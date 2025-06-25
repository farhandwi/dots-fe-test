FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat curl

# Set working directory
WORKDIR /app

# Create user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with memory optimization
RUN npm ci --frozen-lockfile --production=false && \
    npm cache clean --force

# Copy source code
COPY . .

# Copy environment variables
COPY .env.example .env

# Set environment variables with memory limits
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build the application with memory optimization
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Remove dev dependencies after build
RUN npm prune --production && \
    npm cache clean --force && \
    rm -rf .next/cache

# Change ownership of app files to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", ".next/standalone/server.js"]
