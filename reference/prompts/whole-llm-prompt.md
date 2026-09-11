# FINARIVU AI — LOCAL PHI-4 CONTROLLER + VERIFIED MULTI-AGENT IMPLEMENTATION

You are a Senior AI/Backend Engineer specializing in:

- Python 3.13+
- FastAPI
- LangChain
- LangGraph
- PostgreSQL
- Pydantic v2
- Async Python
- llama.cpp / GGUF local LLM inference
- LLM provider abstraction
- Multi-agent AI systems
- Financial software reliability
- AI guardrails and response validation

You are modifying an EXISTING FinArivu AI backend.

DO NOT rebuild the project from scratch.

DO NOT create a second AI architecture.

FIRST inspect the existing repository, implementation, configuration, AI services, agents, providers, LangGraph workflow, financial engines, repositories, schemas, tests and documentation.

Use the existing architecture wherever possible.

============================================================
1. PRODUCT CONTEXT
============================================================

Product:

FinArivu AI

Positioning:

AI Personal CFO / Financial Planning Copilot for Indian salaried professionals.

The system provides:

- Financial Health
- Budget Analysis
- Expense Analysis
- Goal Planning
- Retirement Planning
- Tax Intelligence
- Debt/EMI Analysis
- Net Worth Analysis
- Wealth Simulation
- Financial Education

The system must NOT provide:

- Stock recommendations
- Buy/Sell recommendations
- Intraday signals
- Trading signals
- Portfolio management
- Auto-investing
- Personalized securities recommendations

The system must remain consistent with the existing FinArivu legal/product architecture.

============================================================
2. AUTHORITATIVE ARCHITECTURE
============================================================

The final architecture must be:

USER
 ↓
FastAPI
 ↓
Authentication / Rate Limiting
 ↓
Input Guardrails
 ↓
LOCAL PHI-4 CONTROLLER
 ↓
Controller fallback API if local model fails
 ↓
FinancialContextBuilder
 ↓
LangGraph Orchestrator
 ↓
SPECIALIST AGENTS
 ↓
API LLM PROVIDERS ONLY
 ↓
Deterministic Financial Engines
 ↓
Verified Financial Results
 ↓
API Response Builder
 ↓
Deterministic Response Verification
 ↓
LOCAL PHI-4 VALIDATOR
 ↓
Repair / Reject / Escalate
 ↓
API Verifier for high-risk or uncertain cases
 ↓
Final validated response
 ↓
FastAPI
 ↓
React Native

IMPORTANT:

ONLY the Controller/Validator uses the local Phi-4 model.

Specialist agents MUST use API LLM providers.

Response Builder MUST use API LLM providers.

Do NOT make specialist agents use the local Phi-4 model.

============================================================
3. LOCAL MODEL
============================================================

Use:

Josephgflowers/Phinance-Phi-4-mini-instruct-finance-v0.4-with-reasoning-gguf

Model:

Phinance Phi-4-mini

Quantization:

Q4_K_M

Runtime:

Prefer the existing compatible local inference architecture.

If no local inference implementation exists, implement a dedicated local LLM provider using llama.cpp-compatible GGUF inference.

Prefer an isolated local model service/provider abstraction so the rest of the application does not depend directly on llama.cpp implementation details.

Hardware:

- NVIDIA RTX 3050 Laptop GPU
- 6 GB VRAM
- 16 GB RAM

The model must be used primarily for SHORT structured tasks:

- intent classification
- risk classification
- context requirement selection
- agent routing
- execution-plan generation
- prompt planning
- guardrail assistance
- response validation

Do NOT use the local model for long-form response generation.

Do NOT use the local model for authoritative financial calculations.

============================================================
4. CONTROLLER RESPONSIBILITIES
============================================================

Create or adapt a single Controller abstraction.

Suggested conceptual structure:

app/ai/controller/

- controller_service.py
- controller_schema.py
- controller_prompt.py
- resilient_controller.py
- controller_fallback.py

The Controller must produce a strict Pydantic ExecutionPlan.

The ExecutionPlan should contain fields such as:

- request_id
- intent
- confidence
- risk_level
- required_context
- selected_agents
- required_financial_tools
- execution_mode
- response_mode
- requires_verification
- missing_information
- safety_action

Example:

