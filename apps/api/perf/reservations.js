import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';

// ─── Configuración por variables de entorno ──────────────────────
//   ENDPOINT  get | post           (qué endpoint probar)
//   REQUESTS  250 | 500 | 1000     (nº de peticiones = nº de hilos virtuales)
//   BASE_URL  http://localhost:4000
//   PERF_USERNAME / PERF_PASSWORD  (credenciales para el login)
//   (ojo: NO usar USERNAME/PASSWORD a secas; en Windows USERNAME ya existe
//    como variable de entorno del sistema y pisaría el valor por defecto)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const ENDPOINT = (__ENV.ENDPOINT || 'get').toLowerCase();
const REQUESTS = parseInt(__ENV.REQUESTS || '250', 10);
const USERNAME = __ENV.PERF_USERNAME || 'admin';
const PASSWORD = __ENV.PERF_PASSWORD || 'admin';

// N hilos × 1 loop = N peticiones (equivalente a un Thread Group de JMeter)
export const options = {
  scenarios: {
    load: {
      executor: 'per-vu-iterations',
      vus: REQUESTS,
      iterations: 1,
      maxDuration: '5m',
    },
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const DAY_MS = 24 * 60 * 60 * 1000;
const BASE_DATE = Date.UTC(2027, 0, 1); // fechas futuras para no chocar con el seed

export function setup() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Login falló (${res.status}): ${res.body}`);
  }
  const token = res.json('access_token');

  let roomIds = [];
  const roomsRes = http.get(`${BASE_URL}/rooms`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  try {
    roomIds = roomsRes.json().map((r) => r.id);
  } catch (_) {
    roomIds = [];
  }
  if (!roomIds.length) roomIds = [1, 2, 3, 4, 5, 6];

  // Banda de fechas aleatoria por corrida: evita 409 al re-ejecutar el POST
  // (cada corrida cae en un rango de fechas distinto que no se solapa).
  const baseOffsetDays = Math.floor(Math.random() * 10000000);

  return { token, roomIds, baseOffsetDays };
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  if (ENDPOINT === 'post') {
    const i = exec.scenario.iterationInTest; // índice único por petición
    const roomId = data.roomIds[i % data.roomIds.length];
    const dayIndex = data.baseOffsetDays + i; // único dentro y entre corridas
    const checkIn = new Date(BASE_DATE + dayIndex * DAY_MS);
    const checkOut = new Date(checkIn.getTime() + DAY_MS);

    const body = JSON.stringify({
      nationalId: `9${String(i).padStart(8, '0')}`,
      fullName: `Perf Tester ${i}`,
      roomId,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
    });

    const res = http.post(`${BASE_URL}/reservations`, body, { headers });
    check(res, { 'status 201': (r) => r.status === 201 });
  } else {
    const res = http.get(`${BASE_URL}/reservations`, { headers });
    check(res, { 'status 200': (r) => r.status === 200 });
  }
}

function round(n, d = 2) {
  if (n === undefined || n === null || isNaN(n)) return 0;
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

export function handleSummary(data) {
  const dur = (data.metrics.http_req_duration || {}).values || {};
  const reqs = (data.metrics.http_reqs || {}).values || {};
  const failed = (data.metrics.http_req_failed || {}).values || {};

  const flat = {
    endpoint: ENDPOINT.toUpperCase(),
    requests: REQUESTS,
    total_requests: reqs.count || 0,
    throughput_rps: round(reqs.rate),
    avg_ms: round(dur.avg),
    med_ms: round(dur.med),
    p90_ms: round(dur['p(90)']),
    p95_ms: round(dur['p(95)']),
    p99_ms: round(dur['p(99)']),
    max_ms: round(dur.max),
    error_rate_pct: round((failed.rate || 0) * 100),
  };

  const line = (k, v) => `  ${k.padEnd(18)} ${v}`;
  const text =
    `\n── ${flat.endpoint} · ${flat.requests} peticiones ──\n` +
    [
      line('Peticiones', flat.total_requests),
      line('Throughput', `${flat.throughput_rps} req/s`),
      line('Media', `${flat.avg_ms} ms`),
      line('Mediana', `${flat.med_ms} ms`),
      line('p90', `${flat.p90_ms} ms`),
      line('p95', `${flat.p95_ms} ms`),
      line('p99', `${flat.p99_ms} ms`),
      line('Máximo', `${flat.max_ms} ms`),
      line('Error', `${flat.error_rate_pct} %`),
    ].join('\n') +
    '\n';

  const tag = `${ENDPOINT}-${REQUESTS}`;
  return {
    stdout: text,
    [`results/${tag}.json`]: JSON.stringify(flat, null, 2),
  };
}
