'use client';

import { formatDistanceToNow } from 'date-fns';
import { Check, Camera, Loader2, Zap } from 'lucide-react';

import { SimulateDMDialog } from '@/components/leads/simulate-dm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AutomationRuleDisplay } from '@/lib/automation-rules';
import type { Lead } from '@/lib/types';

function KlaviyoStatus({ lead }: { lead: Lead }) {
  if (lead.klaviyo_synced_at) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] text-green-400"
        title={new Date(lead.klaviyo_synced_at).toLocaleString()}
      >
        <Check className="size-3" strokeWidth={2} />
        Synced
      </span>
    );
  }
  if (lead.klaviyo_sync_error) {
    const isCredentials = lead.klaviyo_sync_error === 'credentials_not_configured';
    return (
      <span
        className="text-[11px] text-amber-400"
        title={isCredentials ? 'Klaviyo API key not configured' : lead.klaviyo_sync_error}
      >
        {isCredentials ? 'Not configured' : 'Failed'}
      </span>
    );
  }
  if (!lead.email) {
    return <span className="text-[11px] text-muted-foreground/40">—</span>;
  }
  return <span className="text-[11px] text-muted-foreground/50">Skipped</span>;
}

type LeadsPageClientProps = {
  leads: Lead[];
  totalCount: number;
  automationRules: AutomationRuleDisplay[];
  recentActivity: { id: string; action: string; details: Record<string, unknown> | null; created_at: string }[];
};

export function LeadsPageClient({
  leads,
  totalCount,
  automationRules,
  recentActivity,
}: LeadsPageClientProps) {
  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Leads"
        subtitle={`${totalCount} lead${totalCount !== 1 ? 's' : ''} captured for this brand.`}
        actions={<SimulateDMDialog />}
      />

      {leads.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No leads yet"
          description='Click "Simulate Instagram DM" to capture your first lead and trigger the Klaviyo sync flow.'
        />
      ) : (
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-[11px] text-muted-foreground/60 font-medium">Source</TableHead>
                <TableHead className="text-[11px] text-muted-foreground/60 font-medium">Keyword</TableHead>
                <TableHead className="text-[11px] text-muted-foreground/60 font-medium">Name</TableHead>
                <TableHead className="text-[11px] text-muted-foreground/60 font-medium">Email</TableHead>
                <TableHead className="text-[11px] text-muted-foreground/60 font-medium">Interests</TableHead>
                <TableHead className="text-[11px] text-muted-foreground/60 font-medium">Klaviyo</TableHead>
                <TableHead className="text-[11px] text-muted-foreground/60 font-medium">Captured</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id} className="border-border/30">
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <Camera className="size-3 text-pink-400" strokeWidth={1.5} />
                      {lead.from_handle
                        ? <span className="text-foreground/70">{lead.from_handle}</span>
                        : <span className="text-muted-foreground/40">IG DM</span>
                      }
                    </span>
                  </TableCell>
                  <TableCell>
                    {lead.keyword ? (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-medium text-primary/80">
                        {lead.keyword}
                      </span>
                    ) : (
                      <span className="text-[12px] text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground/80">
                    {lead.name ?? <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground/70 font-mono">
                    {lead.email ?? <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell>
                    {lead.extracted_interests.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {lead.extracted_interests.slice(0, 3).map((interest) => (
                          <span
                            key={interest}
                            className="rounded bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {interest}
                          </span>
                        ))}
                        {lead.extracted_interests.length > 3 && (
                          <span className="text-[10px] text-muted-foreground/50">
                            +{lead.extracted_interests.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[12px] text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <KlaviyoStatus lead={lead} />
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground/50">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Automation Rules card */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-muted-foreground" strokeWidth={1.5} />
            <h2 className="text-[13px] font-semibold text-foreground">Automation Rules</h2>
          </div>
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[11px] text-muted-foreground/60 font-medium">Keyword</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground/60 font-medium">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automationRules.map((rule) => (
                  <TableRow key={rule.keyword} className="border-border/30">
                    <TableCell>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-medium text-primary/80">
                        {rule.keyword}
                      </span>
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">
                      {rule.welcomeMessage}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Recent captures */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 text-muted-foreground opacity-0" strokeWidth={1.5} />
            <h2 className="text-[13px] font-semibold text-foreground">Recent Captures</h2>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-[13px] text-muted-foreground/60">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border/30 bg-card/60 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-foreground/80">
                        {entry.action === 'lead_captured' ? 'Lead captured' : entry.action === 'klaviyo_synced' ? 'Klaviyo synced' : entry.action}
                      </p>
                      {entry.details && typeof entry.details.keyword === 'string' && entry.details.keyword && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                          keyword: {entry.details.keyword}
                          {typeof entry.details.ai_extraction_summary === 'string' &&
                            ` · ${entry.details.ai_extraction_summary}`}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground/40">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
