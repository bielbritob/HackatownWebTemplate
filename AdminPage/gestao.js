import { db } from '../firebase.js';
import { collection, getDocs, deleteDoc, doc, updateDoc, addDoc } from "firebase/firestore";

// Função para listar os produtos na tela de admin
async function listarProdutosAdmin() {
    const querySnapshot = await getDocs(collection(db, "produtos"));
    const container = document.getElementById('tabela-produtos');
    container.innerHTML = "";

    querySnapshot.forEach((doc) => {
        const prod = doc.data();
        const id = doc.id; // O ID do documento é essencial!

        container.innerHTML += `
            <div class="card-admin">
                <h3>${prod.nome}</h3>
                <button onclick="deletarProduto('${id}')">🗑️ Deletar</button>
                <button onclick="editarProduto('${id}', '${prod.nome}')">✏️ Editar</button>
            </div>
        `;
    });
}


// Lógica de Adicionar
async function adicionarProduto() {
    event.preventDefault() //previni recarregamento da page
    // 1. Pegar os valores dos inputs lá no seu HTML
    const nome = document.getElementById('nome').value;
    const preco = document.getElementById('preco').value;
    const desc = document.getElementById('desc').value;
    const img = document.getElementById('img').value;

    // 2. Criar o "JSON" (Objeto JavaScript)
    const novoProduto = {
        nome: nome,
        preco: preco,
        desc: desc,
        img: img,
        dataCriacao: new Date() // Dica: sempre bom salvar a data
    };

    // 3. Tentar salvar no Firestore
    try {
        // A mágica: collection(db, "nomeDaColecao")
        const docRef = await addDoc(collection(db, "produtos"), novoProduto);

        console.log("Produto adicionado com ID: ", docRef.id);
        alert("Sucesso! Produto cadastrado.");

        // Limpar campos após salvar
        document.getElementById('nome').value = "";
        document.getElementById('preco').value = "";
        document.getElementById('desc').value = "";
        document.getElementById('img').value = "";
    } catch (e) {
        console.error("Erro ao adicionar produto: ", e);
    }
}

// Vincula a função ao botão
document.getElementById('btn-adicionar').addEventListener('click', adicionarProduto);

// Lógica de DELETAR
window.deletarProduto = async (id) => {
    if (confirm("Certeza que quer excluir este produto?")) {
        await deleteDoc(doc(db, "produtos", id));
        listarProdutosAdmin(); // Recarrega a lista
    }
};

// Lógica de ATUALIZAR (exemplo básico)
window.editarProduto = async (id, nomeAtual) => {
    const novoNome = prompt("Novo nome para " + nomeAtual + ":");
    if (novoNome) {
        await updateDoc(doc(db, "produtos", id), {
            nome: novoNome
        });
        listarProdutosAdmin(); // Recarrega a lista
    }
};

listarProdutosAdmin();