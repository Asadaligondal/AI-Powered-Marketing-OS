import { format } from 'date-fns';
import { Activity, CalendarDays } from 'lucide-react';
import { redirect } from 'next/navigation';

import { PlatformBadge } from '@/components/content/PlatformBadge';
import { PageHeader } from '@/components/ui/page-header';
import { createClient } from '@/lib/supabase/server';
import type { Platform } from '@/lib/types';

type ActivityEntry = {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

type TodayPiece = {
  id: string;
  platform: string;
  hook: string;
  status: string;
  scheduled_for: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: brand } = await supabase
    .from('brands')
    .select('id, name, tagline, content_pillars')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!brand) redirect('/brand');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [{ data: todayPieces }, { data: recentActivity }] = await Promise.all([
    supabase
      .from('content_pieces')
      .select('id, platform, hook, status, scheduled_for')
      .eq('brand_id', brand.id)
      .gte('scheduled_for', todayStart.toISOString())
      .lte('scheduled_for', todayEnd.toISOString())
      .order('scheduled_for', { ascending: true }),
    supabase
      .from('activity_log')
      .select('id, action, details, created_at')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const pillars = (brand.content_pillars as string[] | null) ?? [];

  return (
    <div className="space-y-8 pb-16">
      <PageHeader title="Dashboard" subtitle="Overview of your brand and today's content." />

      {/* Brand summary */}
      <section className="space-y-3 rounded-xl border border-border/40 bg-card p-5">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">{brand.name}</h2>
          {brand.tagline && (
            <p className="mt-0.5 text-[13px] text-muted-foreground">{brand.tagline}</p>
          )}
        </div>
        {pillars.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pillars.map((pillar) => (
              <span
                key={pillar}
                className="rounded-md bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary/80"
              >
                {pillar}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's posts */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-[13px] font-semibold text-foreground">Today's Posts</h2>
          </div>
          {!todayPieces?.length ? (
            <p className="text-[13px] text-muted-foreground/60">Nothing scheduled today.</p>
          ) : (
            <div className="space-y-2">
              {(todayPieces as TodayPiece[]).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/60 px-3 py-2.5"
                >
                  <PlatformBadge platform={p.platform as Platform} />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/80">
                    {p.hook}
                  </span>
                  {p.scheduled_for && (
                    <span className="shrink-0 text-[11px] text-muted-foreground/60">
                      {format(new Date(p.scheduled_for), 'h:mm a')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-[13px] font-semibold text-foreground">Recent Activity</h2>
          </div>
          {!recentActivity?.length ? (
            <p className="text-[13px] text-muted-foreground/60">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {(recentActivity as ActivityEntry[]).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-2 rounded-lg border border-border/30 bg-card/60 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-foreground/80">{entry.action}</p>
                    {entry.details && typeof entry.details.topic === 'string' && (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground/60">
                        {entry.details.topic}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground/40">
                    {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
