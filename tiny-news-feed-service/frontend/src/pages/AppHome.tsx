// import { useAuth } from "../auth/AuthContext";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getFeedService, type FeedResponse, type PostDetailResponse } from "../utils/feed.service";
import PostForm from "./Post";
import { useAuth } from "../auth/AuthContext";
import { useFeedSocket } from "../realtime/useFeedSocket";


const formatDate = (dateInput: string | Date): string => {
    const date = new Date(dateInput);

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }) + ' · ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

const formatCompactTime = (dateInput: string | Date): string => {
    return new Date(dateInput).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
};

const isSameDay = (dateInput: string | Date): boolean => {
    const date = new Date(dateInput);
    const now = new Date();

    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
};


export default function AppHome() {
    const { user, logout } = useAuth();
    const [feedResponse, setFeedResponse] = useState<FeedResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshNotices, setRefreshNotices] = useState(0);

    const loadFeed = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getFeedService();
            setFeedResponse(res);
        } catch {
            setError("We couldn't load your feed right now. Please retry in a moment.");
        } finally {
            setLoading(false);
            setRefreshNotices(0);
        }
    }, []);

    useEffect(() => {
        let active = true;
        loadFeed().catch(() => {
            if (!active) return;
            setError("We couldn't load your feed right now. Please retry in a moment.");
        });
        return () => {
            active = false;
        };
    }, [loadFeed]);

    const posts = useMemo(() => {
        const list = feedResponse?.posts ?? [];
        const seen = new Set<string>();
        return list.filter((p) => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
        });
    }, [feedResponse]);
    const todaysCount = useMemo(
        () => posts.filter((post) => isSameDay(post.createdAt)).length,
        [posts]
    );
    const initials =
        (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "") || user?.handle?.[0] || "NF";

    const handleOwnPost = useCallback((post: PostDetailResponse) => {
        setFeedResponse((prev) => {
            const currentPosts = prev?.posts ?? [];
            const withoutDupes = currentPosts.filter((p) => p.id !== post.id);
            return {
                nextCursor: prev?.nextCursor ?? null,
                posts: [post, ...withoutDupes],
            };
        });
    }, []);

    const handleRefreshNotice = useCallback(() => {
        setRefreshNotices((count) => count + 1);
    }, []);

    useFeedSocket({
        onOwnPost: handleOwnPost,
        onRefreshNotice: handleRefreshNotice,
    });

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-16 -top-20 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
                <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
                <div className="absolute left-1/3 bottom-[-6rem] h-72 w-72 rounded-full bg-cyan-400/15 blur-[120px]" />
            </div>

            <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                <header className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-indigo-900/40 backdrop-blur-xl">
                    <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-500 to-indigo-700 text-lg font-semibold uppercase shadow-lg shadow-indigo-900/40">
                                {initials}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Your hub</p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-semibold leading-tight text-white">Tiny News Feed</h1>
                                    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                                        Live
                                    </span>
                                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-100">
                                        {posts.length} posts
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-300">
                                    Hi {user ? `${user.firstName} ${user.lastName}` : "there"}, your feed refreshes automatically.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <PostForm />
                            <button
                                type="button"
                                onClick={logout}
                                className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-3 border-t border-white/10 px-6 py-4 sm:grid-cols-3">
                        <StatPill label="New today" value={todaysCount.toString()} hint="Posts shared in the last 24h" />
                        <StatPill label="Latest update" value={posts[0] ? formatCompactTime(posts[0].createdAt) : "—"} hint={posts[0] ? formatDate(posts[0].createdAt) : "Waiting for fresh stories"} />
                        <StatPill label="With media" value={posts.filter((p) => p.photoURL).length.toString()} hint="Posts carrying images" />
                    </div>
                </header>

                <main className="mt-8">
                    {refreshNotices > 0 && (
                        <div className="mb-4 flex justify-center">
                            <button
                                type="button"
                                onClick={loadFeed}
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-lg shadow-emerald-900/40 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                            >
                                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_6px_rgba(74,222,128,0.25)]" aria-hidden />
                                New posts available
                                <span className="rounded-full bg-emerald-300/30 px-2 py-0.5 text-xs font-semibold text-emerald-50">
                                    {refreshNotices}
                                </span>
                                <svg className="h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m4 4 7.5 7.5L4 19M13 5h7m-7 14h7" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-400/15 px-4 py-3 text-sm text-amber-100 shadow-lg shadow-amber-900/40">
                            {error}
                        </div>
                    )}

                    <section className="space-y-4">
                        {loading && (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, idx) => (
                                    <div key={idx} className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-slate-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-slate-700/70" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-32 rounded bg-slate-700/60" />
                                                <div className="h-3 w-24 rounded bg-slate-800/60" />
                                            </div>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <div className="h-3 rounded bg-slate-800/60" />
                                            <div className="h-3 w-11/12 rounded bg-slate-800/60" />
                                            <div className="h-3 w-8/12 rounded bg-slate-800/60" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && posts.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center shadow-inner shadow-slate-900/50">
                                <p className="text-lg font-semibold text-white">No posts yet</p>
                                <p className="mt-2 text-sm text-slate-300">
                                    Start the conversation by sharing your first update.
                                </p>
                            </div>
                        )}

                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </section>
                </main>
            </div>
        </div>
    );
}


const PostCard: React.FC<{ post: PostDetailResponse }> = ({ post }) => {
    const { content, photoURL, user, createdAt } = post;

    return (
        <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 shadow-xl shadow-slate-900/50">
            <div className="absolute right-4 top-4 flex items-center gap-2 text-xs text-slate-200">
                <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-3 py-1 font-medium text-sky-100">
                    {photoURL ? "Media post" : "Text only"}
                </span>
                <span className="text-slate-400">{formatCompactTime(createdAt)}</span>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400 text-sm font-semibold uppercase text-white shadow-lg shadow-slate-900/40">
                        {user.handle.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-white">@{user.handle}</p>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" aria-hidden />
                            <p className="text-xs text-slate-400">{formatDate(createdAt)}</p>
                        </div>
                        <div className="mt-2 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm leading-relaxed text-slate-100 shadow-inner shadow-slate-900/50">
                            <p className="whitespace-pre-wrap">{content}</p>
                        </div>
                    </div>
                </div>

                {photoURL && (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-lg shadow-slate-900/50">
                        <img
                            src={photoURL}
                            alt="Post attachment"
                            className="h-auto w-full max-h-96 object-cover"
                        />
                    </div>
                )}
            </div>
        </article>
    );
};

function StatPill({ label, value, hint }: { label: string; value: string; hint: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 shadow-inner shadow-slate-900/40">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-semibold text-white">{value}</span>
                <span className="text-xs text-slate-300">{hint}</span>
            </div>
        </div>
    );
}
