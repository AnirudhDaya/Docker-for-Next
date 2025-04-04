
/**
 * Get the Docker Compose template for a plain Next.js project
 */
export function getPlainNextCompose(): string{
  return `services:
    web:
      build: .
      ports:
        - '3000:3000'
      environment:
        - NODE_ENV=production`
}

