# PayNex

> **Intelligent Shopping. Seamless Payments.**
> *"Find Better. Buy Smarter."*

PayNex is a full-stack, AI-powered intelligent shopping and payment platform. It pairs conversational natural-language product discovery with side-by-side specification evaluation, PostgreSQL session persistence, and server-side PayPal Sandbox checkout.

---

## Architecture Overview

```
PayNex/
├── frontend/             # React 19 + Vite 8 + Tailwind CSS v4 SPA
│   ├── src/
│   │   ├── components/   # Modular UI & product components
│   │   ├── context/      # AuthContext, CartContext, CompareContext
│   │   ├── pages/        # 11 responsive pages
│   │   └── services/     # Centralized API service layer (Axios)
│   └── .env              # VITE_API_BASE_URL=http://localhost:8000/api/v1
│
├── backend/              # Python FastAPI REST API
│   ├── app/
│   │   ├── main.py       # FastAPI application & CORS
│   │   ├── models/       # SQLAlchemy ORM models (PostgreSQL)
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── routers/      # Auth, Products, Cart, Orders, Payments, AI, Dashboard
│   │   └── utils/        # JWT/Bcrypt auth, PayPal SDK, Gemini AI
│   ├── alembic/          # Database migrations
│   ├── test_api.py       # Automated integration test suite
│   └── requirements.txt  # Python dependencies
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Lucide Icons, Framer Motion |
| **Backend** | Python 3.14, FastAPI, Pydantic v2 |
| **Database** | PostgreSQL 18 with SQLAlchemy 2.0 ORM |
| **Database Migrations** | Alembic |
| **Security** | JWT (python-jose), bcrypt password hashing, OAuth2 Bearer |
| **AI Assistant** | Google Gemini API (`gemini-1.5-flash`) + Catalog Grounding |
| **Payments** | PayPal Orders API v2 (Developer Sandbox) |

---

## Quickstart

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Copy .env.example to .env and configure DATABASE_URL
alembic upgrade head
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Health Check: [http://localhost:8000/health](http://localhost:8000/health)
- Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Application: [http://localhost:5173/](http://localhost:5173/)

---

## Automated Verification

Run the comprehensive integration test suite to verify all backend endpoints:
```bash
cd backend
python test_api.py
```
*(All tests pass: Health check, Categories, Product Catalog, Search & Filter, User Registration, Login, Protected Routes, Cart CRUD, Wishlist, Order placement, AI Chat, Dashboard Stats, Profile).*
