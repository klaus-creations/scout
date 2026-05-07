"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { session, loading } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !session) {
            router.replace("/login");
        }
    }, [session, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
            {/* Top nav */}
            <header className="border-b border-zinc-800/60 backdrop-blur-sm sticky top-0 z-40 bg-zinc-950/80">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <Link href="/" className="text-lg font-semibold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Scout<span className="text-purple-400">AI</span>
                    </Link>
                    <nav className="flex items-center gap-6 text-sm">
                        <Link href="/" className="text-zinc-400 hover:text-zinc-100 transition-colors">Research</Link>
                        <Link href="/jobs" className="text-zinc-400 hover:text-zinc-100 transition-colors">Jobs</Link>
                        <button

                            onClick={async () => {
                                const { supabase } = await import("@/lib/supabase");
                                await supabase.auth.signOut();
                            }}
                            className="text-zinc-500 hover:text-red-400 transition-colors"
                        >
                            Sign out
                        </button>
                    </nav>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        </div>
    );
}