{
    "intent": "budget_analysis",
    "confidence": 0.96,
    "risk_level": "low",
    "required_context": [
        "monthly_income",
        "monthly_expenses",
        "budget_limits"
    ],
    "selected_agents": [
        "budget_agent"
    ],
    "required_financial_tools": [
        "budget_engine"
    ],
    "execution_mode": "parallel",
    "response_mode": "explanation",
    "requires_verification": true,
    "missing_information": [],
    "safety_action": "allow"
}

The local model MUST return structured JSON.

Validate every controller response using Pydantic.

Malformed controller output MUST NOT enter LangGraph.

============================================================
5. LOCAL CONTROLLER FALLBACK
============================================================

The local Phi-4 controller must have an automatic API fallback.

Flow:

Local Phi-4
 ↓
success
 ↓
continue

OR

Local Phi-4
 ↓
timeout / runtime failure / malformed output / unavailable
 ↓
API Controller
 ↓
continue

The API fallback should use the best available configured API model.

Use the existing provider abstraction instead of creating another provider system.

The controller fallback must support:

- timeout
- connection failure
- model unavailable
- malformed JSON
- inference exception
- GPU/runtime exception

Do not crash the Copilot request because the local model is unavailable.

============================================================
6. TIMEOUT POLICY
============================================================

Make all timeouts configurable through environment variables.

Example:

LOCAL_LLM_TIMEOUT_SECONDS

API_CONTROLLER_TIMEOUT_SECONDS

AGENT_TIMEOUT_SECONDS

RESPONSE_BUILDER_TIMEOUT_SECONDS

VALIDATOR_TIMEOUT_SECONDS

The existing requirement permits a 5-minute absolute local-controller timeout.

However, for interactive Copilot performance:

- use a short practical controller timeout
- immediately fall back when the local model is clearly unavailable
- do not intentionally make the user wait 5 minutes

The 5-minute value may remain as an absolute configurable safety ceiling, but the normal controller timeout should be much smaller.

Do not hardcode timeout values.

============================================================
7. LOCAL MODEL PERFORMANCE
============================================================

Optimize for:

- low latency
- short prompts
- structured JSON
- low output token count
- GPU acceleration
- minimal context
- deterministic temperature where appropriate

Recommended starting configuration should be configurable:

- Q4_K_M
- GPU layer offloading
- reasonable context size
- reasonable batch size
- flash attention if supported
- KV cache optimization if supported

Do NOT assume a configuration is optimal.

Add logging/metrics for:

- inference latency
- model availability
- token usage if available
- timeout count
- fallback count
- validation failures

Never log sensitive financial data.

============================================================
8. INPUT GUARDRAILS
============================================================

Input guardrails must run before the controller.

Check:

1. Prompt injection
2. Jailbreak attempts
3. PII/security-sensitive requests
4. Unsafe financial requests
5. Malformed input
6. Oversized input
7. Unsupported requests

Never request or store:

- bank passwords
- UPI PIN
- OTP
- CVV
- banking credentials
- authentication secrets

Unsafe investment requests must be handled according to the existing FinArivu safety/legal architecture.

Example:

User:
"Which stock should I buy tomorrow?"

Return an educational refusal.

Do NOT route the request to a specialist investment recommendation agent.

============================================================
9. FINANCIAL CONTEXT BUILDER
============================================================

Use the EXISTING FinancialContextBuilder if present.

Do not create a duplicate context system.

The controller identifies required context.

The backend decides which data is actually allowed and retrieves it.

IMPORTANT:

The LLM must NOT directly query PostgreSQL.

Flow:

Controller
 ↓
Required Context
 ↓
Backend allowlist
 ↓
Repository
 ↓
FinancialContextBuilder
 ↓
Structured Context

Only provide the minimum relevant user data.

Example:

Question:
"Why did my savings decrease this month?"

Context may include:

- current income
- current expenses
- previous expenses
- current savings
- previous savings
- savings rate

Do not send unrelated:

- full profile
- bank identifiers
- unrelated goals
- unrelated insurance information

unless required.

============================================================
10. CONTEXT SAFETY
============================================================

The context builder must enforce:

- authenticated user ownership
- user_id filtering
- data minimization
- source metadata
- null vs zero distinction
- Decimal-safe financial values
- current/latest data
- no cross-user data access

The LLM must never invent missing financial information.

If required information is missing:

return a structured missing-information result.

Example:

