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
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        full_name: fullName,
                    },
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
            <Card className="border-border bg-card shadow-sm animate-in fade-in zoom-in duration-500 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
                <CardHeader className="space-y-4 pt-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-600 shadow-inner">
                        <Mail className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-black tracking-tighter text-foreground leading-none">Validate Intelligence</CardTitle>
                        <CardDescription className="text-muted-foreground text-base font-medium">
                            Synthesizing your access... Check <span className="text-primary font-bold">{email}</span>
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardFooter className="pb-10 justify-center">
                    <Link href="/login" className="text-sm font-bold text-primary hover:underline underline-offset-4 tracking-tight">
                        ← Back to secure authentication
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="border-border bg-card shadow-sm animate-in fade-in zoom-in duration-500 rounded-xs relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-primary via-purple-500 to-primary" />
            <CardHeader className="space-y-2 pt-10">
                <CardTitle className="text-4xl font-black tracking-tighter text-center text-foreground">
                    Join Scout <span className="text-primary italic">AI</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground text-center text-base font-medium">
                    Deploy your personal research agent today
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 pt-4">
                <form onSubmit={handleSignup} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="fullName" className="text-foreground/80 ml-1 font-bold text-xs uppercase tracking-widest">Full Name</Label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 flex h-4 w-4 items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="pl-12 h-11  border-border text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>
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
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="password" title="password" className="text-foreground/80 ml-1 font-bold text-xs uppercase tracking-widest">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pl-12 h-11 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-xl"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword" title="confirm password" className="text-foreground/80 ml-1 font-bold text-xs uppercase tracking-widest">Confirm</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/40" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="pl-12 h-11 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 ml-1 mt-0 font-bold tracking-wide uppercase">
                        Security Requirement: Minimum 8 characters
                    </p>

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
                                Create Account
                                <UserPlus className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-bold text-primary hover:underline underline-offset-4"
                    >
                        Sign In
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
