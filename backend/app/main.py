from fastapi import FastAPI

app = FastAPI(title="BioAlign-ML Backend Engine")

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}