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
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl text-zinc-100 shadow-2xl animate-in fade-in zoom-in duration-500">
            <CardHeader className="space-y-1 pt-8">
                <CardTitle className="text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Welcome back
                </CardTitle>
                <CardDescription className="text-zinc-400 text-center text-base">
                    Enter your credentials to access your account
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 pt-4">
                <form onSubmit={handleLogin} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-zinc-300 ml-1">Email address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="pl-10 bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between ml-1">
                            <Label htmlFor="password" title="password" className="text-zinc-300">Password</Label>
                            <Link
                                href="/forgot-password"
                                className="text-xs text-zinc-500 hover:text-purple-400 transition-colors"
                            >
                                Forgot?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pl-10 bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
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
                        className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 h-11 font-semibold group transition-all"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Sign In
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-8">
                <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-zinc-900 px-2 text-zinc-500">Or continue with</span>
                    </div>
                </div>
                <p className="text-center text-sm text-zinc-500">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="font-medium text-zinc-300 hover:text-purple-400 transition-colors underline underline-offset-4"
                    >
                        Sign up for free
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
