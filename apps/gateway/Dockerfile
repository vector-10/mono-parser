# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy gateway app
COPY apps/gateway ./apps/gateway

# Install ALL dependencies
RUN npm ci

# Generate Prisma client
WORKDIR /app/apps/gateway
RUN npx prisma generate

# Build with Nx
WORKDIR /app
RUN npx nx build gateway --prod

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/gateway/dist ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/apps/gateway/prisma ./prisma

# Install production dependencies
COPY --from=builder /app/apps/gateway/package*.json ./
RUN npm install 

# Expose port
EXPOSE 3000

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate dev --name init && node main.js"]