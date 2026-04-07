from app.core.database import SessionLocal
from app.core.security import hash_password

def seed_admin():
    db = SessionLocal()
    try:
        from app.models.user import User
        existing = db.query(User).filter(User.username == "admin").first()
        if not existing:
            admin = User(
                username="admin",
                email="admin@company.com",
                full_name="System Administrator",
                hashed_password=hash_password("Admin@1234"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("✅ Default admin created: admin / Admin@1234 — CHANGE THIS PASSWORD!")
    finally:
        db.close()
