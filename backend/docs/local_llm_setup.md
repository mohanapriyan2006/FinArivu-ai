# Local Phi-4 Controller/Validator Setup

This project uses `Josephgflowers/Phinance-Phi-4-mini-instruct-finance-v0.4-with-reasoning-gguf` (Q4_K_M) as the local controller and validator.

## Download the model

1. Visit the Hugging Face model page or repository.
2. Download the `Q4_K_M` GGUF file, e.g.:
   ```text
   Phinance-Phi-4-mini-instruct-finance-v0.4-with-reasoning-gguf.Q4_K_M.gguf
   ```
3. Place it in a known directory such as `D:\Models\`.

## Install llama-cpp-python with CUDA

```powershell
pip install --force-reinstall --no-cache-dir llama-cpp-python --index-url https://abetlen.github.io/llama-cpp-python/whl/cu124
```

For CPU-only inference:

```powershell
pip install --force-reinstall --no-cache-dir llama-cpp-python
```

## Configure the backend

Edit `.env` and set:

```dotenv
LOCAL_LLM_ENABLED=true
LOCAL_LLM_MODEL_PATH=D:\\Models\\Phinance-Phi-4-mini-instruct-finance-v0.4-with-reasoning-gguf.Q4_K_M.gguf
LOCAL_LLM_N_GPU_LAYERS=-1
LOCAL_LLM_N_CTX=4096
LOCAL_LLM_N_BATCH=512
LOCAL_LLM_THREADS=6
LOCAL_LLM_TIMEOUT_SECONDS=120
LOCAL_LLM_FLASH_ATTN=true
LOCAL_LLM_OFFLOAD_KQV=true
```

- `LOCAL_LLM_N_GPU_LAYERS=-1` offloads all GPU-compatible layers.
- `LOCAL_LLM_N_CTX=4096` is the total context size.
- `LOCAL_LLM_N_BATCH=512` and `LOCAL_LLM_THREADS=6` are tuned for an RTX 3050 6 GB.

## Verify

Start the backend and call the health endpoint:

```bash
GET /api/v1/copilot/health
```

If the local model is enabled and loadable, `healthy` will be `true` for the `local-phi4` provider. If the model file is missing or `llama-cpp-python` is not installed, the system automatically falls back to the configured API provider chain (Gemini → Groq → OpenRouter).
