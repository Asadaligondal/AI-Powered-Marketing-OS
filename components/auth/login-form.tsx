"use client";

import { Sparkles } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-11 items-center justify-center rounded-md border border-border bg-card shadow-[var(--elev-edge)]">
          <Sparkles className="size-5 text-primary" strokeWidth={1.5} aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-[13px] font-medium uppercase tracking-[0.4px] text-muted-foreground">
            AI Marketing OS
          </p>
          <p className="text-[15px] font-medium tracking-tight text-foreground">Sign in to continue</p>
        </div>
      </div>

      <Card className="border-border shadow-[var(--elev-edge)]">
        <CardHeader className="pb-4">
          <CardTitle className="text-[17px]">Credentials</CardTitle>
          <CardDescription>Use the demo account from your local environment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={(e) => void onSubmit(e)}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@yahoo.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-[12px] leading-relaxed text-muted-foreground">
            Demo credentials are configured in <span className="font-mono text-[11px] text-foreground/90">.env.local</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
