const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store active spins
const activeSpins = new Map();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/spin/:id', (req, res) => {
    const spinId = req.params.id;
    console.log(`Accessing spin page with ID: ${spinId}`);
    res.sendFile(path.join(__dirname, 'public', 'spin.html'));
});

// Generate new spin link
app.post('/api/generate-link', (req, res) => {
    try {
        // Expire old active links
        for (const [id, data] of activeSpins.entries()) {
            if (!data.used && Date.now() <= data.expiryTime) {
                activeSpins.delete(id);
                console.log(`Deleted old link: ${id}`);
            }
        }

        // Generate new link
        const uniqueId = Math.random().toString(36).substring(7);
        const expiryTime = Date.now() + (5 * 60 * 1000); // 5 minutes

        // Save new link
        activeSpins.set(uniqueId, {
            used: false,
            expiryTime,
            prize: null,
            createdAt: new Date()
        });

        console.log(`Generated new link: ${uniqueId}`);
        console.log('Active spins:', Array.from(activeSpins.keys()));

        res.json({
            success: true,
            spinId: uniqueId,
            spinUrl: `/spin/${uniqueId}`
        });

    } catch (error) {
        console.error('Generate link error:', error);
        res.status(500).json({
            success: false,
            error: 'เกิดข้อผิดพลาดในการสร้างลิงก์'
        });
    }
});

// Validate spin attempt
app.post('/api/spin/:id', (req, res) => {
    try {
        const spinId = req.params.id;
        console.log(`Spin attempt for ID: ${spinId}`);
        console.log('Active spins:', Array.from(activeSpins.keys()));

        // Get spin data
        const spinData = activeSpins.get(spinId);
        console.log('Spin data:', spinData);

        // Validate spin
        if (!spinData) {
            console.log('Spin not found');
            return res.status(400).json({
                success: false,
                error: 'ลิงก์ไม่ถูกต้อง'
            });
        }

        if (spinData.used) {
            console.log('Spin already used');
            return res.status(400).json({
                success: false,
                error: 'ลิงก์นี้ถูกใช้งานไปแล้ว'
            });
        }

        if (Date.now() > spinData.expiryTime) {
            console.log('Spin expired');
            activeSpins.delete(spinId);
            return res.status(400).json({
                success: false,
                error: 'ลิงก์หมดอายุแล้ว'
            });
        }

        // Prize list with weights
        const prizes = [
            { name: 'เลือกได้ทั้งร้าน 1 เมนู', weight: 5 },
            { name: 'ลด 30 บาท', weight: 10 },
            { name: 'ลด 10%', weight: 15 },
            { name: 'ลด 5%', weight: 15 },
            { name: 'ลด 3%', weight: 15 },
            { name: 'ฟรีวิป 1 จุก', weight: 10 },
            { name: 'ฟรีมุก 1 ตัก', weight: 10 },
            { name: 'ฟรีชาเขียว', weight: 10 },
            { name: 'ฟรีชาไทย', weight: 5 },
            { name: 'ฟรีชามะนาว', weight: 5 }
        ];

        // Select random prize with weights
        const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedPrize = prizes[prizes.length - 1].name;

        for (const prize of prizes) {
            if (random < prize.weight) {
                selectedPrize = prize.name;
                break;
            }
            random -= prize.weight;
        }

        console.log(`Selected prize: ${selectedPrize}`);

        // Update spin data
        spinData.used = true;
        spinData.prize = selectedPrize;
        spinData.usedAt = new Date();
        activeSpins.set(spinId, spinData);

        res.json({
            success: true,
            prize: selectedPrize
        });

    } catch (error) {
        console.error('Spin error:', error);
        res.status(500).json({
            success: false,
            error: 'เกิดข้อผิดพลาดในการสุ่มรางวัล'
        });
    }
});

// Validate spin link
app.get('/api/validate-spin/:id', (req, res) => {
    try {
        const spinId = req.params.id;
        console.log(`Validating spin ID: ${spinId}`);
        
        const spinData = activeSpins.get(spinId);
        console.log('Validation data:', spinData);

        if (!spinData) {
            return res.json({
                valid: false,
                error: 'ลิงก์ไม่ถูกต้อง'
            });
        }

        if (spinData.used) {
            return res.json({
                valid: false,
                error: 'ลิงก์นี้ถูกใช้งานไปแล้ว'
            });
        }

        if (Date.now() > spinData.expiryTime) {
            activeSpins.delete(spinId);
            return res.json({
                valid: false,
                error: 'ลิงก์หมดอายุแล้ว'
            });
        }

        res.json({ valid: true });
        
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            valid: false,
            error: 'เกิดข้อผิดพลาดในการตรวจสอบลิงก์'
        });
    }
});

// Clean up expired spins
setInterval(() => {
    const now = Date.now();
    let cleanupCount = 0;
    
    for (const [id, data] of activeSpins.entries()) {
        if (now > data.expiryTime) {
            activeSpins.delete(id);
            cleanupCount++;
        }
    }
    
    if (cleanupCount > 0) {
        console.log(`Cleaned up ${cleanupCount} expired spins`);
    }
}, 60000);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});