{
    "missing_information": [
        "monthly_expenses"
    ]
}

Then the Copilot should ask the user for the missing information rather than hallucinating.

============================================================
11. LANGGRAPH ORCHESTRATION
============================================================

Use the existing LangGraph architecture.

Do NOT replace it with a custom orchestration implementation unless absolutely necessary.

The Controller produces the ExecutionPlan.

LangGraph executes it.

Independent specialist agents should run in parallel whenever possible.

Example:

User:
"Can I afford this car while maintaining my emergency fund and retirement goal?"

Possible parallel agents:

- BudgetAgent
- DebtAgent
- RetirementAgent
- GoalAgent

Only serialize agents when one depends on another's output.

The goal is to minimize total latency.

============================================================
12. SPECIALIST AGENTS
============================================================

SPECIALIST AGENTS MUST USE API LLM PROVIDERS.

Examples:

- BudgetAgent
- ExpenseAgent
- GoalAgent
- RetirementAgent
- TaxAgent
- DebtAgent
- NetWorthAgent
- FinancialHealthAgent
- EducationAgent

Each agent must:

1. Receive only relevant context.
2. Receive verified tool/engine results.
3. Use API LLM provider.
4. Return structured AgentResult.
5. Never invent user financial data.
6. Never perform authoritative calculations itself.
7. Never bypass legal/safety restrictions.

Do not connect specialist agents directly to the local Phi-4 model.

============================================================
13. API PROVIDER ABSTRACTION
============================================================

Use the EXISTING provider abstraction.

Do not create separate Gemini/Groq/OpenRouter clients inside every agent.

All providers must implement the common provider interface.

Support:

- Gemini
- Groq
- OpenRouter
- existing configured providers

Use the existing provider router/fallback mechanism where possible.

============================================================
14. API AGENT FALLBACK
============================================================

Every specialist agent call must be resilient.

Example:

Primary Provider
 ↓
timeout/error
 ↓
Fallback Provider
 ↓
timeout/error
 ↓
Next Provider
 ↓
success

Handle:

- timeout
- 429
- 5xx
- connection error
- malformed response
- invalid JSON
- provider unavailable

Do not endlessly retry.

Use bounded retries.

Avoid retry storms.

Provider selection should be configurable.

============================================================
15. DETERMINISTIC FINANCIAL ENGINES
============================================================

Financial engines remain the SOURCE OF TRUTH.

Never allow an LLM to replace them.

Use existing:

- BudgetEngine
- TaxEngine
- GoalEngine
- RetirementEngine
- DebtEngine
- NetWorthEngine
- FinancialHealthEngine
- CashFlowEngine

If equivalent engines already exist, reuse them.

Do not duplicate financial formulas.

All money calculations must use Decimal-compatible logic.

Examples of authoritative results:

- tax
- savings rate
- budget usage
- goal progress
- retirement corpus
- net worth
- debt ratio
- financial health score

LLMs only interpret and explain these results.

============================================================
16. AGENT RESULT SCHEMA
============================================================

Create/adapt a strict structured AgentResult.

Example:

{
    "agent": "budget_agent",
    "status": "success",
    "engine_results": {...},
    "facts": [...],
    "insights": [...],
    "warnings": [...],
    "confidence": 0.94
}

Keep numerical values traceable to deterministic engine results.

============================================================
17. RESPONSE BUILDER
============================================================

Response Builder MUST use an API LLM provider.

It receives:

- user question
- relevant financial context
- verified engine results
- specialist agent results
- safety constraints
- response schema

It generates the user-facing answer.

Do NOT use local Phi-4 to write the long-form answer unless explicitly required as an emergency fallback.

Response Builder must never invent:

- financial numbers
- transactions
- income
- expenses
- goals
- tax values
- dates
- financial products

If information is not present in verified context, it must not be stated as fact.

============================================================
18. RESPONSE VALIDATION
============================================================

Every final response MUST be verified before reaching the user.

Use TWO validation layers.

------------------------------------------------------------
LAYER 1 — DETERMINISTIC VALIDATION
------------------------------------------------------------

Create/adapt:

app/ai/validator/deterministic_validator.py

Check:

- numerical values
- currency values
- percentages
- dates
- user financial facts
- engine outputs
- calculations
- policy constraints
- unsupported factual claims where machine-checkable

Example:

Verified result:

