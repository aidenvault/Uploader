#!/usr/bin/env node

/**
 * GitHub Uploader CLI
 * 
 * Usage:
 *   node cli.js upload <file-or-folder> [options]
 * 
 * Options:
 *   --token       GitHub Personal Access Token
 *   --username    GitHub username
 *   --repo        Repository name
 *   --branch      Branch name (default: main)
 *   --message     Commit message
 *   --path        Target path in repo
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GITHUB_API = 'https://api.github.com';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

const options = {
    token: process.env.GITHUB_TOKEN,
    username: process.env.USERNAME,
    repo: process.env.REPO_NAME,
    branch: process.env.BRANCH || 'main',
    message: 'Upload via CLI',
    targetPath: ''
};

// Parse flags
for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
        const key = args[i].slice(2);
        const value = args[i + 1];
        if (key === 'token') options.token = value;
        if (key === 'username') options.username = value;
        if (key === 'repo') options.repo = value;
        if (key === 'branch') options.branch = value;
        if (key === 'message') options.message = value;
        if (key === 'path') options.targetPath = value;
    }
}

// Helper: GitHub API request
async function githubRequest(endpoint, opts = {}) {
    const response = await fetch(`${GITHUB_API}${endpoint}`, {
        ...opts,
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${options.token}`,
            'User-Agent': 'GitHub-Uploader-CLI',
            ...opts.headers
        }
    });
    
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
}

// Get file SHA if exists
async function getFileSHA(filePath) {
    try {
        const result = await githubRequest(
            `/repos/${options.username}/${options.repo}/contents/${filePath}?ref=${options.branch}`
        );
        if (result.ok && result.data.sha) {
            return result.data.sha;
        }
    } catch (error) {
        // File doesn't exist
    }
    return null;
}

// Upload single file
async function uploadFile(filePath, repoPath) {
    try {
        const content = fs.readFileSync(filePath);
        const base64Content = content.toString('base64');
        
        const sha = await getFileSHA(repoPath);
        
        const uploadData = {
            message: options.message,
            content: base64Content,
            branch: options.branch
        };
        
        if (sha) {
            uploadData.sha = sha;
        }
        
        const result = await githubRequest(
            `/repos/${options.username}/${options.repo}/contents/${repoPath}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(uploadData)
            }
        );
        
        if (result.ok) {
            console.log(`✓ ${repoPath}`);
            return true;
        } else {
            console.error(`✗ ${repoPath}: ${result.data.message}`);
            return false;
        }
    } catch (error) {
        console.error(`✗ ${repoPath}: ${error.message}`);
        return false;
    }
}

// Upload directory recursively
async function uploadDirectory(dirPath, basePath = '') {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let success = 0;
    let failed = 0;
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const repoPath = basePath ? `${basePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
            const result = await uploadDirectory(fullPath, repoPath);
            success += result.success;
            failed += result.failed;
        } else {
            const result = await uploadFile(fullPath, repoPath);
            if (result) success++;
            else failed++;
        }
    }
    
    return { success, failed };
}

// Main upload command
async function uploadCommand(target) {
    if (!target) {
        console.error('Error: Please specify a file or folder to upload');
        process.exit(1);
    }
    
    if (!options.token || !options.username || !options.repo) {
        console.error('Error: Missing required configuration (token, username, repo)');
        console.error('Set them via --flags or in .env file');
        process.exit(1);
    }
    
    const targetPath = path.resolve(target);
    
    if (!fs.existsSync(targetPath)) {
        console.error(`Error: ${target} does not exist`);
        process.exit(1);
    }
    
    console.log(`📤 Uploading to ${options.username}/${options.repo}:${options.branch}`);
    console.log(`📝 Message: ${options.message}`);
    console.log('');
    
    const stats = fs.statSync(targetPath);
    let result;
    
    if (stats.isDirectory()) {
        result = await uploadDirectory(targetPath, options.targetPath);
        console.log('');
        console.log(`✅ Upload complete: ${result.success} succeeded, ${result.failed} failed`);
    } else {
        const fileName = path.basename(targetPath);
        const repoPath = options.targetPath ? `${options.targetPath}/${fileName}` : fileName;
        const success = await uploadFile(targetPath, repoPath);
        console.log('');
        console.log(success ? '✅ Upload complete!' : '❌ Upload failed');
    }
}

// Show help
function showHelp() {
    console.log(`
GitHub Uploader CLI

Usage:
  node cli.js upload <file-or-folder> [options]

Options:
  --token       GitHub Personal Access Token (or set GITHUB_TOKEN env)
  --username    GitHub username (or set USERNAME env)
  --repo        Repository name (or set REPO_NAME env)
  --branch      Branch name (default: main)
  --message     Commit message (default: "Upload via CLI")
  --path        Target path in repository (optional)

Examples:
  # Upload single file
  node cli.js upload ./myfile.txt --message "Add myfile"
  
  # Upload entire folder
  node cli.js upload ./my-folder --message "Add folder contents"
  
  # Upload to specific path
  node cli.js upload ./docs --path documentation
  
  # With all options
  node cli.js upload ./src \\
    --token ghp_xxx \\
    --username myuser \\
    --repo myrepo \\
    --branch develop \\
    --message "Update source files"

Environment:
  Create a .env file with:
    GITHUB_TOKEN=ghp_your_token
    USERNAME=your-username
    REPO_NAME=your-repo
    BRANCH=main
    `);
}

// Main
if (command === 'upload') {
    uploadCommand(args[1]).catch(error => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
} else {
    showHelp();
}
