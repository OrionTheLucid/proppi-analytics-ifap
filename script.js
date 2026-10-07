const API_URL = "http://127.0.0.1:8000";

let temporizadorDebounceTitulo = null;
let indiceSelecaoTitulo = -1;
let temporizadorFiltros = null;

let chartSituacao = null;
let chartAno = null;
let dadosIndicadoresGlobais = null;

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

const inputBusca = document.getElementById('input-busca-titulo');
const containerSugestoes = document.getElementById('sugestoes-busca');
const btnLimparBusca = document.getElementById('btn-limpar-busca');

const containerSugestoesCampus = document.getElementById('sugestoes-campus');
const containerSugestoesSituacao = document.getElementById('sugestoes-situacao');

// Mapeamento dos Campuses para associação com o banco e os elementos HTML
const MAPA_GEO = { lonMin: -54.8763, lonMax: -49.8758, latMax: 4.5088, latMin: -1.2362 }; // limites do SVG do IBGE
// Mapeamento dos Campuses com cores individuais para cada unidade
const COORDENADAS_CAMPUS = [
    { id: 'OPQ', palavras: ['oiapoque', 'opq'],            nome: 'Oiapoque',         filtro: 'Oiapoque (OPQ)',          lat:  3.8433, lon: -51.8331, lado: 'esq', dx: 34, dy: -8,  cor: '#06b6d4' }, // Ciano
    { id: 'PBA', palavras: ['pedra', 'branca', 'pba'],     nome: 'Pedra Branca',     filtro: 'Pedra Branca do Amapari (PBA)', lat: 0.7772, lon: -51.9508, lado: 'esq', dx: 30, dy: -16, cor: '#f59e0b' }, // Amarelo / Âmbar
    { id: 'PTG', palavras: ['porto', 'grande', 'ptg'],     nome: 'Porto Grande',     filtro: 'Porto Grande (PTG)',      lat:  0.7122, lon: -51.4122, lado: 'dir', dx: 30, dy: -40, cor: '#a855f7' }, // Púrpura / Roxo
    { id: 'RE',  palavras: ['reitoria', 're'],             nome: 'Reitoria',         filtro: 'Reitoria (RE)',           lat:  0.0330, lon: -51.0640, lado: 'dir', dx: 44, dy: -38, cor: '#f43f5e' }, // Rosa / Vermelho
    { id: 'MCP', palavras: ['macapa', 'mcp'],              nome: 'Macapá',           filtro: 'Macapá (MCP)',            lat:  0.0036, lon: -51.0899, lado: 'dir', dx: 44, dy: 0,   cor: '#10b981' }, // Verde Esmeralda
    { id: 'STN', palavras: ['santana', 'stn'],             nome: 'Santana',          filtro: 'Santana (STN)',           lat: -0.0583, lon: -51.1815, lado: 'dir', dx: 44, dy: 38,  cor: '#3b82f6' }, // Azul
    { id: 'LRJ', palavras: ['laranjal', 'jari', 'lrj'],    nome: 'Laranjal do Jari', filtro: 'Laranjal do Jari (LRJ)',  lat: -0.8044, lon: -52.4528, lado: 'esq', dx: 34, dy: -4,  cor: '#f97316' }  // Laranja
];

let contagemCampus = {};

function filtrarPorCampus(c) {
    if (!inputCampus) return;
    inputCampus.value = c.filtro;
    btnLimparCampus.classList.remove('hidden');
    carregarProjetos();
}

