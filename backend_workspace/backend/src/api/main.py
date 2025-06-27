from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .issue_routes import router as issue_router

app = FastAPI(
    title="CivicSense Backend API",
    description="FastAPI backend for public issue management with Supabase integration.",
    version="1.0.0",
    openapi_tags=[
        {"name": "Issues", "description": "Operations for managing civic issues"},
        {"name": "System", "description": "System/health endpoints"}
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Explicitly include issue API router
app.include_router(issue_router)


# PUBLIC_INTERFACE
@app.get("/", tags=["System"], summary="Health check endpoint")
def health_check():
    """Health check endpoint for monitoring/ops."""
    return {"message": "Healthy"}
