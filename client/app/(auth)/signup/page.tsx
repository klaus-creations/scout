"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, UserPlus, ArrowRight } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "An error occurred during sign up");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl text-zinc-100 shadow-2xl animate-in fade-in zoom-in duration-500">
                <CardHeader className="space-y-1 pt-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                        <Mail className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
                    <CardDescription className="text-zinc-400 text-base">
                        We&apos;ve sent a verification link to <span className="text-zinc-200 font-medium">{email}</span>
                    </CardDescription>
                </CardHeader>
                <CardFooter className="pb-8 justify-center">
                    <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-purple-400 transition-colors underline underline-offset-4">
                        Return to sign in
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl text-zinc-100 shadow-2xl animate-in fade-in zoom-in duration-500">
            <CardHeader className="space-y-1 pt-8">
                <CardTitle className="text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Create an account
                </CardTitle>
                <CardDescription className="text-zinc-400 text-center text-base">
                    Get started with your new account today
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 pt-4">
                <form onSubmit={handleSignup} className="grid gap-5">
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
                        <Label htmlFor="password" title="password" className="text-zinc-300 ml-1">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pl-10 bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-zinc-500 ml-1 mt-1">
                            Must be at least 8 characters long
                        </p>
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
                                Create account
                                <UserPlus className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
                        <span className="bg-zinc-900 px-2 text-zinc-500">Or join with</span>
                    </div>
                </div>
                <p className="text-center text-sm text-zinc-500">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-zinc-300 hover:text-purple-400 transition-colors underline underline-offset-4"
                    >
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
