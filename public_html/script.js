// Authentication and Session Management
const AUTH = {
    username: 'admin',
    password: '12345678'
};

let currentLinkTimer;

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function setupEventListeners() {
    // Login form enter key
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            login();
        }
    });

    // Generate link button
    const generateButton = document.getElementById('generateButton');
    if (generateButton) {
        generateButton.addEventListener('click', generateLink);
    }
}

// Authentication Functions
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    if (!username || !password) {
        showError(errorDiv, 'กรุณากรอกข้อมูลให้ครบ');
        return;
    }

    if (username === AUTH.username && password === AUTH.password) {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        sessionStorage.setItem('adminUsername', username);
        showAdminSection();
    } else {
        showError(errorDiv, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
}

function logout() {
    sessionStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('adminUsername');
    window.location.reload();
}

function checkAuth() {
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        showAdminSection();
    }
}

function showAdminSection() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';
    document.getElementById('adminUsername').textContent = 
        `ผู้ดูแลระบบ: ${sessionStorage.getItem('adminUsername')}`;
}

// Link Generation Functions
async function generateLink() {
    const button = document.getElementById('generateButton');
    const loadingOverlay = document.getElementById('loadingOverlay');

    try {
        button.disabled = true;
        loadingOverlay.style.display = 'flex';

        const response = await fetch('/api/generate-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'เกิดข้อผิดพลาดในการสร้างลิงก์');
        }

        showGeneratedLink(data);
        startTimer(data.expiryTime);

    } catch (error) {
        console.error('Generate link error:', error);
        alert('เกิดข้อผิดพลาดในการสร้างลิงก์');
    } finally {
        button.disabled = false;
        loadingOverlay.style.display = 'none';
    }
}

function showGeneratedLink(data) {
    const linkContainer = document.getElementById('linkContainer');
    const generatedLink = document.getElementById('generatedLink');
    const qrCode = document.getElementById('qrCode');

    // Clear previous QR code
    qrCode.innerHTML = '';

    // Create full URL for spin page
    const spinUrl = `${window.location.origin}/spin/${data.spinId}`;

    // Show link
    generatedLink.textContent = spinUrl;
    linkContainer.style.display = 'block';

    // Generate QR Code
    new QRCode(qrCode, {
        text: spinUrl,
        width: 128,
        height: 128
    });
}

function startTimer(expiryTime) {
    const timerElement = document.getElementById('timer');
    
    // Clear previous timer if exists
    if (currentLinkTimer) {
        clearInterval(currentLinkTimer);
    }

    currentLinkTimer = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, expiryTime - now);

        if (timeLeft === 0) {
            clearInterval(currentLinkTimer);
            hideLinkContainer();
            return;
        }

        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        timerElement.textContent = 
            `ลิงก์จะหมดอายุใน: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function hideLinkContainer() {
    const linkContainer = document.getElementById('linkContainer');
    linkContainer.style.display = 'none';
}

// Utility Functions
function copyLink() {
    const linkText = document.getElementById('generatedLink').textContent;
    
    navigator.clipboard.writeText(linkText)
        .then(() => {
            const button = document.querySelector('.button-secondary');
            button.textContent = 'คัดลอกแล้ว';
            setTimeout(() => {
                button.textContent = 'คัดลอกลิงก์';
            }, 2000);
        })
        .catch(err => {
            console.error('Copy failed:', err);
            alert('ไม่สามารถคัดลอกลิงก์ได้');
        });
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

// Error Handling
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg, '\nURL: ', url, '\nLine: ', lineNo, '\nColumn: ', columnNo, '\nError object: ', error);
    return false;
};