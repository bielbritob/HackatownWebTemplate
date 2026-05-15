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
function formatarPreco(precoStr) {
    if (!precoStr) return null;
    let p = String(precoStr).replace(/R\$/gi, '').replace(/\s/g, '').replace(',', '.');
    let floatVal = parseFloat(p);
    if (isNaN(floatVal)) return null;
    return floatVal.toFixed(2);
}

async function adicionarProduto() {
    const nome  = document.getElementById('nome').value.trim();
    let preco = document.getElementById('preco').value.trim();
    const desc  = document.getElementById('desc').value.trim();
    const img   = document.getElementById('img').value.trim();

    preco = formatarPreco(preco);

    if (!nome || preco === null) {
        mostrarNotif('⚠️ Nome e preço válido (ex: 20.99) são obrigatórios!');
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
            mostrarNotif('❌ Erro: ' + (result.error || result.message || 'Falha ao adicionar.'));
        }
    } catch (error) {
        console.error('Erro ao adicionar:', error);
        mostrarNotif('❌ Erro de conexão com o servidor.');
    }
}

// ==========================================
// 4. DELETAR PRODUTO (VIA MODAL)
// ==========================================
let deleteTargetId = null;
const modalDelete = document.getElementById('modal-delete');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

window.deletarProduto = (id) => {
    deleteTargetId = id;
    modalDelete.classList.remove('hidden');
};

btnCancelDelete.addEventListener('click', () => {
    modalDelete.classList.add('hidden');
    deleteTargetId = null;
});

btnConfirmDelete.addEventListener('click', async () => {
    if (!deleteTargetId) return;

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deletar', id: deleteTargetId })
        });
        mostrarNotif('🗑️ Produto removido.');
        modalDelete.classList.add('hidden');
        listarProdutos();
    } catch (error) {
        console.error('Erro ao deletar:', error);
        mostrarNotif('❌ Erro ao remover produto.');
    }
});

// ==========================================
// 5. EDITAR PRODUTO (VIA MODAL)
// ==========================================
const modalEditar = document.getElementById('modal-editar');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const btnSaveEdit = document.getElementById('btn-save-edit');

window.prepararEdicao = (prod) => {
    document.getElementById('edit-id').value = prod.id;
    document.getElementById('edit-nome').value = prod.nome;
    document.getElementById('edit-preco').value = prod.preco;
    document.getElementById('edit-desc').value = prod.descricao || '';
    document.getElementById('edit-img').value = prod.img || '';

    modalEditar.classList.remove('hidden');
};

btnCancelEdit.addEventListener('click', () => {
    modalEditar.classList.add('hidden');
});

btnSaveEdit.addEventListener('click', async () => {
    const id = document.getElementById('edit-id').value;
    const nome = document.getElementById('edit-nome').value.trim();
    let preco = document.getElementById('edit-preco').value.trim();
    const desc = document.getElementById('edit-desc').value.trim();
    const img = document.getElementById('edit-img').value.trim();

    preco = formatarPreco(preco);

    if (!nome || preco === null) {
        mostrarNotif('⚠️ Nome e preço válido (ex: 20.99) são obrigatórios!');
        return;
    }

    const dadosEdicao = {
        action: 'editar',
        id: id,
        nome: nome,
        preco: preco,
        desc: desc,
        img: img
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(dadosEdicao)
        });
        const result = await response.json();

        if (result.success) {
            mostrarNotif('✏️ Produto atualizado!');
            modalEditar.classList.add('hidden');
            listarProdutos();
        } else {
            mostrarNotif('❌ Erro: ' + (result.error || result.message || 'Falha ao atualizar.'));
        }
    } catch (error) {
        console.error('Erro ao editar:', error);
        mostrarNotif('❌ Erro de conexão com o servidor.');
    }
});

// ==========================================
// EVENT LISTENERS E MÁSCARAS
// ==========================================
document.getElementById('btn-adicionar').addEventListener('click', adicionarProduto);

function maskCurrency(e) {
    let val = e.target.value;
    // Permite apenas números, ponto e vírgula
    val = val.replace(/[^0-9.,]/g, '');
    e.target.value = val;
}

document.getElementById('preco').addEventListener('input', maskCurrency);
document.getElementById('edit-preco').addEventListener('input', maskCurrency);

// ==========================================
// INICIALIZAÇÃO
// ==========================================
listarProdutos();
