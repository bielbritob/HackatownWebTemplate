<?php
header('Access-Control-Allow-Origin: *');

//FIX ERROR PREFLIGHT LOGIN PAGE
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");  
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With"); //FIX ERRO PREFLIGHT

header('Content-Type: application/json');

$host = "127.0.0.1";
$user = "root";
$pass = "k2g9ekk6"; 
$dbname = "3a_engenharia_db"; // Db da 3A

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Erro de conexão"]));
}

// Pega os dados enviados pelo JavaScript
$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$senha = $data['senha'] ?? '';

// Busca o usuário no banco
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ? AND senha = ?");
$stmt->bind_param("ss", $email, $senha);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Usuario ou senha incorretos."]);
}

$stmt->close();
$conn->close();
?>