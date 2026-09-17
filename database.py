from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. URL de Conexão do Banco de Dados
SQLALCHEMY_DATABASE_URL = "sqlite:///./proppi.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 2. Configuração da fábrica de sessões e da base declarativa para os modelos
Sessionlocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 3. Função utilitária para gerenciar a injeção da sessão do banco nas rotas
def get_db():
    db = Sessionlocal()
    try:
        yield db
    finally:
        db.close()