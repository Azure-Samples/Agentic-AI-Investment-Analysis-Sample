# Use Node.js official image as base
FROM node:24-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY web-app/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY web-app/. .

# Create dynamic .env file
RUN echo "VITE_API_BASE_URL=API_URL" > .env && \
    echo "VITE_OTHER_CONFIG=OTHER_CONFIG" >> .env

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create nginx configuration for serving static files only
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Replace placeholder in built files with environment variables at runtime
RUN apk add --no-cache sed

# Create entrypoint script to replace environment variables
RUN printf '#!/bin/sh\nfor file in /usr/share/nginx/html/assets/*.js; do\n  if [ -f "$file" ]; then\n    sed -i "s|API_URL|${VITE_API_BASE_URL:-}|g" "$file" 2>/dev/null || true\n    sed -i "s|OTHER_CONFIG|${VITE_OTHER_CONFIG:-}|g" "$file" 2>/dev/null || true\n  fi\ndone\nexec nginx -g "daemon off;"\n' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Expose port 8080
EXPOSE 8080

# Start nginx with custom entrypoint
ENTRYPOINT ["/entrypoint.sh"]