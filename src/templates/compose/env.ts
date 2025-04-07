/**
 * Get the Docker Compose template for a Next.js project with environment variables
 */
export function getEnvNextCompose(): string {
  return `services:
    web:
      build:
        context: .
        args:
          - NEXT_PUBLIC_DATABASE_URL=\${NEXT_PUBLIC_DATABASE_URL}
      restart: unless-stopped
      ports:
        - '3000:3000'
      # env_file: #uncomment this for local development
      #   - .env
      environment:
        - NODE_ENV=production
        - HOSTNAME=0.0.0.0
        - NEXT_PUBLIC_DATABASE_URL=\${NEXT_PUBLIC_DATABASE_URL}
      # volumes: #uncomment this for local development
      #   - ./.env:/app/.env
      networks:
        - proxy
        - default
      labels:
        - "traefik.enable=true"
        # HTTP Router - fixed quotes and explicit domain
        - "traefik.http.routers.\${COMPOSE_PROJECT_NAME:-app}.rule=Host(\`test.domain.com\`)"
        - "traefik.http.routers.\${COMPOSE_PROJECT_NAME:-app}.entrypoints=websecure"
        - "traefik.http.routers.\${COMPOSE_PROJECT_NAME:-app}.tls.certresolver=letsencrypt"
        # Service - make sure the port is correctly specified
        - "traefik.http.services.\${COMPOSE_PROJECT_NAME:-app}.loadbalancer.server.port=3000"
        # Middlewares
        - "traefik.http.routers.\${COMPOSE_PROJECT_NAME:-app}.middlewares=secure-headers@docker,gzip-compress@docker"

  networks:
    proxy:
      external: true`
}