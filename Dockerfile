# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=./src/schema.prisma

# Build TypeScript
RUN npm run build

# Production Stage
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built assets
COPY --from=builder /app/dist ./dist

# Copy Prisma schema for generation
COPY --from=builder /app/src/schema.prisma ./src/schema.prisma
COPY --from=builder /app/src/migrations ./src/migrations

# Generate Prisma Client for production
RUN npx prisma generate --schema=./src/schema.prisma

EXPOSE 3000

CMD ["npm", "start"]
