// ===== Tabela de projetos e modal de detalhes =====

// parâmetro da API -> id do campo na tela
const CAMPOS_FILTRO = {
    titulo: 'input-busca-titulo',
    campus: 'filtro-campus',
    situacao: 'filtro-situacao',
    edital: 'filtro-edital',
    ano: 'filtro-ano',
    area: 'filtro-area',
    grupo_pesquisa: 'filtro-grupo',
    coordenador: 'filtro-coordenador'
};

let sequenciaTabela = 0;

function lerFiltros() {
    const filtros = {};
    Object.entries(CAMPOS_FILTRO).forEach(([parametro, id]) => {
        filtros[parametro] = document.getElementById(id)?.value || '';
    });
    return filtros;
}

async function carregarProjetos() {
    const tabela = document.getElementById('tabela-projetos');
    if (!tabela) return;

    const minha = ++sequenciaTabela;
    const contador = document.getElementById('contador-exibicao');

    try {
        tabela.classList.add('opacity-40', 'pointer-events-none', 'transition-opacity');
        const data = await buscarProjetos(lerFiltros(), 50);
        if (minha !== sequenciaTabela) return; // chegou uma busca mais nova: descarta esta

        tabela.innerHTML = "";
        if (!data.resultados || data.resultados.length === 0) {
            tabela.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-500">Nenhum projeto encontrado.</td></tr>`;
            if (contador) contador.innerText = "0 registros";
            return;
        }

        if (contador) contador.innerText = `Mostrando ${data.resultados.length} registros`;

        data.resultados.forEach(p => {
            const linha = document.createElement('tr');
            linha.className = "hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition cursor-pointer";
            linha.onclick = () => abrirDetalhes(p.id);

            const editalTexto = p.edital ? `${p.edital} (${p.ano_edital || '-'})` : '-';
            linha.innerHTML = `
                <td class="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">${escaparHtml(p.titulo || '-')}</td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-300">${escaparHtml(p.campus || '-')}</td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-300">${escaparHtml(editalTexto)}</td>
                <td class="py-3 px-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 whitespace-nowrap">${escaparHtml(p.situacao_atual || '-')}</span></td>
            `;
            tabela.appendChild(linha);
        });
    } catch (error) {
        if (minha !== sequenciaTabela) return;
        console.error("Erro ao carregar projetos:", error);
        tabela.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-red-500">Erro ao carregar os dados.</td></tr>`;
    } finally {
        // Só remove o efeito de carregamento se esta ainda for a busca mais recente
        if (minha === sequenciaTabela) tabela.classList.remove('opacity-40', 'pointer-events-none');
    }
}

async function abrirDetalhes(id) {
    try {
        const data = await buscarProjeto(id);
        const p = data.dados;
        const definir = (el, valor) => { document.getElementById(el).innerText = valor || "-"; };
        definir('modal-titulo', p.titulo);
        definir('modal-campus', p.campus);
        definir('modal-situacao', p.situacao_atual);
        definir('modal-coordenador', p.coordenador);
        definir('modal-periodo', p.periodo_execucao);
        definir('modal-edital', p.edital ? `${p.edital} (${p.ano_edital || '-'})` : '');
        definir('modal-area', p.area_conhecimento);
        definir('modal-grupo', p.grupo_pesquisa);
        definir('modal-resumo', p.resumo || "Sem resumo.");
        document.getElementById('modal-detalhes').classList.remove('hidden');
    } catch (error) {
        console.error("Erro ao abrir detalhes do projeto:", error);
    }
}

function fecharModal() {
    document.getElementById('modal-detalhes').classList.add('hidden');
}
