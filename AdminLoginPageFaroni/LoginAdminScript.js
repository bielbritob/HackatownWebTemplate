const btnSubmit = document.getElementById("submit");
const inputSenha = document.getElementById("Senha");
const inputUsuario = document.getElementById("Usuario");

async function tryLogin() {
    const usuario = inputUsuario.value;
    const senha = inputSenha.value;

    if (!usuario || !senha) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        // Faz a requisição para o seu servidor local XAMPP
        const response = await fetch('http://localhost/projeto_01_hackatown/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: usuario, senha: senha })
        });

        const result = await response.json();

        if (result.success) {
            console.log("Logged com sucesso");
            // Salva um "token" simples no navegador para fingir uma sessão
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = '../AdminPageFaroni/admin.html';
        } else {
            alert("Erro no login: " + result.message);
        }

    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro ao conectar com o servidor local.");
    }
}

// Eventos de clique e tecla Enter (mantidos do seu original)
btnSubmit.addEventListener("click", tryLogin);

[inputSenha, inputUsuario].forEach(input => {
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") tryLogin();
    });
});