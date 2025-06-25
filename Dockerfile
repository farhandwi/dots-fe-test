# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install production dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --omit=dev

# Stage 2: Dev Dependencies
FROM node:18-alpine AS dev-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./

# Install all dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Stage 3: Builder
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependencies from dev-deps stage
COPY --from=dev-deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Copy env example if needed
COPY .env.example .env

# Set production environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build with cache mount for Next.js
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Stage 4: Runner
FROM node:18-alpine AS runner
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Create nodejs user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy package.json for dependencies info
COPY --from=builder /app/package.json ./package.json

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application with standalone server
CMD ["node", "server.js"]
