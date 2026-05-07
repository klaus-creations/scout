import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResearchDepth = "quick" | "deep" | "exhaustive";

export interface Job {
    id: string;
    query: string;
    status: "pending" | "running" | "done" | "failed";
    depth: ResearchDepth;
    created_at: string;
    completed_at?: string;
    error_message?: string;
}

export interface Source {
    id: string;
    url: string;
    title?: string;
    excerpt?: string;
    agent: string;
    fetched_at?: string;
}

export interface Report {
    id: string;
    job_id: string;
    title: string;
    content: string;
    summary: string;
    word_count: number;
    created_at: string;
    sources: Source[];
}

export interface StreamEvent {
    type: "job_created" | "status" | "source" | "finding" | "section_done" | "error" | "done";
    message: string;
    data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function getToken(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Not authenticated");
    return token;
}

async function authHeaders(): Promise<HeadersInit> {
    const token = await getToken();
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * POST /api/research
 * Returns a ReadableStream of SSE events.
 */
export async function startResearch(
    query: string,
    depth: ResearchDepth = "deep"
): Promise<ReadableStream<StreamEvent>> {
    const headers = await authHeaders();
    const res = await fetch(`${API_URL}/api/research`, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, depth }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Failed to start research");
    }

    if (!res.body) throw new Error("No response body");

    // Parse SSE text/event-stream into StreamEvent objects
    const decoder = new TextDecoder();
    return new ReadableStream<StreamEvent>({
        async start(controller) {
            const reader = res.body!.getReader();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    controller.close();
                    break;
                }
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const event: StreamEvent = JSON.parse(line.slice(6));
                            controller.enqueue(event);
                        } catch {
                            // skip malformed lines
                        }
                    }
                }
            }
        },
    });
}

/** GET /api/jobs */
export async function listJobs(limit = 20): Promise<Job[]> {
    const headers = await authHeaders();
    const res = await fetch(`${API_URL}/api/jobs?limit=${limit}`, { headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Failed to fetch jobs");
    }
    return res.json();
}

/** GET /api/jobs/:id */
export async function getJob(jobId: string): Promise<Job> {
    const headers = await authHeaders();
    const res = await fetch(`${API_URL}/api/jobs/${jobId}`, { headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Job not found");
    }
    return res.json();
}

/** GET /api/jobs/:id/report */
export async function getReport(jobId: string): Promise<Report> {
    const headers = await authHeaders();
    const res = await fetch(`${API_URL}/api/jobs/${jobId}/report`, { headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Report not found");
    }
    return res.json();
}
