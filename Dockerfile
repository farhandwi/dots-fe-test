FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# Stage 2: Builder - Menggunakan Node.js untuk Build Next.js
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy dependency files first to leverage Docker cache
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies) required for building and linting
RUN npm ci

# Copy the rest of your application code
COPY . .

# Copy environment files
COPY .env.example .env
COPY next.config.mjs ./

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build application
RUN npm run build

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
