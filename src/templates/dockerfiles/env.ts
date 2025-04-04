/**
 * Get the Dockerfile template for a Next.js project with environment variables
 */
export function getEnvNextDockerfile(): string {
    return `FROM oven/bun:alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build phase
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_DATABASE_URL
ENV NEXT_PUBLIC_DATABASE_URL=$NEXT_PUBLIC_DATABASE_URL

# Build the app
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# We don't need to set NEXT_PUBLIC variables at runtime since they're 
# embedded in the bundle during build time. However, for server-side code
# that might still reference them, we'll keep them:
ARG NEXT_PUBLIC_DATABASE_URL
ENV NEXT_PUBLIC_DATABASE_URL=$NEXT_PUBLIC_DATABASE_URL

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]`

}