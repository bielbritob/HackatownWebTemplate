<?php
$host = '127.0.0.1';
$db   = '3a_engenharia_db';
$user = 'root'; // seu usuario do mysql 9.7
$pass = ''; // a senha que você sabe

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "<h2>Conectado ao banco: $db</h2>";

    // 1. Busca todas as tabelas do banco
    $queryTabelas = $pdo->query("SHOW TABLES");
    $tabelas = $queryTabelas->fetchAll(PDO::FETCH_COLUMN);

    if (empty($tabelas)) {
        echo "Nenhuma tabela encontrada.";
    } else {
        foreach ($tabelas as $tabela) {
            echo "<h3>Tabela: <strong>$tabela</strong></h3>";
            
            // 2. Busca a estrutura (colunas) da tabela atual
            $queryStruct = $pdo->query("DESCRIBE $tabela");
            $colunas = $queryStruct->fetchAll(PDO::FETCH_ASSOC);

            // Monta uma tabela HTML para ficar fácil de ler
            echo "<table border='1' cellpadding='5' style='border-collapse: collapse; width: 100%; text-align: left;'>
                    <tr style='background-color: #f2f2f2;'>
                        <th>Campo</th>
                        <th>Tipo</th>
                        <th>Nulo</th>
                        <th>Chave</th>
                        <th>Padrão</th>
                        <th>Extra</th>
                    </tr>";

            foreach ($colunas as $coluna) {
                echo "<tr>
                        <td>{$coluna['Field']}</td>
                        <td>{$coluna['Type']}</td>
                        <td>{$coluna['Null']}</td>
                        <td>{$coluna['Key']}</td>
                        <td>{$coluna['Default']}</td>
                        <td>{$coluna['Extra']}</td>
                      </tr>";
            }
            echo "</table><br><hr>";
        }
    }

} catch (PDOException $e) {
    echo "<div style='color: red; font-weight: bold;'>Erro ao conectar ou consultar: " . $e->getMessage() . "</div>";
}
?>
