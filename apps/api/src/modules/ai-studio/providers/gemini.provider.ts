import * as https from 'https';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, GenerateOptions } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('GEMINI_API_KEY'));
  }

  private getApiKey(): string {
    const key = this.config.get<string>('GEMINI_API_KEY');
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    return key;
  }

  private getModel(): string {
    return this.config.get<string>('AI_MODEL') ?? 'gemini-1.5-flash';
  }

  private request(prompt: string, options: GenerateOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      const apiKey = this.getApiKey();
      const model = this.getModel();

      const messages: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      if (options.systemPrompt) {
        messages.push({ role: 'user', parts: [{ text: options.systemPrompt }] });
        messages.push({ role: 'model', parts: [{ text: 'Understood. I will follow those instructions.' }] });
      }
      messages.push({ role: 'user', parts: [{ text: prompt }] });

      const body = JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 1000,
        },
      });

      const path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const reqOptions = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
              return reject(new Error(`Gemini error: ${parsed.error.message}`));
            }
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            resolve(text);
          } catch (e) {
            reject(new Error(`Gemini parse error: ${String(e)}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Gemini request timed out after 30s'));
      });
      req.on('error', (e) => reject(new Error(`Gemini request error: ${e.message}`)));
      req.write(body);
      req.end();
    });
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    return this.request(prompt, options);
  }

  async generateStructuredJSON<T = Record<string, unknown>>(
    prompt: string,
    schemaDescription: string,
    options?: GenerateOptions,
  ): Promise<T> {
    const systemPrompt =
      options?.systemPrompt ??
      `You are a helpful assistant that responds ONLY with valid JSON. No markdown, no explanation, no code blocks. Just raw JSON that matches this schema: ${schemaDescription}`;

    const text = await this.request(prompt, { ...options, systemPrompt });

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
      throw new Error(`Gemini did not return valid JSON. Response: ${text.substring(0, 200)}`);
    }
  }
}
