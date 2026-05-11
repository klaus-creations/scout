"use client";

import { useAuth } from "@/components/AuthProvider";

export function useSession() {
    return useAuth();
}
