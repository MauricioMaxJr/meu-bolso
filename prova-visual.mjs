#!/usr/bin/env node
/* ============================================================
   PROVA VISUAL - fotografa o MAXBOLSO RODANDO DE VERDADE.
   Sobe o servidor local, abre o app no Chrome (2x, retina), enche com dados
   de mentira, joga o app (grava meses de verdade pelo próprio código),
   fotografa as telas-chave nos DOIS temas e nos EXTREMOS (tela vazia, nome
   gigante, número máximo) e roda a varredura mecânica de padrão.

   Uso: node app/prova-visual.mjs   (fotos em fotos-maxbolso/, na raiz do projeto)
   VERDE (exit 0) = nenhuma falha de padrão. VERMELHO (exit 1) = tem conserto.

   Vive no repositório (script de prova versionado); as fotos e o deploy
   ficam fora do repo.
   ============================================================ */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync, rmSync } from "node:fs";
import { join, dirname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const APP = RAIZ;
const FOTOS = join(RAIZ, "..", "fotos-maxbolso");
const require = createRequire(import.meta.url);

function acharPuppeteer() {
  for (const c of ["puppeteer", "E:/Projetos/projeto-futebol/node_modules/puppeteer",
                   "C:/Projetos/projeto-futebol/node_modules/puppeteer"]) {
    try { return require(c); } catch (e) { /* tenta o próximo */ }
  }
  return null;
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8", ".png": "image/png",
  ".svg": "image/svg+xml", ".woff2": "font/woff2" };

function subirServidor() {
  return new Promise(res => {
    const srv = createServer(async (req, resp) => {
      try {
        let caminho = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
        caminho = caminho === "/" ? "index.html" : caminho.slice(1);
        const arquivo = join(APP, caminho);
        if (!(normalize(arquivo) === APP || normalize(arquivo).startsWith(APP + sep))) { resp.writeHead(403); resp.end(); return; }
        const ext = arquivo.slice(arquivo.lastIndexOf(".")).toLowerCase();
        resp.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-store" });
        resp.end(await readFile(arquivo));
      } catch (e) { resp.writeHead(404); resp.end("nao encontrado"); }
    });
    srv.listen(0, () => res({ srv, porta: srv.address().port }));
  });
}

/* ---------- os dados de mentira (chave ANTIGA de propósito: prova a migração) ---------- */
const HOJE = new Date();
const chave = n => { const d = new Date(HOJE.getFullYear(), HOJE.getMonth() + n, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };

function mesCheio(pct, extras) {
  return {
    status: "aberto",
    sal: { pctMeta: pct, valorReal: null, registrado: true },
    rendas: [{ id: "r" + pct, desc: "Reembolso viagem São Paulo", valor: 1240.5, catId: "cat-reembolso" }],
    gastos: [
      { id: "g1" + pct, desc: "Mercado da semana", valor: 842.37, catId: "mercado", dia: 5 },
      { id: "g2" + pct, desc: "Combustível", valor: 410, catId: "combustivel", dia: 9 },
      { id: "g3" + pct, desc: "Jantar de aniversário no restaurante do centro", valor: 268.9, catId: "restaurantes", dia: 14 },
      { id: "g4" + pct, desc: "Farmácia", valor: 132.45, catId: "farmacia", dia: 20 },
      ...(extras || []),
    ],
    fixosStatus: { f1: { pago: true }, f2: { pago: true }, f3: { pago: false }, f4: { pago: true } },
    aportes: [{ metaId: "m-reserva", valor: 2500 }, { metaId: "m-invest", valor: 1500 }],
    snapshot: null,
  };
}

const SEED = {
  version: 1, // entra pela migração de verdade: as categorias oficiais nascem do próprio app
  config: { salBase: 14000, descFolha: 160, pctMinimo: 20, pctPremioReserva: 50,
            pctPremioLivre: 30, reservaMeses: 6, tema: "claro", mapaPeriodo: 12,
            avisos: false, ultimoAviso: null, guardiaoUltimo: null, onboardingOculto: true },
  categorias: [],
  custosFixos: [
    { id: "f1", nome: "Aluguel", valor: 3200, catId: "moradia", dia: 5, assinatura: false, lembrete: true, variavel: false, ativo: true },
    { id: "f2", nome: "Conta de luz", valor: 289.9, catId: "contas", dia: 12, assinatura: false, lembrete: true, variavel: true, ativo: true },
    { id: "f3", nome: "Plano de saúde da família inteira com dependentes", valor: 1875.4, catId: "saude", dia: 20, assinatura: false, lembrete: true, variavel: false, ativo: true },
    { id: "f4", nome: "Netflix", valor: 59.9, catId: "assinaturas", dia: 8, assinatura: true, lembrete: false, variavel: false, ativo: true },
    { id: "f5", nome: "Spotify", valor: 34.9, catId: "assinaturas", dia: 8, assinatura: true, lembrete: false, variavel: false, ativo: true },
  ],
  metas: [
    { id: "m-reserva", nome: "Reserva de emergência", icone: "life-buoy", alvo: 45000, prazo: null, guardado: 21000, tipoReserva: true },
    { id: "m-invest", nome: "Investimentos", icone: "trending-up", alvo: 0, prazo: null, guardado: 38400, tipoInvest: true },
    { id: "m-viagem", nome: "Viagem de fim de ano para a Europa com a família", icone: "plane", alvo: 32000, prazo: chave(6), guardado: 9800 },
  ],
  contas: [
    { id: "c1", nome: "Nubank", icone: "landmark", saldo: 12480.55 },
    { id: "c2", nome: "Caixinha da reserva", icone: "piggy-bank", saldo: 21000 },
    { id: "c3", nome: "Corretora XP", icone: "trending-up", saldo: 38400.9 },
  ],
  meses: {
    [chave(-4)]: mesCheio(100),
    [chave(-3)]: mesCheio(105),
    [chave(-2)]: mesCheio(95),
    [chave(-1)]: mesCheio(110),
    [chave(0)]: mesCheio(120, [{ id: "gx", desc: "Notebook novo para trabalhar em casa", valor: 12999.99, catId: "tecnologia", dia: 2 }]),
  },
};

/* ---------- a varredura mecânica de padrão ---------- */
const VARREDURA = `(() => {
  const falhas = [];
  const doc = document.scrollingElement;
  if (doc.scrollWidth > doc.clientWidth + 1)
    falhas.push("página rola na horizontal (" + doc.scrollWidth + " > " + doc.clientWidth + ")");
  const rolaveisOk = el => el.closest(".table-scroll, .chart-box, .mx-rolagem, .icone-grid, [style*='overflow']");
  // reticência é decisão de desenho (o texto avisa que continua); corte seco é defeito
  const reticencia = el => { const s = getComputedStyle(el); return s.textOverflow === "ellipsis" && s.overflow !== "visible"; };
  for (const el of document.querySelectorAll("main *, .topbar *, .sidebar *, footer *")) {
    if (el.offsetParent === null && el.tagName !== "BODY") continue;
    if (rolaveisOk(el) || reticencia(el)) continue;
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0)
      falhas.push("corta na horizontal: " + el.tagName.toLowerCase() + "." + (el.className || "") + " (" + el.scrollWidth + ">" + el.clientWidth + ") texto: " + (el.textContent || "").trim().slice(0, 40));
    if (el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0 && getComputedStyle(el).overflow === "hidden")
      falhas.push("corta na vertical: " + el.tagName.toLowerCase() + "." + (el.className || "") + " texto: " + (el.textContent || "").trim().slice(0, 40));
  }
  for (const el of document.querySelectorAll("button, label, h1, h2, h3, .card .label, .badge, .selo, td, th, .nm")) {
    if (!el.offsetParent) continue;
    const t = getComputedStyle(el).textTransform;
    if (t !== "uppercase" && !el.closest(".mx-livre") && (el.textContent || "").trim())
      falhas.push("fora da caixa alta (" + t + "): " + el.tagName.toLowerCase() + " " + (el.textContent || "").trim().slice(0, 30));
  }
  const marca = document.querySelector("#brand-area .mx-logo-icone svg");
  if (!marca || marca.getBoundingClientRect().width < 10) falhas.push("marca MAXWORKS sumiu do menu");
  const xouro = document.querySelector("#brand-area .mx-logo-nome .mx-x-ouro");
  if (!xouro || xouro.getBoundingClientRect().width < 4) falhas.push("X de ouro sumiu do nome");
  const lema = document.querySelector("#brand-area .mx-logo-lema");
  if (!lema || !(lema.textContent || "").trim()) falhas.push("lema do app sumiu da logo");
  const selo = document.querySelector("#rodape-marca .mx-assinatura");
  if (!selo || !/UM PRODUTO MAXWORKS/i.test(selo.textContent)) falhas.push("selo UM PRODUTO MAXWORKS sumiu do rodapé");
  if (!selo.querySelector("svg")) falhas.push("X de ouro sumiu do selo");
  const bt = document.getElementById("btn-tema");
  const cx = bt.getBoundingClientRect();
  if (cx.width < 20) falhas.push("botão de tema sumiu");
  if (window.innerWidth - cx.right > 40) falhas.push("botão de tema fora do canto superior direito (sobra " + Math.round(window.innerWidth - cx.right) + "px)");
  if (cx.top > 90) falhas.push("botão de tema não está no topo (y=" + Math.round(cx.top) + ")");
  const lua = bt.querySelector(".mx-lua"), sol = bt.querySelector(".mx-sol");
  const escuro = document.documentElement.getAttribute("data-theme") === "dark";
  const visivel = el => el && getComputedStyle(el).display !== "none";
  if (escuro ? (!visivel(sol) || visivel(lua)) : (!visivel(lua) || visivel(sol)))
    falhas.push("símbolo do tema errado (escuro=" + escuro + ")");
  return falhas;
})()`;

async function main() {
  const puppeteer = acharPuppeteer();
  if (!puppeteer) { console.error("[FALHA] puppeteer não encontrado."); process.exit(1); }
  rmSync(FOTOS, { recursive: true, force: true });
  mkdirSync(FOTOS, { recursive: true });

  const { srv, porta } = await subirServidor();
  const base = "http://localhost:" + porta + "/";
  const navegador = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--force-device-scale-factor=2"] });
  let falhas = 0, fotos = 0;
  const erro = m => { falhas++; console.log("  ERRO " + m); };
  const ok = m => console.log("  OK  " + m);

  async function abrir({ largura = 1280, altura = 900, dados = SEED, chaveDado = "meubolso.v1" } = {}) {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: largura, height: altura, deviceScaleFactor: 2 });
    const problemas = [];
    pagina.on("console", m => { if (m.type() === "error") problemas.push(m.text()); });
    pagina.on("pageerror", e => problemas.push("pageerror: " + e.message));
    await pagina.evaluateOnNewDocument((k, d) => {
      localStorage.clear();
      if (d) localStorage.setItem(k, JSON.stringify(d));
    }, chaveDado, dados);
    await pagina.goto(base, { waitUntil: "networkidle0" });
    return { pagina, problemas };
  }

  // inteira = página toda; a janela do diálogo é fixa na tela, então vai só o visível
  async function foto(pagina, nome, inteira = true) {
    await pagina.evaluate(() => { const t = document.getElementById("toast"); if (t) t.hidden = true; });
    await new Promise(r => setTimeout(r, 120));
    const alvo = join(FOTOS, nome + ".png");
    await pagina.screenshot({ path: alvo, fullPage: inteira });
    fotos++;
    return alvo;
  }

  async function varrer(pagina, nome) {
    const f = await pagina.evaluate(VARREDURA);
    if (f.length) f.forEach(x => erro(nome + ": " + x));
    return f.length === 0;
  }

  /* ---- 1. app cheio, os dois temas, todas as telas ---- */
  console.log("\n== 1. APP CHEIO (dado do dono veio da chave anterior) ==");
  {
    const { pagina, problemas } = await abrir();
    // o próprio app grava os meses passados: snapshot real, metas somadas
    await pagina.evaluate(chs => {
      for (const k of chs) { mesVisto = k; gravarMes(k); }
      mesVisto = chs[chs.length - 1];
      render();
    }, [chave(-4), chave(-3), chave(-2), chave(-1)]);
    await pagina.evaluate(() => { mesVisto = Object.keys(S.meses).sort().pop(); render(); });

    const migrou = await pagina.evaluate(() => ({
      novaChave: !!localStorage.getItem("maxbolso.v1"),
      contas: S.contas.length, metas: S.metas.length, categorias: S.categorias.length,
      gravados: Object.values(S.meses).filter(m => m.status === "gravado").length,
      guardadoReserva: S.metas.find(m => m.tipoReserva).guardado,
    }));
    (migrou.novaChave && migrou.contas === 3 && migrou.metas === 3 && migrou.categorias > 30 && migrou.gravados === 4)
      ? ok(`dado da chave anterior atravessou inteiro e virou maxbolso.v1 (${migrou.categorias} categorias, ${migrou.contas} contas, ${migrou.gravados} meses gravados, reserva ${migrou.guardadoReserva})`)
      : erro("migração da chave anterior falhou: " + JSON.stringify(migrou));

    const telas = ["inicio", "renda", "custos", "metas", "contas", "relatorios", "mapa", "dicas", "esquema", "config"];
    for (const tema of ["claro", "escuro"]) {
      if (tema === "escuro") await pagina.click("#btn-tema");
      const marcado = await pagina.evaluate(() => document.documentElement.getAttribute("data-theme"));
      (tema === "claro" ? marcado === "light" : marcado === "dark")
        ? ok("tema " + tema + ": data-theme=" + marcado)
        : erro("tema " + tema + " com data-theme=" + marcado);
      const guardado = await pagina.evaluate(() => localStorage.getItem("maxworks-tema"));
      (guardado === (tema === "escuro" ? "dark" : "light")) ? ok("escolha guardada em maxworks-tema=" + guardado)
        : erro("tema não ficou guardado: " + guardado);
      for (const t of telas) {
        await pagina.evaluate(n => trocaTela(n), t);
        await foto(pagina, `${tema}-${t}`);
        await varrer(pagina, `${tema}/${t}`);
      }
      // o diálogo por cima (peça de formulário)
      await pagina.evaluate(() => { trocaTela("custos"); dlgFixo(S.custosFixos[2]); });
      await foto(pagina, `${tema}-dialogo`, false);
      await pagina.evaluate(() => document.getElementById("dlg-item").close("cancel"));
    }
    problemas.length ? erro("console com erro: " + problemas.slice(0, 3).join(" | ")) : ok("console limpo nas 20 telas");
    await pagina.close();
  }

  /* ---- 2. extremo: app vazio (primeiro dia) ---- */
  console.log("\n== 2. EXTREMO: TELA VAZIA (primeiro dia de uso) ==");
  {
    const { pagina, problemas } = await abrir({ dados: null, chaveDado: "maxbolso.v1" });
    for (const tema of ["claro", "escuro"]) {
      if (tema === "escuro") await pagina.click("#btn-tema");
      for (const t of ["inicio", "renda", "metas", "contas", "relatorios", "mapa"]) {
        await pagina.evaluate(n => trocaTela(n), t);
        await foto(pagina, `vazio-${tema}-${t}`);
        await varrer(pagina, `vazio-${tema}/${t}`);
      }
    }
    const botoes = await pagina.evaluate(() => {
      trocaTela("inicio");
      return [...document.querySelectorAll(".vazio")].filter(v => !v.querySelector("button")).length;
    });
    ok(`telas vazias fotografadas (${botoes} sem botão, decisão de produto já auditada)`);
    problemas.length ? erro("console com erro na tela vazia: " + problemas[0]) : ok("console limpo na tela vazia");
    await pagina.close();
  }

  /* ---- 3. extremo: celular ---- */
  console.log("\n== 3. EXTREMO: CELULAR (375 x 812) ==");
  {
    const { pagina, problemas } = await abrir({ largura: 375, altura: 812 });
    for (const tema of ["claro", "escuro"]) {
      if (tema === "escuro") await pagina.click("#btn-tema");
      for (const t of ["inicio", "custos", "relatorios"]) {
        await pagina.evaluate(n => trocaTela(n), t);
        await foto(pagina, `celular-${tema}-${t}`);
        await varrer(pagina, `celular-${tema}/${t}`);
      }
      await pagina.click("#btn-menu");
      await new Promise(r => setTimeout(r, 300));
      await foto(pagina, `celular-${tema}-menu`);
      await pagina.evaluate(() => fechaDrawer());
    }
    problemas.length ? erro("console com erro no celular: " + problemas[0]) : ok("console limpo no celular");
    await pagina.close();
  }

  /* ---- 4. extremo: número máximo e nome gigante ---- */
  console.log("\n== 4. EXTREMO: NÚMERO MÁXIMO E NOME GIGANTE ==");
  {
    const { pagina } = await abrir();
    await pagina.evaluate(() => {
      S.contas[0].nome = "Conta corrente do banco com o nome mais comprido que existe no Brasil";
      S.contas[0].saldo = 98765432.19;
      S.metas[2].nome = "Meta com nome absurdamente grande para ver se a barra aguenta o tranco";
      S.metas[2].alvo = 12345678.9;
      const mes = getMes(mesVisto);
      mes.gastos.push({ id: "gmax", desc: "Gasto de valor máximo para testar a coluna de números", valor: 9876543.21, catId: "outros", dia: 1 });
      salvar(); trocaTela("contas");
    });
    await foto(pagina, "extremo-contas-nome-gigante");
    await varrer(pagina, "extremo/contas");
    await pagina.evaluate(() => trocaTela("inicio"));
    await foto(pagina, "extremo-inicio-numero-maximo");
    await varrer(pagina, "extremo/inicio");
    await pagina.evaluate(() => trocaTela("metas"));
    await foto(pagina, "extremo-metas-nome-gigante");
    await varrer(pagina, "extremo/metas");
    await pagina.evaluate(() => trocaTela("custos"));
    await foto(pagina, "extremo-custos-lista-cheia");
    await varrer(pagina, "extremo/custos");
    await pagina.close();
  }

  /* ---- 5. a identidade que o celular usa para instalar o app ---- */
  console.log("\n== 5. PWA: NOME, ÍCONE E MANIFEST DE VERDADE ==");
  {
    const { pagina } = await abrir();
    const r = await pagina.evaluate(async () => {
      const alvos = ["manifest.webmanifest", "icons/favicon.svg", "icons/icon-192.png",
                     "icons/icon-512.png", "icons/apple-touch-icon.png"];
      const status = {};
      for (const a of alvos) status[a] = (await fetch(a)).status;
      const mani = await (await fetch("manifest.webmanifest")).json();
      return { status, mani, titulo: document.title,
        tituloIos: document.querySelector('meta[name="apple-mobile-web-app-title"]').content,
        cor: document.querySelector('meta[name="theme-color"]').content,
        sw: !!(await navigator.serviceWorker.getRegistration()) };
    });
    const ruins = Object.entries(r.status).filter(([, s]) => s !== 200).map(([a]) => a);
    ruins.length ? erro("arquivo do app não responde: " + ruins.join(", "))
                 : ok("manifest, favicon e os 3 PNGs do ícone respondem 200");
    (r.mani.name === "MaxBolso" && r.mani.short_name === "MaxBolso" && r.titulo === "MaxBolso" && r.tituloIos === "MaxBolso")
      ? ok("nome MaxBolso na aba, no atalho do celular e no manifest (lei da marca: título sutil, logo maiúscula)")
      : erro("nome errado em algum lugar: " + JSON.stringify({ t: r.titulo, ios: r.tituloIos, m: r.mani.name }));
    (r.mani.theme_color === "#101014" && r.cor === "#101014")
      ? ok("cor da marca (#101014) no manifest e na barra do navegador")
      : erro("theme-color fora da marca: " + r.cor + " / " + r.mani.theme_color);
    r.sw ? ok("service worker registrado (app continua abrindo sem internet)") : erro("service worker não registrou");
    await pagina.close();
  }

  await navegador.close();
  srv.close();

  console.log("\n===============================");
  console.log(`${fotos} fotos em ${FOTOS}`);
  if (falhas === 0) { console.log("VERDE - nenhuma falha de padrão."); process.exit(0); }
  console.log(`VERMELHO - ${falhas} falha(s) de padrão.`); process.exit(1);
}

main().catch(e => { console.error("[FALHA] " + (e && e.stack ? e.stack : e)); process.exit(1); });
