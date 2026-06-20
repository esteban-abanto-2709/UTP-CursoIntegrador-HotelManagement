"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  useApiHealth,
  type ApiHealthStatus,
  RETRY_INTERVAL_SECONDS,
} from "@/hooks/use-api-health";

const SESSION_KEY = "lumina-api-awake";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function WakeUpGate({ children }: { children: React.ReactNode }) {
  const [decision, setDecision] = React.useState<"pending" | "awake" | "check">(
    "pending",
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDecision(
      sessionStorage.getItem(SESSION_KEY) === "true" ? "awake" : "check",
    );
  }, []);

  if (decision === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (decision === "awake") {
    return <>{children}</>;
  }

  return <HealthGate>{children}</HealthGate>;
}

function HealthGate({ children }: { children: React.ReactNode }) {
  const { status, elapsedSeconds, retry } = useApiHealth();

  React.useEffect(() => {
    if (status === "healthy") {
      sessionStorage.setItem(SESSION_KEY, "true");
    }
  }, [status]);

  if (status === "healthy") {
    return <>{children}</>;
  }

  return (
    <WakingScreen
      status={status}
      elapsedSeconds={elapsedSeconds}
      onRetry={retry}
    />
  );
}

function WakingScreen({
  status,
  elapsedSeconds,
  onRetry,
}: {
  status: ApiHealthStatus;
  elapsedSeconds: number;
  onRetry: () => void;
}) {
  const failed = status === "failed";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {failed ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-destructive">
            <span className="text-xl font-bold text-destructive">!</span>
          </div>
        ) : (
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        )}

        <h1 className="mt-6 text-xl font-semibold text-foreground">
          {failed
            ? "No pudimos conectar con el servidor"
            : "Despertando el servidor…"}
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          {failed
            ? "El servidor está tardando más de lo normal en responder. Puedes reintentar o revisar su estado."
            : "El backend está en un plan gratuito y puede tardar hasta ~60 segundos en arrancar tras un periodo de inactividad. Gracias por la paciencia."}
        </p>

        {!failed && (
          <>
            <p className="mt-4 text-sm font-medium text-foreground tabular-nums">
              Tiempo transcurrido: {elapsedSeconds}s
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Reintentando cada {RETRY_INTERVAL_SECONDS}s
            </p>
          </>
        )}

        {failed && (
          <Button className="mt-6" onClick={onRetry}>
            Reintentar
          </Button>
        )}

        <a
          href={API_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 text-sm text-primary underline-offset-4 hover:underline"
        >
          Ver cómo va el API →
        </a>
      </div>
    </div>
  );
}
