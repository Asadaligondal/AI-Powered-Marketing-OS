'use client';

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isPast,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  Unlink,
  Wifi,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ContentChip } from '@/components/calendar/content-chip';
import { PieceDrawer } from '@/components/calendar/piece-drawer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import type { ContentPiece } from '@/lib/types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type LinkedInStatus = {
  connected: boolean;
  handle?: string;
  isMocked: boolean;
};

type CalendarGridProps = {
  initialPieces: ContentPiece[];
  initialMonth: string;
  brandId: string;
  linkedIn: LinkedInStatus;
};

type GenerateResult = { batchesCreated: number; piecesCreated: number; totalTokens: number };

export function CalendarGrid({
  initialPieces,
  initialMonth,
  brandId,
  linkedIn,
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(initialMonth));
  const [pieces, setPieces] = useState<ContentPiece[]>(initialPieces);
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<ContentPiece | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  const [showLocalhostCron, setShowLocalhostCron] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setShowLocalhostCron(window.location.hostname === 'localhost');
  }, []);

  const loadMonth = useCallback(
    async (month: Date) => {
      setIsLoadingMonth(true);
      const start = startOfMonth(month).toISOString();
      const end = endOfMonth(month).toISOString();
      const { data, error } = await supabase
        .from('content_pieces')
        .select('*')
        .eq('brand_id', brandId)
        .gte('scheduled_for', start)
        .lte('scheduled_for', end)
        .order('scheduled_for', { ascending: true });

      if (error) toast.error('Failed to load calendar');
      else setPieces((data as ContentPiece[]) ?? []);
      setIsLoadingMonth(false);
    },
    [brandId, supabase],
  );

  function goToPrev() {
    const m = subMonths(currentMonth, 1);
    setCurrentMonth(m);
    void loadMonth(m);
  }

  function goToNext() {
    const m = addMonths(currentMonth, 1);
    setCurrentMonth(m);
    void loadMonth(m);
  }

  function goToToday() {
    const m = new Date();
    setCurrentMonth(m);
    void loadMonth(m);
  }

  async function handleGenerate30() {
    setIsGenerating(true);
    setGenerateResult(null);
    toast.info('Generating 30 days of content — this takes about 2 minutes…');
    try {
      const res = await fetch('/api/content/generate-batch-30', { method: 'POST' });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Generation failed');
      }
      const data = (await res.json()) as GenerateResult;
      setGenerateResult(data);
      toast.success(`Generated ${data.piecesCreated} pieces across ${data.batchesCreated} days`);
      // Reload the current month to show new pieces
      await loadMonth(currentMonth);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDisconnectLinkedIn() {
    const res = await fetch('/api/linkedin/disconnect', { method: 'POST' });
    if (res.ok) {
      toast.success('LinkedIn disconnected');
      window.location.reload();
    } else {
      toast.error('Failed to disconnect');
    }
  }

  function handleDragStart(e: React.DragEvent, pieceId: string) {
    e.dataTransfer.setData('pieceId', pieceId);
    setDraggingId(pieceId);
  }

  function handleDragEnd() {
    setDraggingId(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent, targetDate: Date) {
    e.preventDefault();
    const pieceId = e.dataTransfer.getData('pieceId');
    if (!pieceId) return;
    if (isPast(targetDate) && !isToday(targetDate)) {
      toast.error('Cannot reschedule to a past date');
      setDraggingId(null);
      return;
    }

    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece) return;

    // Preserve time component from original scheduled_for, or default to 9am
    let newDate: Date;
    if (piece.scheduled_for) {
      const orig = new Date(piece.scheduled_for);
      newDate = new Date(targetDate);
      newDate.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
    } else {
      newDate = new Date(targetDate);
      newDate.setHours(9, 0, 0, 0);
    }

    const scheduledFor = newDate.toISOString();

    // Optimistic update
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, scheduled_for: scheduledFor, status: 'scheduled' } : p)),
    );
    setDraggingId(null);

    try {
      const res = await fetch(`/api/content/pieces/${pieceId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Reschedule failed');
      }
      const data = (await res.json()) as { piece: ContentPiece };
      setPieces((prev) => prev.map((p) => (p.id === pieceId ? data.piece : p)));
      toast.success(`Rescheduled to ${format(newDate, 'MMM d')}`);
    } catch (e) {
      // Revert optimistic update
      setPieces((prev) =>
        prev.map((p) => (p.id === pieceId ? { ...p, scheduled_for: piece.scheduled_for, status: piece.status } : p)),
      );
      toast.error(e instanceof Error ? e.message : 'Reschedule failed');
    }
  }

  function handleChipClick(piece: ContentPiece) {
    setSelectedPiece(piece);
    setDrawerOpen(true);
  }

  function handlePieceUpdate(updated: ContentPiece) {
    setPieces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedPiece?.id === updated.id) setSelectedPiece(updated);
  }

  function handlePieceDelete(pieceId: string) {
    setPieces((prev) => prev.filter((p) => p.id !== pieceId));
    if (selectedPiece?.id === pieceId) setSelectedPiece(null);
  }

  // Calendar date computation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = getDay(monthStart); // 0 = Sunday
  const totalCells = Math.ceil((leadingBlanks + daysInMonth.length) / 7) * 7;
  const allCells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...daysInMonth,
    ...Array.from({ length: totalCells - leadingBlanks - daysInMonth.length }, () => null),
  ];

  function piecesForDay(day: Date): ContentPiece[] {
    return pieces
      .filter((p) => p.scheduled_for && isSameDay(new Date(p.scheduled_for), day))
      .sort((a, b) => {
        if (!a.scheduled_for) return 1;
        if (!b.scheduled_for) return -1;
        return new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime();
      });
  }

  return (
    <>
      {/* Header controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Month nav */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={goToPrev}>
            <ChevronLeft className="size-4" strokeWidth={1.5} />
          </Button>
          <span className="min-w-[140px] text-center text-[15px] font-semibold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon-sm" onClick={goToNext}>
            <ChevronRight className="size-4" strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-[12px] text-muted-foreground">
            Today
          </Button>
          {isLoadingMonth && <Loader2 className="size-3.5 animate-spin text-muted-foreground" strokeWidth={1.5} />}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* LinkedIn status */}
          {linkedIn.connected ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[12px] text-green-400">
                <Wifi className="size-3" strokeWidth={1.5} />
                {linkedIn.isMocked ? 'LinkedIn (pending)' : (linkedIn.handle ?? 'LinkedIn')}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => void handleDisconnectLinkedIn()}
                className="text-muted-foreground hover:text-foreground"
                title="Disconnect LinkedIn"
              >
                <Unlink className="size-3.5" strokeWidth={1.5} />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => { window.location.href = '/api/linkedin/auth'; }}
            >
              <ExternalLink className="size-3.5" strokeWidth={1.5} />
              Connect LinkedIn
            </Button>
          )}

          {/* Generate 30 days */}
          <Button
            onClick={() => void handleGenerate30()}
            disabled={isGenerating}
            className="gap-1.5"
          >
            {isGenerating ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <Sparkles className="size-4" strokeWidth={1.5} />
            )}
            {isGenerating ? 'Generating…' : 'Generate 30 days'}
          </Button>

          {/* Dev-only cron trigger (after mount so SSR HTML matches first paint) */}
          {showLocalhostCron && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => {
                void fetch('/api/cron/publish-due', {
                  headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ''}` },
                }).then(() => toast.success('Cron triggered'));
              }}
            >
              <RefreshCw className="size-3.5" strokeWidth={1.5} />
              Run cron
            </Button>
          )}
        </div>
      </div>

      {/* Generating banner */}
      {isGenerating && (
        <div className="mb-4 rounded-lg border border-border/50 bg-muted/20 px-4 py-3 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin shrink-0" strokeWidth={1.5} />
            <span>
              Generating 30 days of on-brand content across all pillars — this typically takes 2–3
              minutes. You can navigate away and come back.
            </span>
          </div>
        </div>
      )}

      {generateResult && !isGenerating && (
        <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-2.5 text-[12px] text-green-400">
          Created {generateResult.piecesCreated} pieces across {generateResult.batchesCreated} days
          {generateResult.totalTokens > 0 && ` · ~${generateResult.totalTokens.toLocaleString()} tokens`}
        </div>
      )}

      {/* Day labels */}
      <div className="mb-1 grid grid-cols-7 gap-px">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-medium text-muted-foreground/60">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg border border-border/30 bg-border/20 overflow-hidden">
        {allCells.map((day, i) => {
          if (!day) {
            return (
              <div
                key={`blank-${i}`}
                className="min-h-[100px] bg-card/30 p-1.5"
              />
            );
          }

          const dayPieces = piecesForDay(day);
          const visiblePieces = dayPieces.slice(0, 4);
          const overflow = dayPieces.length - 4;
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const past = isPast(day) && !today;
          const isDragTarget = draggingId !== null;

          return (
            <div
              key={day.toISOString()}
              onDragOver={handleDragOver}
              onDrop={(e) => void handleDrop(e, day)}
              onDragEnd={handleDragEnd}
              className={`min-h-[100px] p-1.5 transition-colors duration-100 ${
                inCurrentMonth ? 'bg-card' : 'bg-card/40'
              } ${isDragTarget && !past ? 'hover:bg-muted/30' : ''}`}
            >
              {/* Day number */}
              <div
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium ${
                  today
                    ? 'bg-primary text-primary-foreground'
                    : inCurrentMonth
                      ? 'text-foreground/80'
                      : 'text-muted-foreground/30'
                }`}
              >
                {format(day, 'd')}
              </div>

              {/* Chips */}
              <div className="space-y-0.5">
                {isLoadingMonth
                  ? dayPieces.length > 0 && <Skeleton className="h-5 w-full rounded" />
                  : visiblePieces.map((piece) => (
                      <ContentChip
                        key={piece.id}
                        piece={piece}
                        onClick={() => handleChipClick(piece)}
                        onDragStart={handleDragStart}
                        isPublishing={publishingIds.has(piece.id)}
                      />
                    ))}

                {overflow > 0 && (
                  <button
                    className="w-full rounded py-0.5 text-[10px] text-muted-foreground/50 transition-colors hover:bg-muted/30 hover:text-muted-foreground"
                    onClick={() => {
                      // Show last chip's day in the drawer just to open something
                      const last = dayPieces[4];
                      if (last) handleChipClick(last);
                    }}
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Piece drawer */}
      <PieceDrawer
        piece={selectedPiece}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onPieceUpdate={handlePieceUpdate}
        onPieceDelete={handlePieceDelete}
        linkedInConnected={linkedIn.connected && !linkedIn.isMocked}
      />
    </>
  );
}
