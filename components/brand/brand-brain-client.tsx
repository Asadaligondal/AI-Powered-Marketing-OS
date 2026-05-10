"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  acceptBrandSuggestion,
  saveBrand,
  type AcceptField,
} from "@/app/actions/brand-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { SectionDivider } from "@/components/ui/section";
import { Textarea } from "@/components/ui/textarea";
import type { BrandProduct, BrandRow, BrandSynthesisSuggestion } from "@/lib/types";
import { X } from "lucide-react";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function asProducts(v: unknown): BrandProduct[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((p) => p && typeof p === "object")
    .map((p) => ({
      name: typeof (p as { name?: unknown }).name === "string" ? (p as { name: string }).name : "",
      type:
        typeof (p as { type?: unknown }).type === "string" ? (p as { type: string }).type : "",
      price:
        typeof (p as { price?: unknown }).price === "string" ? (p as { price: string }).price : "",
      description:
        typeof (p as { description?: unknown }).description === "string"
          ? (p as { description: string }).description
          : "",
    }))
    .filter((p) => p.name.trim());
}

function formatPreview(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const FIELD_LABELS: Record<AcceptField, string> = {
  name: "Name",
  tagline: "Tagline",
  description: "Description",
  voice: "Voice",
  audience: "Audience",
  products: "Products",
  content_pillars: "Content pillars",
  pain_points: "Pain points",
  competitors: "Competitors",
};

export function BrandBrainClient({ brand }: { brand: BrandRow }) {
  const [name, setName] = useState(brand.name);
  const [tagline, setTagline] = useState(brand.tagline ?? "");
  const [description, setDescription] = useState(brand.description ?? "");
  const [voice, setVoice] = useState(brand.voice ?? "");
  const [audience, setAudience] = useState(brand.audience ?? "");
  const [products, setProducts] = useState<BrandProduct[]>(() => asProducts(brand.products));
  const [pillars, setPillars] = useState<string[]>(() => asStringArray(brand.content_pillars));
  const [painPoints, setPainPoints] = useState<string[]>(() => asStringArray(brand.pain_points));
  const [competitors, setCompetitors] = useState<string[]>(() => asStringArray(brand.competitors));

  const [pillarDraft, setPillarDraft] = useState("");
  const [painDraft, setPainDraft] = useState("");
  const [compDraft, setCompDraft] = useState("");

  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [suggestions, setSuggestions] = useState<BrandSynthesisSuggestion | null>(null);

  const [pendingSave, startSave] = useTransition();
  const [pendingSynth, startSynth] = useTransition();
  const [pendingAccept, startAccept] = useTransition();

  const suggestionEntries = useMemo(() => {
    if (!suggestions) return [];
    return Object.entries(suggestions).filter(([k, v]) => {
      return k in FIELD_LABELS && v !== undefined && v !== null;
    }) as [AcceptField, unknown][];
  }, [suggestions]);

  useEffect(() => {
    setName(brand.name);
    setTagline(brand.tagline ?? "");
    setDescription(brand.description ?? "");
    setVoice(brand.voice ?? "");
    setAudience(brand.audience ?? "");
    setProducts(asProducts(brand.products));
    setPillars(asStringArray(brand.content_pillars));
    setPainPoints(asStringArray(brand.pain_points));
    setCompetitors(asStringArray(brand.competitors));
  }, [brand]);

  function updateProduct(index: number, patch: Partial<BrandProduct>) {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function addProduct() {
    setProducts((prev) => [...prev, { name: "", type: "", price: "", description: "" }]);
  }

  function removeProduct(index: number) {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }

  function addChip(
    draft: string,
    setDraft: (v: string) => void,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) {
    const next = draft.trim();
    if (!next) return;
    setter((prev) => (prev.includes(next) ? prev : [...prev, next]));
    setDraft("");
  }

  function onSave() {
    startSave(async () => {
      const res = await saveBrand({
        name,
        tagline,
        description,
        voice,
        audience,
        products: products.filter((p) => p.name.trim()),
        content_pillars: pillars,
        pain_points: painPoints,
        competitors,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Brand saved");
    });
  }

  function onSynthesize() {
    startSynth(async () => {
      try {
        const res = await fetch("/api/brand/synthesize", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: docTitle, content: docContent }),
        });
        const json = (await res.json()) as { suggestions?: BrandSynthesisSuggestion; error?: string };
        if (!res.ok) {
          toast.error(json.error ?? "Synthesis failed");
          return;
        }
        const sug = json.suggestions ?? {};
        const keys = Object.keys(sug);
        if (!keys.length) {
          toast.message("No suggested updates", {
            description: "The model did not propose any deltas for this document.",
          });
        } else {
          toast.success("Suggestions ready");
        }
        setSuggestions(sug);
      } catch {
        toast.error("Network error");
      }
    });
  }

  function onAccept(field: AcceptField, value: unknown) {
    startAccept(async () => {
      const res = await acceptBrandSuggestion({
        field,
        value: value as never,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      if (field === "name") setName(String(value));
      if (field === "tagline") setTagline(String(value));
      if (field === "description") setDescription(String(value));
      if (field === "voice") setVoice(String(value));
      if (field === "audience") setAudience(String(value));
      if (field === "products") setProducts(asProducts(value));
      if (field === "content_pillars") setPillars(asStringArray(value));
      if (field === "pain_points") setPainPoints(asStringArray(value));
      if (field === "competitors") setCompetitors(asStringArray(value));

      setSuggestions((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        delete (next as Record<string, unknown>)[field];
        return Object.keys(next).length ? next : null;
      });

      toast.success("Field updated");
    });
  }

  function onReject(field: AcceptField) {
    setSuggestions((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      delete (next as Record<string, unknown>)[field];
      return Object.keys(next).length ? next : null;
    });
  }

  function currentValueForField(field: AcceptField): unknown {
    switch (field) {
      case "name":
        return name;
      case "tagline":
        return tagline;
      case "description":
        return description;
      case "voice":
        return voice;
      case "audience":
        return audience;
      case "products":
        return products;
      case "content_pillars":
        return pillars;
      case "pain_points":
        return painPoints;
      case "competitors":
        return competitors;
      default:
        return "";
    }
  }

  return (
    <div className="space-y-10 pb-16">
      <PageHeader
        title="Brand brain"
        subtitle="Deskbound ships pre-seeded for the demo. Edit fields and save — embeddings refresh automatically."
      />
      <div className="grid gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Brand profile</CardTitle>
          <CardDescription>
            Core positioning fields. Saving refreshes your embedding vector from name, tagline, description, voice, and audience.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="voice">Voice</Label>
              <Textarea
                id="voice"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                rows={5}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="audience">Audience</Label>
              <Textarea
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                rows={5}
              />
            </div>
          </div>

          <SectionDivider />

          <div className="grid gap-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Products</p>
                <p className="text-xs text-muted-foreground">Name, type, price, description.</p>
              </div>
              <Button type="button" variant="outline" onClick={addProduct}>
                Add product
              </Button>
            </div>

            <div className="grid gap-3">
              {products.map((p, idx) => (
                <div
                  key={idx}
                  className="group rounded-lg border border-border bg-background p-4 shadow-[var(--elev-edge)] transition-colors duration-150 ease-out hover:border-border hover:bg-muted/20"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-2 md:col-span-2">
                      <Label>Name</Label>
                      <Input
                        value={p.name}
                        onChange={(e) => updateProduct(idx, { name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Input
                        value={p.type ?? ""}
                        onChange={(e) => updateProduct(idx, { type: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Price</Label>
                      <Input
                        value={p.price ?? ""}
                        onChange={(e) => updateProduct(idx, { price: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={p.description ?? ""}
                        onChange={(e) => updateProduct(idx, { description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => removeProduct(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <SectionDivider />

          <ChipEditor
            title="Content pillars"
            helper="Press Enter to add a pillar."
            values={pillars}
            draft={pillarDraft}
            setDraft={setPillarDraft}
            onAdd={() => addChip(pillarDraft, setPillarDraft, setPillars)}
            onRemove={(v) => setPillars((prev) => prev.filter((x) => x !== v))}
          />
          <ChipEditor
            title="Pain points"
            helper="Press Enter to add a pain point."
            values={painPoints}
            draft={painDraft}
            setDraft={setPainDraft}
            onAdd={() => addChip(painDraft, setPainDraft, setPainPoints)}
            onRemove={(v) => setPainPoints((prev) => prev.filter((x) => x !== v))}
          />
          <ChipEditor
            title="Competitors"
            helper="Press Enter to add a competitor or adjacent voice."
            values={competitors}
            draft={compDraft}
            setDraft={setCompDraft}
            onAdd={() => addChip(compDraft, setCompDraft, setCompetitors)}
            onRemove={(v) => setCompetitors((prev) => prev.filter((x) => x !== v))}
          />

          <div className="flex justify-end">
            <Button type="button" disabled={pendingSave || !name.trim()} onClick={onSave}>
              {pendingSave ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-2 border-l-primary bg-card">
        <CardHeader>
          <CardTitle>Train from a document</CardTitle>
          <CardDescription>
            Paste plain text or markdown. Optional `.txt` / `.md` upload reads into the textarea (parsed client-side).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="docTitle">Title</Label>
            <Input
              id="docTitle"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g., Founder letter"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="docFile">File (optional)</Label>
            <Input
              id="docFile"
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const ok = /\.(txt|md)$/i.test(file.name);
                if (!ok) {
                  toast.error("Only .txt or .md files are supported in Phase 1.");
                  e.target.value = "";
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => setDocContent(String(reader.result ?? ""));
                reader.readAsText(file);
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="docContent">Document</Label>
            <Textarea
              id="docContent"
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              rows={10}
              placeholder="Paste positioning notes, an outline, or any narrative about the brand."
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={pendingSynth || !docContent.trim()}
              onClick={onSynthesize}
              variant="outline"
            >
              {pendingSynth ? "Synthesizing…" : "Synthesize"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!!suggestionEntries.length && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested updates</CardTitle>
            <CardDescription>
              Review deltas side-by-side. Accept writes to your brand and refreshes embeddings.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {suggestionEntries.map(([field, proposed]) => {
              const current = currentValueForField(field);
              return (
                <div key={field} className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm font-medium text-foreground">{FIELD_LABELS[field]}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="grid gap-2">
                      <p className="text-xs font-medium text-muted-foreground">Current</p>
                      <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-card p-3 font-mono text-[12px] text-muted-foreground">
                        {formatPreview(current)}
                      </pre>
                    </div>
                    <div className="grid gap-2">
                      <p className="text-xs font-medium text-muted-foreground">Proposed</p>
                      <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-card p-3 font-mono text-[12px] text-foreground">
                        {formatPreview(proposed)}
                      </pre>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                      disabled={pendingAccept}
                      onClick={() => onReject(field)}
                    >
                      Reject
                    </Button>
                    <Button type="button" disabled={pendingAccept} onClick={() => onAccept(field, proposed)}>
                      Accept
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
    </div>
  );
}

function ChipEditor(props: {
  title: string;
  helper: string;
  values: string[];
  draft: string;
  setDraft: (v: string) => void;
  onAdd: () => void;
  onRemove: (v: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{props.title}</p>
          <p className="text-xs text-muted-foreground">{props.helper}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-background p-3">
        {props.values.length === 0 ? (
          <p className="text-xs text-muted-foreground">No items yet.</p>
        ) : (
          props.values.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => props.onRemove(v)}
              className="inline-flex max-w-full items-center gap-1 rounded-sm border border-border bg-muted px-2 py-1 text-left text-[12px] font-normal text-foreground transition-colors duration-150 ease-out hover:bg-muted/80"
              title="Remove"
            >
              <span className="min-w-0 truncate">{v}</span>
              <X className="size-3 shrink-0 opacity-50" strokeWidth={1.5} aria-hidden />
            </button>
          ))
        )}
      </div>
      <Input
        value={props.draft}
        onChange={(e) => props.setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            props.onAdd();
          }
        }}
        placeholder="Type and press Enter…"
      />
    </div>
  );
}
