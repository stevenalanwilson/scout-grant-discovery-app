FROM node:20-alpine

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

WORKDIR /app/client

EXPOSE 5173

CMD ["npm", "run", "dev"]
