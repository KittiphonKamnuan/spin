class PrizeWheel {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isSpinning = false;
        this.startTime = null;
        this.prizes = [
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
        this.init();
    }

    init() {
        this.drawWheel();
        this.setupEventListeners();
        this.validateSpin();
    }

    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const sliceAngle = (2 * Math.PI) / this.prizes.length;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.prizes.forEach((prize, index) => {
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

    async spin() {
        if (this.isSpinning) return;

        const spinButton = document.getElementById('spinButton');
        const buttonText = spinButton.querySelector('.button-text');
        const buttonLoading = spinButton.querySelector('.button-loading');

        try {
            this.isSpinning = true;
            spinButton.disabled = true;
            buttonText.style.display = 'none';
            buttonLoading.style.display = 'block';

            const spinId = this.getSpinId();
            const response = await fetch(`/api/spin/${spinId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            // Calculate rotation
            const prizeIndex = this.prizes.findIndex(p => p.name === data.prize);
            const rotations = 5 + Math.random() * 2;
            const targetAngle = (360 / this.prizes.length) * prizeIndex;
            const totalRotation = (rotations * 360) + targetAngle;

            // Animate wheel
            await this.animate(totalRotation);

            // Show result
            this.showResult(data.prize);

        } catch (error) {
            console.error('Spin error:', error);
            this.showError(error.message || 'เกิดข้อผิดพลาดในการสุ่มรางวัล');
        } finally {
            this.isSpinning = false;
            buttonText.style.display = 'block';
            buttonLoading.style.display = 'none';
        }
    }

    animate(totalRotation) {
        return new Promise(resolve => {
            const startTime = performance.now();
            const duration = 4000;

            const animateFrame = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentRotation = easeOut * totalRotation;

                this.canvas.style.transform = `rotate(${currentRotation}deg)`;

                if (progress < 1) {
                    requestAnimationFrame(animateFrame);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animateFrame);
        });
    }

    showResult(prize) {
        const resultDiv = document.getElementById('prizeResult');
        const prizeNameDiv = document.getElementById('prizeName');
        const timestampDiv = document.getElementById('timestamp');
        
        prizeNameDiv.textContent = prize;
        timestampDiv.textContent = new Date().toLocaleString('th-TH');
        resultDiv.style.display = 'block';
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorContent = errorDiv.querySelector('.error-content');
        errorContent.textContent = message;
        errorDiv.style.display = 'block';
    }

    getSpinId() {
        const urlParts = window.location.pathname.split('/');
        return urlParts[urlParts.length - 1];
    }

    setupEventListeners() {
        const spinButton = document.getElementById('spinButton');
        spinButton.addEventListener('click', () => this.spin());
    }

    async validateSpin() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.style.display = 'flex';

        try {
            const spinId = this.getSpinId();
            const response = await fetch(`/api/validate-spin/${spinId}`);
            const data = await response.json();

            if (!data.valid) {
                this.showError(data.error);
                document.getElementById('spinButton').disabled = true;
            }
        } catch (error) {
            console.error('Validation error:', error);
            this.showError('เกิดข้อผิดพลาดในการตรวจสอบลิงก์');
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }
}

// Initialize wheel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PrizeWheel('wheelCanvas');
});