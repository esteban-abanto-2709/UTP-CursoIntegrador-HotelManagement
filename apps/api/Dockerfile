# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code and config files
COPY . .

# Generate Prisma Client (using dummy URLs for build time)
RUN DIRECT_URL="postgresql://dummy:5432/dummy" DATABASE_URL="postgresql://dummy:5432/dummy" npx prisma generate

# Build the application
RUN npm run build


# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built assets and prisma from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Start the application with automatic migrations
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
