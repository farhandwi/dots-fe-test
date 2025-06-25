FROM node:18-alpine

# Install dependencies for compatibility and runtime
RUN apk add --no-cache libc6-compat curl

# Create and switch to app directory
WORKDIR /app

# Opsional: buat user non-root (seperti di runner stage)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy dependency files and install all dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source code dan env
COPY . .
COPY .env.example .env

# Set environment untuk production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Build aplikasi Next.js
RUN npm run build


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
