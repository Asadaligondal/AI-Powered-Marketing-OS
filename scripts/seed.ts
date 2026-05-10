/**
 * Seeds the demo auth user (Supabase Admin API) and Deskbound brand + embedding.
 * Loads `.env.local` when present. Run after migrations: `npm run seed`
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { createAdminClient } from "@/lib/supabase/admin";
import { embed } from "@/lib/openai";
import { brandEmbeddingSource } from "@/lib/brandEmbedding";
import type { BrandProduct } from "@/lib/types";

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? "demo@deskbound.test";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD;

const products: BrandProduct[] = [
  {
    name: "The 10-Minute Mobility Reset",
    type: "digital course",
    price: "$49",
    description:
      "A compact digital course of desk-friendly mobility resets targeting hips, thoracic spine, and neck without gym gear.",
  },
  {
    name: "Deskbound Field Manual",
    type: "book/PDF",
    price: "$19",
    description:
      "A practical PDF field manual for workspace setup, micro-drills, and myth-busting sanity checks for knowledge workers.",
  },
  {
    name: "Live monthly mobility workshops",
    type: "Zoom",
    price: "$29/session",
    description:
      "Live Zoom workshops each month covering sequencing, Q&A, and form cues for real desks and real schedules.",
  },
];

const contentPillars = [
  "micro-mobility drills",
  "the science of why sitting wrecks you",
  "workspace setup",
  "habit stacking",
  "myth-busting wellness BS",
];

const painPoints = [
  "lower back pain",
  "tight hips",
  "brain fog from poor circulation",
  "expensive useless ergonomic gear",
];

const competitors = ["GMB Fitness", "Knees Over Toes Guy", "The Ready State"];

const description =
  "Deskbound teaches mobility and posture for desk workers and knowledge workers: evidence-informed mechanics, short resets, and workspace habits — direct and warm, never influencer fluff.";

const voice =
  "Direct, warm, slightly nerdy. Cites mechanics (\"hip flexor lengthening,\" \"thoracic extension\") without being clinical. No hype. Sparing exclamation marks. Anti-wellness-influencer.";

const audience =
  "28–45, knowledge workers, mild back/neck pain, sit 6+ hrs/day, skeptical of fluff, like Andrew Huberman / Peter Attia content";

async function resolveDemoUserId(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  if (!DEMO_PASSWORD) {
    throw new Error("DEMO_USER_PASSWORD is required in .env.local to seed the demo account.");
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });

  if (!createErr && created.user?.id) {
    console.log("[seed] Created demo user:", DEMO_EMAIL);
    return created.user.id;
  }

  const msg = createErr?.message ?? "";
  if (!msg.toLowerCase().includes("already") && !msg.toLowerCase().includes("registered")) {
    throw createErr ?? new Error("Failed to create demo user");
  }

  const { data: page, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw listErr;
  const found = page.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL.toLowerCase());
  if (!found) throw new Error(`Demo user exists message returned but user not found for ${DEMO_EMAIL}`);
  console.log("[seed] Demo user already exists:", DEMO_EMAIL);
  return found.id;
}

async function main() {
  const admin = createAdminClient();
  const userId = await resolveDemoUserId(admin);

  const row = {
    user_id: userId,
    name: "Deskbound",
    tagline: "Move better. Sit less. Think clearer.",
    description,
    voice,
    audience,
    products,
    content_pillars: contentPillars,
    pain_points: painPoints,
    competitors,
  };

  const { data: existing } = await admin.from("brands").select("id").eq("user_id", userId).maybeSingle();

  let brandId = existing?.id as string | undefined;

  if (brandId) {
    const { error } = await admin.from("brands").update(row).eq("id", brandId);
    if (error) throw error;
    console.log("[seed] Updated brand row:", brandId);
  } else {
    const { data: inserted, error } = await admin.from("brands").insert(row).select("id").single();
    if (error) throw error;
    brandId = inserted.id as string;
    console.log("[seed] Inserted brand row:", brandId);
  }

  const summary = brandEmbeddingSource({
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    voice: row.voice,
    audience: row.audience,
  });
  const vector = await embed(summary);
  const { error: embErr } = await admin.from("brands").update({ embedding: vector }).eq("id", brandId);
  if (embErr) throw embErr;

  console.log("[seed] Done. Log in with:", DEMO_EMAIL);
}

main().catch((e) => {
  console.error("[seed] Failed:", e);
  process.exit(1);
});
