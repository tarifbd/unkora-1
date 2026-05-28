import { Injectable } from '@nestjs/common';
import { AIProvider, GenerateOptions } from './ai-provider.interface';

@Injectable()
export class LocalProvider implements AIProvider {
  readonly name = 'local';

  isConfigured(): boolean {
    return false;
  }

  async generateText(_prompt: string, _options?: GenerateOptions): Promise<string> {
    throw new Error('Local model is not configured. Please set up a local LLM endpoint.');
  }

  async generateStructuredJSON<T = Record<string, unknown>>(
    _prompt: string,
    _schemaDescription: string,
    _options?: GenerateOptions,
  ): Promise<T> {
    throw new Error('Local model is not configured. Please set up a local LLM endpoint.');
  }
}