savings_rate = 24.7%

Generated response:

"Your savings rate is 31%."

Result:

FAIL

Do not send the response.

This is the strongest validation layer for numerical correctness.

------------------------------------------------------------
LAYER 2 — LOCAL PHI-4 VALIDATOR
------------------------------------------------------------

Use local Phi-4 to evaluate:

- groundedness
- unsupported claims
- factual consistency
- response relevance
- policy compliance
- whether claims are supported by supplied context
- whether the answer actually answers the user's question

The validator must return strict JSON.

Example:

{
    "status": "PASS",
    "grounded": true,
    "policy_safe": true,
    "unsupported_claims": [],
    "numerical_errors": [],
    "confidence": 0.95,
    "repairability": "none"
}

Possible status:

PASS
REPAIR
REJECT
ESCALATE

============================================================
19. RESPONSE REPAIR LOGIC
============================================================

If validation fails, classify the problem.

CASE A — SMALL / REPAIRABLE ERROR

Examples:

- formatting issue
- incorrect wording
- unnecessary unsupported sentence
- minor response structure problem
- wrong label
- small non-authoritative phrasing problem

Then:

Validator
 ↓
REPAIR
 ↓
Response Builder
 ↓
Revalidate

Limit repair attempts.

Maximum:

1 or 2 attempts.

Never create an infinite repair loop.

------------------------------------------------------------
CASE B — MAJOR ERROR
------------------------------------------------------------

Examples:

- incorrect financial number
- fabricated user data
- wrong tax result
- unsupported financial claim
- contradictory engine result
- unsafe financial recommendation
- multiple serious errors

Do NOT blindly repair.

Instead:

1. Regenerate from verified engine results OR
2. Escalate to API verifier OR
3. Return a safe user-facing limitation message if the issue cannot be reliably resolved.

Never send an answer known to contain major errors.

============================================================
20. API VERIFIER
============================================================

Use an API verifier ONLY when required.

Trigger when:

- high-risk query
- local validator confidence is low
- multiple agents disagree
- serious response discrepancy
- deterministic validator detects an unresolved issue
- sensitive financial interpretation
- response remains uncertain after repair

Use the best configured API verification model.

The API verifier must receive:

- original question
- verified context
- verified engine results
- agent outputs
- generated response

It must determine whether the response is safe and grounded.

============================================================
21. HIGH-RISK LOGIC
============================================================

Do not send every response through an expensive API verifier.

Normal:

Deterministic validation
 ↓
Local Phi-4 validation
 ↓
PASS
 ↓
USER

High-risk/uncertain:

Deterministic validation
 ↓
Local Phi-4 validation
 ↓
UNCERTAIN
 ↓
API verifier
 ↓
PASS
 ↓
USER

If API verifier fails:

Do not send the questionable answer.

Return a safe limitation response or regenerate from verified data.

============================================================
22. PROVIDER FAILURE HANDLING
============================================================

Implement fault tolerance at every AI layer.

LOCAL CONTROLLER:

Phi-4
 ↓ failure
API controller

SPECIALIST AGENT:

Gemini
 ↓ failure
Groq
 ↓ failure
OpenRouter

RESPONSE BUILDER:

Primary API
 ↓ failure
Fallback API

API VERIFIER:

Primary verifier
 ↓ failure
Fallback verifier

Use bounded retries and timeouts.

Never allow one provider failure to crash the entire Copilot.

============================================================
23. LATENCY OPTIMIZATION
============================================================

Optimize for fast real-world responses.

Rules:

1. Keep local controller prompts short.
2. Keep local validator prompts short.
3. Limit controller output tokens.
4. Limit validator output tokens.
5. Retrieve only required financial context.
6. Run independent agents in parallel.
7. Avoid duplicate database queries.
8. Cache safe reusable data where appropriate.
9. Do not call an API verifier unless necessary.
10. Do not run unnecessary agents.
11. Avoid sending full conversation history to every agent.
12. Use bounded provider retries.
13. Use provider timeouts.
14. Use circuit-breaker behavior if already supported.
15. Stream only after factual validation where appropriate.

Target low latency, but DO NOT sacrifice correctness for speed.

============================================================
24. CONVERSATION MEMORY
============================================================

Use the existing ConversationMemory / SessionMemory.

Do not send the entire conversation history to every agent.

