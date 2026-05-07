import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
        // Exchange the code for a session — client-side Supabase handles this
        // Just redirect to the dashboard; the client will pick up the session from the URL hash
        return NextResponse.redirect(`${origin}/?code=${code}`);
    }

    // Something went wrong
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
