# syntax=docker/dockerfile:1.7

# ───────────────────────────────────────────────────────────────────
# Stage 1 — Build
# ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Lockfile-aware install (privilégie npm ci si possible)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

# Variables d'environnement de build (Vite les fige dans le bundle)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID \
    NODE_ENV=production

COPY . .
RUN npm run build

# ───────────────────────────────────────────────────────────────────
# Stage 2 — Runtime (Nginx)
# ───────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Conf SPA + sécurité + cache
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Bundle statique
COPY --from=build /app/dist /usr/share/nginx/html

# Healthcheck simple
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
