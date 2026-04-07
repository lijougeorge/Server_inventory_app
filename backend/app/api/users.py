from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role, get_current_user, hash_password
from app.models.user import User
from app.schemas.schemas import UserCreate, UserUpdate, UserOut

router = APIRouter()

@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    return db.query(User).all()

@router.post("/", response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update = data.model_dump(exclude_unset=True)
    if "password" in update:
        update["hashed_password"] = hash_password(update.pop("password"))
    for k, v in update.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "Deleted"}

@router.get("/me", response_model=UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user
