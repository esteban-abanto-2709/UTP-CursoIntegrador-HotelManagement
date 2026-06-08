import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  renderStatusPage(): string {
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Lumina Resort API</title>
  <style>
    :root {
      --bg: #0a0f1a;
      --panel: #111827;
      --border: #1f2937;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --sky: #0ea5e9;
      --green: #22c55e;
      --red: #ef4444;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(1200px 600px at 50% -10%, #0f1b30, var(--bg));
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
    }
    .card {
      width: 100%;
      max-width: 440px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: var(--sky);
      box-shadow: 0 0 16px rgba(14, 165, 233, 0.7);
    }
    .brand h1 { font-size: 18px; margin: 0; letter-spacing: 0.2px; }
    .brand span { color: var(--muted); font-size: 13px; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
      border: 1px solid var(--border);
      background: #0b1220;
    }
    .badge .pulse {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: var(--muted);
    }
    .badge.ok { color: var(--green); border-color: rgba(34, 197, 94, 0.35); }
    .badge.ok .pulse { background: var(--green); box-shadow: 0 0 12px rgba(34, 197, 94, 0.8); }
    .badge.down { color: var(--red); border-color: rgba(239, 68, 68, 0.35); }
    .badge.down .pulse { background: var(--red); box-shadow: 0 0 12px rgba(239, 68, 68, 0.8); }
    .rows { margin-top: 24px; display: grid; gap: 12px; }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: #0b1220;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 14px;
    }
    .row .label { color: var(--muted); }
    .row .value { font-variant-numeric: tabular-nums; font-weight: 600; }
    .foot { margin-top: 22px; color: var(--muted); font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <div class="dot"></div>
      <div>
        <h1>Lumina Resort API</h1>
        <span>Estado del servicio</span>
      </div>
    </div>

    <div id="badge" class="badge">
      <span class="pulse"></span>
      <span id="badge-text">Comprobando…</span>
    </div>

    <div class="rows">
      <div class="row">
        <span class="label">Tiempo activo</span>
        <span class="value" id="uptime">—</span>
      </div>
      <div class="row">
        <span class="label">Última comprobación</span>
        <span class="value" id="timestamp">—</span>
      </div>
    </div>

    <div class="foot">Se actualiza cada 30 s mientras la pestaña esté activa</div>
  </div>

  <script>
    function formatUptime(seconds) {
      var s = Math.floor(seconds % 60);
      var m = Math.floor((seconds / 60) % 60);
      var h = Math.floor(seconds / 3600);
      return h + "h " + m + "m " + s + "s";
    }

    async function check() {
      var badge = document.getElementById("badge");
      var badgeText = document.getElementById("badge-text");
      try {
        var res = await fetch("/health", { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        var data = await res.json();
        badge.className = "badge ok";
        badgeText.textContent = "Operativo";
        document.getElementById("uptime").textContent = formatUptime(data.uptime);
        document.getElementById("timestamp").textContent =
          new Date(data.timestamp).toLocaleString("es-PE");
      } catch (err) {
        badge.className = "badge down";
        badgeText.textContent = "Sin conexión";
        document.getElementById("uptime").textContent = "—";
        document.getElementById("timestamp").textContent = new Date().toLocaleString("es-PE");
      }
    }

    check();

    setInterval(function () {
      if (!document.hidden) check();
    }, 30000);

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) check();
    });
  </script>
</body>
</html>`;
  }
}
