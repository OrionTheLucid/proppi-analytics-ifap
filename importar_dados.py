import pandas as pd
from database import Sessionlocal, engine
import models

# Garante que o banco de dados e as tabelas mapeadas no models.py sejam geradas fisicamente no SQlite antes de iniciar a inserção
# Remove a tabela antiga se ela existir (evitando dados duplicados) e recria do zero
models.ProjetoModel.__table__.drop(engine, checkfirst=True)
models.Base.metadata.create_all(bind=engine)

def importar_planilha():
    # Caminho do arquivo da planilha institucional consolidada
    caminho_arquivo = r"C:\Users\teksu\Documents\Banco de Dados PROPPI\todos_os_projetos.xlsx"
    print(f"Lendo a planilha {caminho_arquivo}...")

    # Leitura da primeira aba da planilha utilizando o Pandas
    xls = pd.ExcelFile(caminho_arquivo)
    df = pd.read_excel(caminho_arquivo, sheet_name=xls.sheet_names[0])

    # Substitui células vazias ou nulas (NaN) por um traço ("-") para padronizar
    df = df.fillna("-")

    # Abre uma sessão ativa de conexão com o banco de dados
    db = Sessionlocal()
    print(f"Iniciando a importação de {len(df)} registros para o banco de dados")

    contador = 0

    try:
        # Pecorre cada linha da planilha utilizando os índices numéricos (iloc) para garantir precisão absoluta na extração de cada coluna
        for index, linha in df.iterrows():

            # Tratamento do ano do edital para garantir que seja um número inteiro seguro
            ano_val = linha.iloc[4]
            ano_int = int(ano_val) if str(ano_val).isdigit() else 0

            # Mapeamento exato das colunas institucionais para o modelo do banco:
            # Índice 1: Título | Índice 2: Resumo | Índice 3: Edital | Índice 4: Ano
            # Índice 5: Coordenador | Índice 6: Área | Índice 7: Grupo | Índice 8: Campus
            # Índice 9: Período | Índice 10: Situação Atual
            novo_projeto = models.ProjetoModel(
                titulo=str(linha.iloc[1]),
                resumo=str(linha.iloc[2]),
                edital=str(linha.iloc[3]),
                ano_edital=ano_int,
                coordenador=str(linha.iloc[5]),
                area_conhecimento=str(linha.iloc[6]),
                grupo_pesquisa=str(linha.iloc[7]),
                campus=str(linha.iloc[8]),
                periodo_execucao=str(linha.iloc[9]),
                situacao_atual=str(linha.iloc[10])
            )

            # Adiciona o registro na sessão do banco
            db.add(novo_projeto)
            contador += 1

        # Efetiva a gravação definitiva de todos os registros no SQLite
        db.commit()
        print(f"Sucesso absoluto! {contador} projetos foram importados e salvos no banco de dados.")

    except Exception as e:
        # Em caso de qualquer falha, desfaz qualquer alteração pendente para proteger o banco de dados
        db.rollback()
        print(f"Erro crítico durante a importação: {e}")
    finally:
        # Fecha obrigatoriamente a sessão de conexão com o banco de dados
        db.close()

if __name__ == "__main__":
    importar_planilha()