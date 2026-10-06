# CASA — Modular Backend API Gateway (`backend/`)

## Application Overview
The **CASA Backend** is an enterprise-grade NestJS RESTful microservices gateway providing core business logic for authentication, property advertisements, search, admin governance, and billing.

---

## Technology Stack
- **Framework:** NestJS 11 (Node.js)
- **Language:** TypeScript 5.8
- **Database:** MongoDB Atlas via Mongoose ORM
- **Security:** Helmet, CORS, Class-Validator, JWT / RBAC Guards
- **Documentation:** OpenAPI Swagger (`/api/docs`)
- **Default Port:** `5000`

---

## Getting Started (Independent Run)

Enter the backend directory and install dependencies:

```bash
cd backend
npm install
```

### Development Server
```bash
npm run dev
```
The API gateway will start at **[http://localhost:5000/api/v1](http://localhost:5000/api/v1)**.

### Health Check Endpoint
```bash
curl http://localhost:5000/health
```
**Response Format:**
```json
{
  "status": "ok",
  "timestamp": "2026-10-01T10:00:00.000Z",
  "uptimeSeconds": 14,
  "environment": "development",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "connected": true
  }
}
```

### OpenAPI Swagger Documentation
Interactive API docs available at: **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**.

### Production Build & Run
```bash
npm run build
npm run start:prod
```

### Type Checking & Testing
```bash
npm run typecheck
npm run lint
npm run test
```

---

## Environment Configuration (`.env`)
```env
PORT=5000
NODE_ENV=development
APP_NAME="CASA API Gateway"
APP_PREFIX="api/v1"
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
MONGODB_URI=mongodb://127.0.0.1:27017/casa_real_estate
MONGODB_DB_NAME=casa_real_estate
JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars
```
