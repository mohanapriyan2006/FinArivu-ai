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

| Rank | Model | Strengths | Limits (RPM / TPM / TPD) | Why Good for Finance |
| --- | --- | --- | --- | --- |
| 1 | **llama-3.1-8b-instant** | Fast, balanced reasoning | 30 RPM / 6K TPM / 500K TPD | Handles structured financial queries, portfolio summaries, and quick analytics with high daily token allowance. |
| 2 | **meta-llama/llama-prompt-guard-2-22m** | Guardrails + reasoning | 30 RPM / 15K TPM / 500K TPD | Strong token throughput, useful for compliance-heavy financial text generation. |
| 3 | **openai/gpt-oss-120b** | Larger reasoning capacity | 30 RPM / 8K TPM / 200K TPD | Good for deeper financial analysis, but lower daily token cap than Llama-3.1. |
| 4 | **qwen/qwen3.6-27b** | Balanced mid-size model | 30 RPM / 8K TPM / 200K TPD | Solid for financial forecasting and structured outputs, though capped lower than Llama-3.1. |
| 5 | **groq/compound-mini** | Lightweight, efficient | 30 RPM / 70K TPM | Best for small, frequent financial queries (e.g., stock lookups, ratios) without hitting token caps. |

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

| Rank | Model ID | Strengths | Why Good for Finance |
| --- | --- | --- | --- |
| 1 | **gemini-3.5-flash** | Most intelligent model for sustained frontier performance on agentic and coding tasks | Excellent for financial analysis, portfolio simulations, and backend automation. |
| 2 | **gemini-3.1-flash-lite** | Frontier-class performance at fraction of cost | Cost-efficient, ideal for high-volume financial queries and dashboards. |
| 3 | **gemini-2.5-flash** | Best price-performance for low-latency, high-volume reasoning | Great for financial reporting, risk scoring, and batch analytics. |
| 4 | **gemini-2.5-flash-lite** | Fastest and most budget-friendly multimodal model | Useful for lightweight financial assistants and frequent queries. |
| 5 | **gemini-2.5-pro** | Advanced reasoning and coding capabilities | Best for complex financial modeling, forecasting, and compliance-heavy tasks. |

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

