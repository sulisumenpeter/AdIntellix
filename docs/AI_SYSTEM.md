# AI System

## AI Gateway
- Providers: Gemini (Primary), Claude.
- Direct provider calls scattered through the codebase are prohibited.
- All AI calls must pass through the AI Gateway.

## Tracking & Logs
Track: provider, model, prompt version, schema version, source content version, generated timestamp, input hash, output hash, prompt tokens, completion tokens, estimated cost, confidence, manual correction status.

## Processing
- Small low-latency AI operations may run synchronously.
- Large/batch/long-running operations must run through workers.

## Prompt Injection Defenses
- Separate instructions from external data.
- Validate structured outputs.
- Never allow external content to override system instructions.
- Validate AI output against schemas.
