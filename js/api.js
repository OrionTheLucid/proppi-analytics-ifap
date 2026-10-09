// ===== Camada de acesso à API (único lugar com fetch) =====

async function requisitar(caminho, params = {}) {
    const url = new URL(API_URL + caminho);
    Object.entries(params).forEach(([chave, valor]) => {
        if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
            url.searchParams.set(chave, valor);
        }
    });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${caminho}`);
    return res.json();
}

// filtros: { titulo, campus, situacao, edital, ano, area, grupo_pesquisa, coordenador }
function buscarProjetos(filtros = {}, limite = 50) {
    return requisitar('/api/projetos', { ...filtros, limite });
}

function buscarIndicadores(params = {}) {
    return requisitar('/api/projetos/indicadores', params);
}

function buscarProjeto(id) {
    return requisitar(`/api/projetos/${encodeURIComponent(id)}`);
}
