from fastapi import FastAPI

app = FastAPI(
    title="CropVisionAI API",
    description="XAI-Driven Crop Damage Assessment Backend",
    version="1.0"
)

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