The Controller should determine what conversational context is relevant.

Use:

- recent conversation context
- current financial context
- relevant previous facts

Avoid unnecessary token usage.

Never allow old conversation data to override current database truth.

Current verified financial data has priority.

============================================================
25. PROMPT INJECTION PROTECTION
============================================================

Treat:

- user messages
- retrieved documents
- financial descriptions
- previous assistant outputs

as untrusted content.

Never allow user content to modify:

- system instructions
- safety policy
- agent permissions
- database access
- provider credentials
- tool permissions

Use fixed backend-controlled system prompts.

The Controller may classify/plan, but it cannot grant itself new permissions.

============================================================
26. SECURITY
============================================================

Follow the existing FastAPI security architecture.

Must preserve:

- JWT authentication
- authorization
- user_id isolation
- Pydantic validation
- rate limiting
- HTTPS assumptions
- encrypted sensitive storage where already implemented
- audit logging

Never log:

- salary
- expense details
- account information
- tax details
- loan details
- API keys
- authentication tokens
- full financial context

Use request IDs for tracing.

============================================================
27. OBSERVABILITY
============================================================

Add safe structured logging.

Track:

- request_id
- controller provider
- controller latency
- controller fallback
- selected intent
- selected agents
- agent latency
- provider fallback
- engine execution time
- response-builder latency
- deterministic validation status
- local validation status
- API verification status
- total latency
- failure category

DO NOT log sensitive user financial content.

============================================================
28. CONFIGURATION
============================================================

Add/update environment configuration.

Suggested variables:

LOCAL_LLM_ENABLED
LOCAL_LLM_MODEL_PATH
LOCAL_LLM_N_GPU_LAYERS
LOCAL_LLM_N_CTX
LOCAL_LLM_N_BATCH
LOCAL_LLM_THREADS
LOCAL_LLM_TIMEOUT_SECONDS

AI_CONTROLLER_TIMEOUT_SECONDS

AI_AGENT_TIMEOUT_SECONDS

AI_RESPONSE_TIMEOUT_SECONDS

AI_VALIDATOR_TIMEOUT_SECONDS

AI_VERIFIER_TIMEOUT_SECONDS

AI_MAX_REPAIR_ATTEMPTS

AI_ENABLE_API_VERIFIER

AI_PRIMARY_PROVIDER

AI_FALLBACK_PROVIDER

Do not hardcode credentials.

Update:

.env.example

Do not place real secrets in repository files.

============================================================
29. DEPENDENCIES
============================================================

Before adding dependencies:

1. Inspect current pyproject.toml.
2. Inspect requirements.
3. Check whether a compatible local LLM dependency already exists.
4. Avoid unnecessary packages.

If local GGUF inference is not implemented, use an appropriate llama.cpp-compatible Python integration.

Do not introduce Docker, Redis, Kafka, MongoDB, or another infrastructure component unless the existing project genuinely requires it.

Keep the FinArivu stack minimal.

============================================================
30. FILE STRUCTURE
============================================================

Adapt the existing structure.

Preferred conceptual structure:

app/
└── ai/
    ├── controller/
    │   ├── controller_service.py
    │   ├── controller_schema.py
    │   ├── controller_prompt.py
    │   └── resilient_controller.py
    │
    ├── local_llm/
    │   ├── phi4_provider.py
    │   ├── phi4_config.py
    │   └── phi4_health.py
    │
    ├── agents/
    │
    ├── orchestrator/
    │
    ├── context/
    │   └── financial_context_builder.py
    │
    ├── providers/
    │
    ├── validator/
    │   ├── deterministic_validator.py
    │   ├── response_validator.py
    │   └── claim_checker.py
    │
    ├── prompts/
    │
    └── service.py

IMPORTANT:

If equivalent files already exist, MODIFY/EXTEND THEM.

Do not create duplicate services.

============================================================
31. COPILOT SERVICE FLOW
============================================================

The existing CopilotService should become conceptually:

async def process_query(...):

    1. authenticate user

    2. run input guardrails

    3. call resilient controller

    4. obtain validated ExecutionPlan

    5. build selective FinancialContext

    6. validate required context

    7. execute LangGraph plan

    8. run deterministic financial engines

    9. collect verified financial results

    10. call API ResponseBuilder

    11. run deterministic response validation

    12. if failed:
            classify repairability

    13. if repairable:
            regenerate once/twice
            revalidate

    14. call local Phi-4 validator

    15. if PASS:
            return response

    16. if UNCERTAIN/high-risk:
            call API verifier

    17. if API verifier PASS:
            return response

    18. otherwise:
            return safe limitation/failure response

