FROM node:20-alpine

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

# Generate Prisma client
RUN cd server && npx prisma generate

WORKDIR /app/server

EXPOSE 3000

CMD ["npm", "run", "dev"]
