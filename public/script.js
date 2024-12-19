// script.js
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

class PrizeWheel {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.currentRotation = 0;
        this.isSpinning = false;
        this.drawWheel();
    }

    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = this.canvas.width / 2 - 10;
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
            this.ctx.stroke();

            // Draw text
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Kanit';
            this.ctx.fillText(prize.name, radius - 20, 5);
            this.ctx.restore();
        });
    }

    spin() {
        if (this.isSpinning) return;

        this.isSpinning = true;
        const spinButton = document.getElementById('spinButton');
        spinButton.disabled = true;

        const randomSpins = 5 + Math.random() * 5;
        const randomPrizeIndex = Math.floor(Math.random() * prizes.length);
        const targetRotation = (randomSpins * 360) + (randomPrizeIndex * (360 / prizes.length));
        
        let currentRotation = 0;
        const animate = (timestamp) => {
            if (!this.startTime) this.startTime = timestamp;
            const progress = (timestamp - this.startTime) / 4000; // 4 seconds duration

            if (progress < 1) {
                currentRotation = easeOut(progress) * targetRotation;
                this.canvas.style.transform = `rotate(${currentRotation}deg)`;
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                this.startTime = null;
                const prizeResult = document.getElementById('prizeResult');
                prizeResult.textContent = `คุณได้รับ: ${prizes[randomPrizeIndex].name}`;
                prizeResult.style.display = 'block';
                spinButton.disabled = true;
            }
        };

        requestAnimationFrame(animate);
    }
}

function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Initialize wheel
const wheel = new PrizeWheel('wheelCanvas');

// Generate link functionality
let timer;
const generateButton = document.getElementById('generateButton');
const linkContainer = document.getElementById('linkContainer');
const generatedLink = document.getElementById('generatedLink');
const timerElement = document.getElementById('timer');
const spinButton = document.getElementById('spinButton');
const qrCode = document.getElementById('qrCode');

generateButton.addEventListener('click', () => {
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const link = `https://spin.kamnuantech.com/spin/${uniqueId}`;
    
    generatedLink.textContent = link;
    linkContainer.style.display = 'block';
    spinButton.disabled = false;

    // Clear previous QR code
    qrCode.innerHTML = '';
    
    // Generate new QR code
    new QRCode(qrCode, {
        text: link,
        width: 128,
        height: 128
    });

    // Reset and start timer
    let timeLeft = 300; // 5 minutes
    clearInterval(timer);
    
    timer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `ลิงก์จะหมดอายุใน: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft === 0) {
            clearInterval(timer);
            linkContainer.style.display = 'none';
            spinButton.disabled = true;
        }
        timeLeft--;
    }, 1000);
});

// Spin wheel when button is clicked
spinButton.addEventListener('click', () => {
    wheel.spin();
});