from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role: str = "viewer"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class ServerCreate(BaseModel):
    sl: Optional[int] = None
    customer_name: Optional[str] = None
    name: Optional[str] = None
    private_ip: Optional[str] = None
    business_app: Optional[str] = None
    hostname: str
    os_name: Optional[str] = None
    os_version: Optional[str] = None
    server_type: Optional[str] = None
    environment: Optional[str] = None
    platform: Optional[str] = None
    ops_manager: Optional[str] = None
    azure_update_schedule: Optional[str] = None
    onboarded_defender: Optional[str] = None
    onboarded_pam: Optional[str] = None
    ipa_integration: Optional[str] = None
    msb_compliance: Optional[str] = None
    subscription: Optional[str] = None
    location: Optional[str] = None
    resource_group: Optional[str] = None
    owner: Optional[str] = None
    owner_team: Optional[str] = None
    criticality: Optional[str] = None
    support_suma: Optional[str] = None
    support_dcentral: Optional[str] = None
    dcentral: Optional[str] = None
    crowdstrike: Optional[str] = None
    status: Optional[str] = "Active"
    notes: Optional[str] = None
    custom_data: Optional[dict] = {}

class ServerUpdate(ServerCreate):
    hostname: Optional[str] = None

class ServerOut(ServerCreate):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    class Config:
        from_attributes = True

class CustomFieldCreate(BaseModel):
    name: str
    label: str
    field_type: str = "text"
    options: list = []
    required: bool = False

class CustomFieldOut(CustomFieldCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
