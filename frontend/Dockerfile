# Multi-stage Dockerfile for Next.js Frontend

# Base stage
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat curl
COPY package*.json ./

# Dependencies stage
FROM base AS deps
RUN npm ci

# Development stage
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3001
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
RUN npm ci
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001 || exit 1

EXPOSE 3001
ENV PORT 3001
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["node", "server.js"]