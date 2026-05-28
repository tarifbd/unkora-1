import * as https from 'https';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, GenerateOptions } from './ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('ANTHROPIC_API_KEY'));
  }

  private getApiKey(): string {
    const key = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!key) throw new Error('ANTHROPIC_API_KEY is not configured');
    return key;
  }

  private getModel(): string {
    return this.config.get<string>('AI_MODEL') ?? 'claude-3-5-haiku-20241022';
  }

  private request(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string | undefined,
    options: GenerateOptions = {},
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const apiKey = this.getApiKey();
      const body = JSON.stringify({
        model: this.getModel(),
        max_tokens: options.maxTokens ?? 1000,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages,
      });

      const reqOptions = {
        hostname: 'api.anthropic.com',
        port: 443,
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
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
              return reject(new Error(`Anthropic error: ${parsed.error.message}`));
            }
            const text = parsed.content?.[0]?.text ?? '';
            resolve(text);
          } catch (e) {
            reject(new Error(`Anthropic parse error: ${String(e)}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Anthropic request timed out after 30s'));
      });
      req.on('error', (e) => reject(new Error(`Anthropic request error: ${e.message}`)));
      req.write(body);
      req.end();
    });
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const messages = [{ role: 'user', content: prompt }];
    return this.request(messages, options?.systemPrompt, options);
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
      throw new Error(`Anthropic did not return valid JSON. Response: ${text.substring(0, 200)}`);
    }
  }
}
