# ServerHub — Server Inventory Management System

A full-stack web application to manage your server inventory with role-based access, advanced filtering, and CSV / Excel / PDF export.

---

## What's included

| Layer       | Technology          | Purpose                                    |
|-------------|---------------------|--------------------------------------------|
| Frontend    | React + Vite        | Web UI — served via browser                |
| Backend     | Python FastAPI      | REST API — business logic & auth           |
| Database    | PostgreSQL 15       | Persistent data storage                    |
| Proxy       | Nginx               | HTTPS termination, routing                 |
| Deployment  | Docker Compose      | One-command setup on any Linux server      |

---

## User roles

| Role    | Can view | Can add/edit servers | Can delete | Can manage users | Can manage custom fields |
|---------|----------|----------------------|------------|------------------|--------------------------|
| viewer  | ✅       | ❌                   | ❌         | ❌               | ❌                       |
| editor  | ✅       | ✅                   | ❌         | ❌               | ❌                       |
| admin   | ✅       | ✅                   | ✅         | ✅               | ✅                       |

---

## Prerequisites

Install these on your server (Ubuntu/Debian shown):

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose (included with Docker Desktop, or install plugin)
sudo apt-get install docker-compose-plugin

# Verify
docker --version
docker compose version
```

---

## Deployment — step by step

### Step 1: Upload / clone the project

```bash
# On your server, create a directory
mkdir -p /opt/server-inventory
cd /opt/server-inventory

# Copy all project files here (scp, git clone, or file manager)
```

### Step 2: Set your secrets

```bash
cp .env.example .env
nano .env
```

Edit `.env` and set:
- `DB_PASSWORD` — a strong password for PostgreSQL
- `SECRET_KEY` — a long random string for JWT signing

Generate a secret key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Step 3: Build and start

```bash
cd /opt/server-inventory
docker compose up -d --build
```

This will:
1. Build the React frontend (compiles to static files)
2. Build the FastAPI backend
3. Start PostgreSQL, create tables, seed the admin user
4. Start Nginx on port 80

First build takes ~3–5 minutes. Subsequent starts take ~10 seconds.

### Step 4: Open the app

Open your browser and go to:
```
http://YOUR_SERVER_IP
```

**Default login:**
```
Username: admin
Password: Admin@1234
```

**Change the admin password immediately** after first login via Users → Edit.

---

## Useful commands

```bash
# View running containers
docker compose ps

# View live logs
docker compose logs -f

# View only backend logs
docker compose logs -f backend

# Restart all services
docker compose restart

# Stop everything
docker compose down

# Stop and delete all data (destructive!)
docker compose down -v

# Update after code changes
docker compose up -d --build
```

---

## Backup the database

```bash
# Create a backup
docker exec inventory-db pg_dump -U inventory_user server_inventory > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i inventory-db psql -U inventory_user server_inventory < backup_20240101.sql
```

Schedule automated daily backups with cron:
```bash
crontab -e
# Add this line (runs at 2am daily):
0 2 * * * docker exec inventory-db pg_dump -U inventory_user server_inventory > /opt/backups/inventory_$(date +\%Y\%m\%d).sql
```

---

## Setting up HTTPS (optional but recommended)

Install Certbot and get a free SSL certificate:

```bash
# Install certbot
sudo apt install certbot

# Get certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com

# Copy certs to the project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/certs/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/certs/key.pem

# Update docker/nginx.conf to add SSL (see SSL section below)
```

Add to `docker/nginx.conf` inside the server block:
```nginx
listen 443 ssl;
ssl_certificate /etc/nginx/certs/cert.pem;
ssl_certificate_key /etc/nginx/certs/key.pem;
```

Then restart:
```bash
docker compose restart nginx
```

---

## Minimum server requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU      | 2 vCPU  | 4 vCPU      |
| RAM      | 2 GB    | 4 GB        |
| Disk     | 20 GB   | 50 GB       |
| OS       | Ubuntu 20.04+ / RHEL 8+ / Any Linux with Docker |

---

## Project file structure

```
server-inventory/
├── docker-compose.yml          ← Orchestrates all containers
├── .env.example                ← Copy to .env and edit
├── docker/
│   └── nginx.conf              ← Reverse proxy config
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             ← FastAPI entry point
│       ├── api/
│       │   ├── auth.py         ← Login endpoint
│       │   ├── servers.py      ← CRUD + filtering
│       │   ├── users.py        ← User management
│       │   ├── custom_fields.py← Dynamic fields
│       │   ├── export.py       ← CSV, Excel, PDF
│       │   └── dashboard.py    ← Stats
│       ├── models/
│       │   ├── user.py         ← User DB model
│       │   └── server.py       ← Server, CustomField, AuditLog models
│       ├── schemas/
│       │   └── schemas.py      ← Pydantic validation
│       └── core/
│           ├── config.py       ← Settings
│           ├── database.py     ← DB session
│           ├── security.py     ← JWT auth
│           └── seed.py         ← Default admin
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx             ← Routes
        ├── index.css           ← Global styles
        ├── main.jsx
        ├── hooks/
        │   └── useAuth.jsx     ← Auth context
        ├── utils/
        │   └── api.js          ← Axios client
        ├── components/
        │   ├── layout/
        │   │   └── Layout.jsx  ← Sidebar + nav
        │   └── servers/
        │       └── ServerForm.jsx ← Add/edit modal
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx
            ├── ServersPage.jsx
            ├── ReportsPage.jsx
            ├── UsersPage.jsx
            └── CustomFieldsPage.jsx
```

---

## API documentation

Once the app is running, visit:
```
http://YOUR_SERVER_IP/api/docs
```

FastAPI automatically generates interactive API documentation where you can test all endpoints directly in your browser.

---

## Troubleshooting

**App won't start:**
```bash
docker compose logs backend
docker compose logs postgres
```

**Database connection error:**
- Check `.env` has the correct `DB_PASSWORD`
- Wait 10–15 seconds after first start for Postgres to initialise

**Can't login:**
- Default credentials: `admin` / `Admin@1234`
- Check backend logs: `docker compose logs backend`

**Port 80 already in use:**
- Edit `docker-compose.yml`, change `"80:80"` to `"8080:80"` and access via port 8080
