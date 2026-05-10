'use client';

import {
  Briefcase,
  Camera,
  Check,
  Film,
  Layers,
  Loader2,
  Music2,
  XCircle,
} from 'lucide-react';

import type { ContentPiece, Platform } from '@/lib/types';

const PLATFORM_STYLE: Record<
  Platform,
  { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; chip: string; bar: string }
> = {
  linkedin: {
    icon: Briefcase,
    chip: 'bg-blue-500/8 text-blue-300 border-blue-500/15',
    bar: 'bg-blue-500/50',
  },
  instagram_post: {
    icon: Camera,
    chip: 'bg-pink-500/8 text-pink-300 border-pink-500/15',
    bar: 'bg-pink-500/50',
  },
  instagram_reel: {
    icon: Film,
    chip: 'bg-purple-500/8 text-purple-300 border-purple-500/15',
    bar: 'bg-purple-500/50',
  },
  instagram_story: {
    icon: Layers,
    chip: 'bg-purple-500/8 text-purple-200 border-purple-500/10',
    bar: 'bg-purple-400/50',
  },
  tiktok: {
    icon: Music2,
    chip: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/20',
    bar: 'bg-zinc-400/40',
  },
};

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return null;
  }
}

type ContentChipProps = {
  piece: ContentPiece;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, pieceId: string) => void;
  isPublishing?: boolean;
};

export function ContentChip({ piece, onClick, onDragStart, isPublishing }: ContentChipProps) {
  const cfg = PLATFORM_STYLE[piece.platform] ?? PLATFORM_STYLE.linkedin;
  const Icon = cfg.icon;
  const time = formatTime(piece.scheduled_for);
  const effectiveStatus = isPublishing ? 'publishing' : piece.status;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, piece.id)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`group relative flex cursor-pointer select-none items-center gap-1.5 overflow-hidden rounded border py-0.5 pl-2 pr-1.5 text-[11px] leading-tight transition-colors duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${cfg.chip} ${effectiveStatus === 'published' ? 'opacity-70' : ''}`}
    >
      {/* Colored left bar */}
      <div className={`absolute inset-y-0 left-0 w-[2px] ${cfg.bar}`} />

      <Icon className="ml-0.5 size-2.5 shrink-0 opacity-80" strokeWidth={1.5} />
      <span className="min-w-0 flex-1 truncate font-medium">{piece.hook}</span>

      <div className="ml-auto flex shrink-0 items-center gap-1 pl-1">
        {time && <span className="text-[10px] opacity-60">{time}</span>}

        {effectiveStatus === 'publishing' && (
          <Loader2 className="size-2.5 animate-spin opacity-70" strokeWidth={1.5} />
        )}
        {effectiveStatus === 'published' && (
          <Check className="size-2.5 text-green-400" strokeWidth={2} />
        )}
        {effectiveStatus === 'failed' && (
          <XCircle className="size-2.5 text-red-400" strokeWidth={1.5} />
        )}
      </div>
    </div>
  );
}
