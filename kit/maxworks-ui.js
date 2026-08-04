/* ============================================================================
   MAXWORKS-UI - o miolo mínimo da marca (o irmão do maxworks-ui.css).
   O que faz, só isso:
   1. guarda a forma oficial do X de ouro (um caminho vetorial, sem depender de
      fonte instalada) e o foil dos 5 stops - a mesma peça que o gerador de
      ícone usa, para o X ser IGUAL na tela, no selo e no ícone do app;
   2. liga o tema claro/escuro, guardado em localStorage na chave
      "maxworks-tema" (lê e migra as chaves antigas: nada do dono se perde);
   3. veste qualquer página: injeta o botão de tema no canto superior direito
      e o selo "UM PRODUTO MAXWORKS" no rodapé.
   Roda sozinho ao carregar. Para desligar o automático, ponha data-vestir="nao"
   na tag <script>. Também dá require() no Node (o gerador de ícone usa daqui).
   ========================================================================== */
(function (raiz, fabrica) {
  'use strict';
  var api = fabrica();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (raiz) raiz.MAXWORKS = api;
  if (typeof document !== 'undefined') api.iniciar();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var CHAVE = 'maxworks-tema';
  /* Chaves de tema usadas antes do kit: se existirem, o gosto do dono é lido e
     migrado para a chave nova (o app nunca "esquece" o tema que ele escolheu). */
  var CHAVES_ANTIGAS = ['maxia-tema', 'tema', 'theme'];

  /* O foil de ouro oficial da marca (IDENTIDADE-MARCA.md). */
  var FOIL = [
    { parada: 0, cor: '#f7e49a' },
    { parada: .28, cor: '#d9b13c' },
    { parada: .55, cor: '#8a6a14' },
    { parada: .8, cor: '#e8cc72' },
    { parada: 1, cor: '#c9a227' }
  ];

  /* O foil VIVO: a versao do foil para peca PEQUENA (icone ate 64px, selo).
     Regra do tamanho optico: encolhido, o stop escuro do foil oficial (#8a6a14)
     atravessa o meio do X e ele "lava" - vira mancha, parece baixa resolucao.
     Em miniatura o ouro fica so nos tons claros e o X sai nitido. */
  var FOIL_VIVO = [
    { parada: 0, cor: '#f9e7a0' },
    { parada: .45, cor: '#e3bd4b' },
    { parada: 1, cor: '#c9a227' }
  ];

  /* O X da marca como caminho vetorial numa caixa 100x100: duas barras cruzadas,
     simétricas por construção, com as pontas cortadas na reta. Vetor puro para
     ficar idêntico em qualquer máquina e continuar limpo em 16 pixels. */
  var X_CAMINHO = 'M22,19 L42.5,19 L50,32.1 L57.5,19 L78,19 L60.25,50 L78,81 ' +
    'L57.5,81 L50,67.9 L42.5,81 L22,81 L39.75,50 Z';

  function gradienteSvg(id, paleta) {
    var paradas = (paleta || FOIL).map(function (p) {
      return '<stop offset="' + p.parada + '" stop-color="' + p.cor + '"/>';
    }).join('');
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0.25" y2="1">' + paradas + '</linearGradient>';
  }

  /* O X sozinho, em foil de ouro. Em peça pequena (selo, carimbo) usa o foil
     VIVO por padrão: nítido, sem o stop escuro que embaça em miniatura. */
  function xSvg(id, foilCheio) {
    var g = id || ('mx-foil-' + Math.random().toString(36).slice(2, 8));
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' + gradienteSvg(g, foilCheio ? FOIL : FOIL_VIVO) + '</defs>' +
      '<path d="' + X_CAMINHO + '" fill="url(#' + g + ')"/></svg>';
  }

  /* O ícone de app inteiro (quadrado preto de cantos arredondados + X de ouro),
     no estilo do ícone de iPhone. lado = pixels do arquivo.
     RESPIRO: dentro do ladrilho o X entra a 88 por cento, para não encostar nos
     cantos arredondados (provado na folha de escalas: 1,00 fica apertado).
     TAMANHO ÓPTICO: até 64px o foil vira o VIVO (o oficial embaça encolhido).
     O fio de ouro na borda dá definição ao ladrilho preto sobre fundo escuro
     e é o toque de luxo da casa - meio pixel, nunca moldura gritada. */
  var RESPIRO_ICONE = .88;
  function iconeSvg(lado) {
    var L = lado || 512;
    var vivo = L <= 64;
    return '<svg width="' + L + '" height="' + L + '" viewBox="0 0 100 100" ' +
      'xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MAXWORKS">' +
      '<defs>' + gradienteSvg('foil', vivo ? FOIL_VIVO : FOIL) + '</defs>' +
      '<rect width="100" height="100" rx="22" ry="22" fill="#101014"/>' +
      '<rect x="1.1" y="1.1" width="97.8" height="97.8" rx="21" ry="21" fill="none" ' +
      'stroke="url(#foil)" stroke-width="1.6" opacity=".5"/>' +
      '<g transform="translate(50,50) scale(' + RESPIRO_ICONE + ') translate(-50,-50)">' +
      '<path d="' + X_CAMINHO + '" fill="url(#foil)"/></g></svg>';
  }

  var SVG_TEMA =
    '<svg class="mx-lua" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>' +
    '<svg class="mx-sol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/>' +
    '<path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6' +
    'M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></svg>';

  /* ------------------------------------------------------------ o tema */
  function normalizar(valor) {
    if (valor === null || valor === undefined) return null;
    var t = String(valor).replace(/^"|"$/g, '').trim().toLowerCase();
    if (t === 'dark' || t === 'escuro' || t === 'true') return 'dark';
    if (t === 'light' || t === 'claro' || t === 'false') return 'light';
    return null;
  }
  function lerBruto(chave) {
    try { return localStorage.getItem(chave); } catch (e) { return null; }
  }
  function gravar(valor) {
    try { localStorage.setItem(CHAVE, valor); } catch (e) { /* modo anônimo: só não guarda */ }
  }
  function preferidoDoSistema() {
    var m = typeof window !== 'undefined' && window.matchMedia;
    return (m && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  /* Lê o tema guardado. Sem valor na chave nova, procura nas antigas e MIGRA. */
  function temaGuardado(chavesAntigas) {
    var novo = normalizar(lerBruto(CHAVE));
    if (novo) return novo;
    var antigas = (chavesAntigas || []).concat(CHAVES_ANTIGAS);
    for (var i = 0; i < antigas.length; i++) {
      var velho = normalizar(lerBruto(antigas[i]));
      if (velho) { gravar(velho); return velho; }
    }
    return null;
  }
  function aplicarTema(t) {
    var alvo = t === 'dark' ? 'dark' : 'light';
    if (typeof document === 'undefined') return alvo;
    document.documentElement.setAttribute('data-theme', alvo);
    var app = document.querySelector('.mx-app');
    if (app) app.setAttribute('data-theme', alvo);
    return alvo;
  }
  function tema() {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function definirTema(t) {
    var alvo = aplicarTema(t);
    gravar(alvo);
    return alvo;
  }
  function alternarTema() {
    return definirTema(tema() === 'dark' ? 'light' : 'dark');
  }

  /* ------------------------------------------------------ o título do app */
  /* A LOGO é maiúscula (MAXBOLSO); o TÍTULO que o sistema mostra (aba do
     navegador, app instalado, atalho, manifest) é sutil: MaxBolso, MaxIA,
     MaxQi... (lei da marca, 04/08/2026). Exceções de grafia ficam AQUI. */
  var TITULO_EXCECAO = { IA: 'IA', QI: 'Qi' };
  function tituloDoApp(nome) {
    var n = String(nome || '').toUpperCase();
    if (n.indexOf('MAX') !== 0) return nome;
    var resto = n.slice(3);
    var grafia = TITULO_EXCECAO[resto] ||
      (resto.charAt(0) + resto.slice(1).toLowerCase());
    return 'Max' + grafia;
  }

  /* -------------------------------------------------- o nome com X de ouro */
  /* "MAXBOLSO" -> MA<i class="mx-x-ouro">X</i>BOLSO (só o primeiro X do nome). */
  function nomeComX(nome) {
    var texto = String(nome || '');
    var p = texto.toUpperCase().indexOf('X');
    if (p < 0) return texto;
    return texto.slice(0, p) + '<i class="mx-x-ouro">' + texto.charAt(p) + '</i>' + texto.slice(p + 1);
  }

  function seloHtml() {
    return '<div class="mx-assinatura mx-filete">' + xSvg('mx-foil-selo') +
      '<span>UM PRODUTO MAXWORKS</span></div>';
  }

  /* A LOGO DO APP - a peça única do canto do menu: o ladrilho preto com o X de
     ouro (SVG inline, nítido em qualquer resolução) + o nome com o X em foil +
     o lema do app embaixo, no tom do MAXIA ("SOLUÇÕES PARA CLAUDE CODE").
     Alinhamento por construção: uma peça só, ninguém monta à mão. */
  function logoHtml(nome, lema) {
    var n = String(nome || 'MAXWORKS').toUpperCase();
    return '<div class="mx-logo">' +
      '<span class="mx-logo-icone" aria-hidden="true">' + iconeSvg(40) + '</span>' +
      '<span class="mx-logo-texto"><span class="mx-logo-nome">' + nomeComX(n) + '</span>' +
      (lema ? '<span class="mx-logo-lema">' + String(lema).toUpperCase() + '</span>' : '') +
      '</span></div>';
  }

  /* ------------------------------------------------------- vestir a página */
  /* Injeta o botão de tema (canto superior direito) e o selo do rodapé.
     Nunca duplica: se a página já tem o seu, o kit respeita e não mexe. */
  function vestir(opcoes) {
    var o = opcoes || {};
    if (typeof document === 'undefined') return;
    function agora() {
      if (o.botaoTema !== false && !document.querySelector('.mx-tema')) {
        var bt = document.createElement('button');
        bt.className = 'mx-tema';
        bt.type = 'button';
        bt.title = 'CLARO / ESCURO';
        bt.setAttribute('aria-label', 'ALTERNAR TEMA CLARO E ESCURO');
        bt.innerHTML = SVG_TEMA;
        bt.addEventListener('click', function () { alternarTema(); });
        document.body.appendChild(bt);
      }
      if (o.selo !== false && !document.querySelector('.mx-assinatura')) {
        var onde = o.alvoSelo ? document.querySelector(o.alvoSelo) : null;
        var caixa = document.createElement('div');
        caixa.innerHTML = seloHtml();
        (onde || document.body).appendChild(caixa.firstChild);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', agora);
    } else {
      agora();
    }
  }

  /* ------------------------------------------------------------- arranque */
  function iniciar(opcoes) {
    var o = opcoes || {};
    var guardado = temaGuardado(o.chavesAntigas);
    aplicarTema(guardado || preferidoDoSistema());
    var auto = true;
    if (typeof document !== 'undefined' && document.currentScript) {
      auto = document.currentScript.getAttribute('data-vestir') !== 'nao';
    }
    if (o.vestir === false) auto = false;
    if (auto) vestir(o);
  }

  return {
    CHAVE: CHAVE,
    FOIL: FOIL,
    X_CAMINHO: X_CAMINHO,
    gradienteSvg: gradienteSvg,
    xSvg: xSvg,
    iconeSvg: iconeSvg,
    svgTema: SVG_TEMA,
    iniciar: iniciar,
    vestir: vestir,
    tema: tema,
    definirTema: definirTema,
    alternarTema: alternarTema,
    nomeComX: nomeComX,
    tituloDoApp: tituloDoApp,
    logoHtml: logoHtml,
    selo: seloHtml
  };
}));
