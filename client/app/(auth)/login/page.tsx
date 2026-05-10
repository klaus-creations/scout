"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "An error occurred during sign in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-border bg-card shadow-sm animate-in fade-in zoom-in duration-500 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
            <CardHeader className="space-y-2 pt-10">
                <CardTitle className="text-4xl font-black tracking-tighter text-center text-foreground">
                    Scout <span className="text-primary italic">AI</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground text-center text-base font-medium">
                    Authenticate to access research intelligence
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 pt-4">
                <form onSubmit={handleLogin} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-foreground/80 ml-1 font-bold text-xs uppercase tracking-widest">Email address</Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="pl-12 h-11 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between ml-1">
                            <Label htmlFor="password" title="password" className="text-foreground/80 font-bold text-xs uppercase tracking-widest">Password</Label>
                            <Link
                                href="/forgot-password"
                                className="text-[10px] font-bold text-muted-foreground/60 hover:text-primary transition-colors tracking-widest uppercase"
                            >
                                Forgot?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pl-12 h-11 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-xl"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 font-bold rounded-xl border border-primary/20 group transition-all mt-2"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Sign In
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-8">
                <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.2em]">
                        <span className="bg-card px-4 text-muted-foreground/40">Secure Access</span>
                    </div>
                </div>
                <p className="text-center text-sm text-muted-foreground font-medium">
                    Don&apos;t have account?{" "}
                    <Link
                        href="/signup"
                        className="font-bold text-primary hover:underline underline-offset-4"
                    >
                        Create One
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
