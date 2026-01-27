// Base64 Tool - Encode & Decode Everything

// DOM Elements
const statsBar = document.getElementById('stats-bar');
let currentMode = 'text';

// Initialize
function init() {
    setupTabs();
    setupDropZones();
    setupFileInputs();
    setupAutoEncode();
}

function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.mode-content').forEach(m => m.classList.remove('active'));
            
            tab.classList.add('active');
            currentMode = tab.dataset.mode;
            document.getElementById(`${currentMode}-mode`).classList.add('active');
        });
    });
}

function setupDropZones() {
    // File drop zone
    const fileDrop = document.getElementById('file-drop');
    setupDrop(fileDrop, handleFileDrop);
    
    // Image drop zone
    const imageDrop = document.getElementById('image-drop');
    setupDrop(imageDrop, handleImageDrop);
}

function setupDrop(zone, handler) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
        zone.addEventListener(event, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    ['dragenter', 'dragover'].forEach(event => {
        zone.addEventListener(event, () => zone.classList.add('dragover'));
    });
    
    ['dragleave', 'drop'].forEach(event => {
        zone.addEventListener(event, () => zone.classList.remove('dragover'));
    });
    
    zone.addEventListener('drop', e => {
        const files = e.dataTransfer.files;
        if (files.length > 0) handler(files[0]);
    });
    
    zone.addEventListener('click', () => {
        zone.querySelector('input[type="file"]').click();
    });
}

function setupFileInputs() {
    document.getElementById('file-input').addEventListener('change', e => {
        if (e.target.files.length > 0) handleFileDrop(e.target.files[0]);
    });
    
    document.getElementById('image-input').addEventListener('change', e => {
        if (e.target.files.length > 0) handleImageDrop(e.target.files[0]);
    });
}

function setupAutoEncode() {
    // Auto-encode on input for text mode
    document.getElementById('text-input').addEventListener('input', encodeText);
    document.getElementById('text-output').addEventListener('input', () => {
        // Don't auto-decode, user might still be typing
    });
    
    // URL mode
    document.getElementById('url-input').addEventListener('input', encodeURL);
}

// Text Mode
function encodeText() {
    const input = document.getElementById('text-input').value;
    const urlSafe = document.getElementById('url-safe').checked;
    const addPadding = document.getElementById('add-padding').checked;
    
    try {
        let encoded = btoa(unescape(encodeURIComponent(input)));
        
        if (urlSafe) {
            encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
        }
        
        if (!addPadding) {
            encoded = encoded.replace(/=+$/, '');
        }
        
        document.getElementById('text-output').value = encoded;
        updateStats(input.length, encoded.length);
    } catch (e) {
        document.getElementById('text-output').value = 'Error: ' + e.message;
    }
}
window.encodeText = encodeText;

function decodeText() {
    let input = document.getElementById('text-output').value.trim();
    const urlSafe = document.getElementById('url-safe').checked;
    
    try {
        // Handle URL-safe encoding
        if (urlSafe) {
            input = input.replace(/-/g, '+').replace(/_/g, '/');
        }
        
        // Add padding if missing
        while (input.length % 4) input += '=';
        
        const decoded = decodeURIComponent(escape(atob(input)));
        document.getElementById('text-input').value = decoded;
        updateStats(decoded.length, input.length);
    } catch (e) {
        document.getElementById('text-input').value = 'Error: Invalid Base64 string';
    }
}
window.decodeText = decodeText;

// File Mode
function handleFileDrop(file) {
    // Show file info
    document.getElementById('file-info').style.display = 'flex';
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = formatFileSize(file.size);
    document.getElementById('file-type').textContent = file.type || 'unknown type';
    
    const reader = new FileReader();
    reader.onload = e => {
        const base64 = e.target.result.split(',')[1];
        document.getElementById('file-output').value = base64;
        updateStats(file.size, base64.length);
    };
    reader.readAsDataURL(file);
}

function downloadBase64() {
    const base64 = document.getElementById('file-output').value;
    if (!base64) return;
    
    const blob = new Blob([base64], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base64.txt';
    a.click();
    URL.revokeObjectURL(url);
}
window.downloadBase64 = downloadBase64;

function decodeToFile() {
    const input = document.getElementById('decode-input').value.trim();
    const filename = document.getElementById('decode-filename').value || 'decoded-file';
    
    try {
        // Try to decode
        const binary = atob(input);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        
        const blob = new Blob([bytes]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        alert('Error decoding: Invalid Base64 string');
    }
}
window.decodeToFile = decodeToFile;

// Image Mode
function handleImageDrop(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = e => {
        const dataUrl = e.target.result;
        
        // Show preview
        document.getElementById('image-preview').style.display = 'block';
        document.getElementById('preview-img').src = dataUrl;
        
        // Output data URL
        document.getElementById('image-output').value = dataUrl;
        
        // Generate HTML tag
        const htmlTag = `<img src="${dataUrl.substring(0, 50)}..." alt="image">`;
        document.getElementById('html-tag').textContent = `<img src="${dataUrl}" alt="image">`;
        
        updateStats(file.size, dataUrl.length);
    };
    reader.readAsDataURL(file);
}

function copyHTML() {
    const html = document.getElementById('html-tag').textContent;
    navigator.clipboard.writeText(html);
}
window.copyHTML = copyHTML;

// URL Mode
function encodeURL() {
    const input = document.getElementById('url-input').value;
    const useComponent = document.getElementById('encode-component').checked;
    
    try {
        const encoded = useComponent ? encodeURIComponent(input) : encodeURI(input);
        document.getElementById('url-output').value = encoded;
        updateStats(input.length, encoded.length);
    } catch (e) {
        document.getElementById('url-output').value = 'Error: ' + e.message;
    }
}
window.encodeURL = encodeURL;

function decodeURL() {
    const input = document.getElementById('url-output').value;
    const useComponent = document.getElementById('encode-component').checked;
    
    try {
        const decoded = useComponent ? decodeURIComponent(input) : decodeURI(input);
        document.getElementById('url-input').value = decoded;
        updateStats(decoded.length, input.length);
    } catch (e) {
        document.getElementById('url-input').value = 'Error: Invalid encoded string';
    }
}
window.decodeURL = decodeURL;

// Utility functions
function clearInput(id) {
    document.getElementById(id).value = '';
    updateStats(0, 0);
}
window.clearInput = clearInput;

function pasteToInput(id) {
    navigator.clipboard.readText().then(text => {
        document.getElementById(id).value = text;
        if (id === 'text-input') encodeText();
        if (id === 'url-input') encodeURL();
    });
}
window.pasteToInput = pasteToInput;

function copyOutput(id) {
    const output = document.getElementById(id);
    navigator.clipboard.writeText(output.value).then(() => {
        // Visual feedback
        const btn = output.closest('.editor-panel').querySelector('.small-btn');
        if (btn) {
            const original = btn.textContent;
            btn.textContent = '✓ Copied';
            setTimeout(() => btn.textContent = original, 2000);
        }
    });
}
window.copyOutput = copyOutput;

function updateStats(inputSize, outputSize) {
    document.getElementById('input-size').textContent = `Input: ${formatSize(inputSize)}`;
    document.getElementById('output-size').textContent = `Output: ${formatSize(outputSize)}`;
    
    if (inputSize > 0 && outputSize > 0) {
        const ratio = (outputSize / inputSize * 100).toFixed(1);
        document.getElementById('ratio').textContent = `Ratio: ${ratio}%`;
    } else {
        document.getElementById('ratio').textContent = 'Ratio: -';
    }
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' chars';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
