/** Evita dependência circular entre index.js, server.js e ProcesMSG.js */
let waClient = null;

function setWhatsAppClient(client) {
  waClient = client;
}

function getWhatsAppClient() {
  return waClient;
}

module.exports = { setWhatsAppClient, getWhatsAppClient };
