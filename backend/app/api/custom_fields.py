from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role, get_current_user
from app.models.server import CustomField
from app.schemas.schemas import CustomFieldCreate, CustomFieldOut

router = APIRouter()

@router.get("/", response_model=list[CustomFieldOut])
def list_fields(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(CustomField).all()

@router.post("/", response_model=CustomFieldOut)
def create_field(data: CustomFieldCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    if db.query(CustomField).filter(CustomField.name == data.name).first():
        raise HTTPException(status_code=400, detail="Field name already exists")
    field = CustomField(**data.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)
    return field

@router.delete("/{field_id}")
def delete_field(field_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    field = db.query(CustomField).filter(CustomField.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    db.delete(field)
    db.commit()
    return {"detail": "Deleted"}
