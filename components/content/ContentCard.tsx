'use client';

import { CalendarPlus, Check, Copy, Film, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ContentPiece, ContentPieceMetadata, StoryboardBeat, StoryFrame } from '@/lib/types';

import { PlatformBadge } from './PlatformBadge';

function HookScoreChip({ score }: { score: number }) {
  const gradientClass =
    score >= 80
      ? 'from-green-500 to-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.35)]'
      : score >= 60
        ? 'from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
        : 'from-zinc-600 to-zinc-500';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${gradientClass} px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-white`}
      title={`Hook score: ${score}/100`}
    >
      {score}
    </span>
  );
}

function StoryboardSection({ beats }: { beats: StoryboardBeat[] }) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400">
        <Film className="size-3" strokeWidth={2} />
        Storyboard
      </p>
      <div className="space-y-2">
        {beats.map((beat) => (
          <div
            key={beat.beat}
            className="flex gap-3 rounded-md border border-border/50 bg-muted/20 p-3 text-[12px]"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[11px] font-bold text-white shadow-[0_0_8px_rgba(139,92,246,0.4)]">
              {beat.beat}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground/60">
                {beat.duration_s}s · {beat.shot}
              </p>
              <p className="mt-0.5 leading-snug text-muted-foreground">
                <span className="font-medium text-foreground/70">Voiceover: </span>
                {beat.voiceover}
              </p>
              {beat.on_screen_text && (
                <p className="mt-0.5 text-[11px] text-violet-500 dark:text-violet-400">
                  {beat.on_screen_text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryFramesSection({ frames }: { frames: StoryFrame[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-fuchsia-500 dark:text-fuchsia-400">
        Frames
      </p>
      <div className="space-y-2">
        {frames.map((frame) => (
          <div
            key={frame.frame}
            className="flex gap-3 rounded-md border border-border/50 bg-muted/20 p-3 text-[12px]"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 text-[11px] font-bold text-white shadow-[0_0_8px_rgba(217,70,239,0.4)]">
              {frame.frame}
            </div>
            <div className="min-w-0 flex-1">
              <p className="mt-0.5 leading-snug text-muted-foreground">
                <span className="font-medium text-foreground/70">Text: </span>
                {frame.text_overlay}
              </p>
              <p className="mt-0.5 leading-snug text-muted-foreground">
                <span className="font-medium text-foreground/70">Interactive: </span>
                {frame.interactive}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformMetadata({
  metadata,
  platform,
}: {
  metadata: ContentPieceMetadata;
  platform: string;
}) {
  return (
    <div className="space-y-4">
      {metadata.hashtags && metadata.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {metadata.hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-pink-500/25 bg-gradient-to-r from-pink-500/10 to-violet-500/10 px-2.5 py-0.5 text-[11px] text-pink-600 dark:text-pink-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {metadata.storyboard && metadata.storyboard.length > 0 && (
        <StoryboardSection beats={metadata.storyboard} />
      )}

      {metadata.frames && metadata.frames.length > 0 && (
        <StoryFramesSection frames={metadata.frames} />
      )}

      {(metadata.total_duration_s ?? metadata.music_vibe) && (
        <p className="text-[12px] text-muted-foreground">
          {metadata.total_duration_s && (
            <span>
              <span className="font-medium text-foreground/70">Duration:</span>{' '}
              ~{metadata.total_duration_s}s
            </span>
          )}
          {metadata.music_vibe && (
            <span>
              {metadata.total_duration_s ? '  ·  ' : ''}
              <span className="font-medium text-foreground/70">Music:</span> {metadata.music_vibe}
            </span>
          )}
        </p>
      )}

      {metadata.trend_angle && (
        <p className="text-[12px] text-muted-foreground">
          <span className="font-medium text-foreground/70">Trend angle:</span>{' '}
          {metadata.trend_angle}
        </p>
      )}

      {metadata.format && platform === 'linkedin' && (
        <p className="text-[12px] text-muted-foreground">
          <span className="font-medium text-foreground/70">Format:</span> {metadata.format}
        </p>
      )}
    </div>
  );
}

function RegeneratingCard({ platform }: { platform: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-6">
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-violet-500/8 to-transparent"
        style={{ animation: 'shimmer 1.8s ease-in-out infinite' }}
      />
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <Skeleton className="mb-3 h-5 w-3/4" />
      <div className="mb-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <p className="text-[12px] text-muted-foreground/50">
        Regenerating {platform}…
      </p>
    </div>
  );
}

export function ContentCard({ piece: initialPiece }: { piece: ContentPiece }) {
  const [piece, setPiece] = useState<ContentPiece>(initialPiece);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const { metadata } = piece;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(piece.body);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy — clipboard not available');
    }
  }

  async function handleRegenerate() {
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/content/pieces/${piece.id}/regenerate`, { method: 'POST' });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Regenerate failed');
      }
      const data = (await res.json()) as { piece: ContentPiece };
      setPiece(data.piece);
      toast.success('Regenerated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Regenerate failed');
    } finally {
      setIsRegenerating(false);
    }
  }

  if (isRegenerating) {
    return <RegeneratingCard platform={piece.platform} />;
  }

  return (
    <div className="group/outer relative">
      {/* Gradient glow border on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 opacity-0 blur-sm transition-opacity duration-300 group-hover/outer:opacity-25" />

      <Card className="relative flex flex-col gap-0 border-border/50 transition-colors duration-300 group-hover/outer:border-violet-500/25">
        {/* Platform + hook score row */}
        <div className="flex items-start justify-between px-6 pt-6 pb-3">
          <PlatformBadge platform={piece.platform} />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground/50">Hook</span>
            <HookScoreChip score={metadata.hook_score} />
          </div>
        </div>

        {/* Hook + gradient underline */}
        <div className="border-b border-border/40 px-6 pb-4">
          <p className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
            {piece.hook}
          </p>
          <div className="mt-2 h-0.5 w-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        </div>

        {/* Body + platform metadata */}
        <CardContent className="pt-4 pb-2">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
            {piece.body}
          </p>

          {(metadata.hashtags?.length ||
            metadata.storyboard?.length ||
            metadata.frames?.length ||
            metadata.total_duration_s ||
            metadata.music_vibe ||
            metadata.trend_angle ||
            metadata.format) ? (
            <div className="mt-4">
              <PlatformMetadata metadata={metadata} platform={piece.platform} />
            </div>
          ) : null}
        </CardContent>

        {/* Footer: CTA + actions */}
        <CardFooter className="flex-col items-start gap-3">
          <div className="w-full space-y-1 text-[12px]">
            {metadata.cta && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground/70">CTA: </span>
                {metadata.cta}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground/50">
              Score {metadata.hook_score}: {metadata.hook_score_reason}
            </p>
          </div>

          <div className="flex w-full items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleCopy()}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="size-3.5" strokeWidth={1.5} />
              ) : (
                <Copy className="size-3.5" strokeWidth={1.5} />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>

            <button
              onClick={() => void handleRegenerate()}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1.5 text-[13px] font-medium text-white transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-[0_4px_12px_rgba(139,92,246,0.4)] disabled:pointer-events-none disabled:opacity-40"
            >
              <RefreshCw className="size-3.5" strokeWidth={1.5} />
              Regenerate
            </button>

            <Button
              size="sm"
              variant="ghost"
              disabled
              className="ml-auto cursor-not-allowed gap-1.5 opacity-35"
              title="Available in Calendar"
            >
              <CalendarPlus className="size-3.5" strokeWidth={1.5} />
              Schedule
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
