"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listJobs, type Job } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Clock, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
    pending: { label: "Pending", icon: <Clock className="h-3 w-3" />, class: "text-zinc-400 border-zinc-600" },
    running: { label: "Running", icon: <RotateCcw className="h-3 w-3 animate-spin" />, class: "text-blue-400 border-blue-500/30" },
    done: { label: "Done", icon: <CheckCircle2 className="h-3 w-3" />, class: "text-green-400 border-green-500/30" },
    failed: { label: "Failed", icon: <XCircle className="h-3 w-3" />, class: "text-red-400 border-red-500/30" },
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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                    Research Jobs
                </h1>
                <p className="text-zinc-500 mt-1">Your past and running research jobs.</p>
            </div>

            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
                </div>
            )}

            {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">{error}</div>
            )}

            {!loading && jobs.length === 0 && !error && (
                <div className="text-center py-20 text-zinc-600">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No jobs yet. Start your first research query!</p>
                </div>
            )}

            <div className="space-y-3">
                {jobs.map((job) => {
                    const cfg = statusConfig[job.status] ?? statusConfig.pending;
                    return (
                        <div
                            key={job.id}
                            onClick={() => job.status === "done" && router.push(`/jobs/${job.id}/report`)}
                            className={`rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 flex items-start justify-between gap-4 transition-all ${job.status === "done" ? "hover:border-zinc-600 hover:bg-zinc-900 cursor-pointer" : "opacity-80"
                                }`}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-zinc-100 font-medium truncate">{job.query}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                                    <span className="capitalize">{job.depth}</span>
                                    <span>·</span>
                                    <span>{timeAgo(job.created_at)}</span>
                                    {job.error_message && <span className="text-red-400 truncate max-w-xs">{job.error_message}</span>}
                                </div>
                            </div>
                            <Badge variant="outline" className={`flex items-center gap-1.5 shrink-0 ${cfg.class}`}>
                                {cfg.icon}
                                {cfg.label}
                            </Badge>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
