// Prize configuration
const prizes = [
    { name: 'เลือกได้ทั้งร้าน 1 เมนู', color: '#FF6B6B' },
    { name: 'ลด 30 บาท', color: '#4ECDC4' },
    { name: 'ลด 10%', color: '#45B7D1' },
    { name: 'ลด 5%', color: '#96CEB4' },
    { name: 'ลด 3%', color: '#FFEEAD' },
    { name: 'ฟรีวิป 1 จุก', color: '#D4A5A5' },
    { name: 'ฟรีมุก 1 ตัก', color: '#9B9B9B' },
    { name: 'ฟรีชาเขียว', color: '#77DD77' },
    { name: 'ฟรีชาไทย', color: '#FFB347' },
    { name: 'ฟรีชามะนาว', color: '#F49AC2' }
];

// Wheel class for handling the prize wheel
class PrizeWheel {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isSpinning = false;
        this.currentRotation = 0;
        this.init();
    }

    init() {
        this.drawWheel();
    }

    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const sliceAngle = (2 * Math.PI) / prizes.length;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        prizes.forEach((prize, index) => {
            const startAngle = index * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            // Draw slice
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = prize.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw text
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Kanit';
            this.ctx.fillText(prize.name, radius - 20, 5);
            this.ctx.restore();
        });
    }

    rotate(degrees) {
        this.currentRotation = degrees;
        this.canvas.style.transform = `rotate(${degrees}deg)`;
    }
}

// Auth functions
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    if (!username || !password) {
        errorDiv.textContent = 'กรุณากรอกข้อมูลให้ครบ';
        errorDiv.style.display = 'block';
        return;
    }

    if (username === 'admin' && password === '12345678') {
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        sessionStorage.setItem('adminUsername', username);
        showAdminSection();
    } else {
        errorDiv.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        errorDiv.style.display = 'block';
    }
}

function logout() {
    sessionStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('adminUsername');
    window.location.reload();
}

function showAdminSection() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';
    document.getElementById('adminUsername').textContent = 
        `ผู้ดูแลระบบ: ${sessionStorage.getItem('adminUsername')}`;
}

// Link generation and management
let currentLinkTimer;

function generateLink() {
    const button = document.getElementById('generateButton');
    button.disabled = true;

    fetch('/api/generate-link', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showGeneratedLink(data);
            startTimer(data.expiryTime);
        } else {
            throw new Error(data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการสร้างลิงก์');
    })
    .finally(() => {
        button.disabled = false;
    });
}

function showGeneratedLink(data) {
    const linkContainer = document.getElementById('linkContainer');
    const generatedLink = document.getElementById('generatedLink');
    const qrCode = document.getElementById('qrCode');

    // Clear previous QR code
    qrCode.innerHTML = '';

    // Create full URL
    const fullUrl = `${window.location.origin}/spin/${data.spinId}`;
    
    // Show link
    generatedLink.textContent = fullUrl;
    linkContainer.style.display = 'block';

    // Generate QR Code
    new QRCode(qrCode, {
        text: fullUrl,
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
            document.getElementById('linkContainer').style.display = 'none';
            return;
        }

        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        timerElement.textContent = 
            `ลิงก์จะหมดอายุใน: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

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
            console.error('Failed to copy:', err);
            alert('ไม่สามารถคัดลอกลิงก์ได้');
        });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize wheel
    const wheel = new PrizeWheel('wheelCanvas');

    // Check authentication
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        showAdminSection();
    }

    // Add button event listeners
    const generateButton = document.getElementById('generateButton');
    if (generateButton) {
        generateButton.addEventListener('click', generateLink);
    }

    // Handle enter key in login form
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            login();
        }
    });
});