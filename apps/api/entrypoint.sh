#!/bin/sh
set -e

# Generate Prisma client
echo "Generating Prisma client..."
prisma generate --schema /app/prisma/schema.prisma

# Run migrations
echo "Running database migrations..."
prisma migrate deploy --schema /app/prisma/schema.prisma

# Start the application
echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

