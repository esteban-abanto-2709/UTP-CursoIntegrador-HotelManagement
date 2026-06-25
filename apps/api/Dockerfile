FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc prisma.config.ts ./
COPY prisma ./prisma/
RUN pnpm install --prod --frozen-lockfile
RUN DIRECT_URL="postgresql://dummy:5432/dummy" DATABASE_URL="postgresql://dummy:5432/dummy" pnpm prisma generate

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile
COPY . .
RUN DIRECT_URL="postgresql://dummy:5432/dummy" DATABASE_URL="postgresql://dummy:5432/dummy" pnpm prisma generate
RUN pnpm run build
RUN pnpm exec tsc -p prisma/tsconfig.seed-build.json

FROM base AS runner
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc prisma.config.ts tsconfig.json ./
COPY prisma ./prisma/
COPY docker-entrypoint.sh ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma/dist-seed ./prisma/dist-seed
CMD ["sh", "/app/docker-entrypoint.sh"]
