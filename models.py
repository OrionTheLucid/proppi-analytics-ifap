from sqlalchemy import Column, Integer, String
from database import Base

# 1. Definição da estrutura da tabela de projetos no banco de dados relacional
class ProjetoModel(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    projeto = Column(String, index=True)
    campus = Column(String)
    status = Column(String)
    bolsas = Column(Integer)