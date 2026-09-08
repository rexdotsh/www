import { useEffect, useState } from "react";
import type { GitHubDesk } from "@/lib/github";

let cached: { at: number; data: GitHubDesk } | null = null;
let pending: Promise<GitHubDesk> | null = null;

const load = () => {
  if (cached && Date.now() - cached.at < 900_000)
    return Promise.resolve(cached.data);
  pending ??= fetch("/api/github/desk", { signal: AbortSignal.timeout(8000) })
    .then(async (response) => {
      if (!response.ok) throw new Error("GitHub unavailable");
      const data = (await response.json()) as GitHubDesk;
      if (!Array.isArray(data.repositories) || !Array.isArray(data.activity))
        throw new Error("Invalid GitHub response");
      cached = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
};

export function useGitHubDesk(enabled: boolean) {
  const [data, setData] = useState<GitHubDesk | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading"
  );
  const [attempt, setAttempt] = useState(0);
  const requestKey = enabled ? attempt : null;
  useEffect(() => {
    if (requestKey === null) return;
    let active = true;
    setStatus("loading");
    load()
      .then((result) => {
        if (active) {
          setData(result);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("unavailable");
      });
    return () => {
      active = false;
    };
  }, [requestKey]);
  return { data, status, retry: () => setAttempt((value) => value + 1) };
}
