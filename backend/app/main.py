from fastapi import FastAPI, Request, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routes.analytics import router as analytics_router
from app.routes.auth import router as auth_router
from app.routes.profile import router as profile_router
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

# Handle legacy browser probes (old service workers or extensions) to prevent 404 log noise
@app.get("/sw.js", include_in_schema=False)
@app.get("/sos/active", include_in_schema=False)
def handle_browser_probes():
    return Response(status_code=status.HTTP_204_NO_CONTENT)

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
            "profile": f"{settings.API_PREFIX}/profile",
            "auth": f"{settings.API_PREFIX}/auth",
        },
    }


@app.get("/health", tags=["General"])
@app.get(f"{settings.API_PREFIX}/health", tags=["General"])
def health_check():
    """Service health check endpoint from Phase 1."""
    return {
        "status": "healthy",
        "application": "SmartSpend",
    }


# Include API routers under /api prefix
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(transactions_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)
app.include_router(profile_router, prefix=settings.API_PREFIX)

# Also mount routers at root without /api prefix to seamlessly support any frontend VITE_API_URL format
app.include_router(auth_router, include_in_schema=False)
app.include_router(transactions_router, include_in_schema=False)
app.include_router(analytics_router, include_in_schema=False)
app.include_router(profile_router, include_in_schema=False)
