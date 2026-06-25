#!/bin/sh
set -e

echo "[entrypoint] Aplicando migraciones..."
pnpm prisma migrate deploy

case "${SEED_MODE:-none}" in
  base)
    echo "[entrypoint] SEED_MODE=base -> sembrando datos base"
    node prisma/dist-seed/seed.js
    ;;
  demo)
    echo "[entrypoint] SEED_MODE=demo"
    echo " "
    echo "sembrando datos BASE"
    node prisma/dist-seed/seed.js
    echo " "
    echo "sembrando datos DEMO"
    node prisma/dist-seed/seed.demo.js
    ;;
  none | "")
    echo "[entrypoint] SEED_MODE=none -> sin seeds"
    ;;
  *)
    echo "[entrypoint] SEED_MODE='${SEED_MODE}' no reconocido (usa none|base|demo) -> sin seeds"
    ;;
esac

echo "[entrypoint] Iniciando aplicacion..."
exec pnpm run start:prod
