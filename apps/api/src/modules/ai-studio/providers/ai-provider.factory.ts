import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './ai-provider.interface';
import { OpenAIProvider } from './openai.provider';
import { GeminiProvider } from './gemini.provider';
import { AnthropicProvider } from './anthropic.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { LocalProvider } from './local.provider';

@Injectable()
export class AiProviderFactory {
  private readonly openai: OpenAIProvider;
  private readonly gemini: GeminiProvider;
  private readonly anthropic: AnthropicProvider;
  private readonly openrouter: OpenRouterProvider;
  private readonly local: LocalProvider;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAIProvider(config);
    this.gemini = new GeminiProvider(config);
    this.anthropic = new AnthropicProvider(config);
    this.openrouter = new OpenRouterProvider(config);
    this.local = new LocalProvider();
  }

  getProvider(): AIProvider {
    const providerName = this.config.get<string>('AI_PROVIDER') ?? 'openai';
    switch (providerName.toLowerCase()) {
      case 'gemini':
        return this.gemini;
      case 'anthropic':
        return this.anthropic;
      case 'openrouter':
        return this.openrouter;
      case 'local':
        return this.local;
      case 'openai':
      default:
        return this.openai;
    }
  }

  getProviderStatus(): Record<string, { configured: boolean; name: string }> {
    return {
      openai: { configured: this.openai.isConfigured(), name: this.openai.name },
      gemini: { configured: this.gemini.isConfigured(), name: this.gemini.name },
      anthropic: { configured: this.anthropic.isConfigured(), name: this.anthropic.name },
      openrouter: { configured: this.openrouter.isConfigured(), name: this.openrouter.name },
      local: { configured: this.local.isConfigured(), name: this.local.name },
    };
  }
}
