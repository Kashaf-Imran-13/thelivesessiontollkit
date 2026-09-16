# Multi-stage Dockerfile for Unified Full-Stack Deployment
FROM node:20-alpine AS build

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Setup backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy built frontend assets to backend static directory
COPY --from=build /app/frontend/dist /app/frontend/dist

# Expose port and start
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "src/server.js"]
