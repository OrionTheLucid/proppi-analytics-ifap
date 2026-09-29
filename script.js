const API_URL = "http://127.0.0.1:8000";
let chartCampus = null, chartSituacao = null, chartAno = null;

const inputAno = document.getElementById('filtro-ano');
const btnLimparAno = document.getElementById('btn-limpar-ano');

const inputCampus = document.getElementById('filtro-campus');
const btnLimparCampus = document.getElementById('btn-limpar-campus');

const inputSituacao = document.getElementById('filtro-situacao');
const btnLimparSituacao = document.getElementById('btn-limpar-situacao');

const inputEdital = document.getElementById('filtro-edital');
const containerSugestoesEdital = document.getElementById('sugestoes-edital');
const btnLimparEdital = document.getElementById('btn-limpar-edital');

const inputArea = document.getElementById('filtro-area');
const containerSugestoesArea = document.getElementById('sugestoes-area');
const btnLimparArea = document.getElementById('btn-limpar-area');

const inputGrupo = document.getElementById('filtro-grupo');
const containerSugestoesGrupo = document.getElementById('sugestoes-grupo');
const btnLimparGrupo = document.getElementById('btn-limpar-grupo');

const inputCoordenador = document.getElementById('filtro-coordenador');
const containerSugestoesCoordenador = document.getElementById('sugestoes-coordenador');
const btnLimparCoordenador = document.getElementById('btn-limpar-coordenador');

// Monitorar input do Campus
inputCampus.addEventListener('input', function() {
    if (this.value.trim().length > 0) {
        btnLimparCampus.classList.remove('hidden');
    } else {
        btnLimparCampus.classList.add('hidden');
    }
    carregarProjetos();
});

function limparFiltroCampus() {
    inputCampus.value = '';
    btnLimparCampus.classList.add('hidden');
    carregarProjetos();
}

// Monitorar input da Situação
inputSituacao.addEventListener('input', function() {
    if (this.value.trim().length > 0) {
        btnLimparSituacao.classList.remove('hidden');
    } else {
        btnLimparSituacao.classList.add('hidden');
    }
    carregarProjetos();
});

function limparFiltroSituacao() {
    inputSituacao.value = '';
    btnLimparSituacao.classList.add('hidden');
    carregarProjetos();
}

// Monitorar input do Ano
inputAno.addEventListener('input', function() {
    if (this.value.trim().length > 0) {
        btnLimparAno.classList.remove('hidden');
    } else {
        btnLimparAno.classList.add('hidden');
    }
    carregarProjetos();
});

function limparFiltroAno() {
    inputAno.value = '';
    btnLimparAno.classList.add('hidden');
    carregarProjetos();
}

