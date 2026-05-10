import { Briefcase, Camera, Film, Layers, Music2 } from 'lucide-react';

import type { Platform } from '@/lib/types';

type PlatformConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  className: string;
};

const PLATFORM_CONFIG: Record<Platform, PlatformConfig> = {
  instagram_post: {
    label: 'Instagram Post',
    icon: Camera,
    className: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  },
  instagram_reel: {
    label: 'Instagram Reel',
    icon: Film,
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  instagram_story: {
    label: 'Instagram Story',
    icon: Layers,
    className: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  },
  tiktok: {
    label: 'TikTok',
    icon: Music2,
    className: 'bg-zinc-700/40 text-zinc-300 border-zinc-600/30',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Briefcase,
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${config.className}`}
    >
      <Icon className="size-3 shrink-0" strokeWidth={1.5} />
      {config.label}
    </span>
  );
}
