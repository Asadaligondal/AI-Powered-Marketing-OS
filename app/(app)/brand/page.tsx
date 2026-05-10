import { redirect } from "next/navigation";

import { BrandBrainClient } from "@/components/brand/brand-brain-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { BrandRow } from "@/lib/types";

export default async function BrandPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: brand, error } = await supabase.from("brands").select("*").eq("user_id", user.id).single();

  if (error || !brand) {
    return (
      <div className="pb-16">
        <Card className="max-w-xl border-dashed border-border">
          <CardHeader>
            <CardTitle>No brand row</CardTitle>
            <CardDescription>This account does not have an associated brand yet.</CardDescription>
          </CardHeader>
          <CardContent className="text-[13px] text-muted-foreground">
            Run migrations, configure environment variables, then{" "}
            <code className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              npm run seed
            </code>
            .
          </CardContent>
        </Card>
      </div>
    );
  }

  return <BrandBrainClient brand={brand as BrandRow} />;
}
