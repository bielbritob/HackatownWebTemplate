import { auth } from '../firebase.js';
import { onAuthStateChanged } from "firebase/auth";

onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Se não estiver logado, manda de volta pro login
        window.location.href = '../AdminLoginPage/LoginAdmin.html';
    }
});