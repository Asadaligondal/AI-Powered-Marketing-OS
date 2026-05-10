const APPROX_CHARS_PER_TOKEN = 4;
const TARGET_CHUNK_TOKENS = 500;

export function chunkTextByParagraphs(text: string, maxTokensPerChunk = TARGET_CHUNK_TOKENS): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const maxChars = maxTokensPerChunk * APPROX_CHARS_PER_TOKEN;
  const paragraphs = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    const t = current.trim();
    if (t) chunks.push(t);
    current = "";
  };

  for (const p of paragraphs) {
    const candidate = current ? `${current}\n\n${p}` : p;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    flush();
    if (p.length <= maxChars) {
      current = p;
    } else {
      for (let i = 0; i < p.length; i += maxChars) {
        chunks.push(p.slice(i, i + maxChars));
      }
    }
  }
  flush();
  return chunks;
}
