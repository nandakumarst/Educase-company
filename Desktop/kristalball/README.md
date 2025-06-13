# Military Asset Management System

A comprehensive system for managing military assets, including tracking, transfers, assignments, and expenditures across multiple bases.

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT
- **UI Framework**: Material-UI

## Project Structure

```
kristalball/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
│
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utility functions
│   └── prisma/           # Database schema and migrations
│
└── docker/               # Docker configuration files
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v14 or higher)
- Docker (optional)

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Features

- Asset tracking and management
- Role-based access control
- Transfer management between bases
- Assignment and expenditure tracking
- Dashboard with key metrics
- Purchase management
- Comprehensive audit logging

## API Documentation

API documentation is available at `/api-docs` when running the server.

## Security

- JWT-based authentication
- Role-based access control
- Secure password hashing
- API request validation
- CORS protection
- Rate limiting

## License

MIT 