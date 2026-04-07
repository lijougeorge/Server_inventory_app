from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.server import Server, AuditLog
from app.models.user import User

router = APIRouter()

@router.get("/")
def get_dashboard(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    total = db.query(func.count(Server.id)).scalar()
    by_status      = dict(db.query(Server.status,      func.count(Server.id)).group_by(Server.status).all())
    by_os          = dict(db.query(Server.os_name,     func.count(Server.id)).group_by(Server.os_name).all())
    by_env         = dict(db.query(Server.environment, func.count(Server.id)).group_by(Server.environment).all())
    by_platform    = dict(db.query(Server.platform,    func.count(Server.id)).group_by(Server.platform).all())
    by_criticality = dict(db.query(Server.criticality, func.count(Server.id)).group_by(Server.criticality).all())
    by_crowdstrike = dict(db.query(Server.crowdstrike,  func.count(Server.id)).group_by(Server.crowdstrike).all())
    recent_logs    = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(10).all()
    user_count     = db.query(func.count(User.id)).scalar()

    return {
        "total_servers":   total,
        "by_status":       by_status,
        "by_os":           by_os,
        "by_environment":  by_env,
        "by_platform":     by_platform,
        "by_criticality":  by_criticality,
        "by_crowdstrike":  by_crowdstrike,
        "total_users":     user_count,
        "recent_activity": [
            {"action": l.action, "resource": l.resource, "resource_id": l.resource_id,
             "detail": l.detail, "timestamp": l.timestamp.isoformat() if l.timestamp else None}
            for l in recent_logs
        ]
    }
