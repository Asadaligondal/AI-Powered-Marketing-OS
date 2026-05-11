'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import type { ContentPiece, RecentBatch } from '@/lib/types';

import { ContentCard } from './ContentCard';

const EXAMPLE_TOPICS = [
  'the truth about ergonomic chairs',
  '10-minute mobility reset for after meetings',
  'why your lower back hurts at 3pm',
] as const;

const PLATFORM_LABELS = [
  'Instagram Post',
  'Instagram Reel',
  'TikTok',
  'LinkedIn',
  'Instagram Story',
] as const;

function SkeletonCard({ label }: { label: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-6">
      {/* Shimmer sweep */}
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-violet-500/8 to-transparent"
        style={{ animation: 'shimmer 1.8s ease-in-out infinite' }}
      />
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      <Skeleton className="mb-3 h-5 w-3/4 rounded" />
      <div className="mb-4 h-0.5 w-12 rounded-full bg-gradient-to-r from-violet-500/40 to-fuchsia-500/40" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground/35">{label}</p>
    </div>
  );
}

type GenerateResult = {
  batchId: string;
  pieces: ContentPiece[];
};

type ContentStudioProps = {
  recentBatches: RecentBatch[];
};

export function ContentStudio({ recentBatches }: ContentStudioProps) {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);

  async function generate() {
    const trimmed = topic.trim();
    if (!trimmed || isGenerating) return;

    setIsGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmed }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Generation failed');
      }

      const data = (await res.json()) as GenerateResult;
      setResult(data);
      toast.success(`5 pieces generated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void generate();
    }
  }

  const showRecent = !result && !isGenerating && recentBatches.length > 0;

  return (
    <div className="space-y-8">
      {/* Input */}
      <div className="space-y-3">
        <div className="relative">
          {/* Gradient focus glow */}
          <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-0 blur-sm transition-opacity duration-200 focus-within:opacity-25" />

          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to talk about?"
            className="relative min-h-[72px] resize-none pr-32 text-[15px] leading-relaxed"
            disabled={isGenerating}
          />

          <div className="absolute bottom-3 right-3">
            <button
              onClick={() => void generate()}
              disabled={!topic.trim() || isGenerating}
              className="inline-flex items-center gap-1.5 overflow-hidden rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-[13px] font-medium text-white transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-[0_4px_14px_rgba(139,92,246,0.45)] disabled:pointer-events-none disabled:opacity-40"
            >
              {isGenerating ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={1.5} />
              ) : (
                <Sparkles className="size-3.5" strokeWidth={1.5} />
              )}
              Generate
            </button>
          </div>
        </div>

        {/* Example topics */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-muted-foreground/50">Try:</span>
          {EXAMPLE_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              disabled={isGenerating}
              className="rounded-full border border-violet-500/20 bg-gradient-to-r from-violet-500/8 to-fuchsia-500/8 px-3 py-1 text-[12px] text-muted-foreground transition-all duration-150 hover:border-violet-500/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              {t}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground/35">
          Cmd+Enter to generate · typically 15–25s
        </p>
      </div>

      {/* Loading skeletons */}
      {isGenerating && (
        <div className="space-y-4">
          <p className="text-[13px] text-muted-foreground">
            Generating for{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text font-medium text-transparent">
              &ldquo;{topic}&rdquo;
            </span>
            …
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {PLATFORM_LABELS.map((label) => (
              <SkeletonCard key={label} label={label} />
            ))}
          </div>
        </div>
      )}

      {/* Generated results */}
      {result && !isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">
              {result.pieces.length} pieces for{' '}
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text font-medium text-transparent">
                &ldquo;{topic}&rdquo;
              </span>
            </p>
            <a
              href={`/content/${result.batchId}`}
              className="text-[12px] text-primary transition-colors hover:underline"
            >
              View batch page →
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {result.pieces.map((piece) => (
              <ContentCard key={piece.id} piece={piece} />
            ))}
          </div>
        </div>
      )}

      {/* Recent batches */}
      {showRecent && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">
            Recent batches
          </p>
          <div className="space-y-0.5">
            {recentBatches.map((batch) => (
              <a
                key={batch.id}
                href={`/content/${batch.id}`}
                className="flex items-center justify-between rounded-md px-3 py-2 text-[13px] transition-colors duration-150 hover:bg-muted/40"
              >
                <span className="truncate text-foreground/80">{batch.topic}</span>
                <span className="ml-4 shrink-0 text-[11px] text-muted-foreground/50">
                  {new Date(batch.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
