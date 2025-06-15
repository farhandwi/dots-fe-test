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

# Gunakan user non-root
USER nextjs

# Buka port 3000
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "start"]
