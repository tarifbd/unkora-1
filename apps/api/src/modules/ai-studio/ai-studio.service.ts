import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Injectable()
export class AiStudioService {
  constructor(private readonly config: ConfigService) {}

  private async callOpenAI(prompt: string, apiKey: string, model = 'gpt-3.5-turbo'): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });

      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) reject(new BadRequestException(parsed.error.message));
            else resolve(parsed.choices[0]?.message?.content ?? '');
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private async callGemini(prompt: string, apiKey: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      });

      const path = `/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) reject(new BadRequestException(parsed.error.message));
            else resolve(parsed.candidates[0]?.content?.parts[0]?.text ?? '');
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  async generateProductContent(
    productName: string,
    category?: string,
  ): Promise<{
    description: string;
    shortDesc: string;
    tags: string[];
    metaTitle: string;
    metaDescription: string;
  }> {
    const provider = this.config.get<string>('AI_PROVIDER') ?? 'openai';
    const apiKey =
      provider === 'gemini'
        ? this.config.get<string>('GEMINI_API_KEY')
        : this.config.get<string>('OPENAI_API_KEY');

    if (!apiKey)
      throw new BadRequestException(
        'AI API key not configured. Set OPENAI_API_KEY or GEMINI_API_KEY in settings.',
      );

    const prompt = `You are a product content writer for a Bangladeshi eCommerce platform.
Generate product content for: "${productName}"${category ? ` (Category: ${category})` : ''}.

Return ONLY valid JSON (no markdown, no explanation):
{
  "description": "Full product description (100-150 words)",
  "shortDesc": "Short description (20-30 words)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "metaTitle": "SEO meta title (50-60 chars)",
  "metaDescription": "SEO meta description (120-160 chars)"
}`;

    let text = '';
    try {
      if (provider === 'gemini') {
        text = await this.callGemini(prompt, apiKey);
      } else {
        text = await this.callOpenAI(
          prompt,
          apiKey,
          this.config.get<string>('AI_MODEL') ?? 'gpt-3.5-turbo',
        );
      }
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Invalid AI response format');
      return JSON.parse(jsonMatch[0]);
    } catch (e: any) {
      throw new BadRequestException(`AI generation failed: ${e.message}`);
    }
  }

  async generateFromTemplate(
    template: string,
    variables: Record<string, string>,
  ): Promise<string> {
    const provider = this.config.get<string>('AI_PROVIDER') ?? 'openai';
    const apiKey =
      provider === 'gemini'
        ? this.config.get<string>('GEMINI_API_KEY')
        : this.config.get<string>('OPENAI_API_KEY');

    if (!apiKey) throw new BadRequestException('AI API key not configured.');

    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    if (provider === 'gemini') return this.callGemini(prompt, apiKey);
    return this.callOpenAI(prompt, apiKey);
  }
}
