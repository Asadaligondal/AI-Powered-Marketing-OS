'use client';

import { Loader2, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

const EXAMPLES = [
  {
    label: 'MOBILITY + email',
    message:
      "Hey! Can you send me the MOBILITY guide? I've been sitting 10 hours a day and my hips are wrecked. My email is sarah.chen@example.com — thanks!",
  },
  {
    label: 'RESET, no email',
    message: 'DM me RESET',
  },
  {
    label: 'Chatty, no keyword',
    message:
      "I saw your post about back pain and I'm really interested in learning more. Do you have any recommendations for someone who sits all day?",
  },
  {
    label: 'Email, wrong keyword',
    message: "Can I get a discount? My email is promo.hunter@test.com",
  },
];

type ExtractResult = {
  leadId: string;
  extracted: {
    keyword: string | null;
    intent: string;
    name: string | null;
    email: string | null;
    interests: string[];
  };
  klaviyoSynced: boolean;
};

export function SimulateDMDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [fromHandle, setFromHandle] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/webhooks/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), fromHandle: fromHandle.trim() || undefined }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Failed to send DM');
      }
      const data = (await res.json()) as ExtractResult;
      setOpen(false);
      setMessage('');
      setFromHandle('');
      const kw = data.extracted.keyword;
      const synced = data.klaviyoSynced ? ' · Synced to Klaviyo' : '';
      toast.success(`Lead captured${kw ? ` (${kw})` : ''}${synced}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send DM');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-1.5">
            <MessageSquare className="size-4" strokeWidth={1.5} />
            Simulate Instagram DM
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Simulate Instagram DM</DialogTitle>
          <DialogDescription>
            In production this would be a real webhook from Instagram. Paste a message below to
            trigger the lead capture and Klaviyo sync flow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Example pills */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Try an example
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setMessage(ex.message)}
                  className="rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Hey, can you DM me RESET? My email is test@example.com'
            className="min-h-[100px] resize-none text-[13px]"
            disabled={isSending}
          />

          <Input
            value={fromHandle}
            onChange={(e) => setFromHandle(e.target.value)}
            placeholder="From handle (optional, e.g. @fitnessgeek)"
            className="text-[13px]"
            disabled={isSending}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={() => void handleSend()}
            disabled={!message.trim() || isSending}
            className="gap-1.5"
          >
            {isSending && <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />}
            {isSending ? 'Parsing & syncing…' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
