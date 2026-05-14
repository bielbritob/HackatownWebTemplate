<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit; }

$host = "127.0.0.1";
$user = "root";
$pass = "k2g9ekk6"; // Senha do seu MySQL Server 9.7
$dbname = "3a_engenharia_db";

$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) { die(json_encode(["success" => false, "message" => "Erro na conexão"])); }

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';

switch ($action) {
    case 'listar':
        $result = $conn->query("SELECT * FROM produtos ORDER BY id DESC");
        $produtos = [];
        while($row = $result->fetch_assoc()) { $produtos[] = $row; }
        echo json_encode($produtos);
        break;

    case 'adicionar':
        $stmt = $conn->prepare("INSERT INTO produtos (nome, preco, descricao, img) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $data['nome'], $data['preco'], $data['desc'], $data['img']);
        echo json_encode(["success" => $stmt->execute()]);
        break;

    case 'deletar':
        $stmt = $conn->prepare("DELETE FROM produtos WHERE id = ?");
        $stmt->bind_param("i", $data['id']);
        echo json_encode(["success" => $stmt->execute()]);
        break;

    case 'editar':
        $stmt = $conn->prepare("UPDATE produtos SET nome = ?, preco = ?, descricao = ?, img = ? WHERE id = ?");
        $stmt->bind_param("ssssi", $data['nome'], $data['preco'], $data['desc'], $data['img'], $data['id']);
        echo json_encode(["success" => $stmt->execute()]);
        break;
}

$conn->close();
?>