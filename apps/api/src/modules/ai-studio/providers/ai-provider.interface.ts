export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  generateStructuredJSON<T = Record<string, unknown>>(
    prompt: string,
    schemaDescription: string,
    options?: GenerateOptions,
  ): Promise<T>;
}