Never bypass validation.

============================================================
32. ERROR HANDLING
============================================================

Create typed internal errors where appropriate:

ControllerTimeoutError
ControllerUnavailableError
InvalidExecutionPlanError
AgentTimeoutError
ProviderUnavailableError
FinancialEngineError
ResponseValidationError
ResponseVerificationError

Map them to safe API responses.

Do not expose internal stack traces to users.

============================================================
33. IMPORTANT DATA FLOW RULE
============================================================

The correct authority order is:

DATABASE
 ↓
DETERMINISTIC FINANCIAL ENGINE
 ↓
VERIFIED FINANCIAL RESULT
 ↓
API LLM INTERPRETATION
 ↓
DETERMINISTIC VALIDATION
 ↓
LOCAL PHI-4 VALIDATION
 ↓
OPTIONAL API VERIFICATION
 ↓
USER

Never:

LLM
 ↓
invent number
 ↓
user

Never:

LLM
 ↓
calculate tax
 ↓
user

Never:

LLM
 ↓
invent financial profile
 ↓
user

============================================================
34. RESPONSE QUALITY
============================================================

Responses should be:

- accurate
- grounded
- concise
- personalized
- understandable
- based on actual user data
- based on deterministic calculations
- legally safe
- contextually relevant

The system should prefer:

"Your savings rate decreased from 31.2% to 24.7% because your expenses increased by ₹8,400, mainly from travel and dining."

ONLY if those exact values are available from verified data.

Otherwise:

"Your savings rate appears to have decreased because your recent expenses increased. I don't have enough verified category data to identify the exact cause."

Never fabricate precision.

============================================================
35. ARTIFACT RESPONSE SUPPORT
============================================================

Preserve the existing ArtifactBuilder architecture.

If the answer requires UI artifacts:

- tax comparison
- budget breakdown
- goal progress
- retirement calculation
- financial health summary

generate structured artifact JSON from verified engine results.

The AI may provide explanation/metadata.

The backend/engine remains the source of numerical values.

Never let the LLM invent artifact values.

============================================================
36. SSE / STREAMING
============================================================

Preserve existing SSE streaming if implemented.

IMPORTANT:

Do not stream unverified financial facts to the user.

Safe progress events may be streamed:

- analyzing
- selecting financial context
- running budget analysis
- checking goals
- validating response

The final factual response should only be emitted after validation.

============================================================
37. TESTING
============================================================

Before declaring implementation complete, add/update tests.

At minimum test:

CONTROLLER:

- valid ExecutionPlan
- malformed JSON
- local model timeout
- local model unavailable
- API controller fallback

GUARDRAILS:

- prompt injection
- unsafe investment request
- PII/security request
- normal finance question

CONTEXT:

- correct user ownership
- minimum context selection
- missing data
- zero vs null
- no unrelated data leakage

ORCHESTRATION:

- single-agent query
- multi-agent query
- parallel execution
- agent failure
- provider fallback

FINANCIAL ENGINES:

- existing engine tests must continue passing

RESPONSE VALIDATION:

- correct numerical response
- incorrect numerical response
- fabricated value
- unsupported claim
- policy violation
- repairable response
- non-repairable response
- API verifier escalation

PERFORMANCE:

- controller latency
- provider fallback latency
- total request latency

============================================================
38. DO NOT BREAK EXISTING FEATURES
============================================================

Before changing anything:

Inspect:

