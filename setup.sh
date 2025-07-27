#!/bin/bash

# AgriERP Setup Script
echo "Setting up AgriERP development environment..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Setup backend
echo "Setting up backend..."
cd backend
npm install
cd ..

# Setup frontend
echo "Setting up frontend..."
cd frontend
npm install
cd ..

# Setup database
echo "Setting up database..."
cd backend
npm run db:migrate
npm run db:seed
cd ..

echo "Setup complete! You can now run the application with:"
echo "npm run dev"