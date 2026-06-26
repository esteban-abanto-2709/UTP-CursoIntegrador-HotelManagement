"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download";
import { getApiErrorMessage } from "@/lib/api-error";

interface ExportButtonProps {
  url: string;
  filename: string;
  label?: string;
}

export function ExportButton({
  url,
  filename,
  label = "Exportar a Excel",
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await downloadFile(url, filename);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo generar el Excel"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex shrink-0 items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground transition-all hover:bg-background hover:text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
