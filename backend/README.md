# PayNex Backend — Python FastAPI

High-performance, modular REST API powering the PayNex intelligent shopping & payment platform.

## Technology Stack

- **Framework**: Python 3.14 + FastAPI
- **Database**: PostgreSQL 18 with SQLAlchemy 2.0 ORM
- **Migrations**: Alembic
- **Authentication**: JWT (python-jose) + bcrypt password hashing
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`)
- **Payments**: PayPal Developer Sandbox (Orders API v2)

---

## Directory Architecture

```
backend/
├── app/
│   ├── main.py          # FastAPI application entry point & CORS
│   ├── config.py        # Pydantic Settings & environment variables
│   ├── database.py      # SQLAlchemy engine, session maker, get_db dependency
│   ├── models/          # SQLAlchemy ORM models (Users, Products, Orders, etc.)
│   ├── schemas/         # Pydantic request/response validation schemas
│   ├── routers/         # API endpoints
│   │   ├── auth.py      # Registration, Login, Current User
│   │   ├── products.py  # Products list, search, filter, detail, categories
│   │   ├── cart.py      # Server-side Cart CRUD & calculations
│   │   ├── wishlist.py  # User Wishlist management
│   │   ├── orders.py    # Order creation, order items, history
│   │   ├── payments.py  # PayPal order creation, approval, capture
│   │   ├── ai.py        # Natural language AI shopping assistant
│   │   └── dashboard.py # Dashboard stats, activity logs, profile
│   ├── services/        # Business logic & DB seeding
│   └── utils/           # Auth, PayPal, and AI client helpers
├── alembic/             # Database migrations
├── alembic.ini          # Alembic configuration
├── test_api.py          # Automated test suite
├── requirements.txt     # Python dependencies
├── .env.example         # Template for environment variables
└── .env                 # Local secrets (gitignored)
```

---

## Getting Started

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/paynex

# JWT
JWT_SECRET_KEY=your-random-32-byte-secret

# Google Gemini AI (Get from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key

# PayPal Sandbox (Get from https://developer.paypal.com)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### 3. Run Database Migrations & Seed Catalog
```bash
alembic upgrade head
```
*(On first startup, FastAPI automatically verifies all tables and seeds the 8 categories and 12 curated products).*

### 4. Start the Development Server
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Interactive API Documentation

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Running Automated Tests

Run the full end-to-end integration test suite:
```bash
python test_api.py
```
