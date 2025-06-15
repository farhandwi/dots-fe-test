# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Copy dependency files
COPY package.json package-lock.json* ./
# Install dependencies
RUN npm ci --only=production --omit=dev
# Stage 2: Builder
FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Copy dependency files and install all dependencies
COPY package.json package-lock.json* ./
RUN npm ci
# Copy source code
COPY . .
COPY .env.example .env
# Set production environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Build the application
RUN npm run build
# Stage 3: Runner
FROM node:18-alpine AS runner
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
# Create nodejs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
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
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Copy other necessary files
COPY --from=builder /app/next.config.mjs ./

# Switch to non-root user
USER nextjs
# Expose port
EXPOSE 3000
# Start the application
CMD ["npm", "start"]
