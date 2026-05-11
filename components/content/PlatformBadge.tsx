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
    className:
      'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 dark:text-pink-300 border-pink-500/30 shadow-[0_0_8px_rgba(236,72,153,0.12)]',
  },
  instagram_reel: {
    label: 'Instagram Reel',
    icon: Film,
    className:
      'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-400 dark:text-purple-300 border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.12)]',
  },
  instagram_story: {
    label: 'Instagram Story',
    icon: Layers,
    className:
      'bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 text-fuchsia-400 dark:text-fuchsia-300 border-fuchsia-500/30 shadow-[0_0_8px_rgba(217,70,239,0.12)]',
  },
  tiktok: {
    label: 'TikTok',
    icon: Music2,
    className:
      'bg-gradient-to-r from-zinc-600/30 to-zinc-500/30 text-zinc-300 border-zinc-500/30',
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Briefcase,
    className:
      'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 dark:text-blue-300 border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.12)]',
  },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${config.className}`}
    >
      <Icon className="size-3 shrink-0" strokeWidth={2} />
      {config.label}
    </span>
  );
}
