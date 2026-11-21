# Production Deployment & Operations Guide

## Predictive Climate & Micro-Location Yield Engine

This guide documents the procedures for deploying the platform across different target environments:
1. **Containerized Multi-Service Deployment (Docker Compose)**
2. **Kubernetes Cluster (K8s Manifests / Kustomize)**
3. **Cloud PaaS (Render / Railway / Vercel)**
4. **Single-Command Automated Deployment Script (`./deploy.sh`)**

---

## 1. Quick Start: Automated Deployment Script (`deploy.sh`)

An executable management script is provided at the repository root:

```bash
# Display help and available modes
./deploy.sh --help

# 1. Full Multi-Container Production Stack (Docker Compose)
./deploy.sh --docker

# 2. Native Bare-Metal Local Stack (Background processes)
./deploy.sh --local

# 3. Check live service status and ports
./deploy.sh --status

# 4. Stop all running containers and background services
./deploy.sh --stop

# 5. Run full test suite
./deploy.sh --test
```

---

## 2. Docker Compose Deployment

The `docker-compose.yml` orchestrates three isolated services:
- `db`: PostGIS 15-3.3 with healthchecks and persistent storage
- `backend`: FastAPI with Scikit-learn ML models
- `frontend`: React SPA served via Nginx with reverse proxy for `/api/`

### Steps
1. **Prepare Environment File:**
   ```bash
   cp .env.example .env
   ```
2. **Build and Launch:**
   ```bash
   docker compose up -d --build
   ```
3. **Verify Health:**
   ```bash
   docker compose ps
   ```
   All services will report `(healthy)`.
4. **Access Endpoints:**
   - Frontend Application: `http://localhost` (or port 80)
   - Backend API Docs: `http://localhost:8000/docs`
   - Healthcheck: `http://localhost:8000/health`

---

## 3. Kubernetes Deployment (`k8s/`)

Production Kubernetes manifests are organized under `k8s/` using Kustomize:

```text
k8s/
├── kustomization.yaml
├── namespace.yaml           # Dedicated 'climate-engine' namespace
├── configmap.yaml           # Environment variables
├── secrets.yaml             # JWT secret, DB password, tokens
├── postgres-postgis.yaml    # StatefulSet (20Gi PVC) + Service
├── backend.yaml             # Deployment (2 replicas) + Service
├── frontend.yaml            # Deployment (2 replicas) + Service
└── ingress.yaml             # Ingress with path-based routing
```

### Steps to Deploy
```bash
# 1. Build and push container images
docker build -t your-registry/climate-yield-engine-backend:latest -f backend/Dockerfile .
docker build -t your-registry/climate-yield-engine-frontend:latest ./frontend
docker push your-registry/climate-yield-engine-backend:latest
docker push your-registry/climate-yield-engine-frontend:latest

# 2. Deploy to cluster via Kustomize
kubectl apply -k k8s/

# 3. Monitor rollout
kubectl get pods -n climate-engine -w

# 4. Check services and ingress
kubectl get svc,ingress -n climate-engine
```

---

## 4. Cloud PaaS Deployment

### Option A: Render (`render.yaml`)
1. Connect your repository to [Render](https://render.com).
2. Create a new **Blueprint**.
3. Render automatically provisions:
   - Managed PostgreSQL database with PostGIS
   - FastAPI Python Web Service
   - React Static Site with automatic rewrite rules

### Option B: Vercel Frontend (`vercel.json`)
1. Import the repository into [Vercel](https://vercel.com).
2. Set Framework Preset to **Vite**.
3. Set the environment variable `VITE_API_URL` to your production backend URL.
4. Deploy.

---

## 5. Environment Variables Reference

| Variable | Default Value | Purpose |
|---|---|---|
| `ENVIRONMENT` | `production` | Runtime mode (`development` / `production`) |
| `SECRET_KEY` | *(Set a strong secret)* | HMAC-SHA256 secret key for signing JWTs |
| `DATABASE_URL` | `postgresql://...` | Connection string to PostgreSQL/PostGIS (or SQLite) |
| `OPEN_METEO_BASE_URL` | `https://api.open-meteo.com/v1` | Open-Meteo endpoint |
| `COPERNICUS_API_KEY` | *(Optional)* | API token for Copernicus Data Space Ecosystem |
| `DEFAULT_SENSOR_GATEWAY_TOKEN`| `iot-gateway-dev-token-9988` | Secret token used by IoT hardware nodes |
| `VITE_API_URL` | `""` (proxied) | External backend API URL if not using same-domain proxy |

---

## 6. Verification and Troubleshooting

- **Check Backend Logs:**
  ```bash
  docker compose logs -f backend
  ```
- **Check Frontend/Nginx Logs:**
  ```bash
  docker compose logs -f frontend
  ```
- **Inspect Database Geometry:**
  ```bash
  docker compose exec db psql -U postgres -d climate_yield_engine -c "SELECT PostGIS_Version();"
  ```
