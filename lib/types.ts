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
