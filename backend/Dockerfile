FROM node:20-alpine

# Install system dependencies (openssl is required by Prisma)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and config files
COPY tsconfig.json ./
COPY src ./src

# Build production distribution
RUN npm run build

EXPOSE 5000

# Script to run migrations and start backend
CMD ["sh", "-c", "npx prisma db push && npm run dev"]
