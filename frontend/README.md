# CASA — Public Marketplace Frontend (`frontend/`)

## Application Overview
The **CASA Frontend** is an independent Next.js 15 App Router web application designed for property discovery, advertisement browsing, and direct buyer-to-advertiser lead generation.

---

## Technology Stack
- **Framework:** Next.js 15 (App Router, React 19)
- **Language:** TypeScript 5.8
- **Styling:** Tailwind CSS 3.4 + Gemini-Inspired Light Palette
- **Icons:** Lucide React
- **Default Port:** `3000`

---

## Getting Started (Independent Run)

Enter the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
```
The frontend will start at **[http://localhost:3000](http://localhost:3000)**.

### Production Build & Run
```bash
npm run build
npm run start
```

### Type Checking & Linting
```bash
npm run typecheck
npm run lint
```

---

## Independent Execution & Controlled Fallback State
The frontend is engineered to run **independently without requiring the backend to be online**. If the NestJS API (Port 5000) is unreachable, the frontend gracefully renders fallback development property data and alerts the user with a controlled notification banner instead of crashing.

---

## Environment Configuration (`.env.local`)
```env
NEXT_PUBLIC_APP_NAME="CASA Real Estate"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:5000/api/v1"
NEXT_PUBLIC_DEFAULT_LOCALE="en"
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/casa"
```
