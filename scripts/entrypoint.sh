#!/bin/bash
set -e

echo "Running database migrations..."
npx prisma migrate deploy || true

echo "Starting the application..."
exec node backend/server.js