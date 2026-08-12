# Base image with Bun
FROM oven/bun:1.3.14-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock turbo.json ./
COPY apps/Backend/package.json ./apps/Backend/
COPY packages/db/package.json ./packages/db/
RUN bun install --frozen-lockfile

# Generate Prisma client
FROM deps AS prisma
WORKDIR /app
COPY packages/db/prisma ./packages/db/prisma
RUN cd packages/db && bunx prisma generate

# Build the application
FROM deps AS builder
WORKDIR /app
COPY . .
RUN bun run build --filter=backend

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/Backend/dist ./apps/Backend/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=prisma /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/apps/Backend/package.json ./apps/Backend/package.json
EXPOSE 3000
CMD ["bun", "apps/Backend/dist/index.js"]