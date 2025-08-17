# E-commerce Demo API

A production-ready e-commerce backend API built with Node.js, Express.js, PostgreSQL, and Supabase. This project demonstrates a complete e-commerce backend with product management, user authentication, shopping cart, and order management features.

## 🚀 Features

### Core E-commerce Functionality
- **Product Management**: CRUD operations, categories, inventory tracking
- **User Authentication**: Registration, login with Supabase Auth
- **Shopping Cart**: Add/remove items, quantity management
- **Order Management**: Place orders, order history, status tracking
- **Mock Payment**: Simulated payment processing for demo purposes

### Technical Features
- **RESTful API Design**: Clean, consistent API endpoints
- **Database Migrations**: PostgreSQL schema management with node-pg-migrate
- **Authentication**: JWT-based authentication with Supabase
- **Request Validation**: Input validation and sanitization
- **Error Handling**: Centralized error handling middleware
- **Testing**: Comprehensive test suite with Jest and Supertest
- **Mock Data**: Built-in test data for demo purposes

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Testing**: Jest, Supertest
- **Package Manager**: pnpm
- **Containerization**: Docker & Docker Compose
- **Migration**: node-pg-migrate

## 📦 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- pnpm
- Docker & Docker Compose (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nodejs-express-supabase-api-boilerplate
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start with Docker (Recommended)**
   ```bash
   docker-compose up
   ```

   Or **Start locally**:
   ```bash
   # Run database migrations
   pnpm migrate:up
   
   # Seed database with mock data
   pnpm db:seed
   
   # Start development server
   pnpm dev
   ```

The API will be available at `http://localhost:3000`

## 🔧 Available Scripts

```bash
# Development
pnpm dev                    # Start development server
pnpm start                  # Start production server

# Database
pnpm migrate:up            # Run database migrations
pnpm migrate:down          # Rollback last migration
pnpm migrate:create        # Create new migration
pnpm db:seed               # Seed database with mock data

# Testing
pnpm test                   # Run all tests
pnpm test:watch            # Run tests in watch mode
pnpm test:coverage         # Run tests with coverage

# Code Quality
pnpm lint                  # Run ESLint
pnpm lint:fix              # Fix linting issues
pnpm format                # Format code with Prettier

# Docker
docker-compose up          # Start API + Postgres
docker-compose down        # Stop containers
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints Overview

#### Products
- `GET /products` - List products (supports pagination, filtering)
- `GET /products/:id` - Get product details
- `POST /products` - Create product (admin only)
- `PUT /products/:id` - Update product (admin only)
- `DELETE /products/:id` - Delete product (admin only)

#### Categories
- `GET /categories` - List all categories
- `GET /categories/:id/products` - Get products by category

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

#### Shopping Cart
- `GET /cart` - Get cart contents
- `POST /cart` - Add item to cart
- `PUT /cart/:id` - Update cart item quantity
- `DELETE /cart/:id` - Remove item from cart

#### Orders
- `POST /orders` - Create new order
- `GET /orders` - Get user's orders
- `GET /orders/:id` - Get order details

## 🗄️ Database Schema

### Core Tables
- **products** - Product information, pricing, stock
- **categories** - Product categories
- **profiles** - User profiles (extends Supabase auth.users)
- **cart_items** - Shopping cart items
- **orders** - Order information
- **order_items** - Order line items

## 🧪 Testing

Run the complete test suite:
```bash
pnpm test
```

Run tests in watch mode during development:
```bash
pnpm test:watch
```

Generate test coverage report:
```bash
pnpm test:coverage
```

## 🚀 Deployment

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-jwt-secret

# App
PORT=3000
NODE_ENV=production
```

### Production Deployment
1. Set up your Supabase project
2. Configure environment variables
3. Run database migrations
4. Deploy using your preferred platform (Vercel, Railway, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Support

For support and questions, please open an issue in the GitHub repository.

---

**Note**: This is a demo application with mock data for demonstration purposes. For production use, implement proper payment processing, security measures, and data validation.