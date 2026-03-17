# Use a slim Node image
FROM node:20-slim

# Install dependencies needed for Oracle Instant Client and downloading
RUN apt-get update && apt-get install -y \
    libaio1 \
    unzip \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Setup Oracle Instant Client (using Basic Light package for smaller size)
WORKDIR /opt/oracle
RUN wget https://download.oracle.com/otn_software/linux/instantclient/2112000/instantclient-basiclight-linux.x64-21.12.0.0.0dbru.zip \
    && unzip instantclient-basiclight-linux.x64-21.12.0.0.0dbru.zip \
    && rm instantclient-basiclight-linux.x64-21.12.0.0.0dbru.zip

# Set environment variable so the Oracle driver finds the libraries automatically on Linux
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_21_12

# Set work directory for the application
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 5001

# Start the server
CMD ["npm", "start"]
