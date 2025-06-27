from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .issue_routes import router as issue_router

app = FastAPI(
    title="CivicSense Backend API",
    description="FastAPI backend for public issue management with Supabase integration.",
    version="1.0.0",
    openapi_tags=[
        {"name": "Issues", "description": "Operations for managing civic issues"}
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(issue_router)


@app.get("/")
def health_check():
    """Health check endpoint."""
    return {"message": "Healthy"}
