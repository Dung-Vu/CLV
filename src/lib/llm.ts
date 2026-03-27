import OpenAI from 'openai';
import { env } from './env';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LlmResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface LlmClient {
  chat(messages: LlmMessage[], options?: LlmChatOptions): Promise<LlmResponse>;
}

class OpenAICompatibleClient implements LlmClient {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.AI_API_KEY,
      baseURL: env.AI_BASE_URL,
    });
  }

  async chat(messages: LlmMessage[], options?: LlmChatOptions): Promise<LlmResponse> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? env.AI_MODEL,
      messages,
      max_tokens: options?.maxTokens ?? env.AI_MAX_TOKENS,
      temperature: options?.temperature ?? 0.1,
    });

    const content = response.choices[0]?.message?.content ?? '';
    return {
      content,
      model: response.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
          }
        : undefined,
    };
  }
}

let _client: LlmClient | null = null;

export function getLlmClient(): LlmClient {
  if (!_client) {
    _client = new OpenAICompatibleClient();
  }
  return _client;
}

/** Inject a mock LlmClient in tests */
export function setLlmClient(client: LlmClient): void {
  _client = client;
}

/** Reset to default (useful in tests) */
export function resetLlmClient(): void {
  _client = null;
}
