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
    const uptimeSeconds = process.uptime();
    const startedAt = new Date(Date.now() - uptimeSeconds * 1000);
    const seconds = Math.floor(uptimeSeconds % 60);
    const minutes = Math.floor((uptimeSeconds / 60) % 60);
    const hours = Math.floor(uptimeSeconds / 3600);
    const uptime = `${hours}h ${minutes}m ${seconds}s`;
    const startedAtText = startedAt.toLocaleString('es-PE');
    const nowText = new Date().toLocaleString('es-PE');

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
      background: #0b1220;
      color: var(--green);
      border: 1px solid rgba(34, 197, 94, 0.35);
    }
    .badge .pulse {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: var(--green);
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.8);
    }
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

    <div class="badge">
      <span class="pulse"></span>
      <span>Operativo</span>
    </div>

    <div class="rows">
      <div class="row">
        <span class="label">Activo desde</span>
        <span class="value">${startedAtText}</span>
      </div>
      <div class="row">
        <span class="label">Tiempo activo</span>
        <span class="value">${uptime}</span>
      </div>
      <div class="row">
        <span class="label">Consultado</span>
        <span class="value">${nowText}</span>
      </div>
    </div>

    <div class="foot">Recarga la página para actualizar el estado</div>
  </div>
</body>
</html>`;
  }
}
