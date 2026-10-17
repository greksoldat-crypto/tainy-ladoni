const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname)));

app.post('/api/lead', async (req, res) => {
  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: 'Server is not configured.' });
  }

  const name = String(req.body?.name || '').trim().slice(0, 120);
  const contact = String(req.body?.contact || '').trim().slice(0, 200);
  const topic = String(req.body?.topic || '').trim().slice(0, 160);
  const message = String(req.body?.message || '').trim().slice(0, 1000);

  if (!name || !contact || !topic) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  // Escape HTML so user-submitted text cannot be interpreted as Telegram markup.
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const text =
    '<b>🔔 Новая заявка с сайта «Тайны ладони»</b>\n\n' +
    '<b>👤 Имя:</b> ' + esc(name) + '\n' +
    '<b>📱 Контакт:</b> ' + esc(contact) + '\n' +
    '<b>📌 Тема:</b> ' + esc(topic) + '\n' +
    '<b>💬 Вопрос:</b> ' + esc(message || 'не указан');

  try {
    const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
    });
    const tgResult = await tgResponse.json();
    if (!tgResponse.ok || !tgResult.ok) {
      console.error('Telegram API returned an error:', tgResult.description || tgResponse.status);
      return res.status(502).json({ error: 'Telegram delivery failed.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Telegram request failed:', err.message);
    return res.status(502).json({ error: 'Telegram delivery failed.' });
  }
});

app.listen(PORT, () => console.log(`Site listening on port ${PORT}`));
