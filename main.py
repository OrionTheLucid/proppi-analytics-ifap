from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
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
    projeto: str
    campus: str
    status: str
    bolsas: int

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
        projeto=projeto.projeto,
        campus=projeto.campus,
        status=projeto.status,
        bolsas=projeto.bolsas
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
def listar_projetos(db: Session = Depends(get_db)):
    # Faz uma consulta (SELECT * FROM projetos) na tabela usando a sessão do banco
    projetos_salvos = db.query(models.ProjetoModel).all()
    
    return {
        "total_registros": len(projetos_salvos),
        "resultados": projetos_salvos
    }