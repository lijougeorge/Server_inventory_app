from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import engine, Base
from app.api import auth, servers, users, custom_fields, export, dashboard, import_servers

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    from app.core.seed import seed_admin
    seed_admin()
    yield

app = FastAPI(
    title="Server Inventory API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/auth",          tags=["auth"])
app.include_router(servers.router,      prefix="/servers",       tags=["servers"])
app.include_router(users.router,        prefix="/users",         tags=["users"])
app.include_router(custom_fields.router,prefix="/custom-fields", tags=["custom-fields"])
app.include_router(export.router,       prefix="/export",        tags=["export"])
app.include_router(dashboard.router,    prefix="/dashboard",     tags=["dashboard"])
app.include_router(import_servers.router, prefix="/import",       tags=["import"])

@app.get("/health")
def health():
    return {"status": "ok"}