- app/ai/service.py
- app/ai/orchestrator/*
- app/ai/providers/*
- app/ai/agents/*
- app/ai/validator/*
- app/core/config.py
- app/api/*
- app/services/*
- app/engines/*
- app/repositories/*
- app/models/*
- app/schemas/*
- pyproject.toml
- requirements.txt
- .env.example
- tests/*
- ARCHITECTURE.md
- API.md
- FinArivu-MVP.md
- localLLM.md
- best-ai-models.md

Determine what already exists.

Then make the smallest clean architectural changes necessary.

============================================================
39. IMPLEMENTATION ORDER
============================================================

Implement in this order:

PHASE 1
Repository audit

PHASE 2
Local Phi-4 provider

PHASE 3
Controller abstraction

PHASE 4
Controller Pydantic schemas

PHASE 5
Controller fallback

PHASE 6
FinancialContextBuilder integration

PHASE 7
LangGraph ExecutionPlan integration

PHASE 8
Ensure all specialist agents use API providers only

PHASE 9
Provider fallback hardening

PHASE 10
Response Builder integration

PHASE 11
Deterministic response validation

PHASE 12
Local Phi-4 response validator

PHASE 13
Repair/reject/escalation logic

PHASE 14
API verifier

PHASE 15
Timeout/circuit/fallback handling

PHASE 16
Logging/metrics

PHASE 17
Tests

PHASE 18
Performance testing

PHASE 19
Documentation update

============================================================
40. IMPORTANT — DO NOT IMPLEMENT BLINDLY
============================================================

Before editing:

1. Inspect the repository.
2. Map current classes and dependencies.
3. Identify duplicate functionality.
4. Identify current provider fallback behavior.
5. Identify current ResponseValidator.
6. Identify current AgentExecutor.
7. Identify current ResponseBuilder.
8. Identify current Planner.
9. Identify current FinancialContextBuilder.
10. Identify current LangGraph graph/state.
11. Identify existing tests.

Then provide a short implementation plan.

After that, implement.

Do NOT ask me to manually create obvious files.

Do NOT replace working architecture unnecessarily.

============================================================
41. ACCEPTANCE CRITERIA
============================================================

The implementation is complete only when ALL of these are true:

[ ] Local Phi-4 Q4_K_M is integrated.

[ ] Local Phi-4 is used only for Controller/Validator responsibilities.

[ ] All specialist agents use API LLM providers.

[ ] Response Builder uses API LLM providers.

[ ] Local Controller has API fallback.

[ ] API agents have provider fallback.

[ ] Provider failures do not crash Copilot.

[ ] Controller output is Pydantic validated.

[ ] FinancialContextBuilder provides selective context.

[ ] User ownership is enforced.

[ ] LangGraph uses the Controller ExecutionPlan.

[ ] Independent agents execute in parallel when possible.

[ ] Financial calculations remain deterministic.

[ ] Response numbers are checked against engine results.

[ ] Final responses are checked by local Phi-4.

[ ] Repair is limited and controlled.

[ ] Major errors are not silently repaired.

[ ] High-risk/uncertain responses can escalate to API verification.

[ ] Unverified responses never reach the user.

[ ] Missing user data is never hallucinated.

[ ] Sensitive financial data is not logged.

[ ] SSE does not expose unverified factual claims.

[ ] Existing APIs remain backward compatible unless a documented change is necessary.

[ ] Existing tests continue passing.

[ ] New tests cover controller/fallback/validation behavior.

[ ] Configuration is environment-driven.

[ ] No unnecessary infrastructure is introduced.

[ ] No duplicate AI architecture is created.

============================================================
42. FINAL OUTPUT REQUIRED FROM YOU
============================================================

After implementation, provide:

1. Files created
2. Files modified
3. Architecture changes
4. Local Phi-4 configuration
5. Controller responsibilities
6. Agent/provider responsibilities
7. Validation flow
8. Fallback flow
9. Timeout configuration
10. Tests added
11. Tests executed and results
12. Known limitations
13. How to run the local model
14. How to verify the full Copilot pipeline

Also provide a concise final flow diagram:

USER
 ↓
FastAPI
 ↓
Input Guardrails
 ↓
Local Phi-4 Controller
 ↓
API Controller Fallback if needed
 ↓
FinancialContextBuilder
 ↓
LangGraph
 ↓
API Specialist Agents
 ↓
Deterministic Financial Engines
 ↓
Verified Results
 ↓
API Response Builder
 ↓
Deterministic Validation
 ↓
Local Phi-4 Validator
 ↓
Repair / Reject / Escalate
 ↓
API Verifier if required
 ↓
USER

FINAL PRINCIPLE:

"Local Phi-4 controls and verifies.
API models perform specialist reasoning and response generation.
Deterministic financial engines determine the numbers.
The backend determines what data the AI is allowed to see.
Nothing reaches the user until it passes validation."

Do not claim the system is "100% accurate".
The goal is maximum practical accuracy, grounding, reliability, and speed.