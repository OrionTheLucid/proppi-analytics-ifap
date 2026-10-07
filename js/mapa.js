// ===== Mapa do Amapá: marcadores, rótulos e contagem por campus =====
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
    if (AUTOCOMPLETES.campus) AUTOCOMPLETES.campus.definir(c.filtro);
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
