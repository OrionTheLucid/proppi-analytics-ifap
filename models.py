from sqlalchemy import Column, Integer, String
from database import Base

# 1. Definição do modelo de dados relacional para os projetos institucionais da PROPPI
class ProjetoModel(Base):
    __tablename__ = "projetos"

    # 2. Atributos primários e metadados de identificação do projeto
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    titulo = Column(String, index=True)
    resumo = Column(String)

    # 3. Informações de enquadramentio institucional e temporal
    edital = Column(String, index=True)
    ano_edital = Column(Integer, index=True)
    campus = Column(String, index=True)
    area_conhecimento = Column(String)
    grupo_pesquisa = Column(String)

    # 4. Dados de gestão e controle de execução
    coordenador = Column(String)
    periodo_execucao = Column(String)
    situacao_atual = Column(String, index=True)