// Busca Inteligente de Edital
inputEdital.addEventListener('input', async function() {
    const termo = this.value.trim();
    if (termo.length > 0) {
        btnLimparEdital.classList.remove('hidden');
    } else {
        btnLimparEdital.classList.add('hidden');
    }

    if (termo.length < 2) {
        containerSugestoesEdital.classList.add('hidden');
        containerSugestoesEdital.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/projetos?edital=${encodeURIComponent(termo)}&limite=10`);
        const data = await res.json();
        containerSugestoesEdital.innerHTML = '';

        if (!data.resultados || data.resultados.length === 0) {
            containerSugestoesEdital.classList.add('hidden');
            return;
        }

        const editaisUnicos = [...new Set(data.resultados.map(p => p.edital).filter(Boolean))];

        editaisUnicos.forEach(editalNome => {
            const item = document.createElement('div');
            item.className = "p-3 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-200 transition";
            item.innerText = editalNome;
            item.onclick = () => {
                inputEdital.value = editalNome;
                btnLimparEdital.classList.remove('hidden');
                containerSugestoesEdital.classList.add('hidden');
                carregarProjetos();
            };
            containerSugestoesEdital.appendChild(item);
        });

        containerSugestoesEdital.classList.remove('hidden');
    } catch (error) {
        console.error("Erro ao buscar sugestões de editais:", error);
    }
});

function limparBuscaEdital() {
    inputEdital.value = '';
    btnLimparEdital.classList.add('hidden');
    containerSugestoesEdital.classList.add('hidden');
    carregarProjetos();
}

// Busca Inteligente de Área
inputArea.addEventListener('input', async function() {
    const termo = this.value.trim();
    if (termo.length > 0) {
        btnLimparArea.classList.remove('hidden');
    } else {
        btnLimparArea.classList.add('hidden');
    }

    if (termo.length < 2) {
        containerSugestoesArea.classList.add('hidden');
        containerSugestoesArea.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/projetos?area=${encodeURIComponent(termo)}&limite=10`);
        const data = await res.json();
        containerSugestoesArea.innerHTML = '';

        if (!data.resultados || data.resultados.length === 0) {
            containerSugestoesArea.classList.add('hidden');
            return;
        }

        const areasUnicas = [...new Set(data.resultados.map(p => p.area_conhecimento).filter(Boolean))];

        areasUnicas.forEach(areaNome => {
            const item = document.createElement('div');
            item.className = "p-3 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-200 transition";
            item.innerText = areaNome;
            item.onclick = () => {
                inputArea.value = areaNome;
                btnLimparArea.classList.remove('hidden');
                containerSugestoesArea.classList.add('hidden');
                carregarProjetos();
            };
            containerSugestoesArea.appendChild(item);
        });

        containerSugestoesArea.classList.remove('hidden');
    } catch (error) {
        console.error("Erro ao buscar sugestões de áreas:", error);
    }
});

function limparBuscaArea() {
    inputArea.value = '';
    btnLimparArea.classList.add('hidden');
    containerSugestoesArea.classList.add('hidden');
    carregarProjetos();
}

// Busca Inteligente de Grupo de Pesquisa
inputGrupo.addEventListener('input', async function() {
    const termo = this.value.trim();
    const termoLower = termo.toLowerCase();
    if (termo.length > 0) {
        btnLimparGrupo.classList.remove('hidden');
    } else {
        btnLimparGrupo.classList.add('hidden');
    }

    if (termo.length < 2) {
        containerSugestoesGrupo.classList.add('hidden');
        containerSugestoesGrupo.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/projetos?grupo_pesquisa=${encodeURIComponent(termo)}&limite=10`);
        const data = await res.json();
        containerSugestoesGrupo.innerHTML = '';

        let gruposUnicos = [...new Set((data.resultados || []).map(p => p.grupo_pesquisa).filter(Boolean))];
        
        gruposUnicos = gruposUnicos.map(g => (g === "-" ? "Sem Grupo de Pesquisas Definido" : g));

        const textoAlvo = "sem grupo de pesquisas definido";
        if (textoAlvo.includes(termoLower) && !gruposUnicos.includes("Sem Grupo de Pesquisas Definido")) {
            gruposUnicos.unshift("Sem Grupo de Pesquisas Definido");
        }

        if (gruposUnicos.length === 0) {
            containerSugestoesGrupo.classList.add('hidden');
            return;
        }

        gruposUnicos.forEach(grupoNome => {
            const item = document.createElement('div');
            item.className = "p-3 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-200 transition";
            item.innerText = grupoNome;
            item.onclick = () => {
                inputGrupo.value = grupoNome;
                btnLimparGrupo.classList.remove('hidden');
                containerSugestoesGrupo.classList.add('hidden');
                carregarProjetos();
            };
            containerSugestoesGrupo.appendChild(item);
        });

        containerSugestoesGrupo.classList.remove('hidden');
    } catch (error) {
        console.error("Erro ao buscar sugestões de grupos de pesquisa:", error);
    }
});

function limparBuscaGrupo() {
    inputGrupo.value = '';
    btnLimparGrupo.classList.add('hidden');
    containerSugestoesGrupo.classList.add('hidden');
    carregarProjetos();
}

// Busca Inteligente de Coordenador(a)
inputCoordenador.addEventListener('input', async function() {
    const termo = this.value.trim();
    if (termo.length > 0) {
        btnLimparCoordenador.classList.remove('hidden');
    } else {
        btnLimparCoordenador.classList.add('hidden');
    }

    if (termo.length < 2) {
        containerSugestoesCoordenador.classList.add('hidden');
        containerSugestoesCoordenador.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/projetos?coordenador=${encodeURIComponent(termo)}&limite=10`);
        const data = await res.json();
        containerSugestoesCoordenador.innerHTML = '';

        if (!data.resultados || data.resultados.length === 0) {
            containerSugestoesCoordenador.classList.add('hidden');
            return;
        }

        const coordenadoresUnicos = [...new Set(data.resultados.map(p => p.coordenador).filter(Boolean))];

        coordenadoresUnicos.forEach(coordenadorNome => {
            const item = document.createElement('div');
            item.className = "p-3 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-200 transition";
            item.innerText = coordenadorNome;
            item.onclick = () => {
                inputCoordenador.value = coordenadorNome;
                btnLimparCoordenador.classList.remove('hidden');
                containerSugestoesCoordenador.classList.add('hidden');
                carregarProjetos();
            };
            containerSugestoesCoordenador.appendChild(item);
        });

        containerSugestoesCoordenador.classList.remove('hidden');
    } catch (error) {
        console.error("Erro ao buscar sugestões de coordenadores:", error);
    }
});

