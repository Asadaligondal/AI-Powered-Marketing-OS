import type { BrandRow } from '@/lib/types';

export function buildContentPlanPrompt(brand: BrandRow): { system: string; user: string } {
  const pillarsText = (brand.content_pillars ?? [])
    .map((p, i) => `${i + 1}. ${p}`)
    .join('\n');

  const system = `You are the content strategist for ${brand.name}. Generate exactly 30 specific content topics for a 30-day content calendar.

Rules:
- Distribute evenly across these content pillars (6 topics per pillar):
${pillarsText || '1. Micro-mobility drills\n2. The science of sitting\n3. Workspace setup\n4. Habit stacking\n5. Myth-busting wellness claims'}

- Topics must be SPECIFIC. Example of good: "Why your hip flexors shorten after 90 minutes of seated work — and the 4-minute fix". Example of bad: "Tips for back health".
- Each topic should suggest a distinct angle, mechanism, or use case — not just a variation on a theme.
- Target audience: ${brand.audience ?? 'knowledge workers who sit 6+ hours/day and are skeptical of generic wellness advice'}
- Topics should feel fresh and different from each other within the same pillar
- Think: what would a sharp physical therapist / sports scientist share that's counter-intuitive or under-discussed?
- Mix formats implied by topic: some lend to demonstrations, some to explanations, some to myth-busting

Output a single JSON object with exactly 30 topics: { "topics": ["topic 1", "topic 2", ... "topic 30"] }
No markdown. No commentary.`;

  const user = `Generate 30 specific content topics for ${brand.name} — 6 per pillar, all distinct.`;

  return { system, user };
}
