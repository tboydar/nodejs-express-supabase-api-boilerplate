#!/bin/bash

# Test execution script for E-commerce Demo API

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

# Function to setup test environment
setup_test_env() {
    print_status "Setting up test environment..."
    
    # Create .env.test if it doesn't exist
    if [ ! -f .env.test ]; then
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
    fi
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Function to install packages
install_packages() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed"
}

# Function to run linting
run_lint() {
    print_status "Running ESLint..."
    if npm run lint; then
        print_success "Linting passed"
    else
        print_error "Linting failed"
        exit 1
    fi
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    if npm test -- --testPathPattern=models; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        exit 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    if npm test -- --testPathPattern=integration; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        exit 1
    fi
}

# Function to run all tests with coverage
run_all_tests() {
    print_status "Running all tests with coverage..."
    if npm run test:coverage; then
        print_success "All tests passed with coverage"
    else
        print_error "Tests failed"
        exit 1
    fi
}

# Function to check test database
check_test_db() {
    print_status "Checking test database connection..."
    
    # Try to connect to test database
    if psql "$DATABASE_URL" -c '\l' >/dev/null 2>&1; then
        print_success "Test database connection successful"
    else
        print_warning "Test database not available. Using default connection."
    fi
}

# Function to run database migrations for testing
run_test_migrations() {
    print_status "Running test database migrations..."
    if npm run migrate:up; then
        print_success "Test migrations completed"
    else
        print_warning "Test migrations failed or not needed"
    fi
}

# Function to cleanup test data
cleanup_test_data() {
    print_status "Cleaning up test data..."
    # Test cleanup is handled by the test setup/teardown
    print_success "Test cleanup completed"
}

# Function to generate test report
generate_test_report() {
    print_status "Generating test report..."
    
    if [ -d "coverage" ]; then
        print_success "Coverage report generated in coverage/ directory"
        if command_exists open && [[ "$OSTYPE" == "darwin"* ]]; then
            print_status "Opening coverage report in browser..."
            open coverage/lcov-report/index.html
        elif command_exists xdg-open; then
            print_status "Opening coverage report in browser..."
            xdg-open coverage/lcov-report/index.html
        fi
    fi
}

# Main execution function
main() {
    echo "🧪 E-commerce Demo API Test Suite"
    echo "=================================="
    echo
    
    # Parse command line arguments
    TEST_TYPE=${1:-"all"}
    
    case $TEST_TYPE in
        "setup")
            setup_test_env
            ;;
        "lint")
            check_dependencies
            run_lint
            ;;
        "unit")
            setup_test_env
            check_dependencies
            run_unit_tests
            ;;
        "integration")
            setup_test_env
            check_dependencies
            run_integration_tests
            ;;
        "coverage")
            setup_test_env
            check_dependencies
            run_all_tests
            generate_test_report
            ;;
        "all"|"")
            setup_test_env
            check_dependencies
            install_packages
            run_lint
            run_all_tests
            generate_test_report
            cleanup_test_data
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [TYPE]"
            echo
            echo "Available test types:"
            echo "  setup       - Setup test environment only"
            echo "  lint        - Run linting only"
            echo "  unit        - Run unit tests only"
            echo "  integration - Run integration tests only"
            echo "  coverage    - Run all tests with coverage"
            echo "  all         - Run complete test suite (default)"
            echo "  help        - Show this help message"
            echo
            exit 0
            ;;
        *)
            print_error "Unknown test type: $TEST_TYPE"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    echo
    print_success "Test execution completed successfully! 🎉"
}

# Export environment variables for testing
export NODE_ENV=test

# Run main function
main "$@"