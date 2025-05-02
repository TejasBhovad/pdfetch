from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    description: str = None

@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI"}
