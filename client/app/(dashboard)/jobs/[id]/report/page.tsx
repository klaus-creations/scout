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
            <div className="flex justify-center py-32">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
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
            if (line.startsWith("# ")) return <h1 key={i} className="text-4xl font-black text-foreground mt-12 mb-6 font-heading tracking-tighter leading-tight border-b pb-4 border-border/40">{line.slice(2)}</h1>;
            if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold text-foreground mt-10 mb-4 font-heading tracking-tight">{line.slice(3)}</h2>;
            if (line.startsWith("### ")) return <h3 key={i} className="text-xl font-bold text-foreground/80 mt-8 mb-2 font-heading tracking-tight">{line.slice(4)}</h3>;
            if (line.startsWith("- ")) return <li key={i} className="text-muted-foreground ml-6 list-disc mb-3 pl-2 leading-relaxed">{line.slice(2)}</li>;
            if (line.trim() === "") return <div key={i} className="h-6" />;
            return <p key={i} className="text-muted-foreground leading-8 text-[17px] mb-4 selection:bg-primary/5">{line}</p>;
        });

    return (
        <div className="space-y-8 pb-20">
            {/* Back */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-muted-foreground hover:text-foreground -ml-2 transition-colors font-bold"
            >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            {/* Header */}
            <div className="space-y-6">
                <h1 className="text-5xl font-black tracking-tighter text-foreground leading-[1.1]">{report.title}</h1>
                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/60 tracking-widest uppercase">
                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-3 py-1 font-black">{report.word_count.toLocaleString()} WORDS</Badge>
                    <span>·</span>
                    <span>{report.sources.length} SOURCES</span>
                    <span>·</span>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                <div className="rounded-3xl border-2 border-primary/10 bg-primary/5 p-8 text-foreground/80 text-lg leading-relaxed font-medium italic relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    {report.summary}
                </div>
            </div>

            <Separator className="bg-border/60" />

            {/* Body */}
            <article className="space-y-1">
                {renderMarkdown(report.content)}
            </article>

            <Separator className="border-zinc-800" />

            {/* Sources */}
            {report.sources.length > 0 && (
                <div className="space-y-6 pt-10">
                    <h2 className="text-3xl font-black text-foreground font-heading flex items-center gap-3 tracking-tighter">
                        <Globe className="h-8 w-8 text-primary" /> Information Sources
                    </h2>
                    <div className="grid gap-4">
                        {report.sources.map((source, i) => (
                            <a
                                key={source.id}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-all group relative overflow-hidden"
                            >
                                <span className="text-sm text-primary/40 font-black shrink-0 w-8">{(i + 1).toString().padStart(2, '0')}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base text-foreground font-bold truncate group-hover:text-primary transition-colors">
                                        {source.title || source.url}
                                    </p>
                                    {source.excerpt && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{source.excerpt}</p>
                                    )}
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-1 group-hover:text-primary/60 transition-colors" />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
