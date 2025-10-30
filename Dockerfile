# Wanwa Production Dockerfile
# Optimized multi-stage build for minimal image size and maximum performance

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:18-alpine AS deps

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies with cache mounting for faster rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Build arguments
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Build the application
RUN npm run build

# Remove source maps in production
RUN find dist -name "*.map" -type f -delete

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM nginx:1.25-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    wget \
    ca-certificates \
    tzdata \
    tini

# Set timezone
ENV TZ=Europe/Paris
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create nginx user with specific UID/GID for security
RUN addgroup -g 1001 -S nginx-app && \
    adduser -D -u 1001 -S -G nginx-app nginx-app

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx-app:nginx-app nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder
COPY --from=builder --chown=nginx-app:nginx-app /app/dist /usr/share/nginx/html

# Copy health check endpoint
COPY --chown=nginx-app:nginx-app public/health.html /usr/share/nginx/html/health

# Create necessary directories with correct permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx-app:nginx-app /var/cache/nginx /var/log/nginx /var/run && \
    chmod -R 755 /var/cache/nginx /var/log/nginx

# Pre-compress static assets for better performance
RUN find /usr/share/nginx/html -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.json' \) \
    -exec gzip -k -9 {} \; && \
    find /usr/share/nginx/html -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.json' \) \
    -exec brotli -k -9 {} \; || true

# Security: Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*.html.gz.br 2>/dev/null || true && \
    rm -rf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

# Health check with proper endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Expose port 80
EXPOSE 80

# Run as non-root user for security
USER nginx-app

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Labels for metadata
# ============================================
LABEL maintainer="Cirque Photo Video <support@wanwa.app>"
LABEL version="1.0.0"
LABEL description="Wanwa - AI-Powered Product Catalog Management System"
LABEL org.opencontainers.image.source="https://github.com/cirquephotovideo/wanwa"
LABEL org.opencontainers.image.vendor="Cirque Photo Video"
LABEL org.opencontainers.image.licenses="MIT"
LABEL com.wanwa.build-date="2024"
