const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;


const cors = require('cors');
app.use(cors());


app.use(express.static(path.join(__dirname, 'public')));


app.get('/api/csv', (req, res) => {
    try {
        const csvPath = path.join(__dirname, 'Table_Input.csv');
        const csvData = fs.readFileSync(csvPath, 'utf8');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csvData);
    } catch (error) {
        console.error('Error reading CSV file:', error);
        res.status(500).json({ error: 'Failed to read CSV file' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 CSV API available at http://localhost:${PORT}/api/csv`);
});
