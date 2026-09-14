## Qroq api :

### api reference

```
curl https://api.groq.com/openai/v1/chat/completions -s \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $GROQ_API_KEY" \
-d '{
  "model": "llama-3.3-70b-versatile",
  "messages": [{
      "role": "user",
      "content": "Explain the importance of fast language models"
  }]
}'

```

### models

| Rank | Model ID | RPM | RPD | TPM | TPD | Why It’s Top |
| --- | --- | --- | --- | --- | --- | --- |
| **1** | **groq/compound** | 30 | 250 | **70K** | – | Highest token throughput per minute (70K TPM). Best for heavy analytics, finance, or batch workloads. |
| **2** | **groq/compound-mini** | 30 | 250 | **70K** | – | Same throughput as compound, lighter variant for efficiency. |
| **3** | **meta-llama/llama-prompt-guard-2-22m / 86m** | 30 | **14.4K** | 15K | **500K** | Extremely high daily request and token caps. Ideal for continuous monitoring or dashboards. |
| **4** | **openai/gpt-oss-120b / 20b / safeguard-20b** | 30 | 1K | 8K | 200K | Balanced per-minute token rate with solid daily token allowance. |
| **5** | **qwen/qwen3.6-27b / qwen3.8-27b** | 30 | 1K | 8K | 200K | Similar to GPT-OSS models, strong structured outputs and reasoning. |

----

## Gemini api :

### api reference

```
curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemini-3.5-flash",
    "input": "Explain how AI works in a few words"
  }'
```

### models

| Rank | Model | Type | Why It’s Best |
| --- | --- | --- | --- |
| **1** | **Gemini 3.8 Flash** (``gemini-3.8-flash``) | Stable | Most intelligent Flash model, optimized for **long-horizon software engineering, autonomous agents, and enterprise workflows**. Best overall for production. |
| **2** | **Gemini 3.7 Flash** (``gemini-3.7-flash``) | Stable | Previous-gen but still strong for **complex coding and agentic workflows**. Reliable multi-step execution. |
| **3** | **Gemini 3.6 Flash** (``gemini-3.6-flash``) | Stable | Balanced speed + multimodal capabilities. Great for **general agentic and everyday tasks**. |
| **4** | **Gemini 3.1 Pro** (``gemini-3.1-pro-preview``) | Preview | Advanced intelligence with **complex problem-solving and vibe coding**. Strong candidate for experimental high-level reasoning. |
| **5** | **Gemini Omni Flash** (``gemini-omni-1.1-flash``) | Preview | Cutting-edge **video generation and editing** with native audio. Best for creative media workflows. |

-----

## Open router api:

### api reference

```
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": "Explain how AI works in a few words"}]
  }'
```

### models

| Rank | Model ID | Context Window | Finance Ranking | Why Good for Finance |
| --- | --- | --- | --- | --- |
| 1 | **tencent/hy3:free** | 262K | #3 | Built for reasoning and financial analysis, configurable chain-of-thought, anti-hallucination safeguards. Excellent for compliance-heavy finance tasks. |
| 2 | **nvidia/nemotron-3-ultra:free** | 1M | #12 | Strong multi-step reasoning, orchestration, and planning. Great for portfolio optimization, forecasting, and enterprise-scale finance pipelines. |
| 3 | **nvidia/nemotron-3-super:free** | 1M | #23 | Efficient hybrid MoE, strong accuracy benchmarks, long-term coherence. Useful for financial research and structured reporting. |
| 4 | **google/gemma-4-31b:free** | 262K | — | Dense multimodal reasoning, multilingual support, structured outputs. Good for document-heavy finance workflows. |
| 5 | **google/gemma-4-26b-a4b:free** | 262K | — | Instruction-tuned MoE, efficient compute, multimodal input. Solid for financial dashboards and structured analytics. |
| 6 | **poolside/laguna-m1:free** | 262K | #37 | Coding-focused but supports reasoning and tool use. Can be adapted for financial automation and compliance scripts. |

-----

