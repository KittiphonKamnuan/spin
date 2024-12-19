// server.js
const express = require('express');
const app = express();
const path = require('path');

// เพื่อจัดเก็บข้อมูลลิงก์ชั่วคราว (ในการใช้งานจริงควรใช้ฐานข้อมูล)
const activeLinks = new Map();

app.use(express.static('public'));
app.use(express.json());

// API สร้างลิงก์ใหม่
app.post('/api/generate-link', (req, res) => {
    const uniqueId = Math.random().toString(36).substr(2, 9);
    const expiryTime = Date.now() + (5 * 60 * 1000); // 5 นาที

    activeLinks.set(uniqueId, {
        used: false,
        expiryTime,
        prize: null
    });

    res.json({
        uniqueId,
        expiryTime
    });
});

// หน้าสุ่มรางวัล
app.get('/spin/:id', (req, res) => {
    const linkData = activeLinks.get(req.params.id);
    
    if (!linkData) {
        res.status(404).send('ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว');
        return;
    }

    if (linkData.used) {
        res.status(400).send('ลิงก์นี้ถูกใช้งานไปแล้ว');
        return;
    }

    if (Date.now() > linkData.expiryTime) {
        activeLinks.delete(req.params.id);
        res.status(400).send('ลิงก์หมดอายุแล้ว');
        return;
    }

    res.sendFile(path.join(__dirname, 'public', 'spin.html'));
});

// API สำหรับสุ่มรางวัล
app.post('/api/spin/:id', (req, res) => {
    const linkData = activeLinks.get(req.params.id);
    
    if (!linkData || linkData.used || Date.now() > linkData.expiryTime) {
        res.status(400).json({ error: 'ลิงก์ไม่ถูกต้อง หมดอายุ หรือถูกใช้งานแล้ว' });
        return;
    }

    const prizes = [
        'เลือกได้ทั้งร้าน 1 เมนู',
        'ลด 30 บาท',
        'ลด 10%',
        'ลด 5%',
        'ลด 3%',
        'ฟรีวิป 1 จุก',
        'ฟรีมุก 1 ตัก',
        'ฟรีชาเขียว',
        'ฟรีชาไทย',
        'ฟรีชามะนาว'
    ];

    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    linkData.used = true;
    linkData.prize = randomPrize;

    res.json({ prize: randomPrize });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});