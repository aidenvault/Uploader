# 🚀 GitHub Uploader

A lightweight, production-ready tool for uploading files and folders directly to GitHub repositories with automatic repository creation and full Coolify deployment compatibility.

## ✨ Features

- **📁 Drag & Drop Interface** - Intuitive file and folder uploads
- **🔄 Auto Repository Creation** - Automatically creates repos if they don't exist
- **🔐 Secure Authentication** - GitHub Personal Access Token (PAT) support
- **📊 Real-time Progress** - Live upload status and detailed logs
- **🎨 Modern UI** - OKLCH monochrome theme with Inter & JetBrains Mono fonts
- **🐳 Docker Ready** - Lightweight Alpine-based container
- **☁️ Coolify Compatible** - One-click deployment support
- **⚡ Minimal Dependencies** - Fast and efficient

## 🎯 Quick Start

### Prerequisites

- Node.js 18+ (for local development)
- Docker (for containerized deployment)
- GitHub Personal Access Token ([Create one here](https://github.com/settings/tokens))

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd git-uploader

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your GitHub credentials
nano .env

# Start the server
npm start
```

Visit `http://localhost:3000` to start uploading!

### Using the Application

1. **Configure Settings**
   - Enter your GitHub Personal Access Token
   - Provide your GitHub username
   - Specify the repository name
   - Choose branch (default: main)
   - Select public or private visibility
   - Enable auto-create if needed

2. **Upload Files**
   - Drag and drop files or folders
   - Or click the dropzone to browse
   - Set commit message
   - Optionally specify target path
   - Click "Upload to GitHub"

3. **Monitor Progress**
   - Real-time upload progress bar
   - Detailed activity logs
   - Success/error notifications

## 🔑 GitHub Token Setup

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "GitHub Uploader")
4. Select scopes:
   - `repo` (Full control of private repositories)
   - `public_repo` (if only uploading to public repos)
5. Generate and copy the token
6. Add to `.env` file or enter in the web interface

## 📦 Project Structure

```
git-uploader/
├── index.html          # Main web interface
├── style.css           # OKLCH monochrome styling
├── script.js           # Frontend logic
├── server.js           # Express backend
├── package.json        # Dependencies
├── .env.example        # Environment template
├── Dockerfile          # Container configuration
├── coolify.yaml        # Coolify deployment manifest
├── .gitignore          # Git ignore rules
├── .dockerignore       # Docker ignore rules
├── README.md           # This file
└── docs/
    └── deployment.md   # Deployment guide
```

## 🛠️ API Endpoints

- `GET /` - Web interface
- `GET /health` - Health check endpoint
- `POST /api/check-repo` - Check if repository exists
- `POST /api/create-repo` - Create new repository
- `POST /api/upload` - Upload file to repository

## 🎨 Design System

- **Color Model**: OKLCH monochrome palette
- **Grid**: 4px base unit
- **Fonts**: 
  - Sans: Inter
  - Mono: JetBrains Mono
- **Icons**: Phosphor Icons
- **Layout**: No flex-wrap, horizontal scroll preferred

## 📝 Environment Variables

```env
# GitHub Configuration
GITHUB_TOKEN=ghp_your_token_here
USERNAME=your-username
REPO_NAME=my-repo
BRANCH=main

# Server Configuration
PORT=3000
NODE_ENV=production

# Repository Settings
AUTO_CREATE_REPO=true
REPO_VISIBILITY=private
```

## 🐳 Docker Deployment

See [docs/deployment.md](docs/deployment.md) for complete deployment instructions.

### Quick Docker Run

```bash
# Build image
docker build -t github-uploader .

# Run container
docker run -p 3000:3000 --env-file .env github-uploader
```

## 🚢 Coolify Deployment

1. Connect your repository to Coolify
2. Coolify will auto-detect the Dockerfile
3. Set environment variables in Coolify dashboard
4. Deploy!

Alternative: Coolify will use `coolify.yaml` for configuration.

## 🔧 Development

```bash
# Install with dev dependencies
npm install

# Run with hot reload
npm run dev

# The server will restart on file changes
```

## 📊 Features Breakdown

### File Upload
- Multiple file selection
- Folder structure preservation
- Drag-and-drop support
- File size display
- Remove files before upload

### Repository Management
- Auto-detect existing repos
- Create new repos on-demand
- Public/private visibility
- Custom branch support
- Update existing files

### User Experience
- Real-time progress tracking
- Detailed activity logs
- Error handling with clear messages
- Configuration persistence (localStorage)
- Responsive design

## 🔒 Security Notes

- Never commit `.env` file with real tokens
- Store tokens securely
- Use environment variables in production
- Tokens are stored in localStorage (use with caution on shared computers)
- Always use HTTPS in production

## 🐛 Troubleshooting

### Upload Fails
- Verify GitHub token has correct permissions
- Check repository name is correct
- Ensure branch exists or auto-create is enabled
- Check file size limits (GitHub has 100MB limit)

### Repository Not Found
- Enable "Auto-create repository" option
- Or create repository manually on GitHub
- Verify username and repo name are correct

### Connection Issues
- Check network connectivity
- Verify GitHub API is accessible
- Check firewall/proxy settings

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📞 Support

For issues and questions:
- Check [docs/deployment.md](docs/deployment.md) for deployment help
- Open an issue on GitHub
- Review the activity logs for error details

---

Built with ❤️ for seamless GitHub uploads
