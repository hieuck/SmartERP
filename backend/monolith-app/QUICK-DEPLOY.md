# ⚡ Quick Deploy Reference

**One-page reference for deployment commands**

---

## 🚀 Quick Start

```bash
# Full automated deployment (recommended)
./scripts/deploy-production.sh
```

---

## 📋 Individual Commands

### Pre-Deployment
```bash
# Validate before deployment
./scripts/pre-deploy.sh
```

### Deployment
```bash
# Full automated deployment
./scripts/deploy-production.sh

# Or manual steps:
npm install
npm run build
npm run migration:run
pm2 start dist/main.js --name smart-erp
```

### Post-Deployment
```bash
# Validate after deployment
./scripts/post-deploy.sh

# Check health
./scripts/health-check.sh
```

---

## 🔧 Common Tasks

### Check Status
```bash
# PM2
pm2 status
pm2 logs smart-erp

# Docker
docker-compose ps
docker-compose logs backend

# systemd
sudo systemctl status smart-erp
sudo journalctl -u smart-erp -f
```

### Restart Application
```bash
# PM2
pm2 restart smart-erp

# Docker
docker-compose restart backend

# systemd
sudo systemctl restart smart-erp
```

### View Logs
```bash
# PM2
pm2 logs smart-erp --lines 100

# Docker
docker-compose logs -f backend

# systemd
sudo journalctl -u smart-erp -f
```

---

## 🗄️ Database

### Run Migrations
```bash
npm run migration:run
```

### Revert Migration
```bash
npm run migration:revert
```

### Backup Database
```bash
./scripts/backup.sh /path/to/backup.sql
```

### Restore Database
```bash
./scripts/restore.sh /path/to/backup.sql
```

---

## 🔄 Rollback

### Quick Rollback
```bash
# PM2
pm2 stop smart-erp
pm2 start <previous-version>

# Docker
docker-compose down
docker-compose up -d <previous-version>

# Database
npm run migration:revert
```

---

## 🏥 Health Check

### Manual Check
```bash
curl http://localhost:3000/health
```

### Automated Check
```bash
./scripts/health-check.sh
```

### Cron Job
```bash
# Add to crontab
*/5 * * * * /path/to/health-check.sh || alert-team
```

---

## 🔐 Environment

### Setup Environment
```bash
cp .env.production.example .env.production
nano .env.production
```

### Required Variables
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PASSWORD=<secure-password>
JWT_SECRET=<secure-secret>
```

---

## 📊 Monitoring

### Check Response Time
```bash
time curl http://localhost:3000/health
```

### Check Memory Usage
```bash
pm2 monit
```

### Check Database Connections
```bash
psql -c "SELECT * FROM pg_stat_activity;"
```

---

## 🆘 Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs smart-erp --lines 100

# Check port
netstat -tulpn | grep 3000

# Check database
psql -h localhost -U postgres
```

### Slow Performance
```bash
# Check CPU/Memory
top

# Check database
psql -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### Database Connection Issues
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d smart_erp_prod
```

---

## 📞 Support

- **Documentation:** `DEPLOYMENT.md`, `DEPLOYMENT-AUTOMATION.md`
- **Technical:** tech@smarterp.com
- **Emergency:** +84-xxx-xxx-xxx

---

**Last Updated:** 2026-02-27
