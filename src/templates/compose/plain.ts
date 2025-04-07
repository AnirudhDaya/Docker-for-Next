
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
        - NODE_ENV=production
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

