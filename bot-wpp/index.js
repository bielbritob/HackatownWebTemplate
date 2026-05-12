const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(), // salva sessão, não precisa escanear toda vez
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

// Mostra QR code no terminal pra você escanear
client.on('qr', (qr) => {
  console.log('📱 Escaneie o QR code abaixo com seu WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot conectado e pronto!');
});

// Aqui é onde toda mensagem chega
client.on('message', async (msg) => {
  await processarMensagem(msg);
});

client.initialize();