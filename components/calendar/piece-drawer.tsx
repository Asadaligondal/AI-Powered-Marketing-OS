'use client';

import {
  CalendarDays,
  Check,
  Loader2,
  SendHorizonal,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { PlatformBadge } from '@/components/content/PlatformBadge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import type { ContentPiece, ContentPieceMetadata, ContentStatus } from '@/lib/types';

function StatusBadge({ status }: { status: ContentStatus }) {
  const cfg: Record<ContentStatus, string> = {
    draft: 'bg-zinc-700/40 text-zinc-400',
    scheduled: 'bg-amber-500/15 text-amber-400',
    publishing: 'bg-blue-500/15 text-blue-400',
    published: 'bg-green-500/15 text-green-400',
    failed: 'bg-red-500/15 text-red-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${cfg[status]}`}>
      {status}
    </span>
  );
}

function HookChip({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-green-500/15 text-green-400'
      : score >= 60
        ? 'bg-amber-500/15 text-amber-400'
        : 'bg-zinc-700/30 text-zinc-400';
  return (
    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium tabular-nums ${color}`}>
      {score}
    </span>
  );
}

function StoryboardReadout({
  storyboard,
}: {
  storyboard: ContentPieceMetadata['storyboard'];
}) {
  if (!storyboard?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        Storyboard
      </p>
      {storyboard.map((beat) => (
        <div
          key={beat.beat}
          className="rounded-md border border-border/40 bg-muted/10 p-2.5 text-[12px]"
        >
          <p className="font-medium text-foreground/70">
            Beat {beat.beat} · {beat.duration_s}s
          </p>
          <p className="mt-0.5 text-muted-foreground">
            <span className="text-foreground/60">Shot:</span> {beat.shot}
          </p>
          <p className="mt-0.5 text-muted-foreground">
            <span className="text-foreground/60">On screen:</span> {beat.on_screen_text}
          </p>
          <p className="mt-0.5 text-muted-foreground">
            <span className="text-foreground/60">VO:</span> {beat.voiceover}
          </p>
        </div>
      ))}
    </div>
  );
}

type PieceDrawerProps = {
  piece: ContentPiece | null;
  open: boolean;
  onClose: () => void;
  onPieceUpdate: (piece: ContentPiece) => void;
  onPieceDelete: (pieceId: string) => void;
  linkedInConnected: boolean;
};

export function PieceDrawer({
  piece,
  open,
  onClose,
  onPieceUpdate,
  onPieceDelete,
  linkedInConnected,
}: PieceDrawerProps) {
  const [hook, setHook] = useState('');
  const [body, setBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (piece) {
      setHook(piece.hook ?? '');
      setBody(piece.body ?? '');
      setConfirmDelete(false);
    }
  }, [piece]);

  async function save(updates: { hook?: string; body?: string }) {
    if (!piece) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/content/pieces/${piece.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = (await res.json()) as { piece: ContentPiece };
      onPieceUpdate(data.piece);
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }

  function scheduleSave(updates: { hook?: string; body?: string }) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(updates), 800);
  }

  async function handlePublish() {
    if (!piece) return;
    setIsPublishing(true);
    try {
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pieceId: piece.id }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Publish failed');
      }
      const result = (await res.json()) as { success: boolean; real: boolean; external_id?: string };
      const updated: ContentPiece = { ...piece, status: 'published', external_id: result.external_id ?? null };
      onPieceUpdate(updated);
      toast.success(result.real ? 'Posted to LinkedIn' : 'Published (mocked)');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleDelete() {
    if (!piece) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/content/pieces/${piece.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      onPieceDelete(piece.id);
      onClose();
      toast.success('Piece deleted');
    } catch {
      toast.error('Failed to delete piece');
    } finally {
      setIsDeleting(false);
    }
  }

  const meta = piece?.metadata;
  const isLive = piece?.status === 'published';
  const scheduledAt = piece?.scheduled_for
    ? new Date(piece.scheduled_for).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const canPublishReal = piece?.platform === 'linkedin' && linkedInConnected;

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }} direction="right">
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg overflow-y-auto">
        <DrawerHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {piece && <PlatformBadge platform={piece.platform} />}
              {piece && <StatusBadge status={piece.status} />}
              {meta?.hook_score !== undefined && <HookChip score={meta.hook_score} />}
            </div>
            <DrawerClose className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}>
              <X className="size-4" strokeWidth={1.5} />
              <span className="sr-only">Close</span>
            </DrawerClose>
          </div>

          {scheduledAt && (
            <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <CalendarDays className="size-3.5" strokeWidth={1.5} />
              {scheduledAt}
            </div>
          )}
        </DrawerHeader>

        <div className="flex flex-col gap-5 overflow-y-auto p-4">
          {/* Hook */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Hook
            </p>
            <Textarea
              value={hook}
              onChange={(e) => {
                setHook(e.target.value);
                scheduleSave({ hook: e.target.value, body });
              }}
              disabled={isLive}
              className="min-h-[60px] resize-none text-[14px] font-medium"
              placeholder="First line that breaks the scroll"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Body
              </p>
              {isSaving && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                  <Loader2 className="size-3 animate-spin" strokeWidth={1.5} /> Saving...
                </span>
              )}
              {!isSaving && piece && piece.updated_at !== piece.created_at && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                  <Check className="size-3" strokeWidth={2} /> Saved
                </span>
              )}
            </div>
            <Textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                scheduleSave({ hook, body: e.target.value });
              }}
              disabled={isLive}
              className="min-h-[220px] resize-none whitespace-pre-wrap text-[13px] leading-relaxed"
              placeholder="Full post body"
            />
          </div>

          {/* Hashtags */}
          {meta?.hashtags && meta.hashtags.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Hashtags
              </p>
              <div className="flex flex-wrap gap-1">
                {meta.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Storyboard (Reel / TikTok) */}
          <StoryboardReadout storyboard={meta?.storyboard} />

          {/* Story frames */}
          {meta?.frames && meta.frames.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Frames
              </p>
              {meta.frames.map((f) => (
                <div
                  key={f.frame}
                  className="rounded-md border border-border/40 bg-muted/10 p-2.5 text-[12px]"
                >
                  <p className="font-medium text-foreground/70">Frame {f.frame}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    <span className="text-foreground/60">Text:</span> {f.text_overlay}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">
                    <span className="text-foreground/60">Interactive:</span> {f.interactive}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* CTA + hook reason */}
          {(meta?.cta ?? meta?.hook_score_reason) && (
            <div className="space-y-1 rounded-md border border-border/30 bg-muted/10 p-3 text-[12px]">
              {meta?.cta && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground/60">CTA:</span> {meta.cta}
                </p>
              )}
              {meta?.hook_score_reason && (
                <p className="text-muted-foreground/70">
                  Hook {meta.hook_score}: {meta.hook_score_reason}
                </p>
              )}
            </div>
          )}

          {/* External ID if published */}
          {piece?.external_id && (
            <p className="text-[11px] text-muted-foreground/40">
              External ID: {piece.external_id}
            </p>
          )}
        </div>

        <DrawerFooter className="border-t border-border/40">
          {!isLive && (
            <Button
              onClick={() => void handlePublish()}
              disabled={isPublishing || isDeleting}
              className="w-full gap-2"
            >
              {isPublishing ? (
                <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
              ) : (
                <SendHorizonal className="size-4" strokeWidth={1.5} />
              )}
              {isPublishing
                ? 'Publishing...'
                : canPublishReal
                  ? 'Publish to LinkedIn'
                  : 'Publish (mocked)'}
            </Button>
          )}

          {isLive && (
            <div className="flex items-center justify-center gap-2 text-[13px] text-green-400">
              <Check className="size-4" strokeWidth={2} />
              Published
              {piece?.published_at && (
                <span className="text-muted-foreground/60">
                  · {new Date(piece.published_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {!confirmDelete ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                disabled={isPublishing || isDeleting}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" strokeWidth={1.5} />
                Delete
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground">Sure?</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  className="gap-1.5"
                >
                  {isDeleting ? <Loader2 className="size-3.5 animate-spin" strokeWidth={1.5} /> : null}
                  Yes, delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
