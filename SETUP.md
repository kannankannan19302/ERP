# AgriERP Setup Guide

This guide will help you set up the AgriERP system for development, testing, or production use.

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+), macOS (10.15+), or Windows 10+ with WSL2
- **Memory**: Minimum 8GB RAM (16GB recommended for development)
- **Storage**: Minimum 50GB free space
- **Network**: Stable internet connection for package downloads

### Required Software
- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher (comes with Node.js)
- **Docker**: Version 20.x or higher
- **Docker Compose**: Version 2.x or higher
- **Git**: Latest version

### Optional Software
- **PostgreSQL**: Version 15+ (if not using Docker)
- **Redis**: Version 7+ (if not using Docker)
- **VS Code**: Recommended IDE with extensions

## Quick Start with Docker

The fastest way to get AgriERP running is using Docker Compose:

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/agrierp.git
cd agrierp
```

### 2. Environment Configuration
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the environment files as needed
nano backend/.env
nano frontend/.env
```

### 3. Start the Services
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize the Database
```bash
# Run database migrations
docker-compose exec backend npm run migrate

# Seed initial data
docker-compose exec backend npm run seed
```

### 5. Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Database Admin**: http://localhost:8080 (Adminer)
- **Redis Admin**: http://localhost:8081 (Redis Commander)

### Default Login Credentials
- **Super Admin**: admin@agrierp.com / admin123
- **Demo User**: demo@agrierp.com / demo123

## Manual Setup (Development)

If you prefer to set up the system manually without Docker:

### 1. Database Setup

#### PostgreSQL
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE agrierp_dev;
CREATE USER agrierp WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE agrierp_dev TO agrierp;
\q
```

#### SQL Server (Alternative)
```bash
# Install SQL Server (Ubuntu)
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/20.04/mssql-server-2019.list)"
sudo apt update
sudo apt install -y mssql-server
sudo /opt/mssql/bin/mssql-conf setup

# Install SQL Server command-line tools
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list
sudo apt update
sudo apt install mssql-tools unixodbc-dev

# Create database
sqlcmd -S localhost -U SA -P 'YourPassword123'
CREATE DATABASE agrierp_dev;
GO
```

### 2. Redis Setup
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis connection
redis-cli ping
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
nano .env

# Run database migrations
npm run migrate

# Seed initial data
npm run seed

# Start development server
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
nano .env

# Start development server
npm run dev
```

## Environment Configuration

### Backend Environment Variables (.env)

```bash
# Environment
NODE_ENV=development
PORT=3000

# Database Configuration
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agrierp_dev
DB_USER=agrierp
DB_PASSWORD=password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@agrierp.com

# File Storage
STORAGE_TYPE=local
UPLOAD_PATH=uploads/
MAX_FILE_SIZE=10485760

# Features
ENABLE_GRAPHQL=true
ENABLE_WEBSOCKETS=true
ENABLE_AUDIT_LOGS=true
```

### Frontend Environment Variables (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_NAME=AgriERP
NEXT_PUBLIC_APP_VERSION=1.0.0

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_CHAT=true
```

## Database Migration and Seeding

### Running Migrations
```bash
# Run all pending migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Check migration status
npm run migrate:status
```

### Seeding Data
```bash
# Run all seeds
npm run seed

# Run specific seed file
npm run seed:run --specific=01_users.js
```

### Creating Migrations
```bash
# Create a new migration
npx knex migrate:make create_products_table

# Create a new seed
npx knex seed:make 01_products
```

## Development Workflow

### Code Style and Linting
```bash
# Backend linting
cd backend
npm run lint
npm run lint:fix

# Frontend linting
cd frontend
npm run lint
npm run lint:fix
```

### Testing
```bash
# Backend tests
cd backend
npm test
npm run test:watch
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:watch
npm run test:coverage
```

### Building for Production
```bash
# Backend build
cd backend
npm run build

# Frontend build
cd frontend
npm run build
```

## Production Deployment

### Using Docker Compose (Recommended)

1. **Prepare Production Environment**
```bash
# Clone repository on production server
git clone https://github.com/your-org/agrierp.git
cd agrierp

# Copy and configure production environment
cp docker-compose.prod.yml docker-compose.yml
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env
```

2. **Configure Environment Variables**
```bash
# Update production settings
nano backend/.env
nano frontend/.env

# Set secure passwords and secrets
# Configure external services (email, SMS, etc.)
# Set up SSL certificates
```

3. **Deploy Services**
```bash
# Pull latest images
docker-compose pull

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate

# Check service health
docker-compose ps
```

### Manual Production Setup

1. **Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx
```

2. **Database Setup**
```bash
# Install and configure PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb agrierp_prod
sudo -u postgres createuser agrierp_prod
```

3. **Application Deployment**
```bash
# Clone and build application
git clone https://github.com/your-org/agrierp.git
cd agrierp

# Backend setup
cd backend
npm ci --production
npm run build
pm2 start ecosystem.config.js --env production

# Frontend setup
cd ../frontend
npm ci --production
npm run build
pm2 start ecosystem.config.js --env production
```

4. **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/agrierp
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Maintenance

### Health Checks
```bash
# Check application health
curl http://localhost:3000/health
curl http://localhost:3001/api/health

# Check database connection
docker-compose exec postgres pg_isready

# Check Redis connection
docker-compose exec redis redis-cli ping
```

### Log Management
```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View system logs
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

### Backup and Recovery
```bash
# Database backup
docker-compose exec postgres pg_dump -U postgres agrierp_dev > backup.sql

# Database restore
docker-compose exec -T postgres psql -U postgres agrierp_dev < backup.sql

# File backup
tar -czf uploads-backup.tar.gz backend/uploads/
```

### Performance Monitoring
```bash
# Monitor resource usage
docker stats

# Monitor database performance
docker-compose exec postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Monitor Redis performance
docker-compose exec redis redis-cli info stats
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>
```

2. **Database Connection Issues**
```bash
# Check database status
docker-compose exec postgres pg_isready

# Reset database
docker-compose down
docker volume rm agrierp_postgres_data
docker-compose up -d postgres
```

3. **Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
```

4. **Memory Issues**
```bash
# Increase Docker memory limit
# Edit Docker Desktop settings or /etc/docker/daemon.json

# Clear npm cache
npm cache clean --force
```

### Getting Help

- **Documentation**: Check the `/docs` folder for detailed documentation
- **Issues**: Report bugs on GitHub Issues
- **Community**: Join our Discord/Slack community
- **Support**: Contact support@agrierp.com for enterprise support

## Security Considerations

### Development Security
- Never commit sensitive data to version control
- Use environment variables for all configuration
- Keep dependencies updated
- Use HTTPS in production
- Implement proper input validation
- Enable audit logging

### Production Security
- Use strong passwords and secrets
- Enable firewall and fail2ban
- Regular security updates
- SSL/TLS certificates
- Database encryption
- Regular backups
- Monitor for security threats

## Performance Optimization

### Database Optimization
- Create appropriate indexes
- Use connection pooling
- Monitor slow queries
- Regular maintenance (VACUUM, ANALYZE)

### Application Optimization
- Enable caching (Redis)
- Optimize API queries
- Use CDN for static assets
- Implement pagination
- Monitor performance metrics

### Frontend Optimization
- Code splitting
- Image optimization
- Bundle analysis
- Service worker caching
- Performance monitoring

This setup guide should help you get AgriERP running in any environment. For additional help, refer to the documentation in the `/docs` folder or contact the development team.