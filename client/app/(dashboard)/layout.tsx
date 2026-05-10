"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { session, loading } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !session && pathname !== "/") {
            router.replace("/login");
        }
    }, [session, loading, router, pathname]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
        );
    }

    if (!session && pathname !== "/") return null;

    return (
        <div className="h-screen bg-transparent text-foreground relative overflow-hidden">

            <header className="border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/60 h-[10%]">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <Link href="/" className="text-2xl font-bold tracking-tighter font-heading text-primary flex items-center gap-2">
                        Scout<span className="text-foreground -ml-1">AI</span>
                    </Link>
                    <nav className="flex items-center gap-8 text-sm font-medium">
                        {session ? (
                            <>
                                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Research</Link>
                                <Link href="/jobs" className="text-muted-foreground hover:text-primary transition-colors">Jobs</Link>
                                <button
                                    onClick={async () => {
                                        const { supabase } = await import("@/lib/supabase");
                                        await supabase.auth.signOut();
                                    }}
                                    className="px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-border transition-all text-xs font-semibold"
                                >
                                    Sign out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">Login</Link>
                                <Link
                                    href="/signup"
                                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/20 transition-all font-bold"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-6 py-12 flex-1 h-[80%] overflow-y-auto">{children}</main>

            <footer className="border-t border-border/40 bg-background/30 backdrop-blur-sm shadow-none mt-auto h-[10%]">
                <div className="mx-auto max-w-5xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <span className="text-xl font-bold tracking-tighter font-heading text-primary flex items-center gap-2">Scout<span className="text-foreground -ml-1">AI</span></span>
                        <span className="text-xs font-medium text-muted-foreground/40 ml-2">© {new Date().getFullYear()} All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-8 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                        <Link href="/" className="hover:text-primary transition-colors">Privacy</Link>
                        <Link href="/" className="hover:text-primary transition-colors">Terms</Link>
                        <Link href="/" className="hover:text-primary transition-colors">X / Twitter</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
