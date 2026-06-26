"use client";

import { getStoredWard } from "./WardGuard";

export function useWardId() {
  const stored = getStoredWard();
  return {
    wardId: stored?.wardId || "",
    wardName: stored?.wardName || "",
  };
}
