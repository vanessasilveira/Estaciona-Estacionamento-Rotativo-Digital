from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import uuid

app = Flask(__name__)
CORS(app)

# ============================================================================
# CONFIGURAÇÃO DO BANCO DE DADOS MYSQL
# ============================================================================
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "estaciona123",
    "database": "rotapark_db"
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

def limpar_numeros(texto):
    return "".join(filter(str.isdigit, str(texto or "")))

# ============================================================================
# 1. AUTENTICAÇÃO E CADASTRO DE USUÁRIO
# ============================================================================
@app.route("/api/login", methods=["POST"])
def login():
    dados = request.get_json() or {}
    email = (dados.get("email") or "").strip()
    senha = (dados.get("senha") or "").strip()

    if not email or not senha:
        return jsonify({"erro": "Informe e-mail e senha."}), 400

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_usuario, nome_completo, cpf, email, telefone, cep FROM usuarios WHERE email = %s AND senha_hash = %s AND ativo = TRUE",
            (email, senha)
        )
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"erro": "E-mail ou senha inválidos."}), 401

        return jsonify({"mensagem": "Login realizado com sucesso!", "usuario": usuario})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/login/social", methods=["POST"])
def login_social():
    dados = request.get_json() or {}
    provedor = (dados.get("provedor") or "GOOGLE").upper()
    email_social = f"usuario.{provedor.lower()}@rotapark.com"

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_usuario, nome_completo, cpf, email, telefone, cep FROM usuarios WHERE email = %s", (email_social,))
        usuario = cursor.fetchone()

        if not usuario:
            cpf_ficticio = str(uuid.uuid4().int)[:11]
            cursor.execute(
                """INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, telefone, cep, provedor_auth)
                   VALUES (%s, %s, %s, NULL, %s, %s, %s)""",
                (f"Usuário {provedor.title()}", cpf_ficticio, email_social, "37999990000", "35604000", provedor)
            )
            conn.commit()
            novo_id = cursor.lastrowid
            cursor.execute(
                "UPDATE inventario_fidelidade SET qtd_tickets_bonus_30min = 1, contagem_pro_ticket = 4 WHERE id_usuario = %s",
                (novo_id,)
            )
            conn.commit()
            cursor.execute("SELECT id_usuario, nome_completo, cpf, email, telefone, cep FROM usuarios WHERE id_usuario = %s", (novo_id,))
            usuario = cursor.fetchone()

        return jsonify({"mensagem": f"Autenticado via {provedor}!", "usuario": usuario})
    finally:
        cursor.close()
        conn.close()


@app.route("/api/usuarios", methods=["POST"])
def cadastrar_usuario():
    dados = request.get_json() or {}
    nome = (dados.get("nome_completo") or "").strip()
    cpf = limpar_numeros(dados.get("cpf"))
    email = (dados.get("email") or "").strip()
    senha = (dados.get("senha") or "").strip()
    telefone = limpar_numeros(dados.get("telefone"))
    cep = limpar_numeros(dados.get("cep"))

    if not all([nome, cpf, email, senha, telefone, cep]):
        return jsonify({"erro": "Preencha todos os campos obrigatórios."}), 400
    if len(cpf) != 11:
        return jsonify({"erro": "CPF deve conter 11 dígitos."}), 400
    if len(cep) != 8:
        return jsonify({"erro": "CEP deve conter 8 dígitos."}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, telefone, cep, provedor_auth)
               VALUES (%s, %s, %s, %s, %s, %s, 'LOCAL')""",
            (nome, cpf, email, senha, telefone, cep)
        )
        conn.commit()
        return jsonify({"mensagem": "Conta criada com sucesso! Faça login para continuar.", "id_usuario": cursor.lastrowid}), 201
    except Error as e:
        if e.errno == 1062:
            return jsonify({"erro": "CPF ou E-mail já cadastrado no sistema."}), 409
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================================================
# 2. DADOS CONSOLIDADOS DO USUÁRIO (Inventário Bônus + Veículos + Cartões + Setores)
# ============================================================================
@app.route("/api/usuario/<int:id_usuario>/resumo", methods=["GET"])
def resumo_usuario(id_usuario):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM inventario_fidelidade WHERE id_usuario = %s", (id_usuario,))
        inventario = cursor.fetchone() or {"qtd_tickets_bonus_30min": 0, "contagem_pro_ticket": 0, "total_compras_historico": 0}

        cursor.execute("SELECT * FROM veiculos WHERE id_usuario = %s ORDER BY id_veiculo DESC", (id_usuario,))
        veiculos = cursor.fetchall()

        cursor.execute("SELECT id_cartao, bandeira, ultimos_4_digitos, nome_impresso, validade FROM cartoes WHERE id_usuario = %s ORDER BY id_cartao DESC", (id_usuario,))
        cartoes = cursor.fetchall()

        cursor.execute("SELECT * FROM setores_estacionamento ORDER BY id_setor ASC")
        setores = cursor.fetchall()
        for s in setores:
            s["valor_unitario_ticket"] = float(s["valor_unitario_ticket"])

        cursor.execute(
            """SELECT t.*, s.nome_rua, v.placa, v.modelo
               FROM tickets_ativos t
               JOIN setores_estacionamento s ON t.id_setor = s.id_setor
               JOIN veiculos v ON t.id_veiculo = v.id_veiculo
               WHERE t.id_usuario = %s AND t.status_ticket = 'ATIVO' AND t.fim_estacionamento > NOW()
               ORDER BY t.id_ticket DESC LIMIT 1""",
            (id_usuario,)
        )
        ticket_ativo = cursor.fetchone()
        if ticket_ativo:
            ticket_ativo["inicio_estacionamento"] = ticket_ativo["inicio_estacionamento"].isoformat()
            ticket_ativo["fim_estacionamento"] = ticket_ativo["fim_estacionamento"].isoformat()

        return jsonify({
            "inventario": inventario,
            "veiculos": veiculos,
            "cartoes": cartoes,
            "setores": setores,
            "ticket_ativo": ticket_ativo
        })
    finally:
        cursor.close()
        conn.close()


# ============================================================================
# 3. CADASTRO DE VEÍCULO
# ============================================================================
@app.route("/api/veiculos", methods=["POST"])
def cadastrar_veiculo():
    dados = request.get_json() or {}
    id_usuario = dados.get("id_usuario")
    modelo = (dados.get("modelo") or "").strip()
    cor = (dados.get("cor") or "").strip()
    placa = (dados.get("placa") or "").strip().upper().replace("-", "")
    titular_nome = (dados.get("titular_nome") or "").strip()
    titular_telefone = limpar_numeros(dados.get("titular_telefone"))
    titular_cpf = limpar_numeros(dados.get("titular_cpf"))
    titular_email = (dados.get("titular_email") or "").strip()
    titular_cep = limpar_numeros(dados.get("titular_cep"))

    if not all([id_usuario, modelo, cor, placa, titular_nome, titular_telefone, titular_cpf, titular_email, titular_cep]):
        return jsonify({"erro": "Todos os campos do veículo e do titular são obrigatórios."}), 400
    if len(placa) != 7:
        return jsonify({"erro": "A placa deve ter 7 caracteres (ex: ABC1D23)."}), 400

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO veiculos
               (id_usuario, modelo, cor, placa, titular_nome, titular_telefone, titular_cpf, titular_email, titular_cep)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (id_usuario, modelo, cor, placa, titular_nome, titular_telefone, titular_cpf, titular_email, titular_cep)
        )
        conn.commit()
        novo_id = cursor.lastrowid
        cursor.execute("SELECT * FROM veiculos WHERE id_veiculo = %s", (novo_id,))
        veiculo = cursor.fetchone()
        return jsonify({"mensagem": "Veículo validado e cadastrado!", "veiculo": veiculo}), 201
    except Error as e:
        if e.errno == 1062:
            return jsonify({"erro": "Esta placa já está cadastrada no sistema."}), 409
        return jsonify({"erro": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================================================
# 4. CADASTRO DE CARTÃO DE CRÉDITO/DÉBITO
# ============================================================================
@app.route("/api/cartoes", methods=["POST"])
def cadastrar_cartao():
    dados = request.get_json() or {}
    id_usuario = dados.get("id_usuario")
    numero = limpar_numeros(dados.get("numero"))
    nome_impresso = (dados.get("nome_impresso") or "").strip().upper()
    validade = (dados.get("validade") or "").strip()
    cvv = limpar_numeros(dados.get("cvv"))

    if not all([id_usuario, numero, nome_impresso, validade, cvv]) or len(numero) < 13 or len(cvv) < 3:
        return jsonify({"erro": "Dados do cartão inválidos. Verifique número, validade e CVV."}), 400

    bandeira = "VISA" if numero.startswith("4") else ("ELO" if numero.startswith("6") else "MASTERCARD")
    ultimos_4 = numero[-4:]
    token = f"tok_{uuid.uuid4().hex[:12]}"

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            """INSERT INTO cartoes (id_usuario, bandeira, ultimos_4_digitos, nome_impresso, validade, token_gateway)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (id_usuario, bandeira, ultimos_4, nome_impresso, validade, token)
        )
        conn.commit()
        novo_id = cursor.lastrowid
        cursor.execute("SELECT id_cartao, bandeira, ultimos_4_digitos, nome_impresso, validade FROM cartoes WHERE id_cartao = %s", (novo_id,))
        cartao = cursor.fetchone()
        return jsonify({"mensagem": "Cartão salvo com sucesso!", "cartao": cartao}), 201
    finally:
        cursor.close()
        conn.close()


# ============================================================================
# 5. FLUXO DE COMPRA, TENTATIVAS (< 3), ESTORNO E GERAÇÃO DE TICKET
# ============================================================================
@app.route("/api/compras/iniciar", methods=["POST"])
def iniciar_compra():
    dados = request.get_json() or {}
    id_usuario = dados.get("id_usuario")
    id_veiculo = dados.get("id_veiculo")
    id_setor = dados.get("id_setor")
    id_cartao = dados.get("id_cartao")
    quantidade_tickets = int(dados.get("quantidade_tickets", 1))
    usou_bonus_30min = bool(dados.get("usou_bonus_30min", False))
    metodo_pagamento = (dados.get("metodo_pagamento") or "PIX").upper()

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT valor_unitario_ticket FROM setores_estacionamento WHERE id_setor = %s", (id_setor,))
        setor = cursor.fetchone()
        if not setor:
            return jsonify({"erro": "Setor inválido."}), 400

        valor_total = float(setor["valor_unitario_ticket"]) * quantidade_tickets
        codigo_pix = f"00020126580014BR.GOV.BCB.PIX0136rotapark-{uuid.uuid4().hex[:16]}5204000053039865802BR5913ROTAPARK6009BOMDESPACHO6304ABCD" if metodo_pagamento == "PIX" else None

        cursor.execute(
            """INSERT INTO compras
               (id_usuario, id_veiculo, id_setor, id_cartao, quantidade_tickets, usou_bonus_30min, metodo_pagamento, codigo_pix_copia_cola, valor_total, tentativas_pagamento, status_pagamento)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 0, 'PENDENTE')""",
            (id_usuario, id_veiculo, id_setor, id_cartao, quantidade_tickets, usou_bonus_30min, metodo_pagamento, codigo_pix, valor_total)
        )
        conn.commit()
        id_compra = cursor.lastrowid

        cursor.execute("SELECT * FROM inventario_fidelidade WHERE id_usuario = %s", (id_usuario,))
        inventario = cursor.fetchone()

        return jsonify({
            "id_compra": id_compra,
            "valor_total": valor_total,
            "codigo_pix": codigo_pix,
            "inventario": inventario
        }), 201
    except Error as e:
        return jsonify({"erro": e.msg if hasattr(e, "msg") else str(e)}), 400
    finally:
        cursor.close()
        conn.close()


@app.route("/api/compras/<int:id_compra>/processar", methods=["POST"])
def processar_pagamento(id_compra):
    dados = request.get_json() or {}
    acao = (dados.get("acao") or "APROVAR").upper()
    novo_metodo = dados.get("metodo_pagamento")
    novo_cartao = dados.get("id_cartao")

    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM compras WHERE id_compra = %s", (id_compra,))
        compra = cursor.fetchone()
        if not compra:
            return jsonify({"erro": "Compra não encontrada."}), 404

        if novo_metodo:
            cursor.execute(
                "UPDATE compras SET metodo_pagamento = %s, id_cartao = %s WHERE id_compra = %s",
                (novo_metodo.upper(), novo_cartao, id_compra)
            )
            conn.commit()

        if acao == "APROVAR":
            cursor.execute("UPDATE compras SET status_pagamento = 'APROVADO' WHERE id_compra = %s", (id_compra,))
            conn.commit()

            cursor.execute("SELECT * FROM inventario_fidelidade WHERE id_usuario = %s", (compra["id_usuario"],))
            inventario = cursor.fetchone()

            cursor.execute(
                """SELECT t.*, s.nome_rua, v.placa, v.modelo
                   FROM tickets_ativos t
                   JOIN setores_estacionamento s ON t.id_setor = s.id_setor
                   JOIN veiculos v ON t.id_veiculo = v.id_veiculo
                   WHERE t.id_compra = %s""",
                (id_compra,)
            )
            ticket = cursor.fetchone()
            if ticket:
                ticket["inicio_estacionamento"] = ticket["inicio_estacionamento"].isoformat()
                ticket["fim_estacionamento"] = ticket["fim_estacionamento"].isoformat()

            return jsonify({
                "status": "APROVADO",
                "mensagem": "Pagamento validado! Ticket emitido e enviado por e-mail.",
                "inventario": inventario,
                "ticket_ativo": ticket
            })

        elif acao == "RECUSAR":
            novas_tentativas = compra["tentativas_pagamento"] + 1
            if novas_tentativas >= 3:
                cursor.execute(
                    "UPDATE compras SET tentativas_pagamento = %s, status_pagamento = 'CANCELADO' WHERE id_compra = %s",
                    (novas_tentativas, id_compra)
                )
                conn.commit()
                cursor.execute("SELECT * FROM inventario_fidelidade WHERE id_usuario = %s", (compra["id_usuario"],))
                inventario = cursor.fetchone()
                return jsonify({
                    "status": "CANCELADO",
                    "tentativas": novas_tentativas,
                    "estornou_bonus": bool(compra["bonus_ja_reservado"]),
                    "mensagem": "Limite de 3 tentativas excedido. Compra cancelada!",
                    "inventario": inventario
                })
            else:
                cursor.execute(
                    "UPDATE compras SET tentativas_pagamento = %s, status_pagamento = 'RECUSADO' WHERE id_compra = %s",
                    (novas_tentativas, id_compra)
                )
                conn.commit()
                return jsonify({
                    "status": "RECUSADO",
                    "tentativas": novas_tentativas,
                    "restantes": 3 - novas_tentativas,
                    "mensagem": f"Pagamento recusado (Tentativa {novas_tentativas}/3). Escolha outro método ou tente novamente."
                })

        else:  # CANCELAR
            cursor.execute("UPDATE compras SET status_pagamento = 'CANCELADO' WHERE id_compra = %s", (id_compra,))
            conn.commit()
            cursor.execute("SELECT * FROM inventario_fidelidade WHERE id_usuario = %s", (compra["id_usuario"],))
            inventario = cursor.fetchone()
            return jsonify({
                "status": "CANCELADO",
                "estornou_bonus": bool(compra["bonus_ja_reservado"]),
                "mensagem": "Compra cancelada pelo usuário.",
                "inventario": inventario
            })
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    print("Servidor RotaPark rodando em http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
```[cite: 5]

### Resumo rápido de como fica a pasta no seu PC:
* `app.py` → Backend em Python (Flask + MySQL)[cite: 5]
* `rotapark_app.html` → Frontend (as telas do celular que conversam com o `app.py` via `[http://127.0.0.1:5000/api](http://127.0.0.1:5000/api)`)[cite: 4, 5]