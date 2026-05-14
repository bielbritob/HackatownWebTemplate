// ==========================================
// CONFIGURAÇÃO DA API
// Altere para o caminho do seu PHP no XAMPP
// ==========================================
const API_URL = '/projeto_php/api/admin_produtos.php';

// ==========================================
// UTILITÁRIOS
// ==========================================
function mostrarNotif(msg) {
    const notif = document.getElementById('notif');
    notif.textContent = msg;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 2800);
}

function atualizarContador(lista) {
    const contador = document.getElementById('contador-admin');
    contador.textContent = lista.length + (lista.length === 1 ? ' produto' : ' produtos');
}

function limparForm() {
    ['nome', 'preco', 'desc', 'img'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

// ==========================================
// 1. LISTAR PRODUTOS
// ==========================================
async function listarProdutos() {
    const container = document.getElementById('tabela-produtos');
    container.innerHTML = '<p style="text-align:center;color:#9ca3af;grid-column:1/-1;">Carregando produtos...</p>';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'listar' })
        });
        const produtos = await response.json();

        atualizarContador(produtos);
        renderizarCards(produtos);
    } catch (error) {
        console.error('Erro ao listar:', error);
        container.innerHTML = '<p style="text-align:center;color:#dc2626;grid-column:1/-1;">Erro ao carregar produtos.</p>';
    }
}

// ==========================================
// 2. RENDERIZAR CARDS NA TELA
// ==========================================
function renderizarCards(produtos) {
    const container = document.getElementById('tabela-produtos');

    if (produtos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📦</span>
                Nenhum produto cadastrado ainda.
            </div>`;
        return;
    }

    container.innerHTML = produtos.map(prod => `
        <div class="card-admin" id="card-${prod.id}">
            <div class="card-img">
                <img
                    src="${prod.img}"
                    alt="${prod.nome}"
                    onerror="this.src='https://via.placeholder.com/300x200?text=Sem+imagem'"
                >
            </div>
            <div class="card-info">
                <h3 title="${prod.nome}">${prod.nome}</h3>
                <p class="desc">${prod.descricao || 'Sem descrição'}</p>
                <div class="preco">R$${prod.preco}</div>
                <div class="card-actions">
                    <button class="btn-del" onclick="deletarProduto(${prod.id})">
                        🗑️ Deletar
                    </button>
                    <button class="btn-edit" onclick="prepararEdicao(${JSON.stringify(prod).replace(/"/g, '&quot;')})">
                        ✏️ Editar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 3. ADICIONAR PRODUTO
// ==========================================
async function adicionarProduto() {
    const nome  = document.getElementById('nome').value.trim();
    const preco = document.getElementById('preco').value.trim();
    const desc  = document.getElementById('desc').value.trim();
    const img   = document.getElementById('img').value.trim();

    if (!nome || !preco) {
        mostrarNotif('⚠️ Nome e preço são obrigatórios!');
        return;
    }

    const dados = {
        action: 'adicionar',
        nome,
        preco,
        desc,
        img
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        const result = await response.json();

        if (result.success) {
            mostrarNotif('✅ Produto adicionado com sucesso!');
            limparForm();
            listarProdutos();
        } else {
            mostrarNotif('❌ Erro ao adicionar produto.');
        }
    } catch (error) {
        console.error('Erro ao adicionar:', error);
        mostrarNotif('❌ Erro de conexão com o servidor.');
    }
}

// ==========================================
// 4. DELETAR PRODUTO
// ==========================================
window.deletarProduto = async (id) => {
    if (!confirm('Certeza que quer excluir este produto?')) return;

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deletar', id })
        });
        mostrarNotif('🗑️ Produto removido.');
        listarProdutos();
    } catch (error) {
        console.error('Erro ao deletar:', error);
        mostrarNotif('❌ Erro ao remover produto.');
    }
};

// ==========================================
// 5. EDITAR PRODUTO
// ==========================================
window.prepararEdicao = async (prod) => {
    const novoNome  = prompt('Novo nome:', prod.nome)        || prod.nome;
    const novoPreco = prompt('Novo preço:', prod.preco)      || prod.preco;
    const novaDesc  = prompt('Nova descrição:', prod.descricao) || prod.descricao;
    const novaImg   = prompt('Nova URL da imagem:', prod.img) || prod.img;

    const dadosEdicao = {
        action: 'editar',
        id:     prod.id,
        nome:   novoNome,
        preco:  novoPreco,
        desc:   novaDesc,
        img:    novaImg
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(dadosEdicao)
        });
        const result = await response.json();

        if (result.success) {
            mostrarNotif('✏️ Produto atualizado!');
            listarProdutos();
        } else {
            mostrarNotif('❌ Erro ao atualizar produto.');
        }
    } catch (error) {
        console.error('Erro ao editar:', error);
        mostrarNotif('❌ Erro de conexão com o servidor.');
    }
};

// ==========================================
// EVENT LISTENERS
// ==========================================
document.getElementById('btn-adicionar').addEventListener('click', adicionarProduto);

// ==========================================
// INICIALIZAÇÃO
// ==========================================
listarProdutos();
