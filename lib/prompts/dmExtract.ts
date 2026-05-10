export function buildDmExtractPrompt(message: string): { system: string; user: string } {
  const system = `You are an AI that extracts structured data from Instagram DMs for a marketing automation system.

Extract the following fields and return them as a JSON object with EXACTLY these keys:
- keyword: The ALL-CAPS trigger word from the message (e.g. "MOBILITY", "RESET", "WORKSHOP") — or null if none
- intent: One of exactly: "guide", "info", "purchase", "question", "unclear"
- name: The sender's first name (and last name if given) — or null
- email: A valid email address if present (must contain @ and a domain) — or null
- interests: Array of lowercase noun phrases describing what they want (e.g. ["mobility", "back pain", "posture"])

Rules:
- keyword MUST appear in ALL CAPS in the original message to count — don't infer it
- Only extract emails that look syntactically valid (user@domain.tld)
- Keep interests concise (2-3 words max each)
- Return an empty array [] for interests if none found

Return ONLY a valid JSON object. No explanation, no markdown.`;

  const user = `Extract from this Instagram DM:\n\n"${message}"`;

  return { system, user };
}
