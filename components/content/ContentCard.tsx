'use client';

import { CalendarPlus, Check, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ContentPiece, ContentPieceMetadata, StoryboardBeat, StoryFrame } from '@/lib/types';

import { PlatformBadge } from './PlatformBadge';

function HookScoreChip({ score }: { score: number }) {
  const colorClass =
    score >= 80
      ? 'bg-green-500/15 text-green-400 border-green-500/20'
      : score >= 60
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
        : 'bg-zinc-700/30 text-zinc-400 border-zinc-600/20';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium tabular-nums ${colorClass}`}
      title={`Hook score: ${score}/100`}
    >
      {score}
    </span>
  );
}

function StoryboardSection({ beats }: { beats: StoryboardBeat[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        Storyboard
      </p>
      <div className="space-y-2">
        {beats.map((beat) => (
          <div
            key={beat.beat}
            className="rounded-md border border-border/50 bg-muted/20 p-3 text-[12px]"
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="font-semibold text-foreground/80">Beat {beat.beat}</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-muted-foreground">{beat.duration_s}s</span>
            </div>
            <p className="leading-snug text-muted-foreground">
              <span className="font-medium text-foreground/70">Shot: </span>
              {beat.shot}
            </p>
            <p className="mt-0.5 leading-snug text-muted-foreground">
              <span className="font-medium text-foreground/70">On screen: </span>
              {beat.on_screen_text}
            </p>
            <p className="mt-0.5 leading-snug text-muted-foreground">
              <span className="font-medium text-foreground/70">Voiceover: </span>
              {beat.voiceover}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryFramesSection({ frames }: { frames: StoryFrame[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        Frames
      </p>
      <div className="space-y-2">
        {frames.map((frame) => (
          <div
            key={frame.frame}
            className="rounded-md border border-border/50 bg-muted/20 p-3 text-[12px]"
          >
            <p className="font-semibold text-foreground/80">Frame {frame.frame}</p>
            <p className="mt-0.5 leading-snug text-muted-foreground">
              <span className="font-medium text-foreground/70">Text: </span>
              {frame.text_overlay}
            </p>
            <p className="mt-0.5 leading-snug text-muted-foreground">
              <span className="font-medium text-foreground/70">Interactive: </span>
              {frame.interactive}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformMetadata({ metadata, platform }: { metadata: ContentPieceMetadata; platform: string }) {
  return (
    <div className="space-y-4">
      {metadata.hashtags && metadata.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {metadata.hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
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
              <span className="font-medium text-foreground/70">Music:</span>{' '}
              {metadata.music_vibe}
            </span>
          )}
        </p>
      )}

      {metadata.trend_angle && (
        <p className="text-[12px] text-muted-foreground">
          <span className="font-medium text-foreground/70">Trend angle:</span> {metadata.trend_angle}
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
    <Card className="flex flex-col gap-0">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <Skeleton className="h-5 w-28 rounded-md" />
        <Skeleton className="h-5 w-10 rounded-md" />
      </div>
      <div className="border-b border-border/40 px-6 pb-4">
        <Skeleton className="h-5 w-3/4" />
      </div>
      <CardContent className="space-y-2.5 pt-4 pb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
      <CardFooter className="border-t border-border/40 py-3">
        <p className="text-[12px] text-muted-foreground/60">Regenerating {platform}...</p>
      </CardFooter>
    </Card>
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
    <Card className="flex flex-col gap-0">
      {/* Platform + hook score row */}
      <div className="flex items-start justify-between px-6 pt-6 pb-3">
        <PlatformBadge platform={piece.platform} />
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground/60">Hook</span>
          <HookScoreChip score={metadata.hook_score} />
        </div>
      </div>

      {/* Hook */}
      <div className="border-b border-border/40 px-6 pb-4">
        <p className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          {piece.hook}
        </p>
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

      {/* CTA + hook reason + actions */}
      <CardFooter className="flex-col items-start gap-3">
        <div className="w-full space-y-1 text-[12px]">
          {metadata.cta && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground/70">CTA: </span>
              {metadata.cta}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground/60">
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

          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleRegenerate()}
            disabled={isRegenerating}
            className="gap-1.5"
          >
            <RefreshCw className="size-3.5" strokeWidth={1.5} />
            Regenerate
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled
            className="ml-auto gap-1.5 cursor-not-allowed opacity-40"
            title="Available in Calendar — Phase 3"
          >
            <CalendarPlus className="size-3.5" strokeWidth={1.5} />
            Schedule
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
