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
    by_status = dict(db.query(Server.status, func.count(Server.id)).group_by(Server.status).all())
    by_os = dict(db.query(Server.os_name, func.count(Server.id)).group_by(Server.os_name).all())
    by_env = dict(db.query(Server.environment, func.count(Server.id)).group_by(Server.environment).all())
   # by_dc = dict(db.query(Server.datacenter, func.count(Server.id)).group_by(Server.datacenter).all())
    by_customer = dict(db.query(Server.customer_name, func.count(Server.id)).group_by(Server.customer_name).all())
    recent_logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(10).all()
    user_count = db.query(func.count(User.id)).scalar()

    return {
        "total_servers": total,
        "by_status": by_status,
        "by_os": by_os,
        "by_environment": by_env,
   #     "by_datacenter": by_dc,
        "by_customer": by_customer,
        "total_users": user_count,
        "recent_activity": [
            {"action": l.action, "resource": l.resource, "resource_id": l.resource_id,
             "detail": l.detail, "timestamp": l.timestamp.isoformat() if l.timestamp else None}
            for l in recent_logs
        ]
    }
