"use client";

import { useState, useRef } from "react";
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
import { Loader2, Zap, Search, Globe, FileText, AlertCircle } from "lucide-react";

type ResearchStatus = "idle" | "streaming" | "done" | "error";

interface DisplayEvent {
    type: StreamEvent["type"];
    message: string;
    data?: Record<string, unknown>;
}

export default function ResearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [depth, setDepth] = useState<ResearchDepth>("deep");
    const [status, setStatus] = useState<ResearchStatus>("idle");
    const [events, setEvents] = useState<DisplayEvent[]>([]);
    const [jobId, setJobId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const eventsEndRef = useRef<HTMLDivElement>(null);

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

                // Auto-scroll
                setTimeout(() => {
                    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 50);

                if (event.type === "done") {
                    setStatus("done");
                }
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
            case "source": return <Globe className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />;
            case "section_done": return <FileText className="h-3 w-3 text-green-400 shrink-0 mt-0.5" />;
            case "error": return <AlertCircle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />;
            default: return <Zap className="h-3 w-3 text-zinc-500 shrink-0 mt-0.5" />;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                    AI Research
                </h1>
                <p className="text-zinc-500 text-lg">
                    Ask anything. Scout will search the web, read pages, and write a full report.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <Textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="What do you want to research? E.g. 'Impact of quantum computing on cybersecurity in 2025'"
                        className="min-h-[120px] resize-none bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-purple-500/50 transition-all text-base pr-4"
                        disabled={status === "streaming"}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Select
                        value={depth}
                        onValueChange={(v) => setDepth(v as ResearchDepth)}
                        disabled={status === "streaming"}
                    >
                        <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-zinc-300">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                            <SelectItem value="quick">⚡ Quick</SelectItem>
                            <SelectItem value="deep">🔍 Deep</SelectItem>
                            <SelectItem value="exhaustive">🧠 Exhaustive</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        type="submit"
                        disabled={status === "streaming" || !query.trim()}
                        className="flex-1 bg-zinc-100 text-zinc-900 hover:bg-white font-semibold h-10 group transition-all"
                    >
                        {status === "streaming" ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Researching…</>
                        ) : (
                            <><Search className="mr-2 h-4 w-4" /> Start Research</>
                        )}
                    </Button>
                </div>
            </form>

            {/* Event stream */}
            {events.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                        <span className="text-sm font-medium text-zinc-400">Live Progress</span>
                        {status === "streaming" && (
                            <span className="flex items-center gap-1.5 text-xs text-purple-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                                Live
                            </span>
                        )}
                        {status === "done" && <Badge variant="outline" className="text-green-400 border-green-400/30 text-xs">Complete</Badge>}
                        {status === "error" && <Badge variant="outline" className="text-red-400 border-red-400/30 text-xs">Error</Badge>}
                    </div>

                    <div className="max-h-80 overflow-y-auto p-4 space-y-2 font-mono">
                        {events
                            .filter((e) => e.type !== "job_created")
                            .map((event, i) => (
                                <div key={i} className="flex gap-2 text-xs items-start">
                                    {eventIcon(event.type)}
                                    <span
                                        className={
                                            event.type === "source" ? "text-blue-300" :
                                                event.type === "section_done" ? "text-green-300" :
                                                    event.type === "error" ? "text-red-300" :
                                                        event.type === "done" ? "text-purple-300 font-medium" :
                                                            "text-zinc-400"
                                        }
                                    >
                                        {event.message}
                                    </span>
                                </div>
                            ))}
                        <div ref={eventsEndRef} />
                    </div>
                </div>
            )}

            {/* CTA after done */}
            {status === "done" && jobId && (
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-6 flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-zinc-100">Your report is ready!</p>
                        <p className="text-zinc-500 text-sm mt-1">Click to read the full research report with sources.</p>
                    </div>
                    <Button
                        onClick={() => router.push(`/jobs/${jobId}/report`)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        View Report
                    </Button>
                </div>
            )}

            {error && status === "error" && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                    {error}
                </div>
            )}
        </div>
    );
}
