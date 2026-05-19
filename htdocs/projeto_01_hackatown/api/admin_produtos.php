<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit; }

// Aumenta o tempo limite de execução (a IA pode demorar muito na primeira vez para baixar os modelos)
set_time_limit(300);

$host = "127.0.0.1";
$user = "root";
$pass = ""; // Senha do seu MySQL Server 9.7
$dbname = "3a_engenharia_db";

$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) { die(json_encode(["success" => false, "message" => "Erro na conexão"])); }

$data = json_decode(file_get_contents("php://input"), true);
if (empty($data)) {
    $data = $_POST;
}

// Se POST, FILES e input json estão vazios, mas recebemos dados pesados, o post_max_size bloqueou!
if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_POST) && empty($_FILES) && empty($data) && isset($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > 0) {
    die(json_encode(["success" => false, "message" => "O arquivo enviado excede o limite de POST do servidor. Aumente o post_max_size no php.ini."]));
}

$action = $data['action'] ?? '';

function processarUploadImagem($fileInfo, &$error_msg) {
    $pasta_uploads = 'uploads/';
    if (!is_dir($pasta_uploads)) {
        mkdir($pasta_uploads, 0777, true);
    }
    
    // Evita conflitos de nomes
    $nome_orig = uniqid() . '_' . basename($fileInfo['name']);
    $caminho_orig = $pasta_uploads . $nome_orig;

    if (move_uploaded_file($fileInfo['tmp_name'], $caminho_orig)) {
        // Comando do Python com 2>&1 para capturar erros no $output
        $comando_python = escapeshellcmd("python processar_foto.py") . " " . escapeshellarg($caminho_orig) . " 2>&1";
        
        $output = [];
        $result_code = 0;
        exec($comando_python, $output, $result_code);
        
        $retorno = '';
        for ($i = count($output) - 1; $i >= 0; $i--) {
            if (trim($output[$i]) !== '') {
                $retorno = trim($output[$i]);
                break;
            }
        }
        $full_output = implode("\n", $output);

        if ($result_code === 0 && strpos($retorno, 'ERRO') === false && file_exists($retorno)) {
            // Retorna o caminho relativo (ex: /projeto_php/api/uploads/...) para que o Proxy do Vite funcione no Tunnelmole
            return "/projeto_php/api/" . str_replace('\\', '/', $retorno);
        } else {
            // Falha na IA. Vamos expor o erro real do Python para debug do front.
            $error_msg = "A IA falhou. Detalhes: " . substr($full_output, 0, 150);
            // Retorna a imagem original enviada, para não perder o upload
            return "/projeto_php/api/" . str_replace('\\', '/', $caminho_orig);
        }
    }
    $error_msg = "Falha ao mover arquivo enviado para uploads/.";
    return null;
}

switch ($action) {
    case 'listar':
        $result = $conn->query("SELECT * FROM produtos ORDER BY id DESC");
        $produtos = [];
        while($row = $result->fetch_assoc()) { $produtos[] = $row; }
        echo json_encode($produtos);
        break;

    case 'adicionar':
        $img_final = $data['img'] ?? '';
        $msg_python = "";
        if (isset($_FILES['foto_produto'])) {
            if ($_FILES['foto_produto']['error'] == UPLOAD_ERR_OK) {
                $error_msg = "";
                $img_upload = processarUploadImagem($_FILES['foto_produto'], $error_msg);
                if ($img_upload) { 
                    $img_final = $img_upload; 
                    if ($error_msg) $msg_python = $error_msg;
                }
            } else if ($_FILES['foto_produto']['error'] == UPLOAD_ERR_INI_SIZE || $_FILES['foto_produto']['error'] == UPLOAD_ERR_FORM_SIZE) {
                die(json_encode(["success" => false, "message" => "O arquivo da imagem é muito grande para o servidor PHP. Tente uma foto menor."]));
            } else if ($_FILES['foto_produto']['error'] != UPLOAD_ERR_NO_FILE) {
                die(json_encode(["success" => false, "message" => "Erro no upload da imagem. Código: " . $_FILES['foto_produto']['error']]));
            }
        }

        $stmt = $conn->prepare("INSERT INTO produtos (nome, preco, descricao, img) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $data['nome'], $data['preco'], $data['desc'], $img_final);
        echo json_encode(["success" => $stmt->execute(), "msg_python" => $msg_python]);
        break;

    case 'deletar':
        $stmt = $conn->prepare("DELETE FROM produtos WHERE id = ?");
        $stmt->bind_param("i", $data['id']);
        echo json_encode(["success" => $stmt->execute()]);
        break;

    case 'editar':
        $img_final = $data['img'] ?? '';
        $msg_python = "";
        if (isset($_FILES['foto_produto'])) {
            if ($_FILES['foto_produto']['error'] == UPLOAD_ERR_OK) {
                $error_msg = "";
                $img_upload = processarUploadImagem($_FILES['foto_produto'], $error_msg);
                if ($img_upload) { 
                    $img_final = $img_upload; 
                    if ($error_msg) $msg_python = $error_msg;
                }
            } else if ($_FILES['foto_produto']['error'] == UPLOAD_ERR_INI_SIZE || $_FILES['foto_produto']['error'] == UPLOAD_ERR_FORM_SIZE) {
                die(json_encode(["success" => false, "message" => "O arquivo da imagem é muito grande para o servidor PHP. Tente uma foto menor."]));
            } else if ($_FILES['foto_produto']['error'] != UPLOAD_ERR_NO_FILE) {
                die(json_encode(["success" => false, "message" => "Erro no upload da imagem. Código: " . $_FILES['foto_produto']['error']]));
            }
        }

        $stmt = $conn->prepare("UPDATE produtos SET nome = ?, preco = ?, descricao = ?, img = ? WHERE id = ?");
        $stmt->bind_param("ssssi", $data['nome'], $data['preco'], $data['desc'], $img_final, $data['id']);
        echo json_encode(["success" => $stmt->execute(), "msg_python" => $msg_python]);
        break;
}

$conn->close();
?>
