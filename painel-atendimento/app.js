(function () {
  const API = '';

  let selectedNumero = null;
  let pollTimer = null;
  let lastRows = [];

  const elLista = document.getElementById('lista-conversas');
  const elChatHead = document.getElementById('chat-head');
  const elMensagens = document.getElementById('mensagens');
  const elComposer = document.getElementById('composer');
  const elInput = document.getElementById('input-msg');
  const btnEnviar = document.getElementById('btn-enviar');
  const btnAssumir = document.getElementById('btn-assumir');
  const btnResolver = document.getElementById('btn-resolver');

  function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function labelStatus(s) {
    const map = { bot: 'Bot', aguardando: 'Aguardando', humano: 'Humano', resolvido: 'Resolvido' };
    return map[s] || s;
  }

  async function fetchJson(url, opts) {
    const r = await fetch(API + url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts && opts.headers) }
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || r.statusText);
    return data;
  }

  function renderLista(rows) {
    if (!rows || !rows.length) {
      elLista.innerHTML = '<div class="empty-lista">Nenhuma conversa ainda.</div>';
      return;
    }
    elLista.innerHTML = rows
      .map((c) => {
        const ativo = c.numero === selectedNumero ? ' ativo' : '';
        const naoLidas = Number(c.nao_lidas) > 0 ? `<span class="badge badge-novas">${c.nao_lidas}</span>` : '';
        const temp = c.temperatura === 'quente' ? 'badge-quente' : 'badge-frio';
        const tempLabel = c.temperatura === 'quente' ? 'Quente' : 'Frio';
        const numDisplay = String(c.numero).replace('@c.us', '');
        return `
        <div class="item-conversa${ativo}" data-numero="${encodeURIComponent(c.numero)}">
          <div class="item-top">
            <span class="item-numero">${escapeHtml(numDisplay)}</span>
            <span class="item-time">${fmtTime(c.ultima_mensagem_em)}</span>
          </div>
          <div class="item-produto">${escapeHtml(c.produto || '— sem produto —')}</div>
          <div class="item-badges">
            <span class="badge ${temp}">${tempLabel}</span>
            <span class="badge badge-status">${labelStatus(c.status)}</span>
            ${naoLidas}
          </div>
        </div>`;
      })
      .join('');

    elLista.querySelectorAll('.item-conversa').forEach((node) => {
      node.addEventListener('click', () => {
        selectedNumero = decodeURIComponent(node.getAttribute('data-numero'));
        renderLista(lastRows);
        loadConversa();
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMensagens(payload) {
    const { atendimento, mensagens } = payload;
    const numDisplay = String(payload.numero).replace('@c.us', '');
    elChatHead.innerHTML = `
      <div class="chat-head-inner">
        <div class="chat-title">${escapeHtml(numDisplay)}</div>
        <div class="chat-meta">
          ${escapeHtml(atendimento.produto || 'Produto não informado')}
          · ${labelStatus(atendimento.status)}
          · ${atendimento.temperatura === 'quente' ? '🔥 Quente' : '❄️ Frio'}
        </div>
      </div>`;

    if (!mensagens || !mensagens.length) {
      elMensagens.innerHTML = '<div class="empty-chat">Sem mensagens nesta conversa.</div>';
    } else {
      elMensagens.innerHTML = mensagens
        .map(
          (m) => `
        <div class="msg ${m.de}">
          <div>${escapeHtml(m.texto).replace(/\n/g, '<br/>')}</div>
          <div class="msg-meta">${m.de} · ${fmtTime(m.criado_em)}</div>
        </div>`
        )
        .join('');
    }
    elMensagens.scrollTop = elMensagens.scrollHeight;

    elComposer.hidden = false;
    const st = atendimento.status;
    btnAssumir.disabled = st === 'humano';
    btnResolver.disabled = st === 'resolvido';
    btnEnviar.disabled = st !== 'humano';
    elInput.disabled = st !== 'humano';
  }

  async function loadLista() {
    const rows = await fetchJson('/api/conversas');
    lastRows = rows;
    renderLista(rows);
  }

  async function loadConversa() {
    if (!selectedNumero) return;
    const enc = encodeURIComponent(selectedNumero);
    const data = await fetchJson('/api/conversa/' + enc);
    renderMensagens(data);
  }

  async function tick() {
    try {
      await loadLista();
      if (selectedNumero) {
        await loadConversa();
      } else {
        elChatHead.innerHTML =
          '<div class="chat-head-placeholder"><span>Selecione uma conversa na lista</span></div>';
        elMensagens.innerHTML = '';
        elComposer.hidden = true;
      }
    } catch (e) {
      console.warn(e);
      elLista.innerHTML = `<div class="empty-lista">Não foi possível falar com a API. Abra o painel em<br/>
        <strong>http://localhost:3000/painel-atendimento/index.html</strong><br/>com o bot rodando (<code>node index.js</code>).</div>`;
    }
  }

  btnEnviar.addEventListener('click', async () => {
    const texto = elInput.value.trim();
    if (!texto || !selectedNumero) return;
    try {
      await fetchJson('/api/responder', {
        method: 'POST',
        body: JSON.stringify({ numero: selectedNumero, texto })
      });
      elInput.value = '';
      await loadConversa();
      await loadLista();
    } catch (e) {
      alert(e.message);
    }
  });

  btnAssumir.addEventListener('click', async () => {
    if (!selectedNumero) return;
    try {
      const enc = encodeURIComponent(selectedNumero);
      await fetchJson('/api/assumir/' + enc, { method: 'POST' });
      await loadConversa();
      await loadLista();
    } catch (e) {
      alert(e.message);
    }
  });

  btnResolver.addEventListener('click', async () => {
    if (!selectedNumero) return;
    try {
      const enc = encodeURIComponent(selectedNumero);
      await fetchJson('/api/resolver/' + enc, { method: 'POST' });
      await loadConversa();
      await loadLista();
    } catch (e) {
      alert(e.message);
    }
  });

  elInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      btnEnviar.click();
    }
  });

  tick();
  pollTimer = setInterval(tick, 2000);
})();
