import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node -P prisma/tsconfig.seed.json prisma/seed.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});