# Build context: monorepo root

# ---- Stage 1: builder ----
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace manifests for install
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/
COPY client/package*.json ./client/

RUN npm install

# Copy source
COPY tsconfig.base.json ./
COPY grant_sources.json ./
COPY shared/ ./shared/
COPY server/ ./server/

# Generate Prisma client (linux-musl binary declared in schema.prisma)
RUN cd server && npx prisma generate

# Compile TypeScript
RUN cd server && npm run build

# ---- Stage 2: runner ----
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

# Copy workspace manifests for production install
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/
COPY client/package*.json ./client/

RUN npm install --omit=dev

# Copy compiled server output
COPY --from=builder /app/server/dist ./server/dist

# Copy Prisma schema and migrations (needed for prisma migrate deploy at startup)
COPY --from=builder /app/server/prisma ./server/prisma

# Copy generated Prisma client with native binaries (generate does not re-run with --omit=dev)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy grant_sources.json to expected default location
# (server CWD is /app/server, so ../grant_sources.json resolves to /app/grant_sources.json)
COPY grant_sources.json ./

# Copy and permission startup script
COPY server/startup.sh ./server/startup.sh
RUN chmod +x ./server/startup.sh

WORKDIR /app/server

EXPOSE 3000

CMD ["sh", "startup.sh"]
