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

# Install dependencies
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Copy environment variables
COPY .env.example .env

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Build the application
RUN npm run build

# Change ownership of app files to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/dots-fe-test/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
