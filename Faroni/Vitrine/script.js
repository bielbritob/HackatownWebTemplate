// 1. Definição das variáveis globais
const container = document.getElementById('produtos-container');
const inputBusca = document.getElementById('search');
const contadorProdutos = document.getElementById('contador-Produtos');

let todosOsProdutos = [];

// 2. Função única que desenha os cards na tela (Permanece quase igual)
function renderizarProdutos(lista) {
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>Nenhum produto encontrado :(</p>";
    return;
  }

  lista.forEach((prod) => {
    const texto = `Olá! Vim pelo site e me interessei pelo produto: *${prod.nome}* (R$ ${prod.preco}) `;
    const linkWpp = `https://wa.me/5569993652104?text=${encodeURIComponent(texto)}`;

    container.innerHTML += `
            <div class="card-container">
                <div class="img-wrapper"><img src="${prod.img}" alt="${prod.nome}"></div>
                <div class="card-body">
                    <h3>${prod.nome}</h3>
                    <p>${prod.descricao}</p>
                    <h4>R$${prod.preco}</h4>
                    <a href="${linkWpp}" class="btn-wpp" target="_blank">
                        🟢 Pedir via WhatsApp
                    </a>
                </div>
            </div>
        `;
  });
}

// 3. Função adaptada para MySQL Local via PHP
async function carregarDados() {
  container.innerHTML = "<p style='text-align: center; min-height: 500px;'>Carregando produtos...</p>";

  try {
    // Altere a URL para o caminho do seu arquivo PHP no XAMPP //FETCH ADAPTADO PARA TMOLE!!!!
    const response = await fetch('/projeto_php/api/get_produtos.php');

    if (!response.ok) throw new Error('Falha ao conectar com o servidor');

    todosOsProdutos = await response.json();

    AtualizarQuantidadeProdutos(todosOsProdutos);
    renderizarProdutos(todosOsProdutos);
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    container.innerHTML = "<p>Erro ao carregar produtos do banco MySQL.</p>";
  }
}

// 4. Lógica de Busca (Permanece igual)
if (inputBusca) {
  inputBusca.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrados = todosOsProdutos.filter(p =>
      p.nome.toLowerCase().includes(termo)
    );
    renderizarProdutos(filtrados);
  });
}

function AtualizarQuantidadeProdutos(lista) {
  contadorProdutos.textContent = lista.length + " Produtos";
}

// 5. Inicia tudo
carregarDados();
