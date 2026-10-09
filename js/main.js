// ===== Inicialização (carregado por último) =====
montarMapaCampus();
iniciarFiltros();
carregarIndicadores();
carregarProjetos();

// Escuta os cliques no mapa para aplicar o BI (Interação Mapa -> Gráficos)
let sequenciaBI = 0;

document.addEventListener('biCampusAlterado', async (e) => {
    const minha = ++sequenciaBI;
    atualizarTitulosBI(e.detail.nome || null, e.detail.cor || null); // atualiza os títulos na hora
    try {
        const data = await buscarIndicadores({ campus: e.detail.campus }); // null é ignorado pelo api.js
        if (minha !== sequenciaBI) return; // chegou um clique mais novo: descarta
        atualizarGraficosBI(data);
    } catch (error) {
        console.error("Erro ao atualizar o BI de cruzamento de dados:", error);
    }
});