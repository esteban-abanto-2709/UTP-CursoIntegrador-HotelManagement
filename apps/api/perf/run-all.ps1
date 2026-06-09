# Corre los 6 escenarios (GET/POST x 250/500/1000) y consolida las metricas
# en results/summary.md. Requiere k6 instalado y el stack Docker arriba.
#
#   pwsh ./run-all.ps1
#   pwsh ./run-all.ps1 -BaseUrl http://localhost:4000 -Loads 250,500,1000

param(
  [int[]]$Loads = @(250, 500, 1000),
  [string]$BaseUrl = "http://localhost:4000"
)

$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$results = Join-Path $here "results"
New-Item -ItemType Directory -Force -Path $results | Out-Null

Push-Location $here
try {
  foreach ($ep in @("get", "post")) {
    foreach ($n in $Loads) {
      Write-Host ""
      Write-Host "==> $($ep.ToUpper())  $n peticiones" -ForegroundColor Cyan
      $env:ENDPOINT = $ep
      $env:REQUESTS = "$n"
      $env:BASE_URL = $BaseUrl
      k6 run reservations.js
      if ($LASTEXITCODE -ne 0) {
        Write-Warning "k6 devolvio codigo $LASTEXITCODE en $ep/$n (revisa errores/umbral)."
      }
    }
  }

  # ─── Tabla consolidada ─────────────────────────────────────────
  $order = @{ "GET" = 0; "POST" = 1 }
  $rows = Get-ChildItem $results -Filter *.json |
    ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json } |
    Sort-Object @{ Expression = { $order[$_.endpoint] } }, requests

  $md = @()
  $md += "# Reporte de Rendimiento — k6"
  $md += ""
  $md += "Endpoints: `GET /reservations` y `POST /reservations` · Base: $BaseUrl"
  $md += "Generado: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  $md += ""
  $md += "| Endpoint | Peticiones | Throughput (req/s) | Media (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Error % |"
  $md += "|----------|-----------:|-------------------:|-----------:|---------:|---------:|---------:|---------:|--------:|"
  foreach ($r in $rows) {
    $md += "| {0} | {1} | {2} | {3} | {4} | {5} | {6} | {7} | {8} |" -f `
      $r.endpoint, $r.requests, $r.throughput_rps, $r.avg_ms, `
      $r.p90_ms, $r.p95_ms, $r.p99_ms, $r.max_ms, $r.error_rate_pct
  }

  $summaryPath = Join-Path $results "summary.md"
  $md -join "`n" | Set-Content -Path $summaryPath -Encoding UTF8

  Write-Host ""
  Write-Host "Tabla consolidada -> $summaryPath" -ForegroundColor Green
  Write-Host ""
  $md -join "`n" | Write-Host
}
finally {
  Pop-Location
}
