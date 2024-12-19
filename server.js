const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

// Enable CORS
app.use(cors({
    origin: 'https://spin.kamnuantech.com',
    methods: ['GET', 'POST'],
    credentials: true
}));

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Store active links (should be replaced with database in production)
const activeLinks = new Map();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/spin/:id', (req, res) => {
    const linkData = activeLinks.get(req.params.id);
    
    if (!linkData) {
        res.status(404).sendFile(path.join(__dirname, 'public', 'error.html'));
        return;
    }

    if (linkData.used) {
        res.status(400).sendFile(path.join(__dirname, 'public', 'used.html'));
        return;
    }

    if (Date.now() > linkData.expiryTime) {
        activeLinks.delete(req.params.id);
        res.status(400).sendFile(path.join(__dirname, 'public', 'expired.html'));
        return;
    }

    res.sendFile(path.join(__dirname, 'public', 'spin.html'));
});

// API Routes
app.post('/api/generate-link', (req, res) => {
    try {
        const uniqueId = Math.random().toString(36).substr(2, 9);
        const link = `https://spin.kamnuantech.com/spin/${uniqueId}`;
        const expiryTime = Date.now() + (5 * 60 * 1000); // 5 minutes

        activeLinks.set(uniqueId, {
            used: false,
            expiryTime,
            prize: null,
            fullLink: link,
            createdAt: new Date()
        });

        res.json({
            success: true,
            uniqueId,
            link,
            expiryTime
        });
    } catch (error) {
        console.error('Error generating link:', error);
        res.status(500).json({
            success: false,
            error: 'เกิดข้อผิดพลาดในการสร้างลิงก์'
        });
    }
});

app.get('/api/check-link/:id', (req, res) => {
    try {
        const linkData = activeLinks.get(req.params.id);
        
        if (!linkData) {
            return res.json({ 
                valid: false, 
                message: 'ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว' 
            });
        }

        if (linkData.used) {
            return res.json({ 
                valid: false, 
                message: 'ลิงก์นี้ถูกใช้งานไปแล้ว',
                usedAt: linkData.usedAt,
                prize: linkData.prize 
            });
        }

        if (Date.now() > linkData.expiryTime) {
            activeLinks.delete(req.params.id);
            return res.json({ 
                valid: false, 
                message: 'ลิงก์หมดอายุแล้ว' 
            });
        }

        res.json({ 
            valid: true,
            expiresIn: Math.floor((linkData.expiryTime - Date.now()) / 1000)
        });
    } catch (error) {
        console.error('Error checking link:', error);
        res.status(500).json({
            success: false,
            error: 'เกิดข้อผิดพลาดในการตรวจสอบลิงก์'
        });
    }
});

app.post('/api/spin/:id', async (req, res) => {
    try {
        const linkData = activeLinks.get(req.params.id);
        
        if (!linkData) {
            return res.status(400).json({ 
                success: false,
                error: 'ลิงก์ไม่ถูกต้อง' 
            });
        }

        if (linkData.used) {
            return res.status(400).json({ 
                success: false,
                error: 'ลิงก์นี้ถูกใช้งานไปแล้ว',
                usedAt: linkData.usedAt,
                prize: linkData.prize 
            });
        }

        if (Date.now() > linkData.expiryTime) {
            activeLinks.delete(req.params.id);
            return res.status(400).json({ 
                success: false,
                error: 'ลิงก์หมดอายุแล้ว' 
            });
        }

        const prizes = [
            { name: 'เลือกได้ทั้งร้าน 1 เมนู', probability: 5 },
            { name: 'ลด 30 บาท', probability: 10 },
            { name: 'ลด 10%', probability: 15 },
            { name: 'ลด 5%', probability: 15 },
            { name: 'ลด 3%', probability: 15 },
            { name: 'ฟรีวิป 1 จุก', probability: 10 },
            { name: 'ฟรีมุก 1 ตัก', probability: 10 },
            { name: 'ฟรีชาเขียว', probability: 10 },
            { name: 'ฟรีชาไทย', probability: 5 },
            { name: 'ฟรีชามะนาว', probability: 5 }
        ];

        // Weighted random selection
        const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
        let random = Math.random() * totalProbability;
        let selectedPrize = prizes[prizes.length - 1].name; // Default to last prize

        for (const prize of prizes) {
            if (random < prize.probability) {
                selectedPrize = prize.name;
                break;
            }
            random -= prize.probability;
        }

        // Update link data
        linkData.used = true;
        linkData.prize = selectedPrize;
        linkData.usedAt = new Date();

        res.json({
            success: true,
            prize: selectedPrize,
            message: 'สุ่มรางวัลสำเร็จ'
        });

    } catch (error) {
        console.error('Error spinning wheel:', error);
        res.status(500).json({
            success: false,
            error: 'เกิดข้อผิดพลาดในการสุ่มรางวัล'
        });
    }
});

// Admin routes
app.get('/api/admin/links', (req, res) => {
    try {
        const linksData = Array.from(activeLinks.entries()).map(([id, data]) => ({
            id,
            ...data,
            isExpired: Date.now() > data.expiryTime
        }));

        res.json({
            success: true,
            links: linksData
        });
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({
            success: false,
            error: 'เกิดข้อผิดพลาดในการดึงข้อมูลลิงก์'
        });
    }
});

// Clean up expired links periodically
setInterval(() => {
    try {
        const now = Date.now();
        let deletedCount = 0;
        
        for (const [id, data] of activeLinks.entries()) {
            if (now > data.expiryTime) {
                activeLinks.delete(id);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            console.log(`Cleaned up ${deletedCount} expired links`);
        }
    } catch (error) {
        console.error('Error cleaning up expired links:', error);
    }
}, 60000); // Run every minute

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'error.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});