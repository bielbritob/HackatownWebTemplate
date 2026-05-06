import { auth } from '../firebase.js'; // Importa a auth lá da raiz
import { signInWithEmailAndPassword } from "firebase/auth";

const btnSubmit = document.getElementById("submit");
const inputSenha = document.getElementById("Senha");
const inputUsuario = document.getElementById("Usuario");

async function tryLogin() {
    const usuario = document.getElementById('Usuario').value;
    const senha = document.getElementById('Senha').value;

    try {
        await signInWithEmailAndPassword(auth, usuario, senha);

        console.log("Logged com sucesso");

        window.location.href = '../AdminPage/admin.html';
    } catch (error) {
        alert("erro no login: " + error.message);
        console.error(error);

    }
}

btnSubmit.addEventListener("click", tryLogin);

inputSenha.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        tryLogin();
    }
});

inputUsuario.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        tryLogin();
    }
});
