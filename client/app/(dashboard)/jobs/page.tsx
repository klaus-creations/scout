"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listJobs, type Job } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Clock, CheckCircle2, XCircle, RotateCcw, Search } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
    pending: { label: "Pending", icon: <Clock className="h-3.5 w-3.5" />, class: "bg-muted text-muted-foreground border-transparent" },
    running: { label: "Running", icon: <RotateCcw className="h-3.5 w-3.5 animate-spin" />, class: "bg-primary/10 text-primary border-primary/20" },
    done: { label: "Done", icon: <CheckCircle2 className="h-3.5 w-3.5" />, class: "bg-green-500/10 text-green-700 border-green-500/20" },
    failed: { label: "Failed", icon: <XCircle className="h-3.5 w-3.5" />, class: "bg-red-500/10 text-red-700 border-red-500/20" },
};

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        listJobs(30)
            .then(setJobs)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-10">
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tighter text-foreground">
                    Research <span className="text-primary italic">Archive</span>
                </h1>
                <p className="text-muted-foreground text-lg">Your historical research intelligence and active extractions.</p>
            </div>

            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                </div>
            )}

            {error && (
                <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-6 text-red-600 font-medium flex items-center gap-3">
                    <XCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {!loading && jobs.length === 0 && !error && (
                <div className="text-center py-32 border-2 border-dashed border-border rounded-3xl bg-muted/20">
                    <FileText className="h-16 w-16 mx-auto mb-6 text-muted-foreground/30" />
                    <p className="text-xl font-bold text-muted-foreground">No extractions found.</p>
                    <p className="text-muted-foreground/60 mt-1">Deploy your first research query to begin.</p>
                </div>
            )}

            <div className="grid gap-4">
                {jobs.map((job) => {
                    const cfg = statusConfig[job.status] ?? statusConfig.pending;
                    return (
                        <div
                            key={job.id}
                            onClick={() => job.status === "done" && router.push(`/jobs/${job.id}/report`)}
                            className={`group relative rounded-2xl border border-border bg-card p-6 flex items-center justify-between gap-6 transition-all duration-300 ${job.status === "done"
                                ? "hover:border-primary/60 cursor-pointer hover:-translate-y-0.5"
                                : "opacity-75"
                                }`}
                        >
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                    {job.query}
                                </h3>
                                <div className="flex items-center gap-4 mt-2.5">
                                    <Badge variant="outline" className={`flex items-center gap-1.5 px-2.5 py-0.5 font-bold tracking-wider text-[10px] uppercase ${cfg.class}`}>
                                        {cfg.icon}
                                        {cfg.label}
                                    </Badge>
                                    <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground/60">
                                        <span className="capitalize px-2 py-0.5 bg-muted rounded-md text-muted-foreground">{job.depth}</span>
                                        <span>·</span>
                                        <span>{timeAgo(job.created_at)}</span>
                                        {job.error_message && <span className="text-red-500 truncate max-w-xs">{job.error_message}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="shrink-0 transition-transform group-hover:translate-x-1">
                                <Search className={`h-5 w-5 text-muted-foreground/20 group-hover:text-primary/40 transition-colors ${job.status === "done" ? "opacity-100" : "opacity-0"}`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
