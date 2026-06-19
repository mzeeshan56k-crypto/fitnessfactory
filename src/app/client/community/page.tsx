"use client";

import { useState } from "react";
import { Users, Heart, MessageCircle, Send } from "lucide-react";
import { useApp, useCurrentClient } from "@/lib/store";
import { useLocalState } from "@/lib/useLocalState";
import { Avatar } from "@/components/ui/Avatar";

interface Post {
  id: string;
  author: string;
  avatar: string;
  coach: boolean;
  time: string;
  text: string;
  likes: number;
  liked: boolean;
  comments: number;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SEED_POSTS: Post[] = [
  {
    id: "p1", author: "Coach Alex", avatar: "AC", coach: true, time: "2h ago",
    text: "New PR alert 💪 Huge shout-out to everyone who crushed leg day this week. Drop your wins below!",
    likes: 42, liked: false, comments: 12,
  },
  {
    id: "p2", author: "Emma Wilson", avatar: "EW", coach: false, time: "5h ago",
    text: "Hit 10,000 steps every day this week for the first time ever 🙌 The step streak challenge is keeping me honest.",
    likes: 28, liked: false, comments: 6,
  },
  {
    id: "p3", author: "James Okafor", avatar: "JO", coach: false, time: "1d ago",
    text: "Meal prepped for the whole week — high-protein and actually tasty. Macro Master badge incoming 😎",
    likes: 19, liked: false, comments: 4,
  },
  {
    id: "p4", author: "Coach Alex", avatar: "AC", coach: true, time: "2d ago",
    text: "Reminder: the Summer Shred challenge starts Monday. 20 workouts this month — who's in? 🔥",
    likes: 56, liked: false, comments: 21,
  },
];

export default function ClientCommunityPage() {
  const app = useApp();
  const client = useCurrentClient();

  const [posts, setPosts] = useLocalState<Post[]>("ffkc-community", SEED_POSTS);
  const [draft, setDraft] = useState("");

  const authorName = client?.name ?? "You";
  const authorAvatar = client?.avatar ?? initialsOf(authorName);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    const post: Post = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: authorName,
      avatar: authorAvatar,
      coach: false,
      time: "Just now",
      text,
      likes: 0,
      liked: false,
      comments: 0,
    };
    setPosts((prev) => [post, ...prev]);
    setDraft("");
  };

  const toggleLike = (id: string) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
          : p,
      ),
    );

  if (!app.hydrated)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-ink-50 p-6 text-white shadow-glow">
        <div className="flex items-center gap-2 text-sm text-brand-100">
          <Users className="h-4 w-4" /> Community
        </div>
        <h1 className="mt-1 text-2xl font-bold">Share wins, cheer each other on 🎉</h1>
        <p className="mt-1 text-sm text-brand-100">
          {posts.length} post{posts.length === 1 ? "" : "s"} from your fitness community
        </p>
      </section>

      {/* Composer */}
      <section className="card p-5">
        <div className="flex gap-3">
          <Avatar initials={authorAvatar} size="md" />
          <div className="flex-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Share something, ${authorName.split(" ")[0]}…`}
              rows={3}
              className="input resize-none"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={submit}
                disabled={!draft.trim()}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> Post
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="space-y-4">
        {posts.map((p) => (
          <article key={p.id} className="card p-5">
            <div className="flex items-center gap-3">
              <Avatar initials={p.avatar} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-ink-900">{p.author}</span>
                  {p.coach && <span className="badge bg-brand-500/15 text-brand-400">Coach</span>}
                </div>
                <span className="text-xs text-ink-400">{p.time}</span>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ink-700">{p.text}</p>

            <div className="mt-4 flex items-center gap-5 border-t border-ink-100 pt-3">
              <button
                type="button"
                onClick={() => toggleLike(p.id)}
                aria-pressed={p.liked}
                aria-label={p.liked ? "Unlike post" : "Like post"}
                className={
                  p.liked
                    ? "flex items-center gap-1.5 text-sm font-semibold text-brand-400 transition active:scale-95"
                    : "flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-brand-400 active:scale-95"
                }
              >
                <Heart className={p.liked ? "h-4 w-4 fill-brand-400 text-brand-400" : "h-4 w-4"} />
                {p.likes}
              </button>
              <span className="flex items-center gap-1.5 text-sm font-medium text-ink-500">
                <MessageCircle className="h-4 w-4" />
                {p.comments}
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
