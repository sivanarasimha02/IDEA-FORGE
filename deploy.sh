#!/usr/bin/env bash
# ==============================================================================
# Predictive Climate & Micro-Location Yield Engine
# Automated Production & Local Deployment Script
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_banner() {
  echo -e "${GREEN}"
  echo "================================================================="
  echo "    PREDICTIVE CLIMATE & MICRO-LOCATION YIELD ENGINE DEPLOYMENT  "
  echo "================================================================="
  echo -e "${NC}"
}

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
  log_info "Checking deployment prerequisites..."
  
  if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    log_success "Python found: $PYTHON_VERSION"
  else
    log_error "Python 3 is required but not installed."
    exit 1
  fi

  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log_success "Node.js found: $NODE_VERSION"
  else
    log_warning "Node.js not found. Docker mode will still work if Docker is installed."
  fi

  if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker found: $DOCKER_VERSION"
  else
    log_warning "Docker not found. Docker Compose mode will not be available."
  fi
}

train_models_if_missing() {
  log_info "Verifying machine learning model artifacts..."
  if [ ! -f "ml-engine/saved_models/drought_risk_model.joblib" ] || \
     [ ! -f "ml-engine/saved_models/crop_yield_model.joblib" ]; then
    log_warning "Saved model weights missing. Training models now..."
    python3 ml-engine/training/train_risk_models.py
    python3 ml-engine/training/train_yield_model.py
    log_success "ML models trained and saved to ml-engine/saved_models/"
  else
    log_success "Verified existing ML models in ml-engine/saved_models/"
  fi
}

deploy_docker() {
  log_info "Starting deployment via Docker Compose..."
  
  train_models_if_missing

  if [ ! -f ".env" ]; then
    log_info "Creating .env from .env.example..."
    cp .env.example .env
  fi

  log_info "Building and starting containers (PostGIS, FastAPI, React + Nginx)..."
  docker compose down --remove-orphans || true
  docker compose build
  docker compose up -d

  log_info "Waiting for service health checks..."
  sleep 5
  
  echo ""
  log_success "Deployment completed successfully!"
  echo "-----------------------------------------------------------------"
  echo -e "Frontend UI:        ${GREEN}http://localhost${NC} (or http://localhost:80)"
  echo -e "Backend REST API:   ${GREEN}http://localhost:8000${NC}"
  echo -e "Swagger Docs:       ${GREEN}http://localhost:8000/docs${NC}"
  echo -e "PostgreSQL/PostGIS: ${GREEN}localhost:5432${NC}"
  echo "-----------------------------------------------------------------"
  echo "Default Demo Credentials:"
  echo "  Username / Email: farmer@climate-engine.org"
  echo "  Password:         FarmerDemo123!"
  echo "-----------------------------------------------------------------"
}

deploy_local() {
  log_info "Starting bare-metal local deployment..."

  train_models_if_missing

  log_info "1. Starting FastAPI backend in background..."
  nohup python3 -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
  BACKEND_PID=$!
  echo $BACKEND_PID > .backend.pid
  log_success "Backend started (PID: $BACKEND_PID, logs: backend.log)"

  log_info "2. Starting Vite React frontend..."
  cd frontend
  if [ ! -d "node_modules" ]; then
    log_info "Installing frontend node dependencies..."
    npm install
  fi
  nohup npm run dev > ../frontend.log 2>&1 &
  FRONTEND_PID=$!
  echo $FRONTEND_PID > ../.frontend.pid
  cd ..
  log_success "Frontend started (PID: $FRONTEND_PID, logs: frontend.log)"

  sleep 3

  echo ""
  log_success "Local deployment running!"
  echo "-----------------------------------------------------------------"
  echo -e "Frontend UI:      ${GREEN}http://localhost:5173${NC}"
  echo -e "Backend API:      ${GREEN}http://localhost:8000${NC}"
  echo -e "Interactive Docs: ${GREEN}http://localhost:8000/docs${NC}"
  echo "-----------------------------------------------------------------"
  echo "To stop: ./deploy.sh --stop"
}

stop_services() {
  log_info "Stopping deployed services..."
  
  # Stop Docker if running
  if command -v docker &> /dev/null; then
    docker compose down 2>/dev/null || true
  fi

  # Stop local PIDs
  if [ -f ".backend.pid" ]; then
    PID=$(cat .backend.pid)
    kill -9 "$PID" 2>/dev/null || true
    rm -f .backend.pid
    log_success "Killed local backend (PID: $PID)"
  fi

  if [ -f ".frontend.pid" ]; then
    PID=$(cat .frontend.pid)
    kill -9 "$PID" 2>/dev/null || true
    rm -f .frontend.pid
    log_success "Killed local frontend (PID: $PID)"
  fi

  # Fallback kill by port
  lsof -ti :8000 | xargs kill -9 2>/dev/null || true
  lsof -ti :5173 | xargs kill -9 2>/dev/null || true
  log_success "All services stopped."
}

check_status() {
  log_info "Checking service status..."
  
  echo "--- Network Port Status ---"
  if lsof -i :8000 &> /dev/null; then
    echo -e "Backend (Port 8000):   ${GREEN}RUNNING${NC}"
  else
    echo -e "Backend (Port 8000):   ${RED}STOPPED${NC}"
  fi

  if lsof -i :5173 &> /dev/null || lsof -i :80 &> /dev/null; then
    echo -e "Frontend (5173/80):    ${GREEN}RUNNING${NC}"
  else
    echo -e "Frontend (5173/80):    ${RED}STOPPED${NC}"
  fi

  if command -v docker &> /dev/null; then
    echo ""
    echo "--- Docker Containers ---"
    docker ps --filter "name=climate_engine" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  fi
}

run_tests() {
  log_info "Running automated test suites..."
  pytest tests/ -v
}

# Main Command Dispatcher
print_banner

case "$1" in
  --docker|docker)
    check_prerequisites
    deploy_docker
    ;;
  --local|local)
    check_prerequisites
    deploy_local
    ;;
  --stop|stop)
    stop_services
    ;;
  --status|status)
    check_status
    ;;
  --test|test)
    run_tests
    ;;
  --train-models)
    python3 ml-engine/training/train_risk_models.py
    python3 ml-engine/training/train_yield_model.py
    ;;
  *)
    echo "Usage: ./deploy.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  --docker       Deploy multi-container production stack (PostGIS + FastAPI + Nginx)"
    echo "  --local        Run local development processes (FastAPI on 8000 + Vite on 5173)"
    echo "  --stop         Stop all running local or Docker services"
    echo "  --status       Check the status of services and ports"
    echo "  --test         Execute the full Pytest test suite"
    echo "  --train-models Retrain all climate risk and crop yield machine learning models"
    echo ""
    echo "Defaulting to --docker if Docker is installed, otherwise --local..."
    check_prerequisites
    if command -v docker &> /dev/null; then
      deploy_docker
    else
      deploy_local
    fi
    ;;
esac
