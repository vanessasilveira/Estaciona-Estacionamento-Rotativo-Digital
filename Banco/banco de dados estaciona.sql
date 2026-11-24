-- ============================================================================
-- BANCO DE DADOS: ROTAPARK (SISTEMA DE ESTACIONAMENTO ROTATIVO)
-- Compatível com MySQL 8.0+ / MySQL Workbench
-- ============================================================================

DROP DATABASE IF EXISTS rotapark_db;
CREATE DATABASE rotapark_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rotapark_db;

-- ----------------------------------------------------------------------------
-- 1. TABELA DE USUÁRIOS (Login, Cadastro e Autenticação Social)
-- ----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(120) NOT NULL,
    cpf CHAR(11) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NULL, -- Pode ser NULL caso use login Google/Facebook/Outlook
    telefone VARCHAR(20) NOT NULL,
    cep CHAR(8) NOT NULL,
    provedor_auth ENUM('LOCAL', 'GOOGLE', 'FACEBOOK', 'OUTLOOK') NOT NULL DEFAULT 'LOCAL',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. TABELA DE INVENTÁRIO E FIDELIDADE (Contagem de compras e Bônus +30 min)
-- É essa tabela que alimenta a aba/card de tickets bônus na tela de compra
-- ----------------------------------------------------------------------------
CREATE TABLE inventario_fidelidade (
    id_inventario INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    qtd_tickets_bonus_30min INT NOT NULL DEFAULT 0 CHECK (qtd_tickets_bonus_30min >= 0),
    contagem_pro_ticket INT NOT NULL DEFAULT 0 CHECK (contagem_pro_ticket BETWEEN 0 AND 4),
    total_compras_historico INT NOT NULL DEFAULT 0,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventario_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 3. TABELA DE VEÍCULOS (Dados do veículo e do titular)
-- ----------------------------------------------------------------------------
CREATE TABLE veiculos (
    id_veiculo INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    modelo VARCHAR(80) NOT NULL,
    cor VARCHAR(40) NOT NULL,
    placa VARCHAR(7) NOT NULL UNIQUE, -- Formato ABC1234 ou Mercosul ABC1D23
    titular_nome VARCHAR(120) NOT NULL,
    titular_telefone VARCHAR(20) NOT NULL,
    titular_cpf CHAR(11) NOT NULL,
    titular_email VARCHAR(120) NOT NULL,
    titular_cep CHAR(8) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_veiculo_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 4. TABELA DE CARTÕES (Meios de pagamento salvos estilo Mercado Livre)
-- ----------------------------------------------------------------------------
CREATE TABLE cartoes (
    id_cartao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    bandeira ENUM('VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD') NOT NULL,
    ultimos_4_digitos CHAR(4) NOT NULL,
    nome_impresso VARCHAR(100) NOT NULL,
    validade CHAR(5) NOT NULL, -- MM/AA
    token_gateway VARCHAR(255) NOT NULL, -- Nunca salvar CVV puro em produção
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cartao_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 5. TABELA DE SETORES / RUAS (Regras de distância e tempo de permanência)
-- ----------------------------------------------------------------------------
CREATE TABLE setores_estacionamento (
    id_setor INT AUTO_INCREMENT PRIMARY KEY,
    nome_rua VARCHAR(60) NOT NULL,
    distancia_centro_metros INT NOT NULL,
    tempo_base_minutos INT NOT NULL,
    valor_unitario_ticket DECIMAL(10, 2) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 6. TABELA DE COMPRAS / TRANSAÇÕES (Controle de tentativas e status)
-- ----------------------------------------------------------------------------
CREATE TABLE compras (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_veiculo INT NOT NULL,
    id_setor INT NOT NULL,
    id_cartao INT NULL, -- NULL quando pagamento for via PIX
    quantidade_tickets INT NOT NULL CHECK (quantidade_tickets >= 1),
    usou_bonus_30min BOOLEAN NOT NULL DEFAULT FALSE,
    bonus_ja_reservado BOOLEAN NOT NULL DEFAULT FALSE,
    metodo_pagamento ENUM('PIX', 'CARTAO') NOT NULL,
    codigo_pix_copia_cola TEXT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    tentativas_pagamento INT NOT NULL DEFAULT 0 CHECK (tentativas_pagamento <= 3),
    status_pagamento ENUM('PENDENTE', 'APROVADO', 'RECUSADO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_compra_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_compra_veiculo FOREIGN KEY (id_veiculo) REFERENCES veiculos(id_veiculo),
    CONSTRAINT fk_compra_setor FOREIGN KEY (id_setor) REFERENCES setores_estacionamento(id_setor),
    CONSTRAINT fk_compra_cartao FOREIGN KEY (id_cartao) REFERENCES cartoes(id_cartao)
);

-- ----------------------------------------------------------------------------
-- 7. TABELA DE TICKETS ATIVOS (Comprovante e Cronômetro em tempo real)
-- ----------------------------------------------------------------------------
CREATE TABLE tickets_ativos (
    id_ticket INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT NOT NULL UNIQUE,
    id_usuario INT NOT NULL,
    id_veiculo INT NOT NULL,
    id_setor INT NOT NULL,
    tempo_total_minutos INT NOT NULL, -- (tempo_base * quantidade) + 30 se usou bônus
    inicio_estacionamento DATETIME NOT NULL,
    fim_estacionamento DATETIME NOT NULL,
    comprovante_enviado_email BOOLEAN NOT NULL DEFAULT TRUE,
    status_ticket ENUM('ATIVO', 'EXPIRADO') NOT NULL DEFAULT 'ATIVO',
    CONSTRAINT fk_ticket_compra FOREIGN KEY (id_compra) REFERENCES compras(id_compra),
    CONSTRAINT fk_ticket_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_ticket_veiculo FOREIGN KEY (id_veiculo) REFERENCES veiculos(id_veiculo),
    CONSTRAINT fk_ticket_setor FOREIGN KEY (id_setor) REFERENCES setores_estacionamento(id_setor)
);

-- ============================================================================
-- TRIGGERS (AUTOMAÇÃO DAS REGRAS DO FLUXOGRAMA)
-- ============================================================================
DELIMITER $$

-- Trigger 1: Cria automaticamente o inventário zerado assim que um usuário se cadastra
CREATE TRIGGER trg_criar_inventario_usuario
AFTER INSERT ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO inventario_fidelidade (id_usuario, qtd_tickets_bonus_30min, contagem_pro_ticket)
    VALUES (NEW.id_usuario, 0, 0);
END$$

-- Trigger 2: Reserva (subtrai 1) do inventário se o usuário marcar "Usar Bônus de 30min" na compra
CREATE TRIGGER trg_reservar_bonus_compra
BEFORE INSERT ON compras
FOR EACH ROW
BEGIN
    DECLARE v_saldo_bonus INT DEFAULT 0;

    IF NEW.usou_bonus_30min = TRUE THEN
        SELECT qtd_tickets_bonus_30min INTO v_saldo_bonus
        FROM inventario_fidelidade
        WHERE id_usuario = NEW.id_usuario;

        IF v_saldo_bonus <= 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Usuário não possui tickets bônus de 30min no inventário.';
        END IF;

        UPDATE inventario_fidelidade
        SET qtd_tickets_bonus_30min = qtd_tickets_bonus_30min - 1
        WHERE id_usuario = NEW.id_usuario;

        SET NEW.bonus_ja_reservado = TRUE;
    END IF;
END$$

-- Trigger 3: Controla Aprovação (gera ticket + conta 5 compras pro bônus)
-- e Cancelamento (estorna o bônus de 30min se foi usado na tentativa)
CREATE TRIGGER trg_processar_status_compra
AFTER UPDATE ON compras
FOR EACH ROW
BEGIN
    DECLARE v_nova_contagem INT;
    DECLARE v_tempo_base INT;
    DECLARE v_tempo_final INT;

    -- CASO A: Pagamento APROVADO
    IF OLD.status_pagamento <> 'APROVADO' AND NEW.status_pagamento = 'APROVADO' THEN
        -- Atualiza contador de compras (CONTAGEM PRO TICKET + 1)
        SELECT contagem_pro_ticket + 1 INTO v_nova_contagem
        FROM inventario_fidelidade
        WHERE id_usuario = NEW.id_usuario;

        -- Se atingiu 5 compras, ganha 1 bônus de +30min e reseta contador para 0
        IF v_nova_contagem >= 5 THEN
            UPDATE inventario_fidelidade
            SET contagem_pro_ticket = 0,
                qtd_tickets_bonus_30min = qtd_tickets_bonus_30min + 1,
                total_compras_historico = total_compras_historico + 1
            WHERE id_usuario = NEW.id_usuario;
        ELSE
            UPDATE inventario_fidelidade
            SET contagem_pro_ticket = v_nova_contagem,
                total_compras_historico = total_compras_historico + 1
            WHERE id_usuario = NEW.id_usuario;
        END IF;

        -- Calcula tempo total do ticket e inicia o cronômetro
        SELECT tempo_base_minutos INTO v_tempo_base
        FROM setores_estacionamento
        WHERE id_setor = NEW.id_setor;

        SET v_tempo_final = (v_tempo_base * NEW.quantidade_tickets)
                          + IF(NEW.usou_bonus_30min = TRUE, 30, 0);

        INSERT INTO tickets_ativos (
            id_compra, id_usuario, id_veiculo, id_setor,
            tempo_total_minutos, inicio_estacionamento, fim_estacionamento
        ) VALUES (
            NEW.id_compra, NEW.id_usuario, NEW.id_veiculo, NEW.id_setor,
            v_tempo_final, NOW(), DATE_ADD(NOW(), INTERVAL v_tempo_final MINUTE)
        );
    END IF;

    -- CASO B: Compra CANCELADA -> Estorna o bônus se tinha sido descontado
    IF OLD.status_pagamento <> 'CANCELADO' AND NEW.status_pagamento = 'CANCELADO' THEN
        IF NEW.bonus_ja_reservado = TRUE THEN
            UPDATE inventario_fidelidade
            SET qtd_tickets_bonus_30min = qtd_tickets_bonus_30min + 1
            WHERE id_usuario = NEW.id_usuario;
        END IF;
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- VIEW PARA A TELA DE COMPRA (Integração Login + Veículo + Inventário Bônus)
-- ============================================================================
CREATE VIEW vw_tela_compra_usuario AS
SELECT 
    u.id_usuario,
    u.nome_completo,
    u.email,
    v.id_veiculo,
    v.modelo AS veiculo_modelo,
    v.cor AS veiculo_cor,
    v.placa AS veiculo_placa,
    i.qtd_tickets_bonus_30min AS tickets_bonus_disponiveis,
    i.contagem_pro_ticket AS compras_no_ciclo_atual,
    (5 - i.contagem_pro_ticket) AS faltam_para_proximo_bonus
FROM usuarios u
LEFT JOIN veiculos v ON u.id_usuario = v.id_usuario
INNER JOIN inventario_fidelidade i ON u.id_usuario = i.id_usuario;

-- ============================================================================
-- DADOS INICIAIS (Setores do Estacionamento + Usuário de Teste)
-- ============================================================================
INSERT INTO setores_estacionamento (nome_rua, distancia_centro_metros, tempo_base_minutos, valor_unitario_ticket) VALUES
('Rua 1 - Centro Histórico', 100, 120, 5.00),  -- 2h
('Rua 2 - Comércio',         250, 180, 4.50),  -- 3h
('Rua 3 - Praça Matriz',     400, 240, 4.00),  -- 4h
('Rua 4 - Avenida Sul',      600, 300, 3.50),  -- 5h
('Rua 5 - Bairro Jardim',    850, 360, 3.00);  -- 6h

-- Usuário exemplo (A trigger cria o inventário automaticamente)
INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, telefone, cep)
VALUES ('Rodrigo Cunha', '12345678901', 'rodrigo@email.com', 'hash_senha_123', '37999999999', '35604000');

-- Colocando 1 ticket bônus e 4 compras no ciclo para testar a aba da tela de compra
UPDATE inventario_fidelidade
SET qtd_tickets_bonus_30min = 1, contagem_pro_ticket = 4
WHERE id_usuario = 1;

-- Veículo e cartão do usuário exemplo
INSERT INTO veiculos (id_usuario, modelo, cor, placa, titular_nome, titular_telefone, titular_cpf, titular_email, titular_cep)
VALUES (1, 'Fiat Palio Fire', 'Prata', 'ABC1D23', 'Rodrigo Cunha', '37999999999', '12345678901', 'rodrigo@email.com', '35604000');

INSERT INTO cartoes (id_usuario, bandeira, ultimos_4_digitos, nome_impresso, validade, token_gateway)
VALUES (1, 'MASTERCARD', '4829', 'RODRIGO C F CUNHA', '09/29', 'tok_mp_99887766');

-- ============================================================================
-- CONSULTA PRONTA PARA EXIBIR OS DADOS NA TELA DE COMPRA
-- ============================================================================
SELECT * FROM vw_tela_compra_usuario WHERE id_usuario = 1;