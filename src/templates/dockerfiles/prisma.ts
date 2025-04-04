
/**
 * Get the Dockerfile template for a Next.js project with Prisma
 */
export function getPrismaNextDockerfile(): string {
    return `FROM oven/bun:alpine AS base

    # Install dependencies
    FROM base AS deps
    WORKDIR /app
    COPY package.json bun.lockb ./
    # Install dependencies including Prisma CLI
    RUN bun install --frozen-lockfile
    # Copy Prisma schema
    COPY prisma ./prisma

    # Build phase
    FROM base AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY --from=deps /app/prisma ./prisma
    COPY . .

    # Set build-time environment variable
    ARG DATABASE_URL
    ENV DATABASE_URL=$DATABASE_URL

    # Generate Prisma Client and build the app
    RUN bunx prisma generate
    RUN bun run build

    # Production image
    FROM base AS runner
    WORKDIR /app

    ENV NODE_ENV production

    # Copy built application
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/.next/standalone ./
    COPY --from=builder /app/.next/static ./.next/static
    # Copy Prisma schema and generated client
    COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
    COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

    # We don't need to set NEXT_PUBLIC variables at runtime since they're 
    # embedded in the bundle during build time. However, for server-side code
    # that might still reference them, we'll keep them:
    ARG DATABASE_URL
    ENV DATABASE_URL=$DATABASE_URL

    EXPOSE 3000
    ENV PORT 3000
    ENV HOSTNAME "0.0.0.0"

    CMD ["node", "server.js"]`
}