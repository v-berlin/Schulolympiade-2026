const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.static('public'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Success Emoji Server läuft auf Port ${PORT}`);
});
