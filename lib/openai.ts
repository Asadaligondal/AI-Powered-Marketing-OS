import OpenAI from "openai";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  if (!_client) _client = new OpenAI({ apiKey });
  return _client;
}

/**
 * OpenAI SDK client (lazy). Exported per PROJECT_SPEC §8; instantiates on first property access
 * so Next.js can build without OPENAI_API_KEY in the environment.
 */
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    const instance = getClient();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export const MODELS = {
  default: "gpt-5.4-mini",
  cheap: "gpt-5.4-nano",
  heavy: "gpt-5.4",
  embed: "text-embedding-3-small",
} as const;

export async function embed(text: string): Promise<number[]> {
  const r = await openai.embeddings.create({
    model: MODELS.embed,
    input: text,
  });
  const usage = r.usage;
  console.log("[openai]", MODELS.embed, "tokens:", usage);
  return r.data[0].embedding;
}

export type ChatJsonUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export async function chatJsonCompletion(options: {
  model: string;
  system: string;
  user: string;
}): Promise<{ raw: string; usage: ChatJsonUsage | undefined }> {
  const completion = await openai.chat.completions.create({
    model: options.model,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
    response_format: { type: "json_object" },
  });
  const usage = completion.usage as ChatJsonUsage | undefined;
  console.log("[openai]", options.model, "tokens:", usage);
  const raw = completion.choices[0]?.message?.content ?? "{}";
  return { raw, usage };
}
