# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Create Backend & Package App
FROM node:20-slim

# Install dependencies needed for Oracle Instant Client and downloading
RUN apt-get update && apt-get install -y \
    libaio1 \
    unzip \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Setup Oracle Instant Client (using Basic Light package for smaller size)
WORKDIR /opt/oracle
RUN wget https://download.oracle.com/otn_software/linux/instantclient/2113000/instantclient-basiclite-linux.x64-21.13.0.0.0dbru.zip \
    && unzip instantclient-basiclite-linux.x64-21.13.0.0.0dbru.zip \
    && rm instantclient-basiclite-linux.x64-21.13.0.0.0dbru.zip

# Set environment variable so the Oracle driver finds the libraries automatically on Linux
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_13

# Set work directory for the application
WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy the rest of the backend application code
COPY backend/ .

# Copy built frontend into the location backend expects: "../../frontend/dist" relative to /app/src/server.js
# /app/src/server.js -> ../../ is /
COPY --from=frontend-builder /app/frontend/dist /frontend/dist

# Expose the application port
EXPOSE 5001

# Start the server
CMD ["npm", "start"]
