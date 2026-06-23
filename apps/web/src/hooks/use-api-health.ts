import * as React from "react";
import { API_BASE_PATH, routes } from "@/lib/routes";

const API_BASE = API_BASE_PATH;
const ATTEMPT_TIMEOUT = 8000;
const RETRY_INTERVAL = 3000;
const MAX_WINDOW = 90000;

export const RETRY_INTERVAL_SECONDS = RETRY_INTERVAL / 1000;

export type ApiHealthStatus = "checking" | "healthy" | "failed";

export function useApiHealth() {
  const [status, setStatus] = React.useState<ApiHealthStatus>("checking");
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [attempts, setAttempts] = React.useState(0);
  const [runId, setRunId] = React.useState(0);

  const retry = React.useCallback(() => {
    setStatus("checking");
    setElapsedSeconds(0);
    setAttempts(0);
    setRunId((id) => id + 1);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    const tick = setInterval(() => {
      if (!cancelled) {
        setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }
    }, 1000);

    async function ping(): Promise<boolean> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT);
      try {
        const res = await fetch(`${API_BASE}${routes.api.health()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        clearTimeout(timeout);
      }
    }

    async function loop() {
      while (!cancelled) {
        setAttempts((n) => n + 1);
        const ok = await ping();
        if (cancelled) return;
        if (ok) {
          setStatus("healthy");
          clearInterval(tick);
          return;
        }
        if (Date.now() - startedAt >= MAX_WINDOW) {
          setStatus("failed");
          clearInterval(tick);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      }
    }

    void loop();

    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, [runId]);

  return { status, elapsedSeconds, attempts, retry };
}
