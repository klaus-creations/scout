"use client";

import React from "react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 flex items-center justify-center">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-purple-500/20 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/20 blur-[120px]" />

            <div className="relative z-10 w-full max-w-md px-4">
                {children}
            </div>
        </div>
    );
}
