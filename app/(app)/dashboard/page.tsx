import { format, formatDistanceToNow } from 'date-fns';
import {
  Activity,
  CalendarDays,
  FileText,
  Send,
  Users2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type React from 'react';

import { PlatformBadge } from '@/components/content/PlatformBadge';
import { PageHeader } from '@/components/ui/page-header';
import { createClient } from '@/lib/supabase/server';
import type { Lead, Platform } from '@/lib/types';

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

const ACTION_LABELS: Record<string, string> = {
  content_generated: 'Content generated',
  lead_captured: 'Lead captured',
  brand_synthesized: 'Brand synthesized',
  content_published: 'Content published',
  content_scheduled: 'Content scheduled',
};

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
}

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ');
}

function StatCard({
  label,
  value,
  icon: Icon,
  from,
  to,
  delay,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  from: string;
  to: string;
  delay: string;
}) {
  return (
    <div
      className="group relative"
      style={{ animation: 'fade-in-up 0.45s ease-out both', animationDelay: delay }}
    >
      {/* Gradient glow border */}
      <div
        className={`absolute -inset-px rounded-xl bg-gradient-to-r ${from} ${to} opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-50`}
      />
      <div className="relative flex items-center gap-4 rounded-xl border border-border/50 bg-card p-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${from} ${to}`}
        >
          <Icon className="size-5 text-white" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

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

  const [
    { data: todayPieces },
    { data: recentActivity },
    { data: recentLeads },
    { count: contentCount },
    { count: publishedCount },
    { count: leadsCount },
    { count: syncedCount },
  ] = await Promise.all([
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
    supabase
      .from('leads')
      .select('id, keyword, email, created_at')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('content_pieces')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id),
    supabase
      .from('content_pieces')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .eq('status', 'published'),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .not('klaviyo_profile_id', 'is', null),
  ]);

  const pillars = (brand.content_pillars as string[] | null) ?? [];
  const syncPct =
    leadsCount && leadsCount > 0
      ? `${Math.round(((syncedCount ?? 0) / leadsCount) * 100)}%`
      : '—';

  return (
    <div className="relative min-h-screen pb-16">
      {/* Subtle animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-80 w-80 animate-pulse rounded-full bg-violet-500/5 blur-3xl" />
        <div
          className="absolute bottom-1/3 right-1/4 h-80 w-80 animate-pulse rounded-full bg-fuchsia-500/5 blur-3xl"
          style={{ animationDelay: '1.2s' }}
        />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Gradient page header */}
        <PageHeader
          title={
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 bg-clip-text text-transparent">
              Dashboard
            </span>
          }
          subtitle={`${brand.name} — brand overview and today's content.`}
        />

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Content Pieces"
            value={contentCount ?? 0}
            icon={FileText}
            from="from-violet-500"
            to="to-purple-600"
            delay="0ms"
          />
          <StatCard
            label="Published"
            value={publishedCount ?? 0}
            icon={Send}
            from="from-blue-500"
            to="to-cyan-500"
            delay="80ms"
          />
          <StatCard
            label="Leads"
            value={leadsCount ?? 0}
            icon={Users2}
            from="from-emerald-500"
            to="to-green-600"
            delay="160ms"
          />
          <StatCard
            label="Klaviyo Synced"
            value={syncPct}
            icon={Zap}
            from="from-orange-500"
            to="to-amber-500"
            delay="240ms"
          />
        </div>

        {/* ── Brand summary ── */}
        <div
          className="group relative"
          style={{ animation: 'fade-in-up 0.45s ease-out both', animationDelay: '300ms' }}
        >
          <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-25" />
          <section className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-5">
            {/* Gradient top accent bar */}
            <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />
            <div className="pt-1">
              <h2 className="text-[15px] font-semibold text-foreground">{brand.name}</h2>
              {brand.tagline && (
                <p className="mt-0.5 text-[13px] text-muted-foreground">{brand.tagline}</p>
              )}
            </div>
            {pillars.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {pillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="rounded-full border border-violet-500/25 bg-gradient-to-r from-violet-500/12 to-fuchsia-500/12 px-3 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-300"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── 3-column grid ── */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Today's posts */}
          <section
            className="space-y-3"
            style={{ animation: 'fade-in-up 0.45s ease-out both', animationDelay: '360ms' }}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="text-[13px] font-semibold text-foreground">Today's Posts</h2>
            </div>

            {!todayPieces?.length ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                  <CalendarDays className="size-5 text-white" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] text-muted-foreground">Nothing scheduled today.</p>
                <Link
                  href="/content"
                  className="mt-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  Generate Content
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {(todayPieces as TodayPiece[]).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/60 px-3 py-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-border/60 hover:shadow-md"
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

          {/* Recent leads */}
          <section
            className="space-y-3"
            style={{ animation: 'fade-in-up 0.45s ease-out both', animationDelay: '420ms' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users2 className="size-4 text-muted-foreground" strokeWidth={1.5} />
                <h2 className="text-[13px] font-semibold text-foreground">Recent Leads</h2>
              </div>
              <Link
                href="/leads"
                className="text-[11px] text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                View all →
              </Link>
            </div>

            {!recentLeads?.length ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600">
                  <Users2 className="size-5 text-white" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] text-muted-foreground">No leads yet.</p>
                <Link
                  href="/leads"
                  className="mt-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  Simulate a DM
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {(recentLeads as Pick<Lead, 'id' | 'keyword' | 'email' | 'created_at'>[]).map(
                  (lead) => (
                    <Link
                      key={lead.id}
                      href="/leads"
                      className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/60 px-3 py-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-border/60 hover:shadow-md"
                    >
                      {lead.keyword ? (
                        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 to-green-500/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-600 dark:text-emerald-300">
                          {lead.keyword}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/40">no keyword</span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-[12px] font-mono text-foreground/60">
                        {lead.email ? maskEmail(lead.email) : '—'}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground/40">
                        {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      </span>
                    </Link>
                  ),
                )}
              </div>
            )}
          </section>

          {/* Recent activity — gradient timeline */}
          <section
            className="space-y-3"
            style={{ animation: 'fade-in-up 0.45s ease-out both', animationDelay: '480ms' }}
          >
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="text-[13px] font-semibold text-foreground">Recent Activity</h2>
            </div>

            {!recentActivity?.length ? (
              <p className="text-[13px] text-muted-foreground/60">No activity yet.</p>
            ) : (
              <div className="space-y-0">
                {(recentActivity as ActivityEntry[]).map((entry, i) => (
                  <div key={entry.id} className="relative pl-6">
                    {/* Vertical gradient line connecting dots */}
                    {i < recentActivity.length - 1 && (
                      <div className="absolute left-[7px] top-4 h-full w-px bg-gradient-to-b from-violet-500/40 to-transparent" />
                    )}
                    {/* Gradient dot */}
                    <div className="absolute left-0 top-2.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />

                    <div className="mb-3 rounded-lg border border-border/30 bg-card/60 px-3 py-2.5 transition-colors hover:border-border/60">
                      <p className="text-[12px] font-medium capitalize text-foreground/80">
                        {formatAction(entry.action)}
                      </p>
                      {entry.details && typeof entry.details.topic === 'string' && (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground/60">
                          {entry.details.topic}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] text-muted-foreground/40">
                        {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
