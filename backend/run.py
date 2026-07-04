import uvicorn
from app.db.migrations import upgrade_database

if __name__ == "__main__":
    upgrade_database()
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
