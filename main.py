from fastapi import FastAPI
# 1. Inicializa a aplicação web com o FastAPI
app = FastAPI(
    title="API PROPPI - IFAP",
    description="Sistema de Gestão e Business Intelligence da Pró-Reitoria de Pesquisa, Pós-graduação e Inovação",
    version="1.0.0"
)

# 2. Criando a rota principal (Endpoint raiz "/")
@app.get("/")
def pagina_inicial():
    return {
        "mensagem": "Bem-vindo ao Backend do Sistema PROPPI - IFAP",
        "status": "Online e Operacional",
        "desenvolvedor": "Diretoria de Pesquisa, Pós-graduação e Inovação"
    }

# 3. Criando uma rota de dados (Simulando os arquivos que tratamos nas planilhas)
@app.get("/api/projetos")
def listar_projetos():
    dados_proppi = [
        {"id": 1, "projeto": "Redes Mesh Comunitárias", "campus": "Macapá", "status": "Aprovado", "bolsas": 2},
        {"id": 2, "projeto": "Energia Solar Fotovoltaica", "campus": "Santana", "status": "Pendente", "bolsas": 1},
        {"id": 3, "projeto": "Agricultura de Precisão IoT", "campus": "Santana", "status": "Aprovado", "bolsas": 3}
    ]
    return {
    "total_registros": len(dados_proppi), "resultados": dados_proppi}