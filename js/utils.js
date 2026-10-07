// ===== Funções utilitárias =====

// Remove acentos e converte para minúsculas
function normalizarTexto(texto) {
    if (!texto) return "";
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Escapa HTML antes de usar dados do banco dentro de innerHTML
function escaparHtml(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

// Modo escuro global
function alternarDarkMode() {
    const html = document.documentElement;
    const escuro = html.classList.toggle('dark');
    localStorage.setItem('tema', escuro ? 'dark' : 'light');

    // Re-renderiza os gráficos com as cores de contraste do tema atual
    if (dadosIndicadoresGlobais) {
        renderizarGraficos(dadosIndicadoresGlobais);
    }
}

if (localStorage.getItem('tema') === 'dark') {
    document.documentElement.classList.add('dark');
}
