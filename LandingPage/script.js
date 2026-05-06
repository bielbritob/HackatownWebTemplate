import { db } from '../firebase.js';
import { collection, getDocs } from "firebase/firestore";

// 1. Defina as variáveis globais aqui (fora de qualquer função)
const container = document.getElementById('produtos-container');
const inputBusca = document.getElementById('search');
const contadorProdutos = document.getElementById('contador-Produtos');


let todosOsProdutos = []; // Essa "caixa" guarda tudo o que vem do Firebase
let lengthProdutos = 0

// 2. Função única que desenha os cards na tela
function renderizarProdutos(lista) {
    container.innerHTML = ""; // Limpa a tela antes de desenhar

    if (lista.length === 0) {
        container.innerHTML = "<p>Nenhum produto encontrado :(</p>";
        return;
    }

    lista.forEach((prod) => {
        // template, nome, desc e preço
        container.innerHTML += `
            <div class="card-container">
                <div class="img-wrapper"><img src="${prod.img}" alt="${prod.nome}"></div>
                <div class="card-body">
                    <h3>${prod.nome}</h3>
                    <p>${prod.desc}</p>
                    <h4>${prod.preco}</h4>
                    <a href="https://wa.me/5569999999999?text=Quero o produto ${prod.nome}" class="btn-wpp">
                        🟢 Pedir via WhatsApp
                    </a>
                </div>
            </div>
        `;
    });
}

// 3. Função que busca no Firebase e salva na "caixa" (todosOsProdutos)
async function carregarDados() {
    container.innerHTML = "<p style='text-align: center'>Carregando produtos...</p>"; // Feedback visual

    try {
        const querySnapshot = await getDocs(collection(db, "produtos"));

        // Transforma os dados em um array comum
        todosOsProdutos = querySnapshot.docs.map(doc => doc.data());

        // Chama a funct
        AtualizarQuantidadeProdutos(todosOsProdutos);

        // Mostra tudo inicialmente
        renderizarProdutos(todosOsProdutos);
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        container.innerHTML = "<p>Erro ao carregar produtos.</p>";
    }
}

// 4. Lógica de Busca (O filtro)
if (inputBusca) { // Verifica se o input existe para não dar erro
    inputBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();

        // Filtra a "caixa" (todosOsProdutos)
        const filtrados = todosOsProdutos.filter(p =>
            p.nome.toLowerCase().includes(termo)
        );

        // Desenha só o que sobrou
        renderizarProdutos(filtrados);
    });
}

function AtualizarQuantidadeProdutos(todosOsProdutos) {
    // Quantidade de Produtos
    lengthProdutos = todosOsProdutos.length
    //console.log(lengthProdutos)
    //console.log(todosOsProdutos);
    contadorProdutos.textContent = lengthProdutos + " Produtos";
    //console.log(contadorProdutos.textContent);
}


// 5. Inicia tudo ao carregar a página
carregarDados();