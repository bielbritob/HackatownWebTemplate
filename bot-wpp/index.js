const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { setWhatsAppClient } = require('./clientRegistry');
const { processarMensagem } = require('./ProcesMSG');

const client = new Client({
  authStrategy: new LocalAuth(),
  webVersionCache: {
    type: 'remote',
    remotePath:
      'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1012158737-alpha.html'
  },
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--disable-gpu'
    ]
  }
});

client.on('qr', (qr) => {
  console.log('📱 Escaneie o QR code abaixo com seu WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot conectado e pronto!');
  setWhatsAppClient(client);
  require('./server').startServer();
});

client.on('message', async (msg) => {
  // ignora grupo, != de msg txt e se nao começar com 'olá! Vim pelo...
  if (msg.from.endsWith('@g.us')) return;
  if (msg.type !== 'chat') return;

  const frases = [
    'Olá! Vim pelo site e me interessei pelo produto:',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
  ];
  if (!frases.some(f => msg.body.startsWith(f))) return;
  try {
    await processarMensagem(msg);
  } catch (e) {
    console.error('Erro em processarMensagem:', e);
  }
});

client.on('authenticated', () => {
  console.log('🔐 Autenticado! Carregando...');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Falha na autenticação:', msg);
});

client.on('loading_screen', (percent, message) => {
  console.log('⏳ Carregando:', percent, '%', message);
});

client.on('disconnected', (reason) => {
  console.log('🔌 Desconectado:', reason);
});

client.initialize();

module.exports = { client };
