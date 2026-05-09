const API_URL = 'http://localhost/projeto_01_hackatown/api/admin_produtos.php';

// 1. Listar Produtos
async function listarProdutosAdmin() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'listar' })
        });
        const produtos = await response.json();

        const container = document.getElementById('tabela-produtos');
        container.innerHTML = "";

        produtos.forEach((prod) => {
            container.innerHTML += `
                <div class="card-admin">
                 <div class="img-wrapper" style="width: 40px; hepx; margin: 0 auto">
                    <img src="${prod.img}" alt="${prod.nome}">
                 </div>
                    <h4>${prod.nome}</h4>
                    <h4>${prod.desc}</h4>
                    <p>Preço: ${prod.preco}</p>
                    <button onclick="deletarProduto(${prod.id})">🗑️ Deletar</button>
                    <button onclick="prepararEdicao(${JSON.stringify(prod).replace(/"/g, '&quot;')})">✏️ Editar Completo</button>
                </div>
            `;
        });
    } catch (error) {
        console.error("Erro ao listar:", error);
    }
}

// 2. Adicionar Produto
async function adicionarProduto(event) {
    event.preventDefault();

    const dados = {
        action: 'adicionar',
        nome: document.getElementById('nome').value,
        preco: document.getElementById('preco').value,
        desc: document.getElementById('desc').value,
        img: document.getElementById('img').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        const result = await response.json();

        if (result.success) {
            alert("Produto cadastrado com sucesso!");
            document.getElementById('form-produto').reset(); // Limpa o form
            listarProdutosAdmin();
        }
    } catch (error) {
        console.error("Erro ao adicionar:", error);
    }
}

// 3. Deletar Produto
window.deletarProduto = async (id) => {
    if (confirm("Certeza que quer excluir este produto?")) {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'deletar', id: id })
        });
        listarProdutosAdmin();
    }
};

// 4. Editar Produto (Modificando todas as strings)
window.prepararEdicao = async (prod) => {
    const novoNome = prompt("Novo nome:", prod.nome) || prod.nome;
    const novoPreco = prompt("Novo preço:", prod.preco) || prod.preco;
    const novaDesc = prompt("Nova descrição:", prod.descricao) || prod.descricao;
    const novaImg = prompt("Nova URL da imagem:", prod.img) || prod.img;

    const dadosEdicao = {
        action: 'editar',
        id: prod.id,
        nome: novoNome,
        preco: novoPreco,
        desc: novaDesc,
        img: novaImg
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(dadosEdicao)
        });
        const result = await response.json();
        if (result.success) {
            alert("Produto atualizado!");
            listarProdutosAdmin();
        }
    } catch (error) {
        console.error("Erro ao editar:", error);
    }
};

// Event Listeners
document.getElementById('btn-adicionar').addEventListener('click', adicionarProduto);

// Inicialização
listarProdutosAdmin();