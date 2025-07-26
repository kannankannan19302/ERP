# AgriERP - Quick Run Guide

## 🚀 How to Run the Application

### Option 1: Using Docker (Recommended - Easiest)

This is the fastest way to get the entire system running with all dependencies.

```bash
# 1. Clone the repository (if not already done)
git clone https://github.com/kannankannan19302/ERP.git
cd ERP

# 2. Start all services with Docker Compose
docker-compose up -d

# 3. Wait for services to start (about 2-3 minutes)
docker-compose ps

# 4. Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000
# API Docs: http://localhost:3000/api-docs
```

**Default Login Credentials:**
- Email: `admin@agrierp.com`
- Password: `admin123`

### Option 2: Manual Setup (For Development)

If you want to run the application manually for development:

#### Prerequisites
- Node.js 18+ installed
- PostgreSQL 15+ installed and running
- Redis 7+ installed and running

#### Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Edit the .env file with your database credentials
nano .env

# 5. Run database migrations (after setting up PostgreSQL)
npm run migrate

# 6. Seed initial data
npm run seed

# 7. Start the backend server
npm run dev
```

The backend will be available at: http://localhost:3000

#### Frontend Setup
```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Start the frontend server
npm run dev
```

The frontend will be available at: http://localhost:3001

### Option 3: Production Setup

For production deployment, refer to the detailed [SETUP.md](./SETUP.md) guide.

## 🔧 Development Commands

### Backend Commands
```bash
cd backend

# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Database
npm run migrate     # Run database migrations
npm run migrate:rollback  # Rollback last migration
npm run seed        # Seed database with sample data

# Testing
npm test           # Run tests
npm run test:watch # Run tests in watch mode
npm run lint       # Run ESLint
```

### Frontend Commands
```bash
cd frontend

# Development
npm run dev        # Start development server
npm run build      # Build for production
npm start         # Start production server

# Testing & Quality
npm test          # Run tests
npm run lint      # Run ESLint
npm run type-check # TypeScript type checking
```

### Docker Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build -d

# View running containers
docker-compose ps
```

## 🌐 Application URLs

When running locally:

- **Frontend (Main App)**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

When using Docker Compose (additional services):

- **Database Admin (Adminer)**: http://localhost:8080
- **Redis Admin**: http://localhost:8081
- **Email Testing (MailHog)**: http://localhost:8025
- **Monitoring (Grafana)**: http://localhost:3002

## 🔑 Default Login Credentials

### Super Admin
- **Email**: admin@agrierp.com
- **Password**: admin123
- **Access**: Full system access

### Demo User
- **Email**: demo@agrierp.com
- **Password**: demo123
- **Access**: Limited access for testing

## 📱 Testing the Application

### 1. Login and Dashboard
1. Go to http://localhost:3001
2. Login with admin credentials
3. Explore the main dashboard

### 2. HR Module
1. Navigate to HR → Employees
2. Create a new employee
3. Test employee search and filtering

### 3. Builder Module
1. Go to Builder → Modules
2. Create a custom module using drag-and-drop
3. Test the generated forms and workflows

### 4. API Testing
1. Visit http://localhost:3000/api-docs
2. Test API endpoints using the interactive documentation
3. Use tools like Postman for advanced API testing

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using the port
sudo lsof -i :3000
sudo lsof -i :3001

# Kill the process
sudo kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check database exists
psql -U postgres -l
```

#### Docker Issues
```bash
# Check Docker is running
docker --version
docker-compose --version

# Restart Docker services
docker-compose down
docker-compose up -d

# View detailed logs
docker-compose logs backend
docker-compose logs frontend
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### Getting Help

1. **Check Logs**: Always check application logs first
2. **Documentation**: Refer to detailed docs in `/docs` folder
3. **GitHub Issues**: Report bugs at https://github.com/kannankannan19302/ERP/issues
4. **System Overview**: Read [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) for architecture details

## 🚀 Next Steps

After successfully running the application:

1. **Explore Modules**: Navigate through different ERP modules
2. **Create Custom Module**: Use the Builder to create your first custom module
3. **Configure Settings**: Customize the system for your business needs
4. **Import Data**: Import your existing business data
5. **Train Users**: Use the built-in tutorials and documentation

## 📞 Support

- **Documentation**: Complete docs in `/docs` folder
- **Setup Guide**: Detailed setup in [SETUP.md](./SETUP.md)
- **Architecture**: System details in [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)
- **Issues**: https://github.com/kannankannan19302/ERP/issues

---

**Happy coding! 🎉**

The AgriERP system is now ready to transform your agricultural business operations!