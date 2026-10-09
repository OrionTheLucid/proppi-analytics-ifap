// ===== Declaração dos filtros (usa criarAutocomplete) =====

function iniciarFiltros() {
    AUTOCOMPLETES.titulo = criarAutocomplete({
        input: 'input-busca-titulo', lista: 'sugestoes-busca', btnLimpar: 'btn-limpar-busca',
        parametro: 'titulo', campo: 'titulo', limite: 5, debounce: 350,
        recarregarSeVazio: true, nomeLimpar: 'limparBuscaTexto'
    });

    AUTOCOMPLETES.campus = criarAutocomplete({
        input: 'filtro-campus', lista: 'sugestoes-campus', btnLimpar: 'btn-limpar-campus',
        opcoes: OPCOES_CAMPUS, recarregarAoDigitar: 300, nomeLimpar: 'limparFiltroCampus',
        aoAlterar: sincronizarCampusBI // mantém o destaque do mapa e os gráficos em sincronia com este campo
    });

    // Se o texto deixar de ser o campus ativo no mapa, o destaque e os gráficos voltam ao geral
    const campoCampus = document.getElementById('filtro-campus');
    if (campoCampus) campoCampus.addEventListener('input', () => {
        const ativo = COORDENADAS_CAMPUS.find(c => c.id === campusAtivoBI);
        if (ativo && campoCampus.value !== ativo.filtro) limparCampusBI();
    });

    AUTOCOMPLETES.situacao = criarAutocomplete({
        input: 'filtro-situacao', lista: 'sugestoes-situacao', btnLimpar: 'btn-limpar-situacao',
        opcoes: OPCOES_SITUACAO, recarregarAoDigitar: 300, nomeLimpar: 'limparFiltroSituacao'
    });

    // Ano: sem lista de sugestões
    AUTOCOMPLETES.ano = criarAutocomplete({
        input: 'filtro-ano', btnLimpar: 'btn-limpar-ano',
        recarregarAoDigitar: 300, nomeLimpar: 'limparFiltroAno'
    });

    AUTOCOMPLETES.edital = criarAutocomplete({
        input: 'filtro-edital', lista: 'sugestoes-edital', btnLimpar: 'btn-limpar-edital',
        parametro: 'edital', campo: 'edital', nomeLimpar: 'limparBuscaEdital'
    });

    AUTOCOMPLETES.area = criarAutocomplete({
        input: 'filtro-area', lista: 'sugestoes-area', btnLimpar: 'btn-limpar-area',
        parametro: 'area', campo: 'area_conhecimento', nomeLimpar: 'limparBuscaArea'
    });

    AUTOCOMPLETES.grupo = criarAutocomplete({
        input: 'filtro-grupo', lista: 'sugestoes-grupo', btnLimpar: 'btn-limpar-grupo',
        parametro: 'grupo_pesquisa', campo: 'grupo_pesquisa', nomeLimpar: 'limparBuscaGrupo',
        // O banco guarda "-" quando não há grupo; exibimos um texto legível
        transformar: (valores, termo) => {
            const lista = valores.map(g => (g === '-' ? SEM_GRUPO : g));
            if (normalizarTexto(SEM_GRUPO).includes(normalizarTexto(termo)) && !lista.includes(SEM_GRUPO)) {
                lista.unshift(SEM_GRUPO);
            }
            return lista;
        }
    });

    AUTOCOMPLETES.coordenador = criarAutocomplete({
        input: 'filtro-coordenador', lista: 'sugestoes-coordenador', btnLimpar: 'btn-limpar-coordenador',
        parametro: 'coordenador', campo: 'coordenador', nomeLimpar: 'limparBuscaCoordenador'
    });
}

// Botão "Limpar todos os filtros"
function limparFiltros() {
    Object.values(AUTOCOMPLETES).forEach(ac => ac && ac.resetar());
    carregarProjetos();
}