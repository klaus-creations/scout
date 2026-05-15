"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startResearch, type ResearchDepth, type StreamEvent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/hooks";
import {
    Loader2, Zap, Search, Globe, FileText,
    AlertCircle, Shield, Brain, Cpu, ArrowRight,
    Sparkles, Terminal, ChevronRight, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

type ResearchStatus = "idle" | "streaming" | "done" | "error";

interface DisplayEvent {
    type: StreamEvent["type"];
    message: string;
    data?: Record<string, unknown>;
}

export default function ResearchPage() {
    const { session, loading } = useSession();
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [depth, setDepth] = useState<ResearchDepth>("deep");
    const [status, setStatus] = useState<ResearchStatus>("idle");
    const [events, setEvents] = useState<DisplayEvent[]>([]);
    const [jobId, setJobId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const eventsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (eventsEndRef.current) {
            eventsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [events]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setStatus("streaming");
        setEvents([]);
        setError(null);
        setJobId(null);

        try {
            const stream = await startResearch(query.trim(), depth);
            const reader = stream.getReader();

            while (true) {
                const { done, value: event } = await reader.read();
                if (done) break;

                if (event.type === "job_created") {
                    setJobId(event.data?.job_id as string);
                }

                setEvents((prev) => [...prev, event]);

                if (event.type === "done") setStatus("done");
                if (event.type === "error") {
                    setStatus("error");
                    setError(event.message);
                }
            }
        } catch (err: any) {
            setStatus("error");
            setError(err.message ?? "Something went wrong");
        }
    };

    const eventIcon = (type: DisplayEvent["type"]) => {
        switch (type) {
            case "source": return <Globe className="h-3.5 w-3.5 text-blue-400" />;
            case "section_done": return <FileText className="h-3.5 w-3.5 text-emerald-400" />;
            case "error": return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
            case "done": return <Sparkles className="h-3.5 w-3.5 text-purple-400" />;
            default: return <Activity className="h-3.5 w-3.5 text-zinc-500" />;
        }
    };

    if (loading) return null;

    // --- UNAUTHENTICATED LANDING VIEW ---
    if (!session?.user) {
        return (
            <div className="flex flex-col gap-24 py-12 lg:py-20 animate-in fade-in duration-1000">
                <div className="flex flex-col items-center text-center space-y-8">
                    <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-foreground leading-[0.9] max-w-4xl">
                        Autonomous <span className="text-primary italic">Intelligence</span> <br />for the Modern Era
                    </h1>
                    <p className="text-muted-foreground text-xl lg:text-2xl max-w-2xl leading-relaxed">
                        Deploy specialized AI agents that navigate the web, verify facts, and synthesize deep research reports in minutes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            onClick={() => router.push("/signup")}
                            size="lg"
                            className="h-14 px-8 bg-primary text-primary-foreground hover:opacity-90 rounded-full text-lg group transition-all shadow-lg shadow-primary/25"
                        >
                            Get Started Free
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: Globe, title: "Web Intelligence", desc: "Browses live web sources with neural navigation." },
                        { icon: Shield, title: "Fact Verification", desc: "Cross-references multiple data points for accuracy." },
                        { icon: Brain, title: "Deep Synthesis", desc: "Writes comprehensive multi-page research reports." },
                        { icon: Cpu, title: "API Integration", desc: "Connect your research data to any workflow." }
                    ].map((feature, i) => (
                        <div key={i} className="p-8 rounded-3xl border border-border bg-card/50 hover:border-primary/30 transition-all group">
                            <feature.icon className="h-10 w-10 text-primary mb-6 group-hover:scale-110 transition-transform duration-300" />
                            <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- AUTHENTICATED RESEARCH DASHBOARD ---
    return (
        <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                    AI <span className="text-primary italic">Research</span>
                </h1>
                <p className="text-muted-foreground text-lg">Define your objective and let the agents handle the discovery.</p>
            </div>

            {/* Input Dashboard Card */}
            <div className="relative group">
                <form onSubmit={handleSubmit} className="relative border border-border rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm transition-all focus-within:border-primary/30">
                    <div className="p-1">
                        <Textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="What would you like to research today?"
                            className="min-h-48 w-full resize-none border-none bg-transparent text-xl  p-6 focus-visible:ring-0 placeholder:text-muted-foreground/50 font-medium text-foreground"
                            disabled={status === "streaming"}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 border-t border-border">
                        <div className="flex items-center gap-3">
                            <Select
                                value={depth}
                                onValueChange={(v) => setDepth(v as ResearchDepth)}
                                disabled={status === "streaming"}
                            >
                                <SelectTrigger className="w-45 h-10 bg-background border-border rounded-full text-xs font-semibold uppercase tracking-wider">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border">
                                    <SelectItem value="quick">⚡ Quick</SelectItem>
                                    <SelectItem value="deep">🔍 Deep</SelectItem>
                                    <SelectItem value="exhaustive">🧠 Exhaustive</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden sm:inline">
                                Select Engine Depth
                            </span>
                        </div>

                        <Button
                            type="submit"
                            disabled={status === "streaming" || !query.trim()}
                            className={cn(
                                "h-11 px-8 rounded-xl font-bold transition-all duration-300",
                                status === "streaming" ? "bg-zinc-800" : "bg-primary hover:shadow-lg hover:shadow-primary/20"
                            )}
                        >
                            {status === "streaming" ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deploying Agents...</>
                            ) : (
                                <><Search className="mr-2 h-4 w-4" /> Begin Research</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Terminal Feed Section */}
            {events.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="rounded-2xl border border-border bg-[#09090b] shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <Terminal className="h-4 w-4 text-zinc-500" />
                                <span className="text-[11px] font-black tracking-[0.2em] text-zinc-400 uppercase">Live Operations Log</span>
                            </div>
                            <div className="flex items-center gap-4">
                                {status === "streaming" && (
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                        </span>
                                        <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Processing</span>
                                    </div>
                                )}
                                {status === "done" && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold">TASK_COMPLETE</Badge>}
                            </div>
                        </div>

                        <div className="h-72 overflow-y-auto p-6 space-y-3 font-mono">
                            {events
                                .filter((e) => e.type !== "job_created")
                                .map((event, i) => (
                                    <div key={i} className="flex gap-4 group animate-in slide-in-from-left-2 duration-300">
                                        <div className="flex flex-col items-center">
                                            {eventIcon(event.type)}
                                            <div className="w-px h-full bg-zinc-800/50 mt-1" />
                                        </div>
                                        <div className="flex flex-col gap-1 pb-4">
                                            <span className={cn(
                                                "text-xs leading-relaxed",
                                                event.type === "source" ? "text-blue-300/90" :
                                                    event.type === "section_done" ? "text-emerald-300/90" :
                                                        event.type === "error" ? "text-red-400" :
                                                            event.type === "done" ? "text-purple-300 font-bold" :
                                                                "text-zinc-500"
                                            )}>
                                                {event.message}
                                            </span>
                                            {event.type === "source" && (
                                                <span className="text-[10px] text-zinc-600 truncate max-w-md">
                                                    Source: {String(event.data?.url || "Verified Document")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            <div ref={eventsEndRef} />
                        </div>
                    </div>
                </div>
            )}

            {/* Success Result Card */}
            {status === "done" && jobId && (
                <div className="relative group animate-in zoom-in-95 duration-500">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-primary/20 rounded-3xl blur-xl" />
                    <div className="relative rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3 justify-center md:justify-start">
                                <Sparkles className="h-6 w-6 text-emerald-400" />
                                Report Synthesized
                            </h3>
                            <p className="text-muted-foreground font-medium">
                                Your intelligence report is ready for review and export.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push(`/jobs/${jobId}/report`)}
                            size="lg"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-14 px-10 rounded-xl shadow-xl shadow-emerald-900/20 transition-all hover:scale-[1.03]"
                        >
                            View Final Report
                            <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && status === "error" && (
                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-4 flex items-center gap-3 text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}
        </div>
    );
}
