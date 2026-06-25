const { spawn } = require('child_process');
const qrcode = require('qrcode-terminal');

console.log("🚀 Iniciando Tunnelmole e gerando QR Code clicável...");

const tmole = spawn('tmole', ['5173'], { shell: true });

tmole.stdout.on('data', (data) => {
  let output = data.toString();

  // Remove ANSI escape codes para garantir que a URL saia limpa
  output = output.replace(/\x1b\[[0-9;]*m/g, '');

  // Regex melhorada para pegar a URL limpa
  const urlRegex = /(https:\/\/[^\s]+(?:holeo\.site|tunnelmole\.net|tunnelmole\.com))/g;
  const match = output.match(urlRegex);

  if (match) {
    // Limpamos a URL de qualquer resquício de texto do terminal
    const baseUrl = match[0].trim();
    const fullUrl = `${baseUrl}/3aengenharia/landing/index.html`; // 3a eng

    console.log("\n" + "=".repeat(40));
    console.log("✅ LINK PRONTO PARA CELULAR!");
    console.log("🔗 " + fullUrl);
    console.log("=".repeat(40) + "\n");

    // 'small: false' gera um QR maior e mais fácil de ler pelo celular (evita que a câmera leia como texto/OCR)
    qrcode.generate(fullUrl, { small: false });

    console.log("\n📱 Aponte a câmera (deve aparecer 'Abrir Link')");
  }
});

tmole.stderr.on('data', (data) => {
  if (!data.includes('Update available')) { // ignora avisos de update
    console.error(`Erro: ${data}`);
  }
});
