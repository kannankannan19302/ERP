# AgriERP - Complete Agriculture-Based ERP System

## Overview
AgriERP is a comprehensive Enterprise Resource Planning (ERP) system designed specifically for agriculture-based B2B and B2C businesses. Built with modern technologies and inspired by Odoo Enterprise Edition, it provides a fully customizable platform with a powerful Builder Module for creating custom applications without coding.

## Key Features
- **Complete ERP Modules**: HR, Accounting, Sales, Purchase, Inventory, CRM, Manufacturing, Logistics, and more
- **Builder Module**: Drag-and-drop interface for creating custom modules and workflows
- **Multi-Database Support**: SQL Server, PostgreSQL, Oracle with abstraction layer
- **Multi-Tenant Architecture**: Support for multiple companies and branches
- **Role-Based Access Control**: Granular permissions at module, field, and record level
- **Agriculture-Specific Features**: Farmer contracts, agent commissions, produce pricing, logistics
- **Modern UI/UX**: Responsive design with Material UI and Tailwind CSS
- **API-First Architecture**: REST and GraphQL APIs for all modules
- **Offline Support**: Local storage sync for field agents

## Tech Stack
- **Backend**: Node.js with Express.js
- **Frontend**: React with Next.js
- **Database**: PostgreSQL (primary), SQL Server, Oracle support
- **Authentication**: JWT with OAuth2 support
- **UI Framework**: Material-UI with Tailwind CSS
- **API**: REST and GraphQL
- **Containerization**: Docker
- **Cloud**: AWS/Azure/GCP ready

## Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Backend       │
│   (React/Next)  │◄──►│   (Express)     │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Auth Service  │    │   Database      │
                       │   (JWT/OAuth2)  │    │   (PostgreSQL)  │
                       └─────────────────┘    └─────────────────┘
```

## Quick Start
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations
5. Start the development server: `npm run dev`

## Documentation
- [Architecture Documentation](./docs/architecture.md)
- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Module Development Guide](./docs/modules.md)
- [Builder Module Guide](./docs/builder.md)

## License
Open Source - MIT License