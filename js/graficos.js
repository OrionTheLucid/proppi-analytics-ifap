// ===== Indicadores: gráficos, listas de áreas e grupos =====
let chartSituacao = null;
let chartAno = null;
let dadosIndicadoresGlobais = null;
let totalGeralProjetos = null; // total SEM filtro de campus (referência para os KPIs)

async function carregarIndicadores() {
    try {
        const data = await buscarIndicadores();
        totalGeralProjetos = data.metrica_geral.total_projetos;
        renderizarGraficos(data);
        atualizarKPIs(data); // depois do mapa, que calcula contagemCampus
        renderizarListaAreas(data.distribuicao_por_area);
        renderizarListaGrupos(data.distribuicao_por_grupo);
    } catch (error) {
        console.error("Erro ao carregar indicadores:", error);
    }
}

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

                // 2. Totalizador central DINÂMICO
                const somaAtual = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);

                ctx.font = "bold 22px 'Inter', sans-serif";
                ctx.fillStyle = corTexto;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(somaAtual, centerX, centerY - 8);

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

                    const label = chart.data.labels[context.dataIndex];
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
            <span class="text-slate-700 dark:text-slate-300 font-medium">${escaparHtml(area)}</span>
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
            <span class="text-slate-700 dark:text-slate-300 font-medium pr-4">${escaparHtml(nomeGrupo)}</span>
            <span class="text-slate-900 dark:text-slate-100 font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs shrink-0">${qtd}</span>
        `;
        container.appendChild(linha);
    });
}

// Função chamada pelo main.js para atualizar APENAS os dados dos gráficos (Gera animação fluida)
function atualizarGraficosBI(data) {
    dadosIndicadoresGlobais = data;
    atualizarKPIs(data);
    
    if (chartSituacao) {
        chartSituacao.data.labels = Object.keys(data.distribuicao_por_situacao || {});
        chartSituacao.data.datasets[0].data = Object.values(data.distribuicao_por_situacao || {});
        chartSituacao.update(); // Dispara animação
    }

    if (chartAno) {
        chartAno.data.labels = Object.keys(data.distribuicao_por_ano || {});
        chartAno.data.datasets[0].data = Object.values(data.distribuicao_por_ano || {});
        chartAno.update(); // Dispara animação
    }

    renderizarListaAreas(data.distribuicao_por_area);
    renderizarListaGrupos(data.distribuicao_por_grupo);
}

// Mostra o campus ativo ao lado dos títulos dos cards marcados com data-bi-titulo
function atualizarTitulosBI(nome, cor) {
    document.querySelectorAll('[data-bi-titulo]').forEach(el => {
        let sufixo = el.querySelector('.bi-sufixo');
        if (!sufixo) {
            sufixo = document.createElement('span');
            sufixo.className = 'bi-sufixo font-medium';
            el.appendChild(sufixo);
        }
        sufixo.textContent = nome ? ` · ${nome}` : '';
        sufixo.style.color = cor || '';
    });
}

// ===== KPIs do topo =====

// Anima um número do valor atual até o destino (respeita "reduzir movimento")
function animarNumero(el, destino, decimais = 0, sufixo = '') {
    if (!el) return;
    const de = parseFloat(el.dataset.valor || '0') || 0;
    el.dataset.valor = destino;
    const fmt = v => v.toLocaleString('pt-BR', { minimumFractionDigits: decimais, maximumFractionDigits: decimais }) + sufixo;
    const reduzir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (el._anim) cancelAnimationFrame(el._anim);
    if (reduzir || !window.requestAnimationFrame || de === destino) { el.textContent = fmt(destino); return; }
    const t0 = performance.now(), duracao = 700;
    const passo = agora => {
        const p = Math.min(1, (agora - t0) / duracao);
        const suave = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = fmt(de + (destino - de) * suave);
        if (p < 1) el._anim = requestAnimationFrame(passo);
    };
    el._anim = requestAnimationFrame(passo);
}

// Calcula e preenche os 4 KPIs. Acompanha o campus ativo no mapa (data já vem filtrada pela API).
function atualizarKPIs(data) {
    const total = (data.metrica_geral && data.metrica_geral.total_projetos) || 0;
    const ativo = COORDENADAS_CAMPUS.find(c => c.id === campusAtivoBI) || null;
    const situacoes = Object.entries(data.distribuicao_por_situacao || {});
    const somar = nome => situacoes.filter(([k]) => normalizarTexto(k) === nome).reduce((a, [, v]) => a + v, 0);
    const execucao = somar('em execucao'), concluidos = somar('concluido');
    const pct = v => (total ? (v / total) * 100 : 0);
    const f1 = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const texto = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };

    // 1. Total
    animarNumero(document.getElementById('total-projetos'), total);
    texto('kpi-total-sub', ativo && totalGeralProjetos ? `${ativo.nome} · de ${totalGeralProjetos.toLocaleString('pt-BR')} no total` : 'em todos os campi');

    // 2. Campi com projetos (sempre global: o mapa não é filtrado)
    const comProjetos = Object.values(contagemCampus).filter(q => q > 0).length;
    animarNumero(document.getElementById('kpi-campi'), comProjetos);
    if (ativo && totalGeralProjetos) {
        const parte = ((contagemCampus[ativo.id] || 0) / totalGeralProjetos) * 100;
        texto('kpi-campi-sub', `${ativo.nome} concentra ${f1(parte)}% dos projetos`);
    } else {
        texto('kpi-campi-sub', `de ${COORDENADAS_CAMPUS.length} unidades do IFAP`);
    }

    // 3. Em execução
    animarNumero(document.getElementById('kpi-execucao'), execucao);
    texto('kpi-execucao-sub', `${f1(pct(execucao))}% dos projetos${ativo ? ' de ' + ativo.nome : ''}`);

    // 4. Taxa de conclusão (com barra de progresso)
    animarNumero(document.getElementById('kpi-conclusao'), pct(concluidos), 1, '%');
    texto('kpi-conclusao-sub', `${concluidos.toLocaleString('pt-BR')} projetos concluídos`);
    const barra = document.getElementById('kpi-conclusao-barra');
    if (barra) barra.style.width = `${Math.min(100, pct(concluidos))}%`;
}