// Cria os marcadores e rótulos coloridos uma única vez
function montarMapaCampus() {
    const pins = document.getElementById('mapa-pins');
    const wrap = document.getElementById('mapa-wrap');
    if (!pins || !wrap) return;
    pins.innerHTML = '';
    COORDENADAS_CAMPUS.forEach((c, i) => {
        const dot = document.createElement('button');
        dot.id = `dot-${c.id}`;
        dot.title = c.nome;
        dot.className = "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-slate-900 shadow-md hover:scale-110 transition-transform";
        dot.style.backgroundColor = c.cor;
        dot.onclick = () => filtrarPorCampus(c);

        // Halo pulsante acompanhando a cor do campus
        const halo = document.createElement('span');
        halo.className = "pulso-campus absolute inset-0 rounded-full opacity-75 pointer-events-none";
        halo.style.backgroundColor = c.cor;
        halo.style.animationDelay = `${i * 0.35}s`;
        dot.appendChild(halo);

        const chip = document.createElement('button');
        chip.id = `pin-${c.id}`;
        chip.className = "absolute z-[200] inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold " +
            "bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md " +
            "hover:ring-2 hover:ring-emerald-500 transition";
        chip.innerHTML = `${c.nome}: <span id="qtd-${c.id}" class="font-bold" style="color: ${c.cor};">0</span>`;
        chip.onclick = () => filtrarPorCampus(c);

        pins.appendChild(dot);
        pins.appendChild(chip);
    });
    if ('ResizeObserver' in window) new ResizeObserver(posicionarMapa).observe(wrap);
    posicionarMapa();
}

// Converte lat/lon -> pixels dentro do #mapa-wrap e redesenha as linhas-guia
function posicionarMapa() {
    const wrap = document.getElementById('mapa-wrap');
    const svg = document.getElementById('mapa-linhas');
    if (!wrap || !svg) return;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    const g = MAPA_GEO;
    const max = Math.max(1, ...Object.values(contagemCampus));
    let linhas = '';

    const yEq = g.latMax / (g.latMax - g.latMin) * H;
    linhas += `<text x="6" y="${yEq - 5}" font-size="10" class="fill-slate-400 dark:fill-slate-500">Linha do Equador</text>`;

    COORDENADAS_CAMPUS.forEach(c => {
        const x = (c.lon - g.lonMin) / (g.lonMax - g.lonMin) * W;
        const y = (g.latMax - c.lat) / (g.latMax - g.latMin) * H;
        const r = 4.5 + 10 * Math.sqrt((contagemCampus[c.id] || 0) / max);
        const cx = x + (c.lado === 'dir' ? c.dx : -c.dx), cy = y + c.dy;

        const dot = document.getElementById(`dot-${c.id}`);
        dot.style.cssText = `left:${x}px;top:${y}px;width:${2 * r}px;height:${2 * r}px;z-index:${100 - Math.round(r)}`;
        const chip = document.getElementById(`pin-${c.id}`);
        chip.style.left = `${cx}px`; chip.style.top = `${cy}px`;
        chip.style.transform = `translate(${c.lado === 'dir' ? '0' : '-100%'}, -50%)`;

        linhas += `<line x1="${x}" y1="${y}" x2="${cx}" y2="${cy}" stroke-width="1" class="stroke-slate-400 dark:stroke-slate-500"/>`;
    });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = linhas;
}

// Atualiza os números e o tamanho dos círculos com os dados da API
function renderizarMapaCampus(distribuicaoPorCampus) {
    if (!distribuicaoPorCampus) return;
    contagemCampus = {};
COORDENADAS_CAMPUS.forEach(c => contagemCampus[c.id] = 0);

Object.entries(distribuicaoPorCampus).forEach(([nomeBanco, qtd]) => {
    const nomeNorm = normalizarTexto(nomeBanco);
    const campus = COORDENADAS_CAMPUS.find(c =>
        c.palavras.some(p => p instanceof RegExp ? p.test(nomeNorm) : nomeNorm.includes(p))
    );
    if (campus) contagemCampus[campus.id] += qtd;
    else console.warn('Campus sem correspondência no mapa:', nomeBanco);
});

COORDENADAS_CAMPUS.forEach(c => {
    const el = document.getElementById(`qtd-${c.id}`);
    if (el) el.innerText = contagemCampus[c.id];
});
posicionarMapa();
}


