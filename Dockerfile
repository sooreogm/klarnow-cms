# ---------- Build Stage ----------
  FROM node:20-alpine AS builder

  # Set working directory at project root
  WORKDIR /app
  
  # Copy package files (for both server + client)
  COPY package*.json ./
  # RUN ln -s /usr/local/lib/node_modules/ ../node_modules
  
  # Install dependencies (deterministic)
  RUN npm ci
  
  # Copy everything needed for build
  COPY . .
  
  # Build the client using vite
  RUN npm run build
  
  # ---------- Production Stage ----------
  FROM node:20-alpine
  
  WORKDIR /app
  
  # Copy only necessary runtime files
  COPY package*.json ./
  RUN npm ci --omit=dev && npm cache clean --force
  
  # Copy built files (server bundle + public assets)
  COPY --from=builder /app/dist ./dist
  
  # Expose port
  EXPOSE 5500
  
  # Environment setup (PORT can be overridden by runtime)
  # DATABASE_URL should be provided at runtime via --env-file or -e flag
  ENV NODE_ENV=production
  ENV PORT=5500
  
  # Health check
  HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5500/api/test || exit 1

  # Start the app
  CMD ["npm", "run", "start"]
  