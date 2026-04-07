from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Server(Base):
    __tablename__ = "servers"

    id                      = Column(Integer, primary_key=True, index=True)
    sl                      = Column(Integer)
    name                    = Column(String, index=True)
    private_ip              = Column(String)
    business_app            = Column(String)
    hostname                = Column(String, nullable=False, index=True)
    os_name                 = Column(String)
    os_version              = Column(String)
    server_type             = Column(String)
    environment             = Column(String)
    platform                = Column(String)
    ops_manager             = Column(String)
    azure_update_schedule   = Column(String)
    onboarded_defender      = Column(String)
    onboarded_pam           = Column(String)
    ipa_integration         = Column(String)
    msb_compliance          = Column(String)
    subscription            = Column(String)
    location                = Column(String)
    resource_group          = Column(String)
    owner                   = Column(String)
    owner_team              = Column(String)
    criticality             = Column(String)
    support_suma            = Column(String)
    support_dcentral        = Column(String)
    dcentral                = Column(String)
    crowdstrike             = Column(String)
    status                  = Column(String, default="Active")
    notes                   = Column(Text)
    custom_data             = Column(JSON, default={})
    created_by              = Column(Integer, ForeignKey("users.id"))
    updated_by              = Column(Integer, ForeignKey("users.id"))
    created_at              = Column(DateTime(timezone=True), server_default=func.now())
    updated_at              = Column(DateTime(timezone=True), onupdate=func.now())


class CustomField(Base):
    __tablename__ = "custom_fields"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, unique=True, nullable=False)
    label       = Column(String, nullable=False)
    field_type  = Column(String, default="text")
    options     = Column(JSON, default=[])
    required    = Column(String, default=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    action      = Column(String)
    resource    = Column(String)
    resource_id = Column(Integer)
    detail      = Column(JSON)
    timestamp   = Column(DateTime(timezone=True), server_default=func.now())
