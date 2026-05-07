"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getReport, type Report } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, ExternalLink, BookOpen, Globe } from "lucide-react";

export default function ReportPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        getReport(id)
            .then(setReport)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="text-center py-24 space-y-4">
                <p className="text-red-400">{error ?? "Report not found."}</p>
                <Button variant="outline" onClick={() => router.back()}>Go back</Button>
            </div>
        );
    }

    // Render the markdown content as simple HTML-safe paragraphs (no extra deps)
    const renderMarkdown = (md: string) =>
        md.split("\n").map((line, i) => {
            if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold text-zinc-100 mt-8 mb-3">{line.slice(2)}</h1>;
            if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold text-zinc-200 mt-6 mb-2">{line.slice(3)}</h2>;
            if (line.startsWith("### ")) return <h3 key={i} className="font-semibold text-zinc-300 mt-4 mb-1">{line.slice(4)}</h3>;
            if (line.startsWith("- ")) return <li key={i} className="text-zinc-400 ml-4 list-disc">{line.slice(2)}</li>;
            if (line.trim() === "") return <div key={i} className="h-2" />;
            return <p key={i} className="text-zinc-400 leading-7">{line}</p>;
        });

    return (
        <div className="space-y-8 pb-20">
            {/* Back */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-zinc-500 hover:text-zinc-100 -ml-2"
            >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            {/* Header */}
            <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{report.title}</h1>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <Badge variant="outline" className="text-zinc-400 border-zinc-700">{report.word_count.toLocaleString()} words</Badge>
                    <span>·</span>
                    <span>{report.sources.length} sources</span>
                    <span>·</span>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-zinc-400 text-sm leading-6 italic">
                    {report.summary}
                </div>
            </div>

            <Separator className="border-zinc-800" />

            {/* Body */}
            <article className="space-y-1">
                {renderMarkdown(report.content)}
            </article>

            <Separator className="border-zinc-800" />

            {/* Sources */}
            {report.sources.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-400" /> Sources
                    </h2>
                    <div className="grid gap-3">
                        {report.sources.map((source, i) => (
                            <a
                                key={source.id}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-600 hover:bg-zinc-900 transition-all group"
                            >
                                <span className="text-xs text-zinc-600 mt-0.5 font-mono shrink-0">[{i + 1}]</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-zinc-300 font-medium truncate group-hover:text-white transition-colors">
                                        {source.title || source.url}
                                    </p>
                                    {source.excerpt && (
                                        <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">{source.excerpt}</p>
                                    )}
                                </div>
                                <ExternalLink className="h-3 w-3 text-zinc-600 shrink-0 mt-0.5 group-hover:text-zinc-400 transition-colors" />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
