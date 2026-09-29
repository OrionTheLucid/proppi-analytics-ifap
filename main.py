from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine, get_db

# 1. Inicializa a aplicação web com o FastAPI e cria as tabelas físicas no banco de dados
models.Base.metadata.create_all(bind=engine)

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

# 2. Definição do Esquema (Pydantic) para validação dos dados de entrada
class ProjetoCreate(BaseModel):
    titulo: str
    resumo: Optional[str] = "-"
    edital: Optional[str] = "-"
    ano_edital: Optional[int] = 0
    coordenador: Optional[str] = "-"
    area_conhecimento: Optional[str] = "-"
    grupo_pesquisa: Optional[str] = "-"
    campus: str
    periodo_execucao: Optional[str] = "-"
    situacao_atual: Optional[str] = "-"

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
        query = query.filter(models.ProjetoModel.titulo.ilike(f"%{titulo}%"))
    
    if campus:
        # Se o formato vier como "Macapá (MCP)", tenta extrair o que está entre parênteses
        if "(" in campus and ")" in campus:
            sigla_campus = campus.split("(")[-1].replace(")", "").strip()
            query = query.filter(models.ProjetoModel.campus.ilike(f"%{sigla_campus}%"))
        else:
            query = query.filter(models.ProjetoModel.campus.ilike(f"%{campus}%"))

    # Verifica qual dos parâmetros de situação foi preenchido
    filtro_situacao = situacao or situacao_atual
    if filtro_situacao:
        query = query.filter(models.ProjetoModel.situacao_atual.ilike(f"%{filtro_situacao}%"))

    if edital:
        query = query.filter(models.ProjetoModel.edital.ilike(f"%{edital}%"))
        
    if ano:
        # Tenta filtrar tanto por igualdade exata quanto por texto contido, se aplicável
        try:
            ano_int = int(ano)
            query = query.filter(models.ProjetoModel.ano_edital == ano_int)
        except ValueError:
            query = query.filter(models.ProjetoModel.ano_edital.cast(str).ilike(f"%{ano}%"))

    if area:
        query = query.filter(models.ProjetoModel.area_conhecimento.ilike(f"%{area}%"))
        
    if grupo_pesquisa:
        termo_gp = grupo_pesquisa.lower()
        if "sem grupo" in termo_gp or "definido" in termo_gp or termo_gp == "-":
            query = query.filter((models.ProjetoModel.grupo_pesquisa == "-") | (models.ProjetoModel.grupo_pesquisa == None))
        else:
            query = query.filter(models.ProjetoModel.grupo_pesquisa.ilike(f"%{grupo_pesquisa}%"))

    if coordenador:
        query = query.filter(models.ProjetoModel.coordenador.ilike(f"%{coordenador}%"))

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