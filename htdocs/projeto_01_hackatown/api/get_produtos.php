<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$host = "localhost";
$user = "root";
$pass = "k2g9ekk6"; // Senha padrão do XAMPP é vazia
$dbname = "faroni_db";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Falha na conexão"]));
}

$sql = "SELECT nome, descricao as `desc`, preco, img FROM produtos";
$result = $conn->query($sql);

$produtos = [];
while($row = $result->fetch_assoc()) {
    $produtos[] = $row;
}

echo json_encode($produtos);
$conn->close();
?>