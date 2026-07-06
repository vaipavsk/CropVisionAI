from fastapi import FastAPI
from sqlalchemy import text

from app.config.database import engine
from app.routes.upload import router as upload_router

app = FastAPI(
    title="CropVisionAI API",
    description="XAI-Driven Crop Damage Assessment Backend",
    version="1.0"
)

app.include_router(upload_router)

@app.get("/")
def root():
    return {
        "message": "Welcome to CropVisionAI Backend"
    }

@app.get("/health")
def health():
    return {
        "status": "Backend Running",
        "project": "CropVisionAI",
        "version": "1.0"
    }

@app.get("/db-test")
def db_test():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "database": "Connected Successfully"
        }
    except Exception as exc:
        return {
            "database": "Connection Failed",
            "error": str(exc)
        }