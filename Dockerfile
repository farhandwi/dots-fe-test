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
RUN npm ci --frozen-lockfile && npm cache clean --force

# Copy source code
COPY . .

# Set environment variables with memory limits
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build the application with memory optimization
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Remove dev dependencies and clean cache
RUN npm prune --production && \
    npm cache clean --force && \
    rm -rf .next/cache

# Copy the standalone output untuk production
RUN mkdir -p /app/standalone
RUN cp -r .next/standalone/* /app/standalone/ || true
RUN cp -r .next/static /app/standalone/.next/static || true
RUN cp -r public /app/standalone/public || true

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start application - cek standalone dulu
CMD if [ -f "/app/standalone/server.js" ]; then \
      cd /app/standalone && node server.js; \
    elif [ -f "/app/.next/standalone/server.js" ]; then \
      node .next/standalone/server.js; \
    else \
      npm start; \
    fi
