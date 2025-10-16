# 🚀 Quick Start Guide

Get GitHub Uploader running in 60 seconds!

## 📦 Installation

### Option 1: Local Development (Fastest)

```bash
# Navigate to project
cd git-uploader

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Add your GitHub token

# Start server
npm start
```

Visit **http://localhost:3000** 🎉

### Option 2: Docker (Recommended for Production)

```bash
# Build and run in one command
docker build -t github-uploader . && \
docker run -p 3000:3000 --env-file .env github-uploader
```

Visit **http://localhost:3000** 🎉

### Option 3: Coolify (One-Click Deploy)

1. **Connect repository** in Coolify dashboard
2. **Set environment variables**:
   ```
   GITHUB_TOKEN=ghp_your_token
   USERNAME=your-username
   REPO_NAME=default-repo
   ```
3. **Click Deploy** ✨

## 🔑 Get Your GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it "GitHub Uploader"
4. Select scope: **`repo`** (full control)
5. Generate and **copy the token**
6. Add to `.env` file:
   ```env
   GITHUB_TOKEN=ghp_your_token_here
   USERNAME=your-github-username
   REPO_NAME=my-uploads
   ```

## 🎯 First Upload

1. **Open** http://localhost:3000
2. **Configure** settings (or use .env values)
3. **Drag & drop** files or folders
4. **Click** "Upload to GitHub"
5. **Done!** Check your repository

## 📋 CLI Usage (Bonus)

```bash
# Upload a file
node cli.js upload myfile.txt --message "Add file"

# Upload entire folder
node cli.js upload ./my-folder --message "Upload folder"

# Upload to specific path
node cli.js upload ./docs --path documentation
```

## 🔧 Common Issues

### Port 3000 already in use?
```bash
# Use different port
PORT=3001 npm start
# Or in Docker
docker run -p 3001:3000 --env-file .env github-uploader
```

### Token not working?
- Check it has `repo` scope
- Verify it hasn't expired
- Try generating a new one

### Repository not found?
- Enable "Auto-create repository" in settings
- Or create repo manually on GitHub first

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- See [docs/deployment.md](docs/deployment.md) for production deployment
- Customize UI in `style.css` (OKLCH color variables)

## 🆘 Need Help?

- **Health check**: http://localhost:3000/health
- **Logs**: Check browser console or server terminal
- **Docs**: See README.md and deployment.md
- **Issues**: Open a GitHub issue

---

Happy uploading! 🚀
