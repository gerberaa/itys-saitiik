const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = 3000;
const DATA_FILE = 'user_data.json';
const LOG_FILE = 'logs.json';

const DISCORD_CLIENT_ID = '1387893695545610260'; // <-- ВСТАВ СВІЙ
const DISCORD_CLIENT_SECRET = 'dpTGZkKUfbyR5BL8bh_u1FDGbRG_11Nh'; // <-- ВСТАВ СВІЙ
const DISCORD_REDIRECT_URI = 'http://localhost:3000/auth/discord/callback';

app.use(cors());
app.use(express.json());

// Видача статичних файлів (index.html та інше)
app.use(express.static(__dirname));

app.use(session({
  secret: 'tamagirys_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Завантажити дані
app.get('/load', (req, res) => {
  if (!req.session.discord) return res.status(401).json({ error: 'Not authorized' });
  const userId = req.session.discord.id;
  const userFile = `user_data_${userId}.json`;
  if (!fs.existsSync(userFile)) {
    return res.json({});
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
  } catch (e) {
    data = {};
  }
  res.json(data);
});

// Зберегти дані
app.post('/save', (req, res) => {
  logEvent('save_attempt', {
    session: req.session,
    discord: req.session.discord,
    body: req.body
  });
  if (!req.session.discord) {
    logEvent('save_fail', { reason: 'no session.discord' });
    return res.status(401).json({ error: 'Not authorized' });
  }
  const userId = req.session.discord.id;
  const userFile = `user_data_${userId}.json`;
  try {
    fs.writeFileSync(userFile, JSON.stringify(req.body, null, 2));
    logEvent('save_success', { userFile, body: req.body });
    res.json({ status: 'ok' });
  } catch (e) {
    logEvent('save_error', { error: e.toString(), userFile });
    res.status(500).json({ error: 'write error' });
  }
});

// Видача index.html за замовчуванням
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Discord OAuth2: редірект на Discord
app.get('/auth/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify'
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

function logEvent(event, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details
  };
  let logs = [];
  if (fs.existsSync(LOG_FILE)) {
    try {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    } catch (e) { logs = []; }
  }
  logs.push(logEntry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// Discord OAuth2: callback
app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code');
  try {
    // 1. Обміняти code на access_token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
        scope: 'identify'
      })
    });
    const tokenData = await tokenRes.json();
    logEvent('discord_token', tokenData);
    if (!tokenData.access_token) return res.status(400).send('No access_token');
    // 2. Отримати профіль
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const user = await userRes.json();
    logEvent('discord_user', user);
    // 3. Зберегти у сесії
    req.session.discord = {
      id: user.id,
      username: user.username,
      avatar: user.avatar
    };
    // 4. Редірект у гру
    res.redirect('/');
  } catch (e) {
    logEvent('discord_auth_error', { error: e.toString() });
    res.status(500).send('Discord auth error');
  }
});

// API: отримати дані користувача
app.get('/me', (req, res) => {
  if (!req.session.discord) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, user: req.session.discord });
});

app.listen(PORT, () => {
  logEvent('server_start', { message: `Server started on http://localhost:${PORT}` });
}); 