from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, distinct
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.server import Server, AuditLog
from app.schemas.schemas import ServerCreate, ServerUpdate, ServerOut

router = APIRouter()

def log_action(db, user_id, action, resource_id, detail=None):
    db.add(AuditLog(user_id=user_id, action=action, resource="server", resource_id=resource_id, detail=detail or {}))

@router.get("/", response_model=dict)
def list_servers(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    search: Optional[str] = None,
    os_name: Optional[str] = None,
    os_version: Optional[str] = None,
    status: Optional[str] = None,
    environment: Optional[str] = None,
    platform: Optional[str] = None,
    location: Optional[str] = None,
    owner_team: Optional[str] = None,
    criticality: Optional[str] = None,
    subscription: Optional[str] = None,
    crowdstrike: Optional[str] = None,
    onboarded_defender: Optional[str] = None,
    customer_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Server)
    if search:
        q = q.filter(or_(
            Server.hostname.ilike(f"%{search}%"),
            Server.name.ilike(f"%{search}%"),
            Server.private_ip.ilike(f"%{search}%"),
            Server.business_app.ilike(f"%{search}%"),
            Server.owner.ilike(f"%{search}%"),
            Server.owner_team.ilike(f"%{search}%"),
            Server.subscription.ilike(f"%{search}%"),
            Server.customer_name.ilike(f"%{search}%"),
        ))
    if os_name:            q = q.filter(Server.os_name.ilike(f"%{os_name}%"))
    if os_version:         q = q.filter(Server.os_version.ilike(f"%{os_version}%"))
    if status:             q = q.filter(Server.status.ilike(f"%{status}%"))
    if environment:        q = q.filter(Server.environment.ilike(f"%{environment}%"))
    if platform:           q = q.filter(Server.platform.ilike(f"%{platform}%"))
    if location:           q = q.filter(Server.location.ilike(f"%{location}%"))
    if owner_team:         q = q.filter(Server.owner_team.ilike(f"%{owner_team}%"))
    if criticality:        q = q.filter(Server.criticality.ilike(f"%{criticality}%"))
    if subscription:       q = q.filter(Server.subscription.ilike(f"%{subscription}%"))
    if crowdstrike:        q = q.filter(Server.crowdstrike.ilike(f"%{crowdstrike}%"))
    if onboarded_defender: q = q.filter(Server.onboarded_defender.ilike(f"%{onboarded_defender}%"))
    if customer_name:      q = q.filter(Server.customer_name.ilike(f"%{customer_name}%"))

    total = q.count()
    items = q.order_by(Server.sl, Server.id).offset((page-1)*page_size).limit(page_size).all()
    return {"total": total, "page": page, "page_size": page_size, "items": [ServerOut.model_validate(s) for s in items]}

@router.get("/meta/filters")
def get_filter_options(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    def vals(col): return sorted([r[0] for r in db.query(distinct(col)).filter(col != None, col != "").all()])
    return {
        "os_names":         vals(Server.os_name),
        "os_versions":      vals(Server.os_version),
        "environments":     vals(Server.environment),
        "platforms":        vals(Server.platform),
        "locations":        vals(Server.location),
        "owner_teams":      vals(Server.owner_team),
        "criticalities":    vals(Server.criticality),
        "subscriptions":    vals(Server.subscription),
        "statuses":         vals(Server.status),
        "crowdstrike_vals": vals(Server.crowdstrike),
        "defender_vals":    vals(Server.onboarded_defender),
        "customer_names":   vals(Server.customer_name),
    }

@router.get("/{server_id}", response_model=ServerOut)
def get_server(server_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    s = db.query(Server).filter(Server.id == server_id).first()
    if not s: raise HTTPException(status_code=404, detail="Server not found")
    return s

@router.post("/", response_model=ServerOut)
def create_server(data: ServerCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin","editor"))):
    s = Server(**data.model_dump(), created_by=current_user.id)
    db.add(s); db.commit(); db.refresh(s)
    log_action(db, current_user.id, "create", s.id, {"hostname": s.hostname})
    db.commit()
    return s

@router.put("/{server_id}", response_model=ServerOut)
def update_server(server_id: int, data: ServerUpdate, db: Session = Depends(get_db), current_user=Depends(require_role("admin","editor"))):
    s = db.query(Server).filter(Server.id == server_id).first()
    if not s: raise HTTPException(status_code=404, detail="Server not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    s.updated_by = current_user.id
    db.commit(); db.refresh(s)
    log_action(db, current_user.id, "update", s.id, {"hostname": s.hostname})
    db.commit()
    return s

@router.delete("/{server_id}")
def delete_server(server_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    s = db.query(Server).filter(Server.id == server_id).first()
    if not s: raise HTTPException(status_code=404, detail="Server not found")
    log_action(db, current_user.id, "delete", s.id, {"hostname": s.hostname})
    db.delete(s); db.commit()
    return {"detail": "Deleted"}

@router.delete("/bulk/delete")
def bulk_delete(ids: list[int], db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    deleted = 0
    for sid in ids:
        s = db.query(Server).filter(Server.id == sid).first()
        if s:
            log_action(db, current_user.id, "delete", s.id, {"hostname": s.hostname})
            db.delete(s)
            deleted += 1
    db.commit()
    return {"deleted": deleted}
