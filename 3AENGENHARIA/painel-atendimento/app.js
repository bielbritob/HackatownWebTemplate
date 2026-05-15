(function () {
  const API = '';

  let selectedNumero = null;
  let pollTimer = null;
  let lastRows = [];
  let atendenteNome = localStorage.getItem('atendenteNome') || '';
  let activeFilter = 'todas';
  let lastRenderedNumero = null;
  let lastMessagesCount = 0;

  const elLista = document.getElementById('lista-conversas');
  const elChatHead = document.getElementById('chat-head');
  const elMensagens = document.getElementById('mensagens');
  const elComposer = document.getElementById('composer');
  const elInput = document.getElementById('input-msg');
  const btnEnviar = document.getElementById('btn-enviar');
  const btnAssumir = document.getElementById('btn-assumir');
  const btnResolver = document.getElementById('btn-resolver');
  const elIndicator = document.getElementById('new-messages-indicator');

  elIndicator.addEventListener('click', () => {
    elMensagens.scrollTop = elMensagens.scrollHeight;
    elIndicator.classList.add('hidden');
  });

  elMensagens.addEventListener('scroll', () => {
    const isNearBottom = elMensagens.scrollHeight - elMensagens.scrollTop <= elMensagens.clientHeight + 50;
    if (isNearBottom) {
      elIndicator.classList.add('hidden');
    }
  });

  // Elementos do Login
  const loginOverlay = document.getElementById('login-overlay');
  const inputAtendente = document.getElementById('atendente-nome');
  const btnEntrar = document.getElementById('btn-entrar');
  const displayNome = document.getElementById('display-nome');

  function initAuth() {
    if (atendenteNome) {
      loginOverlay.classList.add('hidden');
      displayNome.textContent = atendenteNome;
    } else {
      loginOverlay.classList.remove('hidden');
    }

    btnEntrar.addEventListener('click', () => {
      const val = inputAtendente.value.trim();
      if (val) {
        atendenteNome = val;
        localStorage.setItem('atendenteNome', val);
        loginOverlay.classList.add('hidden');
        displayNome.textContent = val;
      } else {
        alert('Por favor, informe seu nome.');
      }
    });

    inputAtendente.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnEntrar.click();
    });
  }

  initAuth();

  function initFilters() {
    const badges = document.querySelectorAll('.filter-badge');
    badges.forEach(b => {
      b.addEventListener('click', (e) => {
        badges.forEach(badge => badge.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeFilter = e.currentTarget.textContent.toLowerCase().includes('quentes') ? 'quentes' : 'todas';
        renderLista(lastRows);
      });
    });
  }
  
  initFilters();

  function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function labelStatus(s) {
    const map = { bot: '🤖 Bot', aguardando: '⏳ Aguardando', humano: '👤 Humano', resolvido: '✅ Resolvido' };
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
    const filteredRows = (rows || []).filter(c => activeFilter === 'todas' || (activeFilter === 'quentes' && c.temperatura === 'quente'));

    if (!filteredRows.length) {
      elLista.innerHTML = '<div class="empty-lista">Nenhuma conversa encontrada.</div>';
      return;
    }
    elLista.innerHTML = filteredRows
      .map((c) => {
        const ativo = c.numero === selectedNumero ? ' ativo' : '';
        const naoLidas = Number(c.nao_lidas) > 0 ? `<span class="badge badge-novas">${c.nao_lidas}</span>` : '';
        const temp = c.temperatura === 'quente' ? 'badge-quente' : 'badge-frio';
        const tempLabel = c.temperatura === 'quente' ? '🔥 Quente' : '❄️ Frio';
        const numDisplay = String(c.numero).replace('@c.us', '');
        const nomeDisplay = String(c.nome);
        return `
        <div class="item-conversa${ativo}" data-numero="${encodeURIComponent(c.numero)}">
          <div class="item-top">
            <span class="item-numero">${escapeHtml(numDisplay)}</span>
            <span class="item-time">${fmtTime(c.ultima_mensagem_em)}</span>
          </div>
          <div class="item-name">~${escapeHtml(nomeDisplay)}</div>
          <div class="item-produto">📦 ${escapeHtml(c.produto || 'Sem produto identificado')}</div>
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

        // Abre o chat no mobile
        document.querySelector('.app').classList.add('chat-mobile-ativo');

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

  function formatWhatsAppText(text) {
    let html = escapeHtml(text || '');
    // WhatsApp Markdown: *bold*, _italic_, ~strike~
    html = html.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    html = html.replace(/~(.*?)~/g, '<del>$1</del>');
    return html.replace(/\n/g, '<br/>');
  }

  function renderMensagens(payload) {
    const { atendimento, mensagens } = payload;
    const numDisplay = String(payload.numero).replace('@c.us', '');
    const nomeDisplay = String(payload.nome);

    const isFirstLoad = (lastRenderedNumero !== payload.numero);
    if (isFirstLoad) {
      lastRenderedNumero = payload.numero;
      lastMessagesCount = 0;
    }
    elChatHead.innerHTML = `
    <div class="chat-head-inner">
      <button id="btn-voltar" class="btn btn-ghost" style="padding: 5px 10px; border: none; font-size: 1.2rem; display: none;"> ← </button>

      <div style="flex: 1;">
        <div style="display: flex; gap: 8px; align-items: baseline;">
          <div class="chat-title">${escapeHtml(numDisplay)}</div>
          <div class="chat-nome">~${escapeHtml(nomeDisplay)}</div>
        </div>
        <div class="chat-meta">
          📦 ${escapeHtml(atendimento.produto || 'Produto não informado')} · ${labelStatus(atendimento.status)}
          · ${atendimento.temperatura === 'quente' ? '🔥 Quente' : '❄️ Frio'}
        </div>
      </div>
    </div>`;

    // Lógica do botão voltar (executa apenas se estiver no mobile)
    const btnVoltar = document.getElementById('btn-voltar');
    if (window.innerWidth <= 768) {
      btnVoltar.style.display = 'block';
      btnVoltar.onclick = () => {
        document.querySelector('.app').classList.remove('chat-mobile-ativo');
        selectedNumero = null; // Opcional: limpa seleção ao voltar
      };
    }

    if (!mensagens || !mensagens.length) {
      elMensagens.innerHTML = '<div class="empty-chat">Sem mensagens nesta conversa.</div>';
    } else {
      elMensagens.innerHTML = mensagens
        .map((m) => {
          // Ajusta a classe se a mensagem for do atendente (atendente vs bot)
          let tipo = m.de;
          let nomeExibicao = m.de;

          if (m.de === 'atendente' || m.de === 'bot') {
              if (m.texto.includes('Olá, me chamo') || m.de === 'atendente') {
                  tipo = 'atendente';
                  nomeExibicao = 'Atendente';
              } else {
                  tipo = 'bot';
                  nomeExibicao = '🤖 Bot';
              }
          } else {
              nomeExibicao = 'Cliente';
          }

          return `
          <div class="msg ${tipo}">
            <div>${formatWhatsAppText(m.texto)}</div>
            <div class="msg-meta">${nomeExibicao} · ${fmtTime(m.criado_em)}</div>
          </div>`;
        })
        .join('');
    }

    if (isFirstLoad) {
      // Primeira carga: rola para o final sem mostrar indicador
      setTimeout(() => {
        elMensagens.scrollTop = elMensagens.scrollHeight;
        elIndicator.classList.add('hidden');
      }, 10);
    } else {
      // Tick de atualização: se chegaram novas mensagens
      const novasMensagens = (mensagens && mensagens.length > lastMessagesCount);
      if (novasMensagens) {
        const isNearBottom = elMensagens.scrollHeight - elMensagens.scrollTop <= elMensagens.clientHeight + 50;
        if (!isNearBottom) {
          elIndicator.classList.remove('hidden'); // Exibe o botão flutuante se não estiver no final
        } else {
          // Se o usuário está colado embaixo e o contato envia algo, rola o pouquinho que falta
          setTimeout(() => {
            elMensagens.scrollTop = elMensagens.scrollHeight;
          }, 10);
        }
      }
    }
    
    if (mensagens) {
      lastMessagesCount = mensagens.length;
    }

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

    // 1. Localiza o objeto da conversa na lista carregada para pegar o nome
    const conversaAtual = lastRows.find(c => c.numero === selectedNumero);
    const nomeCliente = conversaAtual ? conversaAtual.nome : 'Cliente';

    const encNumero = encodeURIComponent(selectedNumero);
    const encNome = encodeURIComponent(nomeCliente);

    // 2. Monta a URL enviando o nome como Query Parameter
    const data = await fetchJson(`/api/conversa/${encNumero}?nome=${encNome}`);

    renderMensagens(data);
  }

  async function tick() {
    try {
      await loadLista();
      if (selectedNumero) {
        await loadConversa();
      } else {
        elChatHead.innerHTML = `
          <div class="chat-head-placeholder">
            <div class="placeholder-icon">💬</div>
            <span>Selecione uma conversa na lista para começar</span>
          </div>`;
        elMensagens.innerHTML = '';
        elComposer.hidden = true;
      }
    } catch (e) {
      console.warn(e);
      elLista.innerHTML = `<div class="empty-lista">Não foi possível falar com a API.<br/>Verifique se o bot está rodando.</div>`;
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
      setTimeout(() => {
        elMensagens.scrollTop = elMensagens.scrollHeight;
        elIndicator.classList.add('hidden');
      }, 10);
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

      // Envio automático da apresentação do atendente
      if (atendenteNome) {
        const txtApresentacao = `Olá, me chamo ${atendenteNome} e vou continuar o seu atendimento! 🚀`;
        await fetchJson('/api/responder', {
          method: 'POST',
          body: JSON.stringify({ numero: selectedNumero, texto: txtApresentacao })
        });
      }

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
