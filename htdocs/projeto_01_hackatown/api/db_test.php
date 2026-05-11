<?php
$host = '127.0.0.1';
$db   = 'faroni_db';
$user = 'root'; // seu usuario do mysql 9.7
$pass = 'k2g9ekk6'; // a senha que você sabe

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    echo "Conectado ao faroni_db com sucesso!";
} catch (PDOException $e) {
    echo "Erro ao conectar: " . $e->getMessage();
}
?>
