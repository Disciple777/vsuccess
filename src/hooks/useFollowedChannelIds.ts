"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { listFollowedChannels } from "@/lib/api";

/**
 * Loads the current user's followed channel IDs into a Set<string>.
 *
 * - Fetches once on mount (and whenever the auth user changes).
 * - Returns `followedChannelIds` (a Set of channel_id strings) and
 *   `toggleFollowedChannel(channelId, followed)` to optimistically update
 *   the set in memory (used to keep Follow buttons in sync across cards).
 *
 * Non-authenticated users get an empty Set.
 */
export function useFollowedChannelIds() {
  const { user } = useAuth();
  const [followedChannelIds, setFollowedChannelIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setFollowedChannelIds(new Set());
        return;
      }
      try {
        const channels = await listFollowedChannels();
        if (!cancelled) {
          setFollowedChannelIds(new Set(channels.map((c) => c.channel_id)));
        }
      } catch {
        if (!cancelled) setFollowedChannelIds(new Set());
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleFollowedChannel = useCallback((channelId: string, followed: boolean) => {
    setFollowedChannelIds((prev) => {
      const next = new Set(prev);
      if (followed) {
        next.add(channelId);
      } else {
        next.delete(channelId);
      }
      return next;
    });
  }, []);

  return { followedChannelIds, toggleFollowedChannel };
}
