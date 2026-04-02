# Build context: monorepo root

# ---- Stage 1: builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests for install
COPY package*.json ./
COPY client/package*.json ./client/
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

RUN npm install

# Copy source
COPY tsconfig.base.json ./
COPY shared/ ./shared/
COPY client/ ./client/

RUN cd client && npm run build

# ---- Stage 2: nginx static server ----
FROM nginx:1.27-alpine AS runner

COPY client/nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 80

# Inject SERVER_URL into nginx config at container start, then run nginx
CMD ["/bin/sh", "-c", "envsubst '${SERVER_URL}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
