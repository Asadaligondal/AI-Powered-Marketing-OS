export type BrandProduct = {
  name: string;
  type?: string;
  price?: string;
  description?: string;
};

export type BrandRow = {
  id: string;
  user_id: string | null;
  name: string;
  tagline: string | null;
  description: string | null;
  voice: string | null;
  audience: string | null;
  products: BrandProduct[] | null;
  content_pillars: string[] | null;
  pain_points: string[] | null;
  competitors: string[] | null;
  created_at?: string;
  updated_at?: string;
};

export type BrandSynthesisSuggestion = Partial<{
  name: string;
  tagline: string;
  description: string;
  voice: string;
  audience: string;
  products: BrandProduct[];
  content_pillars: string[];
  pain_points: string[];
  competitors: string[];
}>;

export type Platform =
  | 'instagram_post'
  | 'instagram_reel'
  | 'tiktok'
  | 'linkedin'
  | 'instagram_story';

export type ContentStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export type StoryboardBeat = {
  beat: number;
  duration_s: number;
  shot: string;
  on_screen_text: string;
  voiceover: string;
};

export type StoryFrame = {
  frame: number;
  text_overlay: string;
  interactive: string;
};

export type ContentPieceMetadata = {
  hashtags?: string[];
  cta?: string;
  hook_score: number;
  hook_score_reason: string;
  storyboard?: StoryboardBeat[];
  total_duration_s?: number;
  music_vibe?: string;
  trend_angle?: string | null;
  format?: string;
  frames?: StoryFrame[];
};

export type ContentPiece = {
  id: string;
  batch_id: string;
  brand_id: string;
  platform: Platform;
  hook: string;
  body: string;
  metadata: ContentPieceMetadata;
  status: ContentStatus;
  scheduled_for: string | null;
  published_at: string | null;
  external_id: string | null;
  publish_error: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentBatch = {
  id: string;
  brand_id: string;
  topic: string;
  rationale: string | null;
  created_at: string;
};

export type RecentBatch = {
  id: string;
  topic: string;
  created_at: string;
};
