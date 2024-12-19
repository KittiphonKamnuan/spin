// Constants and configurations
const API_BASE_URL = 'https://spin.kamnuantech.com';

const PRIZES = [
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

class PrizeWheel {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isSpinning = false;
        this.startTime = null;
        this.currentRotation = 0;
        this.targetRotation = 0;
        this.spinDuration = 4000; // 4 seconds
        this.init();
    }

    init() {
        this.drawWheel();
        this.setupEventListeners();
    }

    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const sliceAngle = (2 * Math.PI) / PRIZES.length;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw slices
        PRIZES.forEach((prize, index) => {
            const startAngle = index * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();

            // Fill and stroke
            this.ctx.fillStyle = prize.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Add text
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Kanit';
            this.ctx.fillText(prize.name, radius - 20, 5);
            this.ctx.restore();
        });

        // Draw center circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fill();
        this.ctx.stroke();
    }

    setupEventListeners() {
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.startSpin());
        }
    }

    async startSpin() {
        if (this.isSpinning) return;

        const spinButton = document.getElementById('spinButton');
        spinButton.disabled = true;

        try {
            // Get spin ID from URL
            const urlParts = window.location.pathname.split('/');
            const spinId = urlParts[urlParts.length - 1];

            // Call API to get prize
            const response = await fetch(`${API_BASE_URL}/api/spin/${spinId}`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to spin');
            }

            // Find prize index
            const prizeIndex = PRIZES.findIndex(p => p.name === data.prize);
            
            // Calculate rotation
            const baseRotations = 5; // Minimum number of full rotations
            const randomExtraRotations = Math.random() * 2; // 0 to 2 extra rotations
            const sliceAngle = 360 / PRIZES.length;
            const prizeAngle = (sliceAngle * prizeIndex) + Math.random() * (sliceAngle * 0.8);
            
            this.targetRotation = (baseRotations + randomExtraRotations) * 360 + prizeAngle;
            this.isSpinning = true;
            this.startTime = null;
            
            requestAnimationFrame(this.animate.bind(this));

        } catch (error) {
            console.error('Spin error:', error);
            this.showError(error.message);
            spinButton.disabled = false;
        }
    }

    animate(timestamp) {
        if (!this.startTime) this.startTime = timestamp;
        const progress = (timestamp - this.startTime) / this.spinDuration;

        if (progress < 1) {
            // Easing function for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3);
            this.currentRotation = easeOut * this.targetRotation;
            
            // Apply rotation to canvas
            this.ctx.save();
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.rotate((this.currentRotation * Math.PI) / 180);
            this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
            this.drawWheel();
            this.ctx.restore();

            requestAnimationFrame(this.animate.bind(this));
        } else {
            // Spinning complete
            this.isSpinning = false;
            this.showResult();
        }
    }

    showResult() {
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<div class="prize-result">
                ยินดีด้วย! คุณได้รับรางวัล
                <div class="prize-name">${this.lastPrize}</div>
            </div>`;
        }
    }

    showError(message) {
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }
}

// Admin functions
async function generateLink() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/generate-link`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);

        // Update UI with new link
        const linkContainer = document.getElementById('linkContainer');
        const generatedLink = document.getElementById('generatedLink');
        const qrCode = document.getElementById('qrCode');

        if (linkContainer) linkContainer.style.display = 'block';
        if (generatedLink) generatedLink.textContent = data.link;

        // Generate QR Code
        if (qrCode) {
            qrCode.innerHTML = '';
            new QRCode(qrCode, {
                text: data.link,
                width: 128,
                height: 128
            });
        }

        // Start countdown timer
        startTimer(data.expiryTime);

        return data;
    } catch (error) {
        console.error('Error generating link:', error);
        showError('เกิดข้อผิดพลาดในการสร้างลิงก์');
    }
}

let timerInterval;
function startTimer(expiryTime) {
    const timerElement = document.getElementById('timer');
    if (!timerElement) return;

    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, expiryTime - now);

        if (timeLeft === 0) {
            clearInterval(timerInterval);
            const linkContainer = document.getElementById('linkContainer');
            if (linkContainer) linkContainer.style.display = 'none';
            return;
        }

        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        timerElement.textContent = `ลิงก์จะหมดอายุใน: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Initialize wheel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const wheel = new PrizeWheel('wheelCanvas');

    // Set up admin controls if on admin page
    const generateButton = document.getElementById('generateButton');
    if (generateButton) {
        generateButton.addEventListener('click', generateLink);
    }
});