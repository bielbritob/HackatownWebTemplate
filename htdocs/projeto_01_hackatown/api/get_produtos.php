<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$host = "localhost";
$user = "root";
$pass = ""; // Senha padrão do XAMPP é vazia
$dbname = "3a_engenharia_db";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Falha na conexão"]));
}

$sql = "SELECT nome, preco, descricao , img FROM produtos";
$result = $conn->query($sql);

$produtos = [];
while($row = $result->fetch_assoc()) {
    $produtos[] = $row;
}

echo json_encode($produtos);
$conn->close();
?>
