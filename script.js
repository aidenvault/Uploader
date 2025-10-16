// State Management
const state = {
    config: {
        token: '',
        username: '',
        repoName: '',
        branch: 'main',
        visibility: 'private',
        autoCreate: false
    },
    files: [],
    uploading: false
};

// DOM Elements
const elements = {
    token: document.getElementById('github-token'),
    username: document.getElementById('username'),
    repoName: document.getElementById('repo-name'),
    branch: document.getElementById('branch'),
    visibility: document.getElementById('repo-visibility'),
    autoCreate: document.getElementById('create-repo'),
    saveConfig: document.getElementById('save-config'),
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('file-input'),
    fileList: document.getElementById('file-list'),
    commitMessage: document.getElementById('commit-message'),
    targetPath: document.getElementById('target-path'),
    uploadBtn: document.getElementById('upload-btn'),
    progressSection: document.getElementById('progress-section'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    logsContainer: document.getElementById('logs-container'),
    clearLogs: document.getElementById('clear-logs')
};

// Utility Functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
}

function addLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `
        <span class="log-time">${formatTime()}</span>
        <span class="log-message">${message}</span>
    `;
    elements.logsContainer.appendChild(logEntry);
    elements.logsContainer.scrollTop = elements.logsContainer.scrollHeight;
}

function updateProgress(percent, text) {
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = text || `${percent}% complete`;
}

// Configuration Management
function loadConfig() {
    const saved = localStorage.getItem('github-uploader-config');
    if (saved) {
        const config = JSON.parse(saved);
        state.config = { ...state.config, ...config };
        elements.token.value = config.token || '';
        elements.username.value = config.username || '';
        elements.repoName.value = config.repoName || '';
        elements.branch.value = config.branch || 'main';
        elements.visibility.value = config.visibility || 'private';
        elements.autoCreate.checked = config.autoCreate || false;
        addLog('Configuration loaded from local storage', 'success');
    }
}

function saveConfig() {
    state.config = {
        token: elements.token.value,
        username: elements.username.value,
        repoName: elements.repoName.value,
        branch: elements.branch.value,
        visibility: elements.visibility.value,
        autoCreate: elements.autoCreate.checked
    };
    
    localStorage.setItem('github-uploader-config', JSON.stringify(state.config));
    addLog('Configuration saved successfully', 'success');
}

// File Management
function handleFiles(files) {
    const fileArray = Array.from(files);
    state.files = [...state.files, ...fileArray];
    renderFileList();
    elements.uploadBtn.disabled = state.files.length === 0;
    addLog(`Added ${fileArray.length} file(s)`, 'info');
}

function removeFile(index) {
    const removed = state.files.splice(index, 1);
    renderFileList();
    elements.uploadBtn.disabled = state.files.length === 0;
    addLog(`Removed ${removed[0].name}`, 'warning');
}

function renderFileList() {
    if (state.files.length === 0) {
        elements.fileList.innerHTML = '';
        return;
    }
    
    elements.fileList.innerHTML = state.files.map((file, index) => `
        <div class="file-item">
            <div class="file-info">
                <i class="ph ph-file"></i>
                <div class="file-details">
                    <div class="file-name">${file.webkitRelativePath || file.name}</div>
                    <div class="file-size">${formatBytes(file.size)}</div>
                </div>
            </div>
            <button class="file-remove" onclick="removeFile(${index})">
                <i class="ph ph-x"></i>
            </button>
        </div>
    `).join('');
}

// GitHub API Functions
async function checkRepoExists() {
    const { token, username, repoName } = state.config;
    
    try {
        const response = await fetch(`/api/check-repo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, username, repoName })
        });
        
        const data = await response.json();
        return data.exists;
    } catch (error) {
        addLog(`Error checking repository: ${error.message}`, 'error');
        return false;
    }
}

async function createRepository() {
    const { token, repoName, visibility } = state.config;
    
    try {
        const response = await fetch(`/api/create-repo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, repoName, visibility })
        });
        
        const data = await response.json();
        
        if (data.success) {
            addLog(`Repository '${repoName}' created successfully`, 'success');
            return true;
        } else {
            addLog(`Failed to create repository: ${data.error}`, 'error');
            return false;
        }
    } catch (error) {
        addLog(`Error creating repository: ${error.message}`, 'error');
        return false;
    }
}

async function uploadFiles() {
    if (state.uploading) return;
    
    const { token, username, repoName, branch, autoCreate } = state.config;
    const commitMessage = elements.commitMessage.value || 'Upload files via GitHub Uploader';
    const targetPath = elements.targetPath.value || '';
    
    // Validation
    if (!token || !username || !repoName) {
        addLog('Please configure GitHub token, username, and repository name', 'error');
        return;
    }
    
    if (state.files.length === 0) {
        addLog('Please select files to upload', 'warning');
        return;
    }
    
    state.uploading = true;
    elements.uploadBtn.disabled = true;
    elements.progressSection.style.display = 'block';
    
    addLog(`Starting upload to ${username}/${repoName}...`, 'info');
    
    // Check if repo exists
    const repoExists = await checkRepoExists();
    
    if (!repoExists) {
        if (autoCreate) {
            addLog('Repository not found. Creating new repository...', 'warning');
            const created = await createRepository();
            if (!created) {
                state.uploading = false;
                elements.uploadBtn.disabled = false;
                return;
            }
            // Wait a bit for repo to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            addLog('Repository not found. Enable auto-create or create it manually.', 'error');
            state.uploading = false;
            elements.uploadBtn.disabled = false;
            elements.progressSection.style.display = 'none';
            return;
        }
    }
    
    // Upload files
    const totalFiles = state.files.length;
    let completed = 0;
    
    for (const file of state.files) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('token', token);
            formData.append('username', username);
            formData.append('repoName', repoName);
            formData.append('branch', branch);
            formData.append('message', commitMessage);
            formData.append('path', targetPath);
            formData.append('relativePath', file.webkitRelativePath || file.name);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                completed++;
                const percent = Math.round((completed / totalFiles) * 100);
                updateProgress(percent, `${completed}/${totalFiles} files uploaded`);
                addLog(`✓ ${file.webkitRelativePath || file.name}`, 'success');
            } else {
                addLog(`✗ ${file.webkitRelativePath || file.name}: ${data.error}`, 'error');
            }
        } catch (error) {
            addLog(`✗ ${file.webkitRelativePath || file.name}: ${error.message}`, 'error');
        }
    }
    
    state.uploading = false;
    elements.uploadBtn.disabled = false;
    
    if (completed === totalFiles) {
        addLog(`Upload complete! All ${totalFiles} file(s) uploaded successfully.`, 'success');
    } else {
        addLog(`Upload complete. ${completed}/${totalFiles} file(s) uploaded.`, 'warning');
    }
    
    // Clear files
    state.files = [];
    renderFileList();
    elements.uploadBtn.disabled = true;
}

// Event Listeners
elements.saveConfig.addEventListener('click', saveConfig);

elements.dropzone.addEventListener('click', () => {
    elements.fileInput.click();
});

elements.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropzone.classList.add('dragover');
});

elements.dropzone.addEventListener('dragleave', () => {
    elements.dropzone.classList.remove('dragover');
});

elements.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropzone.classList.remove('dragover');
    
    const items = e.dataTransfer.items;
    const files = [];
    
    // Process dropped items
    if (items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry();
            if (item) {
                traverseFileTree(item, files);
            }
        }
    } else {
        handleFiles(e.dataTransfer.files);
    }
});

// Recursive folder traversal for drag-and-drop
function traverseFileTree(item, files, path = '') {
    if (item.isFile) {
        item.file((file) => {
            // Add path information
            Object.defineProperty(file, 'webkitRelativePath', {
                value: path + file.name,
                writable: false
            });
            files.push(file);
            state.files = [...state.files, ...files];
            renderFileList();
            elements.uploadBtn.disabled = state.files.length === 0;
        });
    } else if (item.isDirectory) {
        const dirReader = item.createReader();
        dirReader.readEntries((entries) => {
            for (let i = 0; i < entries.length; i++) {
                traverseFileTree(entries[i], files, path + item.name + '/');
            }
        });
    }
}

elements.fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

elements.uploadBtn.addEventListener('click', uploadFiles);

elements.clearLogs.addEventListener('click', () => {
    elements.logsContainer.innerHTML = '<div class="log-entry log-info"><span class="log-time">--:--:--</span><span class="log-message">Logs cleared</span></div>';
    addLog('Ready for new uploads', 'info');
});

// Global function for remove buttons
window.removeFile = removeFile;

// Initialize
loadConfig();