// Função auxiliar para remover acentos e converter para minúsculas
function normalizarTexto(texto) {
    if (!texto) return "";
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Função para renderizar as sugestões de Campus
function renderizarSugestoesCampus(filtro = '') {
    containerSugestoesCampus.innerHTML = '';
    const termo = normalizarTexto(filtro.trim());
    
    // Filtra as opções ignorando acentos e maiúsculas
    const filtrados = OPCOES_CAMPUS.filter(c => normalizarTexto(c).includes(termo));

    if (filtrados.length === 0) {
        containerSugestoesCampus.classList.add('hidden');
        return;
    }

    filtrados.forEach(nomeCampus => {
        const item = document.createElement('div');
        item.className = "p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800/80 cursor-pointer text-sm text-slate-700 dark:text-slate-200 transition";
        item.innerText = nomeCampus;
        
        item.onclick = () => {
            inputCampus.value = nomeCampus;
            btnLimparCampus.classList.remove('hidden');
            containerSugestoesCampus.classList.add('hidden');
            carregarProjetos();
        };
        
        containerSugestoesCampus.appendChild(item);
    });

    containerSugestoesCampus.classList.remove('hidden');
}

// --- Eventos do campo de Campus ---
inputCampus.addEventListener('focus', () => {
    renderizarSugestoesCampus(inputCampus.value);
});

inputCampus.addEventListener('click', () => {
    renderizarSugestoesCampus(inputCampus.value);
});

inputCampus.addEventListener('input', function() {
    if (this.value.trim().length > 0) {
        btnLimparCampus.classList.remove('hidden');
    } else {
        btnLimparCampus.classList.add('hidden');
    }
    
    renderizarSugestoesCampus(this.value);
    
    clearTimeout(temporizadorFiltros);
    temporizadorFiltros = setTimeout(() => carregarProjetos(), 300);
});

function limparFiltroCampus() {
    inputCampus.value = '';
    btnLimparCampus.classList.add('hidden');
    containerSugestoesCampus.classList.add('hidden');
    carregarProjetos();
}

// Listas fixas de opções institucionais
const OPCOES_CAMPUS = [
    "Macapá (MCP)", "Laranjal do Jari (LRJ)", "Porto Grande (PTG)",
    "Santana (STN)", "Oiapoque (OPQ)", "Reitoria (RE)", "Pedra Branca do Amapari (PBA)"
];


// Listas fixas de opções de situação
const OPCOES_SITUACAO = [
    "Concluído", "Em execução", "Em edição", "Enviado",
    "Não Enviado", "Cancelado", "Inativado", "Não aceito", "Não selecionado"
];

// Função para renderizar as sugestões de Situação
function renderizarSugestoesSituacao(filtro = '') {
    containerSugestoesSituacao.innerHTML = '';
    const termo = normalizarTexto(filtro.trim());
    
    // Filtra as opções ignorando acentos e maiúsculas
    const filtrados = OPCOES_SITUACAO.filter(s => normalizarTexto(s).includes(termo));

    if (filtrados.length === 0) {
        containerSugestoesSituacao.classList.add('hidden');
        return;
    }

    filtrados.forEach(nomeSituacao => {
        const item = document.createElement('div');
        item.className = "p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800/80 cursor-pointer text-sm text-slate-700 dark:text-slate-200 transition";
        item.innerText = nomeSituacao;
        
        item.onclick = () => {
            inputSituacao.value = nomeSituacao;
            btnLimparSituacao.classList.remove('hidden');
            containerSugestoesSituacao.classList.add('hidden');
            carregarProjetos();
        };
        
        containerSugestoesSituacao.appendChild(item);
    });

    containerSugestoesSituacao.classList.remove('hidden');
}

// --- Eventos do campo de Situação ---
inputSituacao.addEventListener('focus', () => {
    renderizarSugestoesSituacao(inputSituacao.value);
});

inputSituacao.addEventListener('click', () => {
    renderizarSugestoesSituacao(inputSituacao.value);
});

inputSituacao.addEventListener('input', function() {
    if (this.value.trim().length > 0) {
        btnLimparSituacao.classList.remove('hidden');
    } else {
        btnLimparSituacao.classList.add('hidden');
    }
    
    renderizarSugestoesSituacao(this.value);
    
    clearTimeout(temporizadorFiltros);
    temporizadorFiltros = setTimeout(() => carregarProjetos(), 300);
});

function limparFiltroSituacao() {
    inputSituacao.value = '';
    btnLimparSituacao.classList.add('hidden');
    containerSugestoesSituacao.classList.add('hidden');
    carregarProjetos();
}

// Monitorar input do Ano
inputAno.addEventListener('input', function() {
    if (this.value.trim().length > 0) {
        btnLimparAno.classList.remove('hidden');
    } else {
        btnLimparAno.classList.add('hidden');
    }
    
    clearTimeout(temporizadorFiltros);
    temporizadorFiltros = setTimeout(() => {
        carregarProjetos();
    }, 300);
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

    if (termo.length < 1) {
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

    if (termo.length < 1) {
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

    if (termo.length < 1) {
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

    if (termo.length < 1) {
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

    // Re-renderiza os gráficos com as novas cores de contraste do tema atual
    if (dadosIndicadoresGlobais) {
        renderizarGraficos(dadosIndicadoresGlobais);
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

// Listeners e Lógica Padronizada para a Busca por Título
if (inputBusca) {
    // Evento disparado enquanto o usuário digita
    inputBusca.addEventListener('input', function() {
        const termo = this.value.trim();

        // 1. Controla a exibição do botão 'X' de limpar
        if (termo.length > 0) {
            btnLimparBusca.classList.remove('hidden');
        } else {
            btnLimparBusca.classList.add('hidden');
            containerSugestoes.classList.add('hidden');
            containerSugestoes.innerHTML = '';
            // Se o usuário apagou todo o texto (via Backspace/Delete), recarrega a tabela automaticamente
            carregarProjetos();
            return;
        }

        // 3. Aplica o DEBOUNCE: Cancela a requisição anterior se o usuário continuar digitando
        clearTimeout(temporizadorDebounceTitulo);

        // Aguarda 350 milissegundos após a última tecla antes de chamar a API
        temporizadorDebounceTitulo = setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/api/projetos?titulo=${encodeURIComponent(termo)}&limite=5`);
                const data = await res.json();
                containerSugestoes.innerHTML = '';

                if (!data.resultados || data.resultados.length === 0) {
                    containerSugestoes.classList.add('hidden');
                    return;
                }

                // Preenche a caixa flutuante com as sugestões encontradas
                data.resultados.forEach(p => {
                    const item = document.createElement('div');
                    item.className = "p-3 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer text-sm text-slate-700 dark:text-slate-200 transition";
                    item.innerText = p.titulo;
                    
                    // Ação ao clicar em uma sugestão da lista
                    item.onclick = () => {
                        inputBusca.value = p.titulo;
                        btnLimparBusca.classList.remove('hidden');
                        containerSugestoes.classList.add('hidden');
                        carregarProjetos(); // Atualiza a tabela imediatamente
                    };
                    containerSugestoes.appendChild(item);
                });
                indiceSelecaoTitulo = -1;
                containerSugestoes.classList.remove('hidden');
            } catch (error) {
                console.error("Erro ao buscar sugestões de título:", error);
            }
        }, 350);
    });

    // Evento de navegação via teclado no input de título
    inputBusca.addEventListener('keydown', function(e) {
        // Captura todas as divs filhas (os itens de sugestão) dentro do container
        const itens = containerSugestoes.querySelectorAll('div');
        const estaVisivel = !containerSugestoes.classList.contains('hidden');

        // 1. Seta para BAIXO
        if (e.key === 'ArrowDown') {
            if (!estaVisivel || itens.length === 0) return;
            e.preventDefault(); // Impede o cursor do texto de ir para o final da frase
            
            indiceSelecaoTitulo++;
            if (indiceSelecaoTitulo >= itens.length) {
                indiceSelecaoTitulo = 0; // Volta para o primeiro item
            }
            atualizarDestaqueSugestaoTitulo(itens);
        } 
        
        // 2. Seta para CIMA
        else if (e.key === 'ArrowUp') {
            if (!estaVisivel || itens.length === 0) return;
            e.preventDefault(); // Impede o cursor do texto de ir para o início da frase
            
            indiceSelecaoTitulo--;
            if (indiceSelecaoTitulo < 0) {
                indiceSelecaoTitulo = itens.length - 1; // Vai para o último item
            }
            atualizarDestaqueSugestaoTitulo(itens);
        } 
        
        // 3. Tecla ENTER
        else if (e.key === 'Enter') {
            // Se a caixa estiver aberta e o usuário selecionou algo com as setas
            if (estaVisivel && indiceSelecaoTitulo >= 0 && itens[indiceSelecaoTitulo]) {
                e.preventDefault();
                // Simula o clique do mouse no item destacado
                itens[indiceSelecaoTitulo].click();
            } else {
                // Caso contrário, apenas fecha e realiza a busca normal
                clearTimeout(temporizadorDebounceTitulo);
                containerSugestoes.classList.add('hidden');
                carregarProjetos();
            }
        } 
        
        // 4. Tecla ESCAPE (ESC)
        else if (e.key === 'Escape') {
            containerSugestoes.classList.add('hidden');
            indiceSelecaoTitulo = -1;
        }
    });
}

function limparBuscaTexto() {
    inputBusca.value = '';
    btnLimparBusca.classList.add('hidden');
    containerSugestoes.classList.add('hidden');
    carregarProjetos();
}

// Função auxiliar para aplicar/remover a cor de destaque no item ativo
function atualizarDestaqueSugestaoTitulo(itens) {
    itens.forEach((item, index) => {
        if (index === indiceSelecaoTitulo) {
            // Aplica destaque visual (verde claro no modo light, slate no modo dark)
            item.classList.add('bg-emerald-100', 'dark:bg-slate-700', 'font-semibold');
            // Rola a caixinha automaticamente caso o item esteja fora da área visível
            item.scrollIntoView({ block: 'nearest' });
        } else {
            // Remove o destaque dos outros itens
            item.classList.remove('bg-emerald-100', 'dark:bg-slate-700', 'font-semibold');
        }
    });
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
    if (!inputCampus.contains(e.target) && !containerSugestoesCampus.contains(e.target)) {
        containerSugestoesCampus.classList.add('hidden');
    }
    if (!inputSituacao.contains(e.target) && !containerSugestoesSituacao.contains(e.target)) {
        containerSugestoesSituacao.classList.add('hidden');
    }
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
    dadosIndicadoresGlobais = data; // Salva em cache global
    
    // Renderiza o mapa interativo
    renderizarMapaCampus(data.distribuicao_por_campus);

    // Detecta se o Dark Mode está ativo para ajustar contraste de textos e bordas
    const isDark = document.documentElement.classList.contains('dark');
    const corTexto = isDark ? '#e2e8f0' : '#334155';
    const corBordaDoughnut = isDark ? '#0f172a' : '#ffffff';

    // 1. Gráfico de Situação Atual
if (chartSituacao) chartSituacao.destroy();

const situacoesLabels = Object.keys(data.distribuicao_por_situacao || {});
const situacoesValores = Object.values(data.distribuicao_por_situacao || {});
const totalProjetos = situacoesValores.reduce((acc, curr) => acc + curr, 0);

// Paleta de gradientes
const mapaGradientes = {
    'Em execução': ['#2563eb', '#60a5fa'],
    'Concluído': ['#059669', '#34d399'],
    'Em edição': ['#d97706', '#fbbf24'],
    'Enviado': ['#4f46e5', '#818cf8'],
    'Não Enviado': ['#7c3aed', '#a78bfa'],
    'Não aceito': ['#ea580c', '#fb923c'],
    'Não selecionado': ['#e11d48', '#fb7185'],
    'Cancelado': ['#475569', '#94a3b8'],
    'Inativado': ['#334155', '#64748b']
};

const elSituacao = document.getElementById('graficoSituacao') || document.getElementById('grafico-situacao');

if (elSituacao) {
    chartSituacao = new Chart(elSituacao, {
        type: 'doughnut',
        // Plugins ativos: DataLabels (números nas fatias) e Plugin Customizado (texto e gradiente no centro)
        plugins: [ChartDataLabels, {
            id: 'fundoETextoCentral',
            beforeDraw(chart) {
                const { width, height, ctx } = chart;
                ctx.save();
                
                const centerX = width / 2;
                const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
                const innerRadius = chart._metasets[0]?.data[0]?.innerRadius || 0;

                // 1. Gradiente Radial Interno (Brilho suave dentro da rosca)
                if (innerRadius > 0) {
                    const gradienteCentro = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius);
                    gradienteCentro.addColorStop(0, isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.08)');
                    gradienteCentro.addColorStop(1, 'transparent');

                    ctx.fillStyle = gradienteCentro;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
                    ctx.fill();
                }

                // 2. Totalizador central
                ctx.font = "bold 22px 'Inter', sans-serif";
                ctx.fillStyle = corTexto;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(totalProjetos, centerX, centerY - 8);

                ctx.font = "500 11px 'Inter', sans-serif";
                ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
                ctx.fillText('Projetos', centerX, centerY + 12);

                ctx.restore();
            }
        }],
        data: { 
            labels: situacoesLabels, 
            datasets: [{ 
                data: situacoesValores, 
                // Gradiente Radial Aplicado a Cada Fatia
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;

                    const index = context.dataIndex;
                    const label = situacoesLabels[index];
                    const cores = mapaGradientes[label] || ['#0891b2', '#06b6d4'];

                    const centerX = (chartArea.left + chartArea.right) / 2;
                    const centerY = (chartArea.top + chartArea.bottom) / 2;
                    const outerRadius = (chartArea.right - chartArea.left) / 2;

                    const gradient = ctx.createRadialGradient(
                        centerX, centerY, outerRadius * 0.3,
                        centerX, centerY, outerRadius
                    );
                    gradient.addColorStop(0, cores[1]);
                    gradient.addColorStop(1, cores[0]);
                    return gradient;
                },
                borderColor: corBordaDoughnut,
                borderWidth: 2,
                hoverOffset: 8
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            // 1. Redução sutil do tamanho do gráfico via padding
            layout: { 
                padding: { top: 22, bottom: 15, left: 22, right: 22 } 
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1400,
                easing: 'easeOutQuart'
            },
            plugins: { 
                // 2. Exibição da Quantidade Dentro do Gráfico
                datalabels: {
                    color: '#ffffff',
                    font: {
                        weight: 'bold',
                        size: 11,
                        family: "'Inter', sans-serif"
                    },
                    // Formatação para ocultar o número caso a fatia seja 0
                    formatter: (value) => (value > 0 ? value : ''),
                    textShadowColor: 'rgba(0, 0, 0, 0.5)',
                    textShadowBlur: 4
                },
                legend: { 
                    position: 'bottom', 
                    labels: { 
                        color: corTexto,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 28,
                        font: { size: 11, family: "'Inter', sans-serif", weight: '500' },
                        boxWidth: 8,
                        boxHeight: 8
                    } 
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#f8fafc' : '#0f172a',
                    bodyColor: isDark ? '#cbd5e1' : '#334155',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 10,
                    usePointStyle: true
                }
            },
            // 1. Espessura da rosca ajustada (72%) para dar mais leveza visual
            cutout: '72%'
        }
    });
}

    // 2. Gráfico de Evolução por Ano
    if (chartAno) chartAno.destroy();
    const elAno = document.getElementById('graficoAno');
    if (elAno) {
        chartAno = new Chart(elAno, {
            type: 'line',
            data: { 
                labels: Object.keys(data.distribuicao_por_ano || {}), 
                datasets: [{ 
                    data: Object.values(data.distribuicao_por_ano || {}), 
                    borderColor: '#10b981', 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                    fill: true, 
                    tension: 0.35,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        ticks: { color: corTexto },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: corTexto },
                        grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                    }
                }
            }
        });
    }
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
    const tabela = document.getElementById('tabela-projetos');
    if (!tabela) return;

    try {
        const termoTitulo = document.getElementById('input-busca-titulo')?.value || '';
        const campus = document.getElementById('filtro-campus')?.value || '';
        const situacao = document.getElementById('filtro-situacao')?.value || '';
        const edital = document.getElementById('filtro-edital')?.value || '';
        const ano = document.getElementById('filtro-ano')?.value || '';
        const area = document.getElementById('filtro-area')?.value || '';
        const grupo = document.getElementById('filtro-grupo')?.value || '';
        const coordenador = document.getElementById('filtro-coordenador')?.value || '';
        
        let url = `${API_URL}/api/projetos?limite=50`;
        if (termoTitulo) url += `&titulo=${encodeURIComponent(termoTitulo)}`;
        if (campus) url += `&campus=${encodeURIComponent(campus)}`;
        if (situacao) url += `&situacao=${encodeURIComponent(situacao)}`;
        if (edital) url += `&edital=${encodeURIComponent(edital)}`;
        if (ano) url += `&ano=${encodeURIComponent(ano)}`;
        if (area) url += `&area=${encodeURIComponent(area)}`;
        if (grupo) url += `&grupo_pesquisa=${encodeURIComponent(grupo)}`;
        if (coordenador) url += `&coordenador=${encodeURIComponent(coordenador)}`;

        // Aplica efeito visual de carregamento
        tabela.classList.add('opacity-40', 'pointer-events-none', 'transition-opacity');

        const res = await fetch(url);
        const data = await res.json();
        tabela.innerHTML = "";

        if (!data.resultados || data.resultados.length === 0) {
            tabela.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-500">Nenhum projeto encontrado.</td></tr>`;
            const contador = document.getElementById('contador-exibicao');
            if (contador) contador.innerText = "0 registros";
            return;
        }

        const contador = document.getElementById('contador-exibicao');
        if (contador) contador.innerText = `Mostrando ${data.resultados.length} registros`;

        data.resultados.forEach(p => {
            const linha = document.createElement('tr');
            linha.className = "hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition cursor-pointer";
            linha.onclick = () => abrirDetalhes(p.id);
            
            const editalTexto = p.edital ? `${p.edital} (${p.ano_edital || '-'})` : '-';

            linha.innerHTML = `
                <td class="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">${p.titulo || '-'}</td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-300">${p.campus || '-'}</td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-300">${editalTexto}</td>
                <td class="py-3 px-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 whitespace-nowrap">${p.situacao_atual || '-'}</span></td>
            `;
            tabela.appendChild(linha);
        });
    } catch (error) {
        console.error("Erro ao carregar projetos:", error);
        tabela.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-red-500">Erro ao carregar os dados.</td></tr>`;
    } finally {
        // Garante que o estado de opacidade seja removido independentemente do resultado
        tabela.classList.remove('opacity-40', 'pointer-events-none');
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
montarMapaCampus();
carregarIndicadores();
carregarProjetos();