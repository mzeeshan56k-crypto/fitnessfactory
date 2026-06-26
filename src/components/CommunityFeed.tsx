"use client";

import { useState } from "react";
import { Users, Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { Avatar } from "@/components/ui/Avatar";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "ME";
}

export function CommunityFeed({
  meId,
  meName,
  meAvatar,
  canDelete = false,
}: {
  meId: string;
  meName: string;
  meAvatar: string;
  /** Coaches can delete any post; members only their own. */
  canDelete?: boolean;
}) {
  const app = useApp();
  const [draft, setDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  const posts = app.communityPosts;

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    app.addCommunityPost(text);
    setDraft("");
  };

  const submitComment = (postId: string) => {
    const text = (commentDraft[postId] ?? "").trim();
    if (!text) return;
    app.addCommunityComment(postId, text);
    setCommentDraft((d) => ({ ...d, [postId]: "" }));
    setOpenComments((o) => ({ ...o, [postId]: true }));
  };

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
          <Avatar initials={meAvatar} size="md" />
          <div className="flex-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Share something, ${meName.split(" ")[0]}…`}
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
        {posts.length === 0 && (
          <div className="card p-8 text-center text-sm text-ink-400">
            No posts yet. Be the first to share a win! 💪
          </div>
        )}
        {posts.map((p) => {
          const liked = p.likedBy.includes(meId);
          const showComments = openComments[p.id];
          const mineToDelete = canDelete || p.author === meName;
          return (
            <article key={p.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar initials={p.avatar || initialsOf(p.author)} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink-900">{p.author}</span>
                    {p.coach && <span className="badge bg-brand-500/15 text-brand-400">Coach</span>}
                  </div>
                  <span className="text-xs text-ink-400">{timeAgo(p.ts)}</span>
                </div>
                {mineToDelete && (
                  <button
                    type="button"
                    onClick={() => app.removeCommunityPost(p.id)}
                    aria-label="Delete post"
                    className="rounded-full p-1.5 text-ink-300 transition hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{p.text}</p>

              <div className="mt-4 flex items-center gap-5 border-t border-ink-100 pt-3">
                <button
                  type="button"
                  onClick={() => app.toggleCommunityLike(p.id)}
                  aria-pressed={liked}
                  aria-label={liked ? "Unlike post" : "Like post"}
                  className={
                    liked
                      ? "flex items-center gap-1.5 text-sm font-semibold text-brand-400 transition active:scale-95"
                      : "flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-brand-400 active:scale-95"
                  }
                >
                  <Heart className={liked ? "h-4 w-4 fill-brand-400 text-brand-400" : "h-4 w-4"} />
                  {p.likedBy.length}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenComments((o) => ({ ...o, [p.id]: !o[p.id] }))}
                  className="flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-brand-400"
                >
                  <MessageCircle className="h-4 w-4" />
                  {p.comments.length}
                </button>
              </div>

              {showComments && (
                <div className="mt-3 space-y-3 border-t border-ink-100 pt-3">
                  {p.comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2">
                      <Avatar initials={c.avatar || initialsOf(c.author)} size="sm" />
                      <div className="flex-1 rounded-2xl bg-ink-50/60 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-ink-900">{c.author}</span>
                          {c.coach && <span className="badge bg-brand-500/15 text-brand-400">Coach</span>}
                          <span className="text-[10px] text-ink-400">{timeAgo(c.ts)}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-ink-700">{c.text}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Avatar initials={meAvatar} size="sm" />
                    <input
                      value={commentDraft[p.id] ?? ""}
                      onChange={(e) => setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") submitComment(p.id); }}
                      placeholder="Write a comment…"
                      className="input flex-1 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => submitComment(p.id)}
                      disabled={!(commentDraft[p.id] ?? "").trim()}
                      className="btn-primary shrink-0 px-3 py-2 disabled:opacity-50"
                      aria-label="Send comment"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
