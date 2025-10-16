# 🚢 Deployment Guide

Complete guide for deploying GitHub Uploader to various platforms.

## 📋 Table of Contents

- [Docker Deployment](#docker-deployment)
- [Coolify Deployment](#coolify-deployment)
- [Manual Server Deployment](#manual-server-deployment)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

## 🐳 Docker Deployment

### Build the Image

```bash
# Clone repository
git clone <your-repo-url>
cd git-uploader

# Build Docker image
docker build -t github-uploader .
```

### Run with Docker

```bash
# Using .env file
docker run -d \
  --name github-uploader \
  -p 3000:3000 \
  --env-file .env \
  github-uploader

# Using environment variables directly
docker run -d \
  --name github-uploader \
  -p 3000:3000 \
  -e GITHUB_TOKEN=ghp_your_token \
  -e USERNAME=your-username \
  -e REPO_NAME=my-repo \
  -e PORT=3000 \
  github-uploader
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  github-uploader:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run with:

```bash
docker-compose up -d
```

### Verify Deployment

```bash
# Check container status
docker ps

# View logs
docker logs github-uploader

# Test health endpoint
curl http://localhost:3000/health
```

## ☁️ Coolify Deployment

### Method 1: Automatic Detection (Recommended)

1. **Connect Repository**
   - Go to Coolify dashboard
   - Click "New Resource" → "Application"
   - Connect your GitHub/GitLab repository
   - Select `git-uploader` directory

2. **Configure Build**
   - Coolify auto-detects Dockerfile
   - Or uses Nixpacks if no Dockerfile
   - Build type: Dockerfile or Nixpacks

3. **Set Environment Variables**
   ```
   GITHUB_TOKEN=ghp_your_token_here
   USERNAME=your-username
   REPO_NAME=my-repo
   BRANCH=main
   PORT=3000
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Access via provided URL

### Method 2: Using coolify.yaml

The included `coolify.yaml` provides configuration:

```yaml
apiVersion: v1
name: github-uploader
type: docker

services:
  - name: github-uploader
    ports:
      - "3000:3000"
    healthcheck:
      path: /health
      port: 3000
```

Coolify will automatically use this configuration.

### Method 3: Nixpacks Build

If you prefer Nixpacks over Docker:

1. Coolify detects `package.json`
2. Automatically installs dependencies
3. Runs `npm start`
4. No Dockerfile needed

Configure in Coolify:
- **Build Command**: `npm ci`
- **Start Command**: `npm start`
- **Port**: 3000

### Post-Deployment

1. **Verify Health**
   ```bash
   curl https://your-app.coolify.io/health
   ```

2. **Check Logs**
   - View in Coolify dashboard
   - Real-time log streaming

3. **Configure Domain**
   - Add custom domain in Coolify
   - SSL auto-configured

## 🖥️ Manual Server Deployment

### Ubuntu/Debian Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Clone repository
git clone <your-repo-url>
cd git-uploader

# Install dependencies
npm ci --only=production

# Create .env file
cp .env.example .env
nano .env  # Edit with your credentials

# Test run
npm start
```

### Process Manager (PM2)

```bash
# Install PM2
sudo npm install -g pm2

# Start application
pm2 start server.js --name github-uploader

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# Monitor
pm2 status
pm2 logs github-uploader
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/github-uploader
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/github-uploader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl status certbot.timer
```

## 🔧 Environment Configuration

### Required Variables

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx  # GitHub Personal Access Token
USERNAME=your-username           # GitHub username
REPO_NAME=default-repo          # Default repository
BRANCH=main                     # Default branch
```

### Optional Variables

```env
PORT=3000                       # Server port
NODE_ENV=production             # Environment
AUTO_CREATE_REPO=true          # Auto-create repos
REPO_VISIBILITY=private        # Default visibility
```

### GitHub Token Scopes

Required scopes for PAT:
- `repo` - Full control of private repositories
- `public_repo` - Access public repositories (if only using public)

Create token at: https://github.com/settings/tokens

### Security Best Practices

1. **Never commit .env file**
   ```bash
   # Verify .gitignore includes .env
   cat .gitignore | grep .env
   ```

2. **Use environment-specific tokens**
   - Development: Limited scope token
   - Production: Full scope token

3. **Rotate tokens regularly**
   - Update in deployment platform
   - Test before removing old token

4. **Use secrets management**
   - Docker secrets
   - Coolify environment variables
   - Cloud provider secrets (AWS Secrets Manager, etc.)

## 🔍 Health Checks

### Endpoint

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Docker Health Check

Built into Dockerfile:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', ...)"
```

### Monitoring

```bash
# Manual check
curl http://localhost:3000/health

# Watch status
watch -n 5 'curl -s http://localhost:3000/health | jq'

# PM2 monitoring
pm2 monit
```

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs github-uploader

# Common issues:
# 1. Port already in use
docker ps -a | grep 3000
lsof -i :3000

# 2. Permission issues
docker run --user node ...

# 3. Environment variables missing
docker exec github-uploader env | grep GITHUB_TOKEN
```

### Build Failures

```bash
# Clean build
docker build --no-cache -t github-uploader .

# Check Dockerfile syntax
docker build --progress=plain -t github-uploader .

# Verify base image
docker pull node:18-alpine
```

### Coolify Issues

1. **Build Timeout**
   - Increase timeout in Coolify settings
   - Check build logs for hanging processes

2. **Environment Variables Not Set**
   - Verify in Coolify dashboard
   - Check spelling and values
   - Restart application after changes

3. **Port Conflicts**
   - Coolify auto-assigns ports
   - Check exposed port matches PORT env var

### Network Issues

```bash
# Test GitHub API connectivity
curl -H "Authorization: Bearer ghp_your_token" \
  https://api.github.com/user

# DNS resolution
nslookup api.github.com

# Firewall check
sudo ufw status
```

### Performance Optimization

```bash
# Monitor resource usage
docker stats github-uploader

# Limit resources
docker run -d \
  --cpus="0.5" \
  --memory="256m" \
  github-uploader

# PM2 cluster mode
pm2 start server.js -i max --name github-uploader
```

## 📊 Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  github-uploader:
    build: .
    deploy:
      replicas: 3
    ports:
      - "3000-3002:3000"
```

### Load Balancer

```nginx
upstream github_uploader {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location / {
        proxy_pass http://github_uploader;
    }
}
```

### Database Considerations

Current app is stateless - uses:
- GitHub API for storage
- localStorage for client config
- Temporary uploads folder

Perfect for horizontal scaling!

## 🔄 Updates & Maintenance

### Update Application

```bash
# Docker
docker pull github-uploader:latest
docker stop github-uploader
docker rm github-uploader
docker run -d --name github-uploader ...

# Manual
cd git-uploader
git pull
npm ci --only=production
pm2 restart github-uploader
```

### Backup

```bash
# Backup configuration
cp .env .env.backup

# Export PM2 config
pm2 save

# Backup uploads (if needed)
tar -czf uploads-backup.tar.gz uploads/
```

### Monitoring

```bash
# Disk usage
du -sh uploads/

# Clean old uploads
find uploads/ -type f -mtime +7 -delete

# Log rotation
pm2 install pm2-logrotate
```

## 📈 Production Checklist

- [ ] Environment variables configured
- [ ] GitHub token with correct scopes
- [ ] Health check endpoint working
- [ ] SSL certificate installed
- [ ] Firewall rules configured
- [ ] Process manager (PM2) running
- [ ] Logs being collected
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Domain configured
- [ ] Error tracking enabled

## 🎯 Quick Commands Reference

```bash
# Docker
docker build -t github-uploader .
docker run -p 3000:3000 --env-file .env github-uploader
docker logs -f github-uploader
docker exec -it github-uploader sh

# PM2
pm2 start server.js --name github-uploader
pm2 logs github-uploader
pm2 restart github-uploader
pm2 stop github-uploader

# Coolify
# Use web dashboard - fully managed

# Health Check
curl http://localhost:3000/health
```

---

Need help? Check the main [README.md](../README.md) or open an issue!
