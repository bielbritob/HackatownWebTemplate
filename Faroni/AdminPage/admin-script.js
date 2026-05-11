// Verifica se o marcador de login existe no navegador
const isLoggedIn = localStorage.getItem('isLoggedIn');

if (isLoggedIn !== 'true') {
    // Se não houver o marcador, redireciona para a tela de login
    alert("Acesso negado. Por favor, faça login.");
    window.location.href = '../LoginAdmin/LoginAdmin.html';
}

// Opcional: Função para deslogar (Logout)
function logout() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = '../LoginAdmin/LoginAdmin.html';
}