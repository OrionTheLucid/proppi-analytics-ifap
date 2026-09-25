from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel

import models
from database import engine, get_db

# 1. Inicializa a aplicação web com o FastAPI e cria as tabelas físicas no banco de dados
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API PROPPI - IFAP",
    description="Sistema de Gestão e Business Intelligence da Pró-Reitoria de Pesquisa, Pós-graduação e Inovação",
    version="1.0.0"
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

# 4. Rota para CADASTRAR um novo projeto no banco de dados (POST)
@app.post("/api/projetos", status_code=201)
def criar_projeto(projeto: ProjetoCreate, db: Session = Depends(get_db)):
    # Transforma os dados recebidos da requisição no modelo da tabela do SQLAlchemy
    novo_projeto = models.ProjetoModel(
        titulo=projeto.titulo,
        resumo=projeto.resumo,
        edital=projeto.edital,
        ano_edital=projeto.ano_edital,
        coordenador=projeto.coordenador,
        area_conhecimento=projeto.area_conhecimento,
        grupo_pesquisa=projeto.grupo_pesquisa,
        campus=projeto.campus,
        periodo_execucao=projeto.periodo_execucao,
        situacao_atual=projeto.situacao_atual
    )

    # Adiciona o registro na sessão do banco, confirma (commit) e atualiza o objeto
    db.add(novo_projeto)
    db.commit()
    db.refresh(novo_projeto)

    return {
        "mensagem": "Projeto cadastrado com sucesso!",
        "dados": novo_projeto
    }

# 5. Rota para LISTAR todos os projetos salvos no banco de dados (GET)
@app.get("/api/projetos")
def listar_projetos(
    campus: Optional[str] = Query(None),
    ano_edital: Optional[int] = Query(None),
    situacao_atual: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.ProjetoModel)
    if campus:
        query = query.filter(models.ProjetoModel.campus.ilike(f"%{campus}%"))
    if ano_edital:
        query = query.filter(models.ProjetoModel.ano_edital == ano_edital)
    if situacao_atual:
        query = query.filter(models.ProjetoModel.situacao_atual.ilike(f"%{situacao_atual}%"))

    projetos_salvos = query.all()
    
    return {
        "total_registros": len(projetos_salvos),
        "resultados": projetos_salvos
    }
# 6. Rota para indicadores e Business Intelligence (GET)
@app.get("/api/projetos/indicadores")
def obter_indicadores(db: Session = Depends(get_db)):
    # Conta o total geral de projetos cadastrados
    total_geral = db.query(models.ProjetoModel).count()

    # Agrupa e conta a quantidade de projetos por Campus
    por_campus = db.query(
        models.ProjetoModel.campus,
        func.count(models.ProjetoModel.id)
    ).group_by(models.ProjetoModel.campus).all()

    # Agrupa e conta a quantidade de projetos por Situação Atual
    por_situacao = db.query(
        models.ProjetoModel.situacao_atual,
        func.count(models.ProjetoModel.id)
    ).group_by(models.ProjetoModel.situacao_atual).all()

    return {
        "metrica_geral": {
            "total_projetos": total_geral
        },
        "distribuicao_por_campus": {campus: qtd for campus, qtd in por_campus},
        "distribuicao_por_situacao": {situacao: qtd for situacao, qtd in por_situacao}
    }