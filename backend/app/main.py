from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routes.analytics import router as analytics_router
from app.routes.transactions import router as transactions_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "SmartSpend REST API — A modern personal finance tracker backend "
        "powered by FastAPI and Supabase PostgreSQL."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration: allows local React frontend (Vite) and configurable environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
def root():
    """Root endpoint providing service metadata and navigation links."""
    return {
        "application": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "description": "Smart Personal Expense Tracker Backend API",
        "docs_url": "/docs",
        "health_url": "/health",
        "api_endpoints": {
            "transactions": f"{settings.API_PREFIX}/transactions",
            "analytics_summary": f"{settings.API_PREFIX}/analytics/summary",
        },
    }


@app.get("/health", tags=["General"])
def health_check():
    """Service health check endpoint from Phase 1."""
    return {
        "status": "healthy",
        "application": "SmartSpend",
    }


# Include API routers under /api prefix
app.include_router(transactions_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)
