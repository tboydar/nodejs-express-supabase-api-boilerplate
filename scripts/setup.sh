#!/bin/bash

# Setup script for E-commerce Demo API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    print_status "Checking Node.js version..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js version: $(node -v)"
}

# Function to check npm
check_npm() {
    print_status "Checking npm..."
    
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "npm version: $(npm -v)"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Function to check database requirements
check_database() {
    print_status "Checking database requirements..."
    
    if command_exists psql; then
        print_success "PostgreSQL client found"
    else
        print_warning "PostgreSQL client not found. You may need to install it for database operations."
    fi
    
    if command_exists docker; then
        print_success "Docker found - you can use docker-compose for local development"
    else
        print_warning "Docker not found. Consider installing Docker for easier local development."
    fi
}

# Function to create environment file
create_env_file() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cat > .env << 'EOF'
# Environment
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_db

# JWT Secrets (Change these in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# API Configuration
API_PREFIX=/api/v1

# Optional: Supabase Configuration
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_KEY=your_supabase_service_key
EOF
        print_success ".env file created"
        print_warning "Please update the .env file with your actual configuration values!"
    else
        print_success ".env file already exists"
    fi
}

# Function to create test environment file
create_test_env_file() {
    print_status "Setting up test environment..."
    
    if [ ! -f ".env.test" ]; then
        print_status "Creating .env.test file..."
        cat > .env.test << 'EOF'
NODE_ENV=test
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce_test
JWT_SECRET=test_jwt_secret_key_for_testing_only
JWT_REFRESH_SECRET=test_jwt_refresh_secret_key_for_testing_only
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
API_PREFIX=/api/v1
EOF
        print_success ".env.test file created"
    else
        print_success ".env.test file already exists"
    fi
}

# Function to create uploads directory
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p uploads
    mkdir -p logs
    
    print_success "Directories created"
}

# Function to run database setup
setup_database() {
    print_status "Setting up database..."
    
    if [ -f "docker-compose.yml" ] && command_exists docker-compose; then
        print_status "Starting database with Docker Compose..."
        docker-compose up -d postgres
        
        # Wait for database to be ready
        print_status "Waiting for database to be ready..."
        sleep 10
        
        print_success "Database started with Docker Compose"
    else
        print_warning "Docker Compose not available. Please ensure PostgreSQL is running manually."
    fi
}

# Function to run migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if npm run migrate:up; then
        print_success "Database migrations completed"
    else
        print_warning "Database migrations failed. This is normal if database is not yet accessible."
    fi
}

# Function to seed database
seed_database() {
    print_status "Seeding database with demo data..."
    
    if npm run db:seed; then
        print_success "Database seeded with demo data"
    else
        print_warning "Database seeding failed. This is normal if database is not yet accessible."
    fi
}

# Function to run tests
run_initial_tests() {
    print_status "Running initial tests..."
    
    if npm run lint; then
        print_success "Linting passed"
    else
        print_warning "Linting failed - please check the code style"
    fi
    
    if npm test -- --passWithNoTests; then
        print_success "Tests passed"
    else
        print_warning "Some tests failed - this is normal during initial setup"
    fi
}

# Function to display next steps
show_next_steps() {
    echo
    echo "🎉 Setup completed successfully!"
    echo "================================"
    echo
    echo "Next steps:"
    echo "1. Update .env file with your actual configuration"
    echo "2. Ensure PostgreSQL is running"
    echo "3. Run migrations: npm run migrate:up"
    echo "4. Seed the database: npm run db:seed"
    echo "5. Start the development server: npm run dev"
    echo
    echo "Available commands:"
    echo "  npm run dev        - Start development server"
    echo "  npm run start      - Start production server"
    echo "  npm run test       - Run tests"
    echo "  npm run lint       - Run linting"
    echo "  npm run db:seed    - Seed database with demo data"
    echo
    echo "Development with Docker:"
    echo "  docker-compose up  - Start all services"
    echo
    echo "Testing:"
    echo "  ./scripts/test.sh  - Run complete test suite"
    echo
    echo "Documentation:"
    echo "  README.md          - English documentation"
    echo "  README-zh.md       - Chinese documentation"
    echo "  README-DE.md       - German documentation"
    echo
}

# Main execution function
main() {
    echo "🚀 E-commerce Demo API Setup"
    echo "============================"
    echo
    
    # Parse command line arguments
    SETUP_TYPE=${1:-"full"}
    
    case $SETUP_TYPE in
        "deps"|"dependencies")
            check_node_version
            check_npm
            install_dependencies
            ;;
        "env"|"environment")
            create_env_file
            create_test_env_file
            create_directories
            ;;
        "db"|"database")
            setup_database
            run_migrations
            seed_database
            ;;
        "test")
            run_initial_tests
            ;;
        "full"|"")
            check_node_version
            check_npm
            check_database
            install_dependencies
            create_env_file
            create_test_env_file
            create_directories
            setup_database
            run_migrations
            seed_database
            run_initial_tests
            show_next_steps
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [TYPE]"
            echo
            echo "Available setup types:"
            echo "  deps        - Install dependencies only"
            echo "  env         - Setup environment files only"
            echo "  db          - Setup database only"
            echo "  test        - Run initial tests only"
            echo "  full        - Complete setup (default)"
            echo "  help        - Show this help message"
            echo
            exit 0
            ;;
        *)
            print_error "Unknown setup type: $SETUP_TYPE"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    if [ "$SETUP_TYPE" != "full" ]; then
        echo
        print_success "Setup ($SETUP_TYPE) completed successfully! 🎉"
    fi
}

# Run main function
main "$@"