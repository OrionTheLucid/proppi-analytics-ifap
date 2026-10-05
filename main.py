from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, event
from typing import List, Optional
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine, get_db
import unicodedata

# 1. Inicializa a aplicação web com o FastAPI e cria as tabelas físicas no banco de dados
models.Base.metadata.create_all(bind=engine)

# Função Python para remover acentos e converter para minúsculas
def normalizar_texto(texto: str) -> str:
    if not texto:
        return ""
    nfkd = unicodedata.normalize('NFD', str(texto))
    texto_sem_acento = "".join([c for c in nfkd if not unicodedata.combining(c)])
    return texto_sem_acento.lower()

# Registra a função customizada 'normalizar' no SQLite via SQLAlchemy
@event.listens_for(engine, "connect")
def adicionar_funcao_normalizar(dbapi_connection, connection_record):
    dbapi_connection.create_function("normalizar", 1, normalizar_texto)

app = FastAPI(
    title="API PROPPI - IFAP",
    description="Sistema de Gestão e Business Intelligence da Pró-Reitoria de Pesquisa, Pós-graduação e Inovação",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite qualquer origem por enquanto
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# # 2. Definição do Esquema (Pydantic) para validação dos dados de entrada
# class ProjetoCreate(BaseModel):
#     titulo: str
#     resumo: Optional[str] = "-"
#     edital: Optional[str] = "-"
#     ano_edital: Optional[int] = 0
#     coordenador: Optional[str] = "-"
#     area_conhecimento: Optional[str] = "-"
#     grupo_pesquisa: Optional[str] = "-"
#     campus: str
#     periodo_execucao: Optional[str] = "-"
#     situacao_atual: Optional[str] = "-"

# 3. Criando a rota principal (Endpoint raiz "/")
@app.get("/")
def pagina_inicial():
    return {
        "mensagem": "Bem-vindo ao Backend do Sistema PROPPI - IFAP",
        "status": "Online e Operacional",
        "desenvolvedor": "Diretoria de Pesquisa, Pós-graduação e Inovação"
    }

# 5. Rota para LISTAR todos os projetos salvos no banco de dados (GET) com os novos filtros
@app.get("/api/projetos")
def listar_projetos(
    titulo: Optional[str] = Query(None),
    campus: Optional[str] = Query(None),
    situacao: Optional[str] = Query(None),         # Nome enviado pelo frontend
    situacao_atual: Optional[str] = Query(None),   # Compatibilidade com chamadas diretas
    edital: Optional[str] = Query(None),
    ano: Optional[str] = Query(None),              # Aceita string para tratar ano de forma flexível
    area: Optional[str] = Query(None),
    grupo_pesquisa: Optional[str] = Query(None),
    coordenador: Optional[str] = Query(None),
    limite: Optional[int] = Query(100),            # Limite opcional para otimizar a velocidade
    db: Session = Depends(get_db)
):
    query = db.query(models.ProjetoModel)

    if titulo:
     termo = f"%{normalizar_texto(titulo)}%"
     query = query.filter(func.normalizar(models.ProjetoModel.titulo).like(termo))

    if campus:
        # Dicionário de equivalência para mapear buscas parciais para as siglas do IFAP
        MAPEAMENTO_CAMPUS = {
            "macapa": "MCP", "macapa": "MCP", "mcp": "MCP",
            "laranjal": "LRJ", "jari": "LRJ", "lrj": "LRJ",
            "porto": "PTG", "grande": "PTG", "ptg": "PTG",
            "santana": "STN", "stn": "STN",
            "oiapoque": "OPQ", "opq": "OPQ",
            "reitoria": "RE", "re": "RE",
            "pedra": "PBA", "branca": "PBA", "amapari": "PBA", "pba": "PBA"
        }

        # 1. Se o usuário selecionou da lista no formato completo "Macapá (MCP)"
        if "(" in campus and ")" in campus:
            sigla = campus.split("(")[-1].replace(")", "").strip()
            query = query.filter(models.ProjetoModel.campus.ilike(f"%{sigla}%"))
        else:
            termo = campus.lower().strip()
            sigla_encontrada = MAPEAMENTO_CAMPUS.get(termo)

            # 2. Se o que foi digitado (ex: "macap") mapear para uma sigla ("MCP"),
            # busca no banco POR AMBOS (pelo texto digitado OU pela sigla)
            if sigla_encontrada:
                query = query.filter(
                    (models.ProjetoModel.campus.ilike(f"%{campus}%")) |
                    (models.ProjetoModel.campus.ilike(f"%{sigla_encontrada}%"))
                )
            else:
                query = query.filter(models.ProjetoModel.campus.ilike(f"%{campus}%"))

    # Verifica qual dos parâmetros de situação foi preenchido
    filtro_situacao = situacao or situacao_atual
    if filtro_situacao:
        query = query.filter(models.ProjetoModel.situacao_atual.ilike(f"%{filtro_situacao}%"))

    if edital:
     termo = f"%{normalizar_texto(edital)}%"
     query = query.filter(func.normalizar(models.ProjetoModel.edital).like(termo))
        
    if ano:
        # Tenta filtrar tanto por igualdade exata quanto por texto contido, se aplicável
        try:
            ano_int = int(ano)
            query = query.filter(models.ProjetoModel.ano_edital == ano_int)
        except ValueError:
            query = query.filter(models.ProjetoModel.ano_edital.cast(str).ilike(f"%{ano}%"))

    if area:
     termo = f"%{normalizar_texto(area)}%"
     query = query.filter(func.normalizar(models.ProjetoModel.area_conhecimento).like(termo))
     
    if grupo_pesquisa:
        termo_gp = grupo_pesquisa.lower()
        if "sem grupo" in termo_gp or "definido" in termo_gp or termo_gp == "-":
            query = query.filter((models.ProjetoModel.grupo_pesquisa == "-") | (models.ProjetoModel.grupo_pesquisa == None))
        else:
            query = query.filter(models.ProjetoModel.grupo_pesquisa.ilike(f"%{grupo_pesquisa}%"))

    if coordenador:
     termo = f"%{normalizar_texto(coordenador)}%"
     query = query.filter(func.normalizar(models.ProjetoModel.coordenador).like(termo))

    # Aplica o limite para garantir resposta rápida na interface
    projetos_salvos = query.limit(limite).all()
    
    return {
        "total_registros": len(projetos_salvos),
        "resultados": projetos_salvos
    }

# 5.1 Rota para indicadores e Business Intelligence (DEVE VIR ANTES da rota de ID)
@app.get("/api/projetos/indicadores")
def obter_indicadores(db: Session = Depends(get_db)):
    total_geral = db.query(models.ProjetoModel).count()

    por_campus = db.query(
        models.ProjetoModel.campus,
        func.count(models.ProjetoModel.id)
    ).group_by(models.ProjetoModel.campus).all()

    por_situacao = db.query(
        models.ProjetoModel.situacao_atual,
        func.count(models.ProjetoModel.id)
    ).group_by(models.ProjetoModel.situacao_atual).all()

    por_ano = db.query(
        models.ProjetoModel.ano_edital,
        func.count(models.ProjetoModel.id)
    ).group_by(models.ProjetoModel.ano_edital).order_by(models.ProjetoModel.ano_edital).all()

    # Exclui o grupo "-" e pega os principais
    por_grupo = db.query(
        models.ProjetoModel.grupo_pesquisa,
        func.count(models.ProjetoModel.id)
    ).filter(
        models.ProjetoModel.grupo_pesquisa != "-",
        models.ProjetoModel.grupo_pesquisa != None
    ).group_by(models.ProjetoModel.grupo_pesquisa).order_by(func.count(models.ProjetoModel.id).desc()).limit(10).all()

    # Pega as áreas de conhecimento para o gráfico ficar limpo e legível
    por_area = db.query(
        models.ProjetoModel.area_conhecimento,
        func.count(models.ProjetoModel.id)
    ).filter(
        models.ProjetoModel.area_conhecimento != "-",
        models.ProjetoModel.area_conhecimento != None
    ).group_by(models.ProjetoModel.area_conhecimento).order_by(func.count(models.ProjetoModel.id).desc()).limit(100).all()

    return {
        "metrica_geral": {
            "total_projetos": total_geral
        },
        "distribuicao_por_campus": {str(k): v for k, v in por_campus},
        "distribuicao_por_situacao": {str(k): v for k, v in por_situacao},
        "distribuicao_por_ano": {str(k): v for k, v in por_ano},
        "distribuicao_por_grupo": {str(k): v for k, v in por_grupo},
        "distribuicao_por_area": {str(k): v for k, v in por_area}
    }

# 5.2 Buscar os detalhes completos de um projeto específico por ID (Fica abaixo)
@app.get("/api/projetos/{projeto_id}")
def obter_detalhes_projeto(projeto_id: int, db: Session = Depends(get_db)):
    projeto = db.query(models.ProjetoModel).filter(models.ProjetoModel.id == projeto_id).first()

    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")

    return {
        "status": "sucesso",
        "dados": projeto
    }