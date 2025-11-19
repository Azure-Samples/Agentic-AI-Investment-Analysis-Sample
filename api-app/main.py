import datetime
import time
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings
from app.utils.logging import setup_logger
from app.dependencies import initialize_all, close_all, get_cosmos_client
from app.routers import opportunity, analysis, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await initialize_all()
    yield
    # Shutdown
    await close_all()

def initialize_api_application() -> FastAPI:

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        debug=settings.DEBUG,
        lifespan=lifespan
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOW_ORIGINS,
        allow_credentials=settings.ALLOW_CREDENTIALS,
        allow_methods=settings.ALLOW_METHODS,
        allow_headers=settings.ALLOW_HEADERS,
    )

    # Include routers
    app.include_router(opportunity.router, prefix="/api")
    app.include_router(analysis.router, prefix="/api")
    app.include_router(chat.router, prefix="/api")

    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Internal server error",
                "detail": str(exc) if settings.DEBUG else "An unexpected error occurred"
            }
        )

    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        """Enhanced health check with system metrics"""
        start_time = time.time()
        
        health_status = {
            "status": "healthy",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "checks": {}
        }
        
        # # Database health
        # try:
        #     cosmos_client = await get_cosmos_client()
        #     if not cosmos_client:
        #         raise Exception("Cosmos client not initialized")
            
        #     container_names = str.join(", ", cosmos_client.containers.keys())
        #     health_status["checks"]["database"] = {"status": "healthy", "response_time_ms": 0}
        #     health_status["checks"]["database"] = {"containers": container_names}
        # except Exception as e:
        #     health_status["checks"]["database"] = {"status": "unhealthy", "error": str(e)}
        #     health_status["status"] = "unhealthy"
        
        # Response time
        health_status["response_time_ms"] = round((time.time() - start_time) * 1000, 2)
        
        if health_status["status"] == "unhealthy":
            return JSONResponse(content=health_status, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        return health_status

    @app.get("/")
    async def root():
        """Root endpoint"""
        return {"message": "AI Agent Workflows API", "version": settings.VERSION}

    return app


setup_logger()

app: FastAPI = initialize_api_application()

if __name__ == "__main__":
    uvicorn.run("main:app", 
                reload=settings.DEBUG,
                host=settings.API_SERVER_HOST,
                port=settings.API_SERVER_PORT,
                workers=settings.API_SERVER_WORKERS,
                use_colors=True,
                log_config=None)  # Disable uvicorn's default logging config