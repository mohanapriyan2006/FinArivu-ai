"""Two-layer response validation: deterministic + local Phi-4 (with API fallback)."""

from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass
from typing import Any

from app.ai.local_llm import LocalLLMInferenceError, LocalLLMUnavailableError, Phi4Provider
from app.ai.providers.factory import get_ai_provider
from app.ai.schemas import AgentResult
from app.ai.schemas.orchestration import FinancialContext
from app.core.config import settings
from app.core.logger import logger


@dataclass
class ValidationResult:
    """Outcome of validating a candidate response."""

    status: str  # PASS, REPAIR, REJECT, ESCALATE
    grounded: bool = True
    policy_safe: bool = True
    unsupported_claims: list[str] = None  # type: ignore[assignment]
    numerical_errors: list[str] = None  # type: ignore[assignment]
    confidence: float = 1.0
    repairability: str = "none"  # none, small, major
    reason: str = ""

    def __post_init__(self) -> None:
        if self.unsupported_claims is None:
            self.unsupported_claims = []
        if self.numerical_errors is None:
            self.numerical_errors = []


class ResponseValidationService:
    """Validate a final response before it reaches the user.

    Layer 1: deterministic checks for numbers, currency, and known values.
    Layer 2: local Phi-4 grounding and policy check (with API fallback).
    """

    _CURRENCY_RE = re.compile(r"₹\s?([\d,]+(?:\.\d+)?)")
    _PERCENT_RE = re.compile(r"([\d,]+(?:\.\d+)?)\s*%")
    _NUMBER_RE = re.compile(r"(?<!\d)([\d,]+(?:\.\d{1,2})?)(?!\d)")
    _YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")

    def __init__(self, local: Phi4Provider | None = None, api=None) -> None:
        self._local = local or Phi4Provider()
        self._api = api
        if self._api is None:
            try:
                self._api = get_ai_provider()
            except Exception as exc:
                logger.warning("Could not initialise API verifier: %s", exc)
                self._api = None

    async def validate(
        self,
        response_text: str,
        *,
        user_message: str,
        financial_context: FinancialContext,
        agent_results: list[AgentResult],
    ) -> ValidationResult:
        """Run deterministic and (if enabled) local-Phi-4 validation."""
        # Layer 1 — deterministic.
        det = self._deterministic_check(response_text, financial_context, agent_results)
        if det.numerical_errors:
            return det

        # Layer 2 — local Phi-4.
        local_result = await self._local_validate(response_text, user_message, financial_context, agent_results)
        if local_result:
            # If local failed, the API verifier is the fallback for uncertain cases.
            if not local_result.policy_safe:
                return ValidationResult(
                    status="REJECT",
                    grounded=False,
                    policy_safe=False,
                    reason="Policy violation detected by local validator",
                    repairability="major",
                )
            if local_result.unsupported_claims or local_result.numerical_errors:
                return ValidationResult(
                    status="REPAIR" if local_result.repairability == "small" else "ESCALATE",
                    grounded=False,
                    unsupported_claims=local_result.unsupported_claims,
                    numerical_errors=local_result.numerical_errors,
                    confidence=local_result.confidence,
                    repairability=local_result.repairability,
                    reason="Local validator found unsupported claims",
                )
            if local_result.confidence < 0.6:
                return ValidationResult(
                    status="ESCALATE",
                    grounded=True,
                    confidence=local_result.confidence,
                    repairability="major",
                    reason="Local validator confidence is low",
                )
            return ValidationResult(
                status="PASS",
                grounded=local_result.grounded,
                policy_safe=local_result.policy_safe,
                confidence=local_result.confidence,
            )

        return det

    async def verify_with_api(
        self,
        response_text: str,
        *,
        user_message: str,
        financial_context: FinancialContext,
        agent_results: list[AgentResult],
    ) -> ValidationResult:
        """API verifier for high-risk or uncertain responses."""
        if self._api is None or not settings.ai_enable_api_verifier:
            logger.warning("API verifier disabled or unavailable")
            return ValidationResult(
                status="REJECT",
                grounded=False,
                reason="API verifier unavailable",
                repairability="major",
            )

        prompt = self._build_verifier_prompt(response_text, user_message, financial_context, agent_results)
        try:
            response = await asyncio.wait_for(
                self._api.chat(
                    [
                        {"role": "system", "content": "You are a careful financial-response reviewer. Output ONLY JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.1,
                    max_tokens=512,
                    response_format={"type": "json_object"},
                ),
                timeout=settings.ai_verifier_timeout_seconds,
            )
            data = self._parse_json(response.content)
            return ValidationResult(
                status="PASS" if data.get("status") == "PASS" else "REJECT",
                grounded=bool(data.get("grounded", False)),
                policy_safe=bool(data.get("policy_safe", False)),
                unsupported_claims=data.get("unsupported_claims", []) or [],
                numerical_errors=data.get("numerical_errors", []) or [],
                confidence=float(data.get("confidence", 0.5)),
                repairability=data.get("repairability", "major"),
                reason=data.get("reason", ""),
            )
        except Exception as exc:
            logger.warning("API verifier failed: %s", exc)
            return ValidationResult(
                status="REJECT",
                grounded=False,
                reason="API verifier failed",
                repairability="major",
            )

    # ── Deterministic validation ───────────────────────────────────────────

    def _deterministic_check(
        self,
        response_text: str,
        financial_context: FinancialContext,
        agent_results: list[AgentResult],
    ) -> ValidationResult:
        """Check that explicit numbers in the response are present in verified data."""
        known = self._collect_known_values(financial_context, agent_results)
        numerical_errors: list[str] = []

        # Check currency values.
        for match in self._CURRENCY_RE.finditer(response_text):
            value = float(match.group(1).replace(",", ""))
            if not self._is_known(value, known):
                numerical_errors.append(f"Unverified currency value: ₹{value}")

        # Check percentages.
        for match in self._PERCENT_RE.finditer(response_text):
            value = float(match.group(1).replace(",", ""))
            if not self._is_known(value, known):
                numerical_errors.append(f"Unverified percentage: {value}%")

        # Stand-alone numbers (heuristic; ignore years and numbers already checked).
        seen: set[float] = set()
        for match in self._NUMBER_RE.finditer(response_text):
            raw = match.group(1).replace(",", "")
            if match.group(0) in [m.group(0) for m in self._YEAR_RE.finditer(response_text)]:
                continue
            value = float(raw)
            if value in seen:
                continue
            seen.add(value)
            if not self._is_known(value, known):
                numerical_errors.append(f"Unverified number in response: {value}")

        if numerical_errors:
            return ValidationResult(
                status="REJECT",
                grounded=False,
                numerical_errors=numerical_errors,
                confidence=0.0,
                repairability="major",
                reason="Response contains numbers not found in verified data",
            )

        return ValidationResult(status="PASS", grounded=True, confidence=1.0)

    def _collect_known_values(
        self,
        financial_context: FinancialContext,
        agent_results: list[AgentResult],
    ) -> set[float]:
        """Flatten all numeric values from the verified context and agent data."""
        known: set[float] = set()
        self._extract_numbers(financial_context.model_dump(), known)
        for r in agent_results:
            self._extract_numbers(r.data, known)
        # Round to one decimal place for comparison.
        return {round(v, 1) for v in known}

    def _extract_numbers(self, data: Any, out: set[float]) -> None:
        if isinstance(data, dict):
            for value in data.values():
                self._extract_numbers(value, out)
        elif isinstance(data, list):
            for item in data:
                self._extract_numbers(item, out)
        elif isinstance(data, (int, float)):
            out.add(float(data))

    def _is_known(self, value: float, known: set[float]) -> bool:
        return round(value, 1) in known

    # ── Local Phi-4 validation ─────────────────────────────────────────────

    async def _local_validate(
        self,
        response_text: str,
        user_message: str,
        financial_context: FinancialContext,
        agent_results: list[AgentResult],
    ) -> ValidationResult | None:
        """Use the local model to check grounding and policy safety."""
        if not self._local._config.is_available():  # type: ignore[attr-defined]
            return None

        prompt = self._build_validator_prompt(response_text, user_message, financial_context, agent_results)
        try:
            response = await asyncio.wait_for(
                self._local.chat(
                    [
                        {"role": "system", "content": "You are a careful financial-response reviewer. Output ONLY JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.1,
                    max_tokens=512,
                ),
                timeout=settings.ai_validator_timeout_seconds,
            )
        except (TimeoutError, asyncio.TimeoutError, LocalLLMUnavailableError, LocalLLMInferenceError) as exc:
            logger.warning("Local Phi-4 validator failed: %s", exc)
            return None
        except Exception as exc:
            logger.warning("Local Phi-4 validator unexpected error: %s", exc)
            return None

        data = self._parse_json(response.content)
        return ValidationResult(
            status=data.get("status", "ESCALATE"),
            grounded=bool(data.get("grounded", False)),
            policy_safe=bool(data.get("policy_safe", True)),
            unsupported_claims=data.get("unsupported_claims", []) or [],
            numerical_errors=data.get("numerical_errors", []) or [],
            confidence=float(data.get("confidence", 0.5)),
            repairability=data.get("repairability", "major"),
            reason=data.get("reason", ""),
        )

    # ── Shared helpers ─────────────────────────────────────────────────────

    def _build_validator_prompt(
        self,
        response_text: str,
        user_message: str,
        financial_context: FinancialContext,
        agent_results: list[AgentResult],
    ) -> str:
        data = {
            "user_message": user_message,
            "verified_context": financial_context.model_dump(),
            "agent_results": [r.model_dump() for r in agent_results],
            "response": response_text,
        }
        return f"""\
You are reviewing a financial assistant response for grounding and safety.

User question: {user_message}

Verified data (do not allow claims that are not here or from the agent results):
{json.dumps(data['verified_context'], indent=2, default=str)[:3000]}

Agent engine results:
{json.dumps(data['agent_results'], indent=2, default=str)[:1500]}

Response to review:
{response_text}

Return ONLY JSON:
{{
  "status": "PASS" | "REPAIR" | "REJECT" | "ESCALATE",
  "grounded": true | false,
  "policy_safe": true | false,
  "unsupported_claims": [],
  "numerical_errors": [],
  "confidence": 0.0,
  "repairability": "none" | "small" | "major",
  "reason": "..."
}}
"""

    def _build_verifier_prompt(
        self,
        response_text: str,
        user_message: str,
        financial_context: FinancialContext,
        agent_results: list[AgentResult],
    ) -> str:
        return self._build_validator_prompt(response_text, user_message, financial_context, agent_results)

    def _parse_json(self, raw: str) -> dict[str, Any]:
        text = (raw or "").strip()
        if not text:
            return {}
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            text = match.group(1)
        try:
            data = json.loads(text)
            return data if isinstance(data, dict) else {}
        except json.JSONDecodeError:
            return {}
