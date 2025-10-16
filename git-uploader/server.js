const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// GitHub API Base URL
const GITHUB_API = 'https://api.github.com';

// Helper function to make GitHub API requests
async function githubRequest(endpoint, options = {}) {
    const response = await fetch(`${GITHUB_API}${endpoint}`, {
        ...options,
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Uploader',
            ...options.headers
        }
    });
    
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
}

// Check if repository exists
app.post('/api/check-repo', async (req, res) => {
    const { token, username, repoName } = req.body;
    
    try {
        const result = await githubRequest(`/repos/${username}/${repoName}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        res.json({ exists: result.ok });
    } catch (error) {
        res.status(500).json({ exists: false, error: error.message });
    }
});

// Create repository
app.post('/api/create-repo', async (req, res) => {
    const { token, repoName, visibility } = req.body;
    
    try {
        const result = await githubRequest('/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: repoName,
                private: visibility === 'private',
                auto_init: true
            })
        });
        
        if (result.ok) {
            res.json({ success: true, data: result.data });
        } else {
            res.json({ success: false, error: result.data.message || 'Failed to create repository' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get file SHA if it exists (for updates)
async function getFileSHA(token, username, repoName, branch, filePath) {
    try {
        const result = await githubRequest(
            `/repos/${username}/${repoName}/contents/${filePath}?ref=${branch}`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );
        
        if (result.ok && result.data.sha) {
            return result.data.sha;
        }
    } catch (error) {
        // File doesn't exist, which is fine for new uploads
    }
    return null;
}

// Upload file to GitHub
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const { token, username, repoName, branch, message, path: targetPath, relativePath } = req.body;
    const file = req.file;
    
    if (!file) {
        return res.status(400).json({ success: false, error: 'No file provided' });
    }
    
    try {
        // Read file content
        const fileContent = fs.readFileSync(file.path);
        const base64Content = fileContent.toString('base64');
        
        // Construct file path
        let filePath = relativePath || file.originalname;
        if (targetPath) {
            filePath = targetPath.endsWith('/') 
                ? `${targetPath}${filePath}` 
                : `${targetPath}/${filePath}`;
        }
        
        // Clean up path (remove leading slashes, normalize)
        filePath = filePath.replace(/^\/+/, '').replace(/\/+/g, '/');
        
        // Check if file exists and get SHA for update
        const sha = await getFileSHA(token, username, repoName, branch, filePath);
        
        // Upload to GitHub
        const uploadData = {
            message: message || 'Upload file via GitHub Uploader',
            content: base64Content,
            branch: branch
        };
        
        // If file exists, include SHA for update
        if (sha) {
            uploadData.sha = sha;
        }
        
        const result = await githubRequest(
            `/repos/${username}/${repoName}/contents/${filePath}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(uploadData)
            }
        );
        
        // Clean up temporary file
        fs.unlinkSync(file.path);
        
        if (result.ok) {
            res.json({ 
                success: true, 
                path: filePath,
                url: result.data.content?.html_url 
            });
        } else {
            res.json({ 
                success: false, 
                error: result.data.message || 'Failed to upload file' 
            });
        }
    } catch (error) {
        // Clean up temporary file on error
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GitHub Uploader running on port ${PORT}`);
    console.log(`📝 Visit http://localhost:${PORT} to start uploading`);
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
