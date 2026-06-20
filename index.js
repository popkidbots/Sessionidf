const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
let code = require('./pair');
require('events').EventEmitter.defaultMaxListeners = 500;

app.use('/code', code);

// Health check for Render
app.get('/health', (req, res) => res.sendStatus(200));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});

app.get('/pair', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.get('/xbt', (req, res) => {
  res.sendFile(path.join(__dirname, 'xbt.html'));
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nDeployment Successful!\n\nnebula-assassin-Server Running on http://0.0.0.0:` + PORT);
});

module.exports = app;
