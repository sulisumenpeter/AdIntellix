import { env } from '../env';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '../supabase/admin';
import crypto from 'crypto';
import { z } from 'zod';
import { logger } from '../observability/logger';

export type AIProvider = 'gemini' | 'claude';

export interface GenerateOptions<T = string> {
  feature: string;
  model?: string;
  provider?: AIProvider;
  promptVersion?: string;
  schemaVersion?: string;
  sourceContentVersion?: string;
  organizationId: string;
  maxRetries?: number;
  schema?: z.ZodSchema<T>;
  timeoutMs?: number;
}

export class AIGateway {
  private gemini: GoogleGenerativeAI;
  private claude: Anthropic;

  constructor() {
    this.gemini = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
    this.claude = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY || '' });
  }

  private detectPromptInjection(prompt: string): boolean {
    // Basic heuristic: check for common override keywords
    const lower = prompt.toLowerCase();
    if (lower.includes('ignore previous instructions') || 
        lower.includes('disregard previous instructions') ||
        lower.includes('system prompt')) {
      return true;
    }
    return false;
  }

  async generate<T = string>(prompt: string, options: GenerateOptions<T>): Promise<{ provider: AIProvider, content: T, usage: { promptTokens: number, completionTokens: number } }> {
    if (this.detectPromptInjection(prompt)) {
      throw new Error('Potential prompt injection detected.');
    }

    const provider = options.provider || 'gemini';
    const inputHash = crypto.createHash('sha256').update(prompt).digest('hex');
    
    let content = '';
    let promptTokens = 0;
    let completionTokens = 0;
    let estimatedCost = 0.0;
    let usedModel = options.model;
    const maxRetries = options.maxRetries ?? 2;
    const timeoutMs = options.timeoutMs ?? 30000;
    
    let attempts = 0;
    let lastError: unknown = null;

    while (attempts <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        if (provider === 'gemini') {
          usedModel = usedModel || 'gemini-1.5-flash';
          const model = this.gemini.getGenerativeModel({ 
            model: usedModel,
            safetySettings: [
              {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
              }
            ]
          });
          // Abort signal is not natively well supported in all older SDKs, but we'll try to race
          const resultPromise = model.generateContent(prompt);
          const result = await Promise.race([
            resultPromise,
            new Promise<never>((_, reject) => {
              controller.signal.addEventListener('abort', () => reject(new Error('AI Request Timeout')));
            })
          ]);
          clearTimeout(timeoutId);
          
          const response = await result.response;
          content = response.text();
          // Mock tokens for Gemini if not available
          promptTokens = response.usageMetadata?.promptTokenCount ?? (prompt.length / 4); 
          completionTokens = response.usageMetadata?.candidatesTokenCount ?? (content.length / 4);
          estimatedCost = 0.00001; // Mock cost
        } else {
          usedModel = usedModel || 'claude-3-haiku-20240307';
          const response = await Promise.race([
            this.claude.messages.create({
              model: usedModel,
              max_tokens: 1024,
              messages: [{ role: 'user', content: prompt }],
            }, { signal: controller.signal }),
            new Promise<never>((_, reject) => {
              controller.signal.addEventListener('abort', () => reject(new Error('AI Request Timeout')));
            })
          ]);
          clearTimeout(timeoutId);
          
          content = ('text' in response.content[0]) ? response.content[0].text : '';
          promptTokens = response.usage.input_tokens;
          completionTokens = response.usage.output_tokens;
          estimatedCost = 0.00002;
        }

        let finalContent: unknown = content;

        if (options.schema) {
          try {
            // Attempt to parse JSON if schema is provided
            // Find JSON block if it's wrapped in markdown
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : content;
            const parsed = JSON.parse(jsonString);
            finalContent = options.schema.parse(parsed);
          } catch (err: unknown) {
            throw new Error(`Schema validation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        const outputHash = crypto.createHash('sha256').update(content).digest('hex');

        // Log to Supabase
        const supabase = createAdminClient();
        await supabase.from('ai_usage_logs').insert({
          organization_id: options.organizationId,
          feature: options.feature,
          provider,
          model: usedModel,
          prompt_version: options.promptVersion || '1.0',
          schema_version: options.schemaVersion,
          source_content_version: options.sourceContentVersion,
          input_hash: inputHash,
          output_hash: outputHash,
          prompt_tokens: Math.round(promptTokens),
          completion_tokens: Math.round(completionTokens),
          estimated_cost: estimatedCost,
          confidence: 1.0,
          generated_timestamp: new Date().toISOString()
        });

        return {
          provider,
          content: finalContent as T,
          usage: {
            promptTokens,
            completionTokens
          }
        };
      } catch (err: unknown) {
        lastError = err;
        attempts++;
        if (attempts <= maxRetries) {
          logger.warn(`AI request failed (attempt ${attempts}), retrying...`, { error: err instanceof Error ? err.message : String(err) });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Backoff
        }
      }
    }

    throw new Error(`AI request failed after ${maxRetries} retries. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
  }
}

export const aiGateway = new AIGateway();