function limparBuscaCoordenador() {
    inputCoordenador.value = '';
    btnLimparCoordenador.classList.add('hidden');
    containerSugestoesCoordenador.classList.add('hidden');
    carregarProjetos();
}

const inputBusca = document.getElementById('input-busca-titulo');
const containerSugestoes = document.getElementById('sugestoes-busca');
const btnLimparBusca = document.getElementById('btn-limpar-busca');

// Configuração do Modo Escuro global
function alternarDarkMode() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('tema', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('tema', 'dark');
    }
}

if (localStorage.getItem('tema') === 'dark') {
    document.documentElement.classList.add('dark');
}

async function carregarIndicadores() {
    try {
        const res = await fetch(`${API_URL}/api/projetos/indicadores`);
        const data = await res.json();
        document.getElementById('total-projetos').innerText = data.metrica_geral.total_projetos;
        renderizarGraficos(data);
        renderizarListaAreas(data.distribuicao_por_area);
        renderizarListaGrupos(data.distribuicao_por_grupo);
    } catch (error) {
        console.error("Erro ao carregar indicadores:", error);
    }
}

inputBusca.addEventListener('input', async function() {
    const termo = this.value.trim();
    if (termo.length > 0) {
        btnLimparBusca.classList.remove('hidden');
    } else {
        btnLimparBusca.classList.add('hidden');
    }

    if (termo.length < 2) {
        containerSugestoes.classList.add('hidden');
        containerSugestoes.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/projetos?titulo=${encodeURIComponent(termo)}&limite=5`);
        const data = await res.json();
        containerSugestoes.innerHTML = '';

        if (!data.resultados || data.resultados.length === 0) {
            containerSugestoes.classList.add('hidden');
            return;
        }

        data.resultados.forEach(p => {
            const item = document.createElement('div');
            item.className = "p-3 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-200 transition";
            item.innerText = p.titulo;
            item.onclick = () => {
                inputBusca.value = p.titulo;
                btnLimparBusca.classList.remove('hidden');
                containerSugestoes.classList.add('hidden');
                carregarProjetos();
            };
            containerSugestoes.appendChild(item);
        });

        containerSugestoes.classList.remove('hidden');
    } catch (error) {
        console.error("Erro ao buscar sugestões:", error);
    }
});

function limparBuscaTexto() {
    inputBusca.value = '';
    btnLimparBusca.classList.add('hidden');
    containerSugestoes.classList.add('hidden');
    carregarProjetos();
}

// Função para limpar todos os filtros de uma vez
function limparFiltros() {
    inputBusca.value = '';
    inputCampus.value = '';
    inputSituacao.value = '';
    inputEdital.value = '';
    inputAno.value = ''; // <-- Atualizado
    inputArea.value = '';
    inputGrupo.value = '';
    inputCoordenador.value = '';
    
    btnLimparBusca.classList.add('hidden');
    containerSugestoes.classList.add('hidden');
    btnLimparCampus.classList.add('hidden');
    btnLimparSituacao.classList.add('hidden');
    btnLimparAno.classList.add('hidden');
    btnLimparEdital.classList.add('hidden');
    containerSugestoesEdital.classList.add('hidden');
    btnLimparArea.classList.add('hidden');
    containerSugestoesArea.classList.add('hidden');
    btnLimparGrupo.classList.add('hidden');
    containerSugestoesGrupo.classList.add('hidden');
    btnLimparCoordenador.classList.add('hidden');
    containerSugestoesCoordenador.classList.add('hidden');
    
    carregarProjetos();
}

// Fechar caixinhas flutuantes ao clicar fora
document.addEventListener('click', function(e) {
    if (!inputEdital.contains(e.target) && !containerSugestoesEdital.contains(e.target)) {
        containerSugestoesEdital.classList.add('hidden');
    }
    if (!inputBusca.contains(e.target) && !containerSugestoes.contains(e.target)) {
        containerSugestoes.classList.add('hidden');
    }
    if (!inputGrupo.contains(e.target) && !containerSugestoesGrupo.contains(e.target)) {
        containerSugestoesGrupo.classList.add('hidden');
    }
    if (!inputCoordenador.contains(e.target) && !containerSugestoesCoordenador.contains(e.target)) {
        containerSugestoesCoordenador.classList.add('hidden');
    }
    if (!inputArea.contains(e.target) && !containerSugestoesArea.contains(e.target)) {
        containerSugestoesArea.classList.add('hidden');
    }
});

function renderizarGraficos(data) {
    if (chartCampus) chartCampus.destroy();
    chartCampus = new Chart(document.getElementById('graficoCampus'), {
        type: 'bar',
        data: { labels: Object.keys(data.distribuicao_por_campus), datasets: [{ data: Object.values(data.distribuicao_por_campus), backgroundColor: '#047857', borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    if (chartSituacao) chartSituacao.destroy();
    chartSituacao = new Chart(document.getElementById('graficoSituacao'), {
        type: 'doughnut',
        data: { labels: Object.keys(data.distribuicao_por_situacao), datasets: [{ data: Object.values(data.distribuicao_por_situacao), backgroundColor: ['#047857', '#10b981', '#34d399', '#6ee7b7', '#065f46', '#022c22', '#38bdf8', '#fbbf24', '#f87171'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
    });

    if (chartAno) chartAno.destroy();
    chartAno = new Chart(document.getElementById('graficoAno'), {
        type: 'line',
        data: { labels: Object.keys(data.distribuicao_por_ano), datasets: [{ data: Object.values(data.distribuicao_por_ano), borderColor: '#047857', backgroundColor: 'rgba(4, 120, 87, 0.1)', fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderizarListaAreas(areas) {
    const container = document.getElementById('lista-areas');
    container.innerHTML = '';
    const entradas = Object.entries(areas);
    if (entradas.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-slate-400 text-sm">Nenhuma área encontrada.</div>`;
        return;
    }
    entradas.forEach(([area, qtd]) => {
        const linha = document.createElement('div');
        linha.className = "flex justify-between items-center px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm";
        linha.innerHTML = `
            <span class="text-slate-700 dark:text-slate-300 font-medium">${area}</span>
            <span class="text-slate-900 dark:text-slate-100 font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs">${qtd}</span>
        `;
        container.appendChild(linha);
    });
}

function renderizarListaGrupos(grupos) {
    const container = document.getElementById('lista-grupos');
    container.innerHTML = '';
    const entradas = Object.entries(grupos);
    if (entradas.length === 0) {
        container.innerHTML = `<div class="p-4 text-center text-slate-400 text-sm">Nenhum grupo encontrado.</div>`;
        return;
    }
    entradas.forEach(([grupo, qtd]) => {
        const nomeGrupo = (grupo === "-" || !grupo) ? "Sem Grupo de Pesquisas Definido" : grupo;
        const linha = document.createElement('div');
        linha.className = "flex justify-between items-center px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm";
        linha.innerHTML = `
            <span class="text-slate-700 dark:text-slate-300 font-medium pr-4">${nomeGrupo}</span>
            <span class="text-slate-900 dark:text-slate-100 font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs shrink-0">${qtd}</span>
        `;
        container.appendChild(linha);
    });
}

async function carregarProjetos() {
    try {
        const termoTitulo = document.getElementById('input-busca-titulo').value;
        const campus = document.getElementById('filtro-campus').value;
        const situacao = document.getElementById('filtro-situacao').value;
        const edital = document.getElementById('filtro-edital').value;
        const ano = document.getElementById('filtro-ano').value;
        const area = document.getElementById('filtro-area').value;
        const grupo = document.getElementById('filtro-grupo').value;
        const coordenador = document.getElementById('filtro-coordenador').value;
        
        let url = `${API_URL}/api/projetos?limite=50`;
        if (termoTitulo) url += `&titulo=${encodeURIComponent(termoTitulo)}`;
        if (campus) url += `&campus=${encodeURIComponent(campus)}`;
        if (situacao) url += `&situacao=${encodeURIComponent(situacao)}`;
        if (edital) url += `&edital=${encodeURIComponent(edital)}`;
        if (ano) url += `&ano=${encodeURIComponent(ano)}`;
        if (area) url += `&area=${encodeURIComponent(area)}`;
        if (grupo) url += `&grupo_pesquisa=${encodeURIComponent(grupo)}`;
        if (coordenador) url += `&coordenador=${encodeURIComponent(coordenador)}`;

        const tabela = document.getElementById('tabela-projetos');
        tabela.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400">A processar dados...</td></tr>`;

        const res = await fetch(url);
        const data = await res.json();
        tabela.innerHTML = "";

        if (!data.resultados || data.resultados.length === 0) {
            tabela.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-500">Nenhum projeto encontrado.</td></tr>`;
            document.getElementById('contador-exibicao').innerText = "0 registros";
            return;
        }

        document.getElementById('contador-exibicao').innerText = `Mostrando ${data.resultados.length} registros`;
        data.resultados.forEach(p => {
            const linha = document.createElement('tr');
            linha.className = "hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition cursor-pointer";
            linha.onclick = () => abrirDetalhes(p.id);
            linha.innerHTML = `
                <td class="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">${p.titulo}</td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-300">${p.campus}</td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-300">${p.edital} (${p.ano_edital})</td>
                <td class="py-3 px-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 whitespace-nowrap">${p.situacao_atual}</span></td>
            `;
            tabela.appendChild(linha);
        });
    } catch (error) {
        console.error("Erro ao carregar projetos:", error);
    }
}

async function abrirDetalhes(id) {
    const res = await fetch(`${API_URL}/api/projetos/${id}`);
    const data = await res.json();
    const p = data.dados;
    document.getElementById('modal-titulo').innerText = p.titulo || "-";
    document.getElementById('modal-campus').innerText = p.campus || "-";
    document.getElementById('modal-situacao').innerText = p.situacao_atual || "-";
    document.getElementById('modal-coordenador').innerText = p.coordenador || "-";
    document.getElementById('modal-periodo').innerText = p.periodo_execucao || "-";
    document.getElementById('modal-edital').innerText = `${p.edital} (${p.ano_edital})` || "-";
    document.getElementById('modal-area').innerText = p.area_conhecimento || "-";
    document.getElementById('modal-grupo').innerText = p.grupo_pesquisa || "-";
    document.getElementById('modal-resumo').innerText = p.resumo || "Sem resumo.";
    document.getElementById('modal-detalhes').classList.remove('hidden');
}

function fecharModal() { document.getElementById('modal-detalhes').classList.add('hidden'); }

// Inicialização
carregarIndicadores();
carregarProjetos();