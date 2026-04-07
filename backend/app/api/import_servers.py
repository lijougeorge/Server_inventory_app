from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import io
from app.core.database import get_db
from app.core.security import require_role
from app.models.server import Server, CustomField

router = APIRouter()

# Maps Excel column headers → model field names
COL_MAP = {
    "sl":                           "sl",
    "name":                         "name",
    "private ip address":           "private_ip",
    "private ip":                   "private_ip",
    "business app / system":        "business_app",
    "business app":                 "business_app",
    "hostname set":                 "hostname",
    "hostname":                     "hostname",
    "os":                           "os_name",
    "version":                      "os_version",
    "type":                         "server_type",
    "env":                          "environment",
    "environment":                  "environment",
    "platform":                     "platform",
    "opsmanager":                   "ops_manager",
    "azure updatemanager schedule":  "azure_update_schedule",
    "azure update manager schedule": "azure_update_schedule",
    "onboarded to defender":        "onboarded_defender",
    "onboarded defender":           "onboarded_defender",
    "onboarded pam":                "onboarded_pam",
    "ipa integration":              "ipa_integration",
    "msb complaingce":              "msb_compliance",
    "msb compliance":               "msb_compliance",
    "subscription":                 "subscription",
    "location":                     "location",
    "resource group":               "resource_group",
    "owner":                        "owner",
    "owner team":                   "owner_team",
    "criticality":                  "criticality",
    "support suma":                 "support_suma",
    "support dcentral":             "support_dcentral",
    "dcentral":                     "dcentral",
    "crowdstrike":                  "crowdstrike",
    "status":                       "status",
    "notes":                        "notes",
}

TEMPLATE_HEADERS = [
    "SL", "NAME", "PRIVATE IP ADDRESS", "BUSINESS APP / SYSTEM", "Hostname set",
    "OS", "Version", "TYPE", "ENV", "PLATFORM", "OpsManager",
    "Azure UpdateManager Schedule", "Onboarded to Defender", "Onboarded PAM",
    "IPA Integration", "MSB compliance", "SUBSCRIPTION", "LOCATION",
    "RESOURCE GROUP", "OWNER", "Owner Team", "CRITICALITY",
    "Support SUMA", "Support DCentral", "DCENTRAL", "CROWDSTRIKE", "Status", "Notes"
]

SAMPLE_ROWS = [
    [1, "ecs-ipar-s201", "10.201.10.200", "FreeIPA", "ecs-ipar-s201", "RHEL", "8.10",
     "App Server", "Prod", "B Cloud", "ecs-ipar-s201", "", "Yes", "FALSE",
     "To Be Decommissioned", "", "ae-ad-1", "", "", "Mohammed Zubair", "",
     "Critical", "Yes", "Yes", "No", "Installed", "Active", ""],
    [2, "ecs-ipas-s201", "10.201.10.100", "FreeIPA", "ecs-ipas-s201", "RHEL", "8.10",
     "App Server", "Prod", "B Cloud", "ecs-ipas-s201", "", "Yes", "FALSE",
     "To Be Decommissioned", "", "ae-ad-1", "", "", "Mohammed Zubair", "",
     "Critical", "Yes", "Yes", "No", "Installed", "Active", ""],
]

@router.get("/template")
def download_template(db: Session = Depends(get_db), current_user=Depends(require_role("admin", "editor"))):
    import openpyxl
    from openpyxl.styles import PatternFill, Font, Alignment
    from openpyxl.utils import get_column_letter

    custom_fields = db.query(CustomField).all()
    all_headers = TEMPLATE_HEADERS + [cf.label for cf in custom_fields]

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Server Import"

    hdr_fill    = PatternFill("solid", fgColor="1E3A5F")
    req_fill    = PatternFill("solid", fgColor="0F5499")
    sample_fill = PatternFill("solid", fgColor="141C2E")
    required    = {"SL", "Hostname set", "OS", "Version"}

    for ci, h in enumerate(all_headers, 1):
        cell = ws.cell(row=1, column=ci, value=h)
        cell.fill = req_fill if h in required else hdr_fill
        cell.font = Font(bold=True, color="FFFFFF", size=10)
        cell.alignment = Alignment(horizontal="center", wrap_text=True)
        ws.column_dimensions[get_column_letter(ci)].width = max(len(h) + 3, 14)
    ws.row_dimensions[1].height = 32

    for ri, row in enumerate(SAMPLE_ROWS, 2):
        extended = list(row) + [""] * len(custom_fields)
        for ci, val in enumerate(extended, 1):
            cell = ws.cell(row=ri, column=ci, value=val)
            cell.fill = sample_fill
            cell.font = Font(color="6B7FA3", size=10)

    ws.freeze_panes = "A2"

    # Instructions sheet
    ws2 = wb.create_sheet("Instructions")
    lines = [
        ("Server Inventory — Bulk Import Template", True),
        ("", False),
        ("HOW TO USE:", True),
        ("1. Fill your server data starting from row 2 (delete sample rows first)", False),
        ("2. Required columns: SL, Hostname set, OS, Version", False),
        ("3. Save as .xlsx or .csv", False),
        ("4. Upload via the Import button on the Servers page", False),
        ("", False),
        ("COLUMN GUIDE:", True),
        ("SL              — Serial number (integer)", False),
        ("NAME            — Server display name", False),
        ("PRIVATE IP ADDRESS — Internal IP e.g. 10.0.1.100", False),
        ("BUSINESS APP / SYSTEM — Application or system this server hosts", False),
        ("Hostname set    — Actual configured hostname (REQUIRED)", False),
        ("OS              — OS name: RHEL, Ubuntu, Windows Server… (REQUIRED)", False),
        ("Version         — OS version e.g. 8.10, 22.04, 2022 (REQUIRED)", False),
        ("TYPE            — Server type: App Server, DB Server, Web Server…", False),
        ("ENV             — Environment: Prod, Dev, Staging, DR…", False),
        ("PLATFORM        — B Cloud, On-Prem, Azure, AWS, GCP…", False),
        ("OpsManager      — Ops Manager hostname", False),
        ("Azure UpdateManager Schedule — Patch schedule name", False),
        ("Onboarded to Defender — Yes / No", False),
        ("Onboarded PAM   — Yes / No / FALSE", False),
        ("IPA Integration — Yes / No / To Be Decommissioned", False),
        ("MSB compliance  — Compliance status", False),
        ("SUBSCRIPTION    — Azure subscription or account name", False),
        ("LOCATION        — Region/datacenter e.g. ae-ad-1", False),
        ("RESOURCE GROUP  — Azure resource group or rack/zone", False),
        ("OWNER           — Server owner name", False),
        ("Owner Team      — Team responsible", False),
        ("CRITICALITY     — Critical / High / Medium / Low", False),
        ("Support SUMA    — Yes / No", False),
        ("Support DCentral— Yes / No", False),
        ("DCENTRAL        — Yes / No", False),
        ("CROWDSTRIKE     — Installed / Not Installed", False),
        ("Status          — Active / Inactive / To Be Decommissioned", False),
        ("", False),
        ("NOTES:", True),
        ("- Duplicate hostnames are skipped automatically", False),
        ("- Rows with missing required fields are skipped", False),
        ("- Column headers are case-insensitive", False),
        ("- Extra columns beyond the template are ignored", False),
    ]
    for ri, (text, bold) in enumerate(lines, 1):
        cell = ws2.cell(row=ri, column=1, value=text)
        cell.font = Font(bold=bold, size=11 if bold else 10)
    ws2.column_dimensions["A"].width = 72

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=server_import_template.xlsx"})


@router.post("/upload")
async def import_servers(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "editor"))
):
    fname = file.filename.lower()
    if not (fname.endswith(".xlsx") or fname.endswith(".xls") or fname.endswith(".csv")):
        raise HTTPException(status_code=400, detail="Only .xlsx, .xls or .csv files are supported")

    contents = await file.read()
    try:
        if fname.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents), dtype=str).fillna("")
        else:
            df = pd.read_excel(io.BytesIO(contents), dtype=str).fillna("")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {str(e)}")

    # Normalise column names and map to model fields
    df.columns = [str(c).strip() for c in df.columns]
    rename = {}
    for col in df.columns:
        mapped = COL_MAP.get(col.lower().strip())
        if mapped:
            rename[col] = mapped
    df = df.rename(columns=rename)

    if "hostname" not in df.columns:
        raise HTTPException(status_code=400, detail="Could not find a 'Hostname set' or 'hostname' column. Please use the template.")

    custom_fields = db.query(CustomField).all()
    custom_field_names = [cf.name for cf in custom_fields]

    imported, skipped, errors = 0, 0, []

    for idx, row in df.iterrows():
        row_num = idx + 2

        def g(field, default=""):
            val = str(row.get(field, default)).strip()
            return "" if val.lower() in ("nan", "none", "") else val

        hostname = g("hostname")
        if not hostname or hostname.lower() in ("hostname set", "hostname", "example"):
            skipped += 1
            continue

        if db.query(Server).filter(Server.hostname == hostname).first():
            errors.append(f"Row {row_num}: '{hostname}' already exists — skipped")
            skipped += 1
            continue

        sl_val = None
        try:
            raw_sl = g("sl")
            if raw_sl:
                sl_val = int(float(raw_sl))
        except Exception:
            pass

        custom_data = {}
        for cf in custom_fields:
            v = g(cf.name)
            if v:
                custom_data[cf.name] = v

        server = Server(
            sl=sl_val,
            name=g("name"),
            private_ip=g("private_ip"),
            business_app=g("business_app"),
            hostname=hostname,
            os_name=g("os_name"),
            os_version=g("os_version"),
            server_type=g("server_type"),
            environment=g("environment"),
            platform=g("platform"),
            ops_manager=g("ops_manager"),
            azure_update_schedule=g("azure_update_schedule"),
            onboarded_defender=g("onboarded_defender"),
            onboarded_pam=g("onboarded_pam"),
            ipa_integration=g("ipa_integration"),
            msb_compliance=g("msb_compliance"),
            subscription=g("subscription"),
            location=g("location"),
            resource_group=g("resource_group"),
            owner=g("owner"),
            owner_team=g("owner_team"),
            criticality=g("criticality"),
            support_suma=g("support_suma"),
            support_dcentral=g("support_dcentral"),
            dcentral=g("dcentral"),
            crowdstrike=g("crowdstrike"),
            status=g("status") or "Active",
            notes=g("notes"),
            custom_data=custom_data,
            created_by=current_user.id,
        )
        db.add(server)
        imported += 1

    db.commit()
    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "message": f"Successfully imported {imported} servers. {skipped} rows skipped."
    }
