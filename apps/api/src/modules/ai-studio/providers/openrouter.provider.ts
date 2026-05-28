import * as https from 'https';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, GenerateOptions } from './ai-provider.interface';

@Injectable()
export class OpenRouterProvider implements AIProvider {
  readonly name = 'openrouter';

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('OPENROUTER_API_KEY'));
  }

  private getApiKey(): string {
    const key = this.config.get<string>('OPENROUTER_API_KEY');
    if (!key) throw new Error('OPENROUTER_API_KEY is not configured');
    return key;
  }

  private getModel(): string {
    return this.config.get<string>('AI_MODEL') ?? 'openai/gpt-4o-mini';
  }

  private request(
    messages: Array<{ role: string; content: string }>,
    options: GenerateOptions = {},
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const apiKey = this.getApiKey();
      const body = JSON.stringify({
        model: this.getModel(),
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000,
      });

      const reqOptions = {
        hostname: 'openrouter.ai',
        port: 443,
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://unkora.com',
          'X-Title': 'UNKORA AI Studio',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 30000,
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              return reject(new Error(`OpenRouter error: ${parsed.error.message}`));
            }
            resolve(parsed.choices?.[0]?.message?.content ?? '');
          } catch (e) {
            reject(new Error(`OpenRouter parse error: ${String(e)}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('OpenRouter request timed out after 30s'));
      });
      req.on('error', (e) => reject(new Error(`OpenRouter request error: ${e.message}`)));
      req.write(body);
      req.end();
    });
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    return this.request(messages, options);
  }

  async generateStructuredJSON<T = Record<string, unknown>>(
    prompt: string,
    schemaDescription: string,
    options?: GenerateOptions,
  ): Promise<T> {
    const systemPrompt =
      options?.systemPrompt ??
      `You are a helpful assistant that responds ONLY with valid JSON. No markdown, no explanation, no code blocks. Just raw JSON that matches this schema: ${schemaDescription}`;

    const text = await this.generateText(prompt, { ...options, systemPrompt });

    try {
      return JSON.parse(text) as T;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]) as T;
        } catch {
          // fall through
        }
      }
      throw new Error(`OpenRouter did not return valid JSON. Response: ${text.substring(0, 200)}`);
    }
  }
}
