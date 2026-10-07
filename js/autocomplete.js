// ===== Campo de filtro genérico com sugestões =====
// Substitui os blocos repetidos de Título, Campus, Situação, Ano, Edital, Área, Grupo e Coordenador.
//
// Opções de criarAutocomplete(cfg):
//   input, btnLimpar, lista ........ ids dos elementos (lista é opcional: sem ela, o campo não tem sugestões)
//   opcoes ......................... array fixo de sugestões (filtrado localmente)
//   parametro + campo .............. sugestões vindas da API (parâmetro de busca e campo do resultado)
//   limite, debounce ............... limite de resultados e atraso (ms) da busca de sugestões
//   transformar(valores, termo) .... ajuste final da lista de sugestões
//   recarregarAoDigitar ............ atraso (ms) para recarregar a tabela enquanto digita
//   recarregarSeVazio .............. recarrega a tabela imediatamente ao apagar o texto
//   nomeLimpar ..................... nome da função global usada nos onclick do HTML

const AUTOCOMPLETES = {};
const CLASSE_ITEM_SUGESTAO = "p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800/80 cursor-pointer text-sm text-slate-700 dark:text-slate-200 transition";
const CLASSES_DESTAQUE = ['bg-emerald-100', 'dark:bg-slate-700', 'font-semibold'];

function criarAutocomplete(cfg) {
    const input = document.getElementById(cfg.input);
    const btn = document.getElementById(cfg.btnLimpar);
    const lista = cfg.lista ? document.getElementById(cfg.lista) : null;
    if (!input) return null;

    let timerBusca = null, timerRecarga = null, indice = -1, sequencia = 0;

    const itens = () => (lista ? lista.querySelectorAll('[data-item]') : []);
    const aberta = () => lista && !lista.classList.contains('hidden');
    const atualizarBotao = () => btn && btn.classList.toggle('hidden', input.value.trim() === '');

    function fechar() {
        if (lista) lista.classList.add('hidden');
        indice = -1;
    }

    function mostrar(valores) {
        if (!lista) return;
        lista.innerHTML = '';
        indice = -1;
        if (!valores.length) { lista.classList.add('hidden'); return; }
        valores.forEach(valor => {
            const item = document.createElement('div');
            item.dataset.item = '';
            item.className = CLASSE_ITEM_SUGESTAO;
            item.innerText = valor;
            item.onclick = () => definir(valor);
            lista.appendChild(item);
        });
        lista.classList.remove('hidden');
    }

    function destacar() {
        itens().forEach((item, i) => {
            CLASSES_DESTAQUE.forEach(c => item.classList.toggle(c, i === indice));
            if (i === indice) item.scrollIntoView({ block: 'nearest' });
        });
    }

    // Preenche o campo e aplica o filtro (usado ao escolher uma sugestão e pelo mapa)
    function definir(valor) {
        input.value = valor;
        atualizarBotao();
        fechar();
        carregarProjetos();
    }

    // Limpa o campo sem recarregar a tabela (usado por "Limpar todos os filtros")
    function resetar() {
        clearTimeout(timerBusca);
        clearTimeout(timerRecarga);
        sequencia++;
        input.value = '';
        atualizarBotao();
        if (lista) lista.innerHTML = '';
        fechar();
    }

    function limpar() {
        resetar();
        carregarProjetos();
    }

    function sugerirDeOpcoes() {
        const termo = normalizarTexto(input.value.trim());
        mostrar(cfg.opcoes.filter(o => normalizarTexto(o).includes(termo)));
    }

    async function sugerirDaApi(termo) {
        const minha = ++sequencia;
        try {
            const data = await buscarProjetos({ [cfg.parametro]: termo }, cfg.limite || 10);
            if (minha !== sequencia) return; // resposta antiga: ignora
            let valores = [...new Set((data.resultados || []).map(p => p[cfg.campo]).filter(Boolean))];
            if (cfg.transformar) valores = cfg.transformar(valores, termo);
            mostrar(valores);
        } catch (erro) {
            console.error(`Erro ao buscar sugestões (${cfg.parametro}):`, erro);
        }
    }

    input.addEventListener('input', () => {
        atualizarBotao();
        const termo = input.value.trim();

        if (cfg.recarregarAoDigitar != null) {
            clearTimeout(timerRecarga);
            timerRecarga = setTimeout(carregarProjetos, cfg.recarregarAoDigitar);
        }
        if (cfg.opcoes) {
            sugerirDeOpcoes();
        } else if (cfg.parametro) {
            clearTimeout(timerBusca);
            if (!termo) {
                sequencia++;
                mostrar([]);
                if (cfg.recarregarSeVazio) carregarProjetos();
                return;
            }
            timerBusca = setTimeout(() => sugerirDaApi(termo), cfg.debounce || 0);
        }
    });

    if (cfg.opcoes) {
        ['focus', 'click'].forEach(evento => input.addEventListener(evento, sugerirDeOpcoes));
    }

    // Teclado: setas, Enter e Esc
    input.addEventListener('keydown', e => {
        const lis = itens();
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            if (!aberta() || !lis.length) return;
            e.preventDefault();
            if (e.key === 'ArrowDown') indice = (indice + 1) % lis.length;
            else indice = indice <= 0 ? lis.length - 1 : indice - 1;
            destacar();
        } else if (e.key === 'Enter') {
            if (aberta() && indice >= 0 && lis[indice]) {
                e.preventDefault();
                lis[indice].click();
            } else {
                clearTimeout(timerBusca);
                clearTimeout(timerRecarga);
                fechar();
                carregarProjetos();
            }
        } else if (e.key === 'Escape') {
            fechar();
        }
    });

    if (cfg.nomeLimpar) window[cfg.nomeLimpar] = limpar;

    return {
        definir, limpar, resetar,
        aoClicarFora(e) {
            if (lista && !input.contains(e.target) && !lista.contains(e.target)) fechar();
        }
    };
}

// Fecha qualquer lista aberta ao clicar fora dela
document.addEventListener('click', e => {
    Object.values(AUTOCOMPLETES).forEach(ac => ac && ac.aoClicarFora(e));
});
