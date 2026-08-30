Model:
Josephgflowers/Phinance-Phi-4-mini-instruct-finance-v0.4-with-reasoning-gguf

Quantization:
Q4_K_M

Role:
FinArivu Controller / Router / Guardrail / Validator

Do NOT use it for:
Authoritative tax calculation
Retirement arithmetic
Financial-health arithmetic
Net-worth arithmetic
Investment advice

-----

# Flow

```text
                         USER
                           │
                           ▼
                    ┌─────────────┐
                    │   FastAPI   │
                    │ Auth + Rate │
                    └──────┬──────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │ INPUT GUARDRAILS │
                 │ • Injection      │
                 │ • PII            │
                 │ • Safety         │
                 │ • Validation     │
                 └────────┬─────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │ LOCAL PHI-4 CONTROLLER  │
              │      Q4_K_M / GPU       │
              │                         │
              │ • Intent                │
              │ • Risk                  │
              │ • Context Requirements  │
              │ • Agent Selection       │
              │ • Execution Plan        │
              │ • Prompt Planning       │
              └───────────┬─────────────┘
                          │
              Local failure / timeout
                          │
                          ▼
                 ┌─────────────────┐
                 │ API CONTROLLER  │
                 │ Best Provider   │
                 └────────┬────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ FinancialContextBuilder│
              │ Relevant user data    │
              └────────────┬───────────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │  LANGGRAPH       │
                 │   ORCHESTRATOR   │
                 └────────┬─────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        Budget Agent   Tax Agent   Goal Agent
          API LLM       API LLM      API LLM
             │            │            │
             ▼            ▼            ▼
        Retirement     Debt Agent   Health Agent
          Agent          API LLM       API LLM
          API LLM
             │            │            │
             └────────────┼────────────┘
                          ▼
              ┌────────────────────────┐
              │ DETERMINISTIC         │
              │ FINANCIAL ENGINES     │
              │                       │
              │ Tax / Budget / Goals  │
              │ Retirement / Debt    │
              │ Net Worth / Health   │
              └────────────┬───────────┘
                           │
                           ▼
                 VERIFIED FINANCIAL
                      RESULTS
                           │
                           ▼
              ┌────────────────────────┐
              │    RESPONSE BUILDER   │
              │      API LLM          │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ DETERMINISTIC CHECK    │
              │ • Numbers              │
              │ • User data            │
              │ • Engine results       │
              │ • Dates / currency     │
              │ • Policy               │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ LOCAL PHI-4 VALIDATOR │
              │ Grounding + Safety    │
              └────────────┬───────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                  PASS           FAIL
                    │             │
                    │             ▼
                    │       REPAIR (is small changes) /
                    |      RESPOND with issue to user (if lot mistakes)
                    │             │
                    │             ▼
                    │       Re-validation
                    │
                    ▼
              ┌─────────────────┐
              │ HIGH RISK /    │
              │ UNCERTAIN?     │
              └───────┬─────────┘
                      │
                ┌─────┴─────┐
                │           │
               NO          YES
                │           │
                │           ▼
                │     API VERIFIER
                │     Best Model
                │           │
                │           ▼
                │       PASS / FAIL
                │
                └──────┬────┘
                       ▼
                     USER
```

## Notes

> **FinArivu AI uses a local quantized Phi-4-mini as the central Controller and Validator, while specialist financial agents use API-based LLMs. Deterministic financial engines provide the authoritative calculations, and every generated response passes through factual and AI-based verification before delivery.**

> **Speed:** Local Phi-4 handles short controller/validation tasks; independent agents run in parallel; API providers automatically fail over on timeout or errors.
> **Accuracy:** Financial engines are the source of truth; deterministic checks validate numbers before the final response; Phi-4 performs grounding/safety verification; high-risk or uncertain responses receive an additional API verification.

---

---

# Responsibility Split

| Component              | Uses                         |
| ---------------------- | ---------------------------- |
| **Controller**         | Local Phi-4                  |
| Controller fallback    | API best model               |
| Intent                 | Local Phi-4                  |
| Agent routing          | Local Phi-4                  |
| Context planning       | Local Phi-4 + backend rules  |
| Context retrieval      | Backend repositories         |
| Specialist agents      | **API LLMs only**            |
| Financial calculations | **Python engines only**      |
| Response generation    | API LLM                      |
| Number verification    | **Deterministic code first** |
| Response verification  | Local Phi-4                  |
| High-risk verification | API model                    |
| Provider failure       | Automatic fallback           |
| Orchestration          | LangGraph                    |

----

