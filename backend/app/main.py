from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.activities import router as activities_router
from app.api.routes.health import router as health_router
from app.api.routes.skills import router as skills_router
from app.api.routes.stats import router as stats_router
from app.api.routes.vacancies import router as vacancies_router
from app.core.config import settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(vacancies_router)
    app.include_router(activities_router)
    app.include_router(skills_router)
    app.include_router(stats_router)

    return app


app = create_app()
