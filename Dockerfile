# Use Node.js LTS image
FROM node:20-slim

# Install system dependencies for Oracle Instant Client (libaio1)
RUN apt-get update && apt-get install -y libaio1 wget unzip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variables for Oracle Instant Client
ENV LD_LIBRARY_PATH=/app/instantclient_21_15

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
