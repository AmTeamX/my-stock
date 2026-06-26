"use client";

import { useState, useEffect } from "react";
import { getProfile, isLoggedIn } from "@/lib/liff";

export function useLiffUser() {
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function fetch() {
      if (!isLoggedIn()) {
        setReady(true);
        return;
      }
      try {
        const profile = await getProfile();
        if (profile) {
          setUserId(profile.userId);
          setUserName(profile.displayName || profile.userId);
        }
      } catch {
        // LIFF not available — silently continue
      }
      setReady(true);
    }
    fetch();
  }, []);

  // Dev fallback
  if (ready && !userId && !process.env.NEXT_PUBLIC_LIFF_ID) {
    return { userId: "dev-user", userName: "Dev", ready: true };
  }

  return { userId, userName, ready };
}
