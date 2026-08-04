#!/usr/bin/env node
/* ============================================================
   AUDITORIA — a frota de auditoria inteira, de graça, na sua máquina.
   Uso:  node auditoria.mjs   -> VERDE (exit 0) ou VERMELHO (exit 1)

   Mecaniza o trabalho das frentes de auditoria multiagente:
    0. Roda o verificar.mjs por dentro (portão rápido continua valendo).
    1. Motor profundo: bordas, monotonicidade, teto, continuidade centavo
       a centavo do IRRF, hierarquia de prêmios, inferePctMeta ida e volta.
    2. Paridade FUNCIONAL app × calculadora: milhares de combinações, o
       líquido tem de ser idêntico (não só as constantes).
    3. Estado e migração: migrar() idempotente, v1 -> v2 com emojis, defaults.
    4. Backup: o predicado real de importação rejeita backup que quebraria o app.
    5. UI estática: todo data-* produzido tem consumidor e vice-versa; todo
       data-abrir abre um dialog que existe; interpolação de nome/descrição
       em HTML sempre passa por esc().
    6. Padrão visual: maiúsculas nos form controls (CSS), zero travessão,
       zero emoji fora do EMOJI_MAP.
    7. CSS: classe usada tem de existir no app.css.
    8. PWA profundo: grafo de assets (index + css + manifest) == pré-cache do
       SW; manifest válido; dimensão REAL dos PNGs bate com o declarado.
    9. Parser hostil: PDF vazio, lixo, truncado — nunca aceita, nunca trava.
   10. Infra: guarda de path traversal do servidor local testada; zip de
       deploy comparado arquivo a arquivo com o repo; hook de pre-commit ativo.
   11. Docs: tabela do CLAUDE.md sem referência morta; sem "antes era",
       TODO/FIXME; marcadores VALIDAR listados.

   FORA DO ALCANCE (precisa de gente ou IA, declarado sempre no fim):
   números oficiais novos (gov.br), julgamento semântico dos textos dos docs,
   pesquisa de mercado, teste visual humano.
   ============================================================ */
import { readFileSync, existsSync, readdirSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { dirname, join, normalize, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const RAIZ = dirname(fileURLToPath(import.meta.url));   // app/
const PROJ = join(RAIZ, "..");                          // raiz do projeto
const ler = p => readFileSync(join(RAIZ, p), "utf8");

let falhas = 0, avisos = 0;
const ok = m => console.log("  OK  " + m);
const erro = m => { falhas++; console.log("  ERRO " + m); };
const info = m => { avisos++; console.log("  INFO " + m); };
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const appjs = ler("app.js");
const indexhtml = ler("index.html");
const appcss = ler("app.css");
const sw = ler("sw.js");

/* ---------- 0. o portão rápido continua valendo ---------- */
console.log("\n== 0. VERIFICAR (portão rápido) ==");
const v = spawnSync(process.execPath, [join(RAIZ, "verificar.mjs")], { encoding: "utf8" });
if (v.status === 0) ok("verificar.mjs VERDE (9 seções)");
else { erro("verificar.mjs VERMELHO — saída:"); console.log(v.stdout + v.stderr); }

/* ---------- extrações (mesma técnica do verificar) ---------- */
const corteIcones = appjs.indexOf("/* ================= ÍCONES");
const corteTema = appjs.indexOf("/* ================= TEMA");
const M = new Function(appjs.slice(0, corteIcones) +
  "; return { round2, calcINSS, calcIRRF, calculaSalario, calcula13, tipoDoMes, faixaDaMeta, INSS_FAIXAS, TETO_INSS, IRRF_FAIXAS, FAIXAS_META };")();
const lsStub = { getItem: () => null, setItem: () => {} };
const E = new Function("localStorage", "console", "window",
  appjs.slice(corteIcones, corteTema) + "; return { categoriasDefault, estadoDefault, migrar };")(lsStub, console, {});
const inferePctMeta = new Function("FAIXAS_META",
  appjs.match(/function inferePctMeta\(premio, tipoMes\) \{[\s\S]*?\n\}/)[0] + "; return inferePctMeta;")(M.FAIXAS_META);

/* ---------- 1. motor profundo ---------- */
console.log("\n== 1. MOTOR PROFUNDO ==");
{
  const bordas = [[-10, null], [0, null], [79.99, null], [80, 80], [84.99, 80], [85, 85], [89.99, 85],
    [90, 90], [94.99, 90], [95, 95], [99.99, 95], [100, 100], [104.99, 100], [105, 105], [109.99, 105],
    [110, 110], [119.99, 110], [120, 120], [500, 120], [NaN, null]];
  const ruimB = bordas.filter(([p, min]) => {
    const f = M.faixaDaMeta(p);
    return (f === null ? null : f.min) !== min;
  });
  ruimB.length ? erro("bordas de faixa erradas: " + JSON.stringify(ruimB)) : ok(bordas.length + " bordas de faixa de meta exatas (inclui negativo e NaN -> sem prêmio)");

  let monoINSS = true, tetoOk = true, prev = 0;
  for (let c = 0; c <= 1000000; c++) {                       // R$ 0,00 a R$ 10.000,00 de centavo em centavo
    const i = M.calcINSS(c / 100);
    if (i < prev - 1e-9) { monoINSS = false; break; }
    prev = i;
  }
  monoINSS ? ok("INSS monotônico de R$ 0 a R$ 10.000, centavo a centavo (1.000.001 casos)") : erro("INSS caiu ao subir o bruto");
  for (const b of [8475.55, 8475.56, 10000, 24000, 66000, 1e7]) if (M.calcINSS(b) !== M.TETO_INSS) tetoOk = false;
  tetoOk ? ok("INSS travado no teto praticado para todo bruto >= 8.475,55") : erro("INSS não trava no teto");
  (M.calcINSS(0) === 0 && M.calcINSS(-5) === 0) ? ok("INSS zero para bruto zero/negativo") : erro("INSS errado para bruto <= 0");

  let monoIRRF = true, negIRRF = false; prev = 0;
  for (let c = 0; c <= 600000; c++) {                        // base R$ 0 a R$ 6.000 de centavo em centavo
    const r = M.calcIRRF(c / 100);
    if (r < 0) negIRRF = true;
    if (r < prev - 1e-9) { monoIRRF = false; break; }
    prev = r;
  }
  monoIRRF && !negIRRF ? ok("IRRF contínuo, monotônico e nunca negativo de R$ 0 a R$ 6.000 (600.001 casos)")
                       : erro("IRRF " + (negIRRF ? "negativo" : "descontínuo") + " na varredura");
  const saltos = M.IRRF_FAIXAS.slice(0, -1).filter(f => Math.abs(M.calcIRRF(f.ate + 0.01) - M.calcIRRF(f.ate)) > 0.011);
  saltos.length ? erro("salto na virada de faixa do IRRF: " + JSON.stringify(saltos.map(f => f.ate))) : ok("viradas de faixa do IRRF sem salto (dedução calibrada)");

  let hier = true;
  for (const f of M.FAIXAS_META) if (!(f.normal <= f.especial && f.especial <= f.dezembro)) hier = false;
  hier ? ok("hierarquia de prêmios normal <= especial <= dezembro em todas as faixas") : erro("hierarquia de prêmios violada");

  let monoLiq = true;
  for (const base of [10000, 12000, 14000, 16000])
    for (const mes of [1, 6, 12]) {
      let ant = -1;
      for (let pct = 0; pct <= 200; pct++) {
        const l = M.calculaSalario(base, pct, mes, 160).liquido;
        if (l < ant - 1e-9) monoLiq = false;
        ant = l;
      }
    }
  monoLiq ? ok("líquido monotônico no % de meta (mais meta nunca paga menos) em 2.412 casos") : erro("líquido caiu ao subir a meta");

  const idaVolta = [];
  for (const f of M.FAIXAS_META) for (const t of ["normal", "especial", "dezembro"])
    if (f[t] > 0 && inferePctMeta(f[t], t) !== f.min) idaVolta.push(t + ":" + f[t]);
  (idaVolta.length === 0 && inferePctMeta(0, "normal") === 0 && inferePctMeta(999, "normal") === null)
    ? ok("inferePctMeta: todo prêmio da tabela volta ao % certo; 0 -> 0; fora da tabela -> mantém")
    : erro("inferePctMeta errado: " + idaVolta.join(", "));

  const t12 = M.calculaSalario(14000, 0, 12, 160), t1 = M.calculaSalario(14000, 0, 1, 160);
  t12.liquido === t1.liquido ? ok("piso sem prêmio idêntico em dezembro e mês normal (equivalência documentada)")
                             : erro("piso de dezembro diverge do mês normal");
}

/* ---------- 2. paridade funcional com a calculadora ---------- */
console.log("\n== 2. PARIDADE FUNCIONAL (app × calculadora) ==");
const CALC = join(PROJ, "calculadora-salario.html");
if (!existsSync(CALC)) info("calculadora-salario.html ausente nesta máquina; paridade funcional pulada");
else {
  const html = readFileSync(CALC, "utf8");
  const ini = html.indexOf("/* ================= TABELAS EDITÁVEIS");
  const fim = html.indexOf("/* ================= UI =================");
  const C = new Function(html.slice(ini, fim) + "; return { calcINSS, calcIRRF, calculaMes, calcula13 };")();
  let comb = 0, dif = [];
  for (const base of [10000, 12000, 14000, 16000, 12556.32])
    for (let pct = 0; pct <= 200; pct++)
      for (const mes of [1, 6, 11, 12])
        for (const outros of [0, 160, 1234.56]) {
          const a = M.calculaSalario(base, pct, mes, outros);
          const c = C.calculaMes(base, pct, mes, outros);
          comb++;
          if (a.liquido !== c.liquido || a.inss !== c.inss || a.irrf !== c.irrf || a.premio !== c.premio)
            dif.push(`${base}/${pct}%/m${mes}/${outros}: app ${a.liquido} x calc ${c.liquido}`);
        }
  dif.length ? erro(`paridade funcional QUEBROU em ${dif.length} de ${comb}: ` + dif.slice(0, 3).join(" | "))
             : ok(`líquido, INSS, IRRF e prêmio idênticos em ${comb.toLocaleString("pt-BR")} combinações`);
  let difO = 0;
  for (let c = 0; c <= 50000; c++)
    if (M.calculaSalario(14000, 100, 1, c / 100).liquido !== C.calculaMes(14000, 100, 1, c / 100).liquido) difO++;
  difO ? erro(`ordem de arredondamento divergiu em ${difO} de 50.001 valores de descontos`)
       : ok("varredura de 50.001 valores de 'outros descontos' centavo a centavo: idêntico");
  let ok13 = true;
  for (const base of [10000, 12000, 14000, 16000]) {
    const d = C.calcula13(base);
    if (d.liquidoTotal !== M.round2(base - C.calcINSS(base) - C.calcIRRF(base - C.calcINSS(base)))) ok13 = false;
  }
  ok13 ? ok("13º da calculadora: parcelas fecham com a identidade contábil nas 4 bases") : erro("13º da calculadora não fecha");
  let par13 = true;
  for (const base of [10000, 12000, 14000, 16000]) if (!igual(M.calcula13(base), C.calcula13(base))) par13 = false;
  par13 ? ok("calcula13 idêntico entre app e calculadora nas 4 bases") : erro("calcula13 DIVERGE entre app e calculadora");
}

/* ---------- 3. estado e migração ---------- */
console.log("\n== 3. ESTADO E MIGRAÇÃO ==");
{
  const def = E.estadoDefault();
  igual(def, JSON.parse(JSON.stringify(def))) ? ok("estadoDefault sobrevive a JSON round-trip sem perda")
                                              : erro("estadoDefault perde dado no JSON round-trip");
  const v1 = () => ({ version: 1,
    config: { salBase: 12000, descFolha: 160, pctMinimo: 20, pctPremioReserva: 50, pctPremioLivre: 30, reservaMeses: 6 },
    categorias: [{ id: "moradia", nome: "Casa própria", icone: "🏠", tipo: "despesa", essencial: true, orcamento: null },
                 { id: "custom1", nome: "Minha categoria", icone: "🛒", tipo: "despesa", essencial: false, orcamento: null }],
    metas: [{ id: "m1", nome: "Viagem", icone: "🏆", alvo: 100, guardado: 0 },
            { id: "r1", nome: "Reserva", icone: "🛟", alvo: 0, guardado: 0, tipoReserva: true }],
    custosFixos: [], meses: {} });
  const m1 = E.migrar(v1());
  const checks = [
    [m1.version === 2, "version vira 2"],
    [Array.isArray(m1.contas) && Array.isArray(m1.holerites), "contas e holerites nascem"],
    [m1.config.mapaPeriodo === 12, "mapaPeriodo ganha default 12"],
    [m1.categorias.find(c => c.id === "moradia").icone === "house", "categoria conhecida herda ícone oficial"],
    [m1.categorias.find(c => c.id === "custom1").icone === "shopping-cart", "categoria própria traduz emoji via EMOJI_MAP"],
    [m1.metas.find(m => m.id === "m1").icone === "award", "meta comum traduz emoji"],
    [m1.metas.find(m => m.id === "r1").icone === "life-buoy", "reserva ganha o ícone dela"],
    [m1.categorias.some(c => c.id === "cat-salario"), "categorias novas do v2 entram"],
  ];
  const ruins = checks.filter(([okC]) => !okC);
  ruins.length ? erro("migração v1 -> v2 falhou em: " + ruins.map(([, m]) => m).join("; "))
               : ok("migração v1 -> v2 completa (" + checks.length + " garantias)");
  igual(E.migrar(JSON.parse(JSON.stringify(m1))), m1) ? ok("migrar é idempotente (migrar duas vezes = uma vez)")
                                                      : erro("migrar NÃO é idempotente");
}

/* ---------- 4. backup: predicado real de importação ---------- */
console.log("\n== 4. BACKUP: PREDICADO DE IMPORTAÇÃO ==");
{
  const mSrc = appjs.match(/if \(!st \|\|[\s\S]*?throw new Error\("formato inválido"\);/);
  if (!mSrc) erro("predicado de importação não encontrado no app.js");
  else {
    const testa = new Function("st", `try { ${mSrc[0]} return "aceita"; } catch { return "rejeita"; }`);
    const casos = [
      [E.estadoDefault(), "aceita", "backup válido v2"],
      [{ version: 1, config: { salBase: 12000, descFolha: 160 }, categorias: [] }, "aceita", "backup válido v1"],
      [null, "rejeita", "null"],
      [{ version: 3, config: { salBase: 1, descFolha: 0 }, categorias: [] }, "rejeita", "versão desconhecida"],
      [{ version: 2, categorias: [] }, "rejeita", "sem config"],
      [{ version: 2, config: { descFolha: 160 }, categorias: [] }, "rejeita", "config sem salBase (quebraria o motor)"],
      [{ version: 2, config: { salBase: "14000", descFolha: 160 }, categorias: [] }, "rejeita", "salBase texto (concatenaria bruto)"],
      [{ version: 2, config: { salBase: NaN, descFolha: 160 }, categorias: [] }, "rejeita", "salBase NaN"],
      [{ version: 2, config: { salBase: 14000 }, categorias: [] }, "rejeita", "sem descFolha (líquido NaN)"],
      [{ version: 2, config: { salBase: 14000, descFolha: 160 } }, "rejeita", "sem categorias"],
    ];
    const ruins = casos.filter(([st, esperado]) => testa(st) !== esperado);
    ruins.length ? erro("predicado de importação errou em: " + ruins.map(([, , n]) => n).join("; "))
                 : ok(casos.length + " casos do predicado de importação (aceita os bons, rejeita os que quebrariam o app)");
    appjs.includes("Number.isFinite(st.config.salBase)") && appjs.includes("Number.isFinite(st.config.descFolha)")
      ? ok("guarda numérica presente no fonte (correção da auditoria de jul/2026)")
      : erro("guarda numérica do import sumiu do fonte");
  }
}

/* ---------- 5. UI estática ---------- */
console.log("\n== 5. UI ESTÁTICA ==");
{
  const kebab = s => s.replace(/[A-Z]/g, c => "-" + c.toLowerCase());
  const nativos = new Set(["getFullYear", "getMonth", "getDate", "getTime"]);
  const produzidos = new Set();
  for (const m of (appjs + indexhtml).matchAll(/data-([a-z][a-z-]*)=/g)) produzidos.add(m[1]);
  for (const m of appjs.matchAll(/dataset\.([a-zA-Z]+)\s*=(?!=)/g)) produzidos.add(kebab(m[1]));
  const consumidos = new Set();
  const iniClique = appjs.indexOf('document.addEventListener("click"');
  const blocoClique = appjs.slice(iniClique, appjs.indexOf("\n});", iniClique));
  for (const m of blocoClique.matchAll(/\bd\.([a-z][a-zA-Z]*)/g)) if (!nativos.has(m[1])) consumidos.add(kebab(m[1]));
  for (const m of appjs.matchAll(/dataset\.([a-zA-Z]+)(?![a-zA-Z])(?!\s*=(?!=))/g)) consumidos.add(kebab(m[1]));
  for (const m of (appjs + appcss).matchAll(/\[data-([a-z][a-z-]*)[\]=]/g)) consumidos.add(m[1]);
  const semConsumidor = [...produzidos].filter(a => !consumidos.has(a));
  const semProdutor = [...consumidos].filter(a => !produzidos.has(a));
  semConsumidor.length ? erro("data-* produzido sem consumidor (atributo morto): " + semConsumidor.join(", "))
                       : ok(produzidos.size + " atributos data-* produzidos, todos consumidos");
  semProdutor.length ? erro("data-* consumido sem produtor (handler morto): " + semProdutor.join(", "))
                     : ok(consumidos.size + " atributos data-* consumidos, todos produzidos");

  const mapa = appjs.match(/const abre = \{([\s\S]*?)\}\[d\.abrir\]/);
  if (!mapa) erro("mapa de dialogs (const abre) não encontrado");
  else {
    const chaves = new Set([...mapa[1].matchAll(/(?:"([^"]+)"|([\w]+)):/g)].map(m => m[1] || m[2]));
    const abrires = new Set([...appjs.matchAll(/data-abrir="([a-z-]+)"/g)].map(m => m[1]));
    for (const m of appjs.matchAll(/vazio\("[^"]*", "[^"]*", "([a-z-]+)"/g)) abrires.add(m[1]);
    const orfaos = [...abrires].filter(a => !chaves.has(a));
    orfaos.length ? erro("data-abrir sem dialog no mapa: " + orfaos.join(", "))
                  : ok(abrires.size + " gatilhos data-abrir, todos com dialog no mapa");
  }

  const inseguros = [];
  for (const m of appjs.matchAll(/\$\{(?!esc\()(?!fmt\()([^}]*\.(?:nome|desc)\b[^}]*)\}/g)) {
    if (/\besc\(/.test(m[1])) continue;
    const linha = appjs.slice(0, m.index).split("\n").length;
    const linhaTxt = appjs.split("\n")[linha - 1];
    if (!linhaTxt.includes("txt:") && !linhaTxt.includes("csv +=")) inseguros.push(`linha ${linha}: \${${m[1]}}`); // txt: passa por esc no dicaHTML; csv não é HTML
  }
  inseguros.length ? erro("interpolação de nome/descrição sem esc() em HTML: " + inseguros.join(" | "))
                   : ok("toda interpolação de nome/descrição em HTML passa por esc() (dicas escapadas em dicaHTML)");
  appjs.includes("esc(d.txt)") ? ok("dicaHTML escapa o texto das dicas") : erro("dicaHTML NÃO escapa d.txt");

  const semBotao = [...appjs.matchAll(/vazio\("([a-z-]+)", "([^"]+)"\)/g)].map(m => m[2]);
  info(`empty states sem botão (decisão de produto, conferir à mão): ${semBotao.length} — ` + semBotao.slice(0, 4).join(" | ") + (semBotao.length > 4 ? " ..." : ""));
}

/* ---------- 6. padrão visual ---------- */
console.log("\n== 6. PADRÃO VISUAL (regras do dono) ==");
{
  const blocos = appcss.split("}").map(b => b.split("{"));
  const formOk = blocos.some(([sel, corpo]) => sel && corpo && /(input|select|button)/.test(sel) && /text-transform:\s*(uppercase|inherit)/.test(corpo));
  const geralOk = /text-transform:\s*uppercase/.test(appcss);
  (formOk && geralOk) ? ok("maiúsculas garantidas no CSS inclusive para form controls (não herdam sozinhos)")
                      : erro("CSS sem text-transform para form controls — campos ficariam minúsculos");
  const alvos = [["app.js", appjs], ["index.html", indexhtml], ["app.css", appcss], ["manifest.webmanifest", ler("manifest.webmanifest")]];
  const comTravessao = alvos.filter(([, txt]) => /[\u2013\u2014]/.test(txt)).map(([n]) => n);
  comTravessao.length ? erro("travessão encontrado (proibido nos textos): " + comTravessao.join(", "))
                      : ok("zero travessão em app, index, css e manifest");
  const mapaEmoji = appjs.match(/EMOJI_MAP = \{[\s\S]*?\};/)[0];
  const semMapa = appjs.replace(mapaEmoji, "");
  const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  const comEmoji = [["app.js fora do EMOJI_MAP", semMapa], ...alvos.slice(1)].filter(([, txt]) => emojiRe.test(txt)).map(([n]) => n);
  comEmoji.length ? erro("emoji fora do EMOJI_MAP (proibido na UI): " + comEmoji.join(", "))
                  : ok("zero emoji na UI (EMOJI_MAP de migração é a única exceção, e é permitida)");
  if (existsSync(CALC)) {
    const marcas = (readFileSync(CALC, "utf8").match(/[–—★]/g) || []).length;
    marcas ? info(`calculadora com ${marcas} travessões/estrelas no texto (estilo anterior ao padrão visual; mudar só com aprovação do dono)`)
           : ok("calculadora sem travessão/estrela");
  }
}

/* ---------- 7. CSS: classes usadas × definidas ---------- */
console.log("\n== 7. CSS ==");
{
  const definidas = new Set();
  // o app veste duas folhas: a do kit da marca (peças .mx-*) e a própria
  const kitcss = existsSync(join(RAIZ, "kit", "maxworks-ui.css")) ? ler("kit/maxworks-ui.css") : "";
  for (const bloco of (appcss + kitcss).split("}")) {
    const sel = bloco.split("{")[0] || "";
    for (const m of sel.matchAll(/\.([a-zA-Z][\w-]*)/g)) definidas.add(m[1]);
  }
  const usadas = new Set();
  const addTokens = s => s.split(/\s+/).forEach(t => { if (/^[a-zA-Z][\w-]*$/.test(t)) usadas.add(t); });
  for (const m of indexhtml.matchAll(/class="([^"]*)"/g)) addTokens(m[1]);
  for (const m of appjs.matchAll(/class="([^"$]*?)[$"]/g)) addTokens(m[1]);
  for (const m of appjs.matchAll(/classList\.(?:add|remove|toggle)\("([\w-]+)"/g)) usadas.add(m[1]);
  for (const m of appjs.matchAll(/className = "([^"]+)"/g)) addTokens(m[1]);
  for (const m of appjs.matchAll(/el\("[^"]+", "([^"]+)"/g)) addTokens(m[1]);
  const ganchosJs = new Set([...appjs.matchAll(/(?:querySelectorAll|querySelector|closest)\(\s*"\.([a-zA-Z][\w-]*)"/g)].map(m => m[1]));
  const semDef = [...usadas].filter(c => !definidas.has(c) && !ganchosJs.has(c));
  semDef.length ? erro("classes usadas sem definição no app.css: " + semDef.join(", "))
                : ok(usadas.size + " classes usadas, todas definidas no app.css (ou gancho de JS)");
  const semUso = [...definidas].filter(c => !usadas.has(c));
  info(`classes definidas que o rastreio estático não viu em uso (podem ser dinâmicas): ${semUso.length}` + (semUso.length ? " — " + semUso.slice(0, 8).join(", ") + (semUso.length > 8 ? " ..." : "") : ""));
}

/* ---------- 8. PWA profundo ---------- */
console.log("\n== 8. PWA PROFUNDO ==");
{
  const manifest = JSON.parse(ler("manifest.webmanifest"));
  const refs = new Set(["index.html"]);
  for (const m of indexhtml.matchAll(/(?:src|href)="([^"#]+?)(?:\?v=\d+)?"/g)) if (!/^https?:/.test(m[1])) refs.add(m[1]);
  for (const m of appcss.matchAll(/url\((?:"|')?([^)"']+)(?:"|')?\)/g)) if (!/^data:/.test(m[1])) refs.add(m[1].replace(/^\.\//, ""));
  for (const i of manifest.icons || []) refs.add(i.src.replace(/^\.\//, ""));
  refs.delete("sw.js");
  refs.delete("manifest.webmanifest"); refs.add("manifest.webmanifest");
  const precache = new Set([...sw.matchAll(/"\.\/([^"]+)"/g)].map(m => m[1]));
  const foraDoCache = [...refs].filter(f => !precache.has(f));
  const cacheSemRef = [...precache].filter(f => f !== "index.html" && !refs.has(f));
  foraDoCache.length ? erro("asset referenciado FORA do pré-cache (quebraria offline): " + foraDoCache.join(", "))
                     : ok(refs.size + " assets referenciados (index+css+manifest), todos no pré-cache do SW");
  cacheSemRef.length ? erro("pré-cache com arquivo que ninguém referencia: " + cacheSemRef.join(", "))
                     : ok("pré-cache sem sobra: todo arquivo cacheado é referenciado");
  const faltamCampos = ["name", "start_url", "display", "theme_color", "icons"].filter(c => manifest[c] == null);
  faltamCampos.length ? erro("manifest sem campos: " + faltamCampos.join(", ")) : ok("manifest com os campos essenciais");
  const temaIndex = (indexhtml.match(/name="theme-color" content="([^"]+)"/) || [])[1];
  manifest.theme_color === temaIndex ? ok("theme_color do manifest == meta do index (" + temaIndex + ")")
                                     : erro(`theme_color diverge: manifest ${manifest.theme_color} x index ${temaIndex}`);
  let pngRuim = [];
  for (const i of manifest.icons || []) {
    const p = join(RAIZ, i.src);
    if (!existsSync(p)) { pngRuim.push(i.src + " (não existe)"); continue; }
    const b = readFileSync(p);
    const dim = b.readUInt32BE(16) + "x" + b.readUInt32BE(20);
    if (i.sizes !== dim) pngRuim.push(`${i.src}: declara ${i.sizes}, PNG real é ${dim}`);
  }
  pngRuim.length ? erro("ícones do manifest: " + pngRuim.join("; ")) : ok("dimensão REAL dos PNGs bate com o declarado no manifest");
}

/* ---------- 9. parser hostil ---------- */
console.log("\n== 9. PARSER HOSTIL ==");
{
  (0, eval)(ler("holerite.js"));
  const inflate = b => Promise.resolve(new Uint8Array(inflateSync(b)));
  const chama = bytes => Promise.race([
    Promise.resolve().then(() => globalThis.Holerite.lerHolerite(bytes, inflate))
      .then(r => (r && r.valido) ? "ACEITOU" : "recusou"),
    new Promise(res => setTimeout(() => res("TRAVOU"), 5000)),
  ]).catch(() => "recusou (exceção tratável)");
  const golden = "E:/Holerites/2026-06 salario.pdf";
  const casos = [
    ["PDF de 0 bytes", new Uint8Array(0)],
    ["lixo binário", new Uint8Array([1, 2, 3, 255, 254, 77, 90, 0, 9, 88].concat(Array(500).fill(66)))],
    ["texto que não é PDF", new TextEncoder().encode("isto não é um pdf, é um txt disfarçado")],
    ["cabeçalho PDF sem corpo", new TextEncoder().encode("%PDF-1.4\n%%EOF")],
  ];
  if (!existsSync(golden)) info("E:\\Holerites ausente; casos com PDF real pulados");
  for (const [nome, bytes] of casos) {
    const r = await chama(bytes);
    r === "ACEITOU" ? erro(`parser ACEITOU entrada hostil (${nome}) — prova contábil furada`)
      : r === "TRAVOU" ? erro(`parser TRAVOU com ${nome} (loop/await pendurado)`)
      : ok(`${nome}: recusado sem travar`);
  }
  if (existsSync(golden)) {
    const bytesFull = new Uint8Array(readFileSync(golden));
    const cheio = await globalThis.Holerite.lerHolerite(bytesFull, inflate);
    cheio.valido ? ok("controle positivo: o golden real continua sendo aceito") : erro("controle positivo FALHOU: golden recusado");
    for (const frac of [0.15, 0.4]) {
      let r = null, st;
      try {
        r = await Promise.race([globalThis.Holerite.lerHolerite(bytesFull.slice(0, Math.floor(bytesFull.length * frac)), inflate),
          new Promise((_, rej) => setTimeout(() => rej(new Error("TRAVOU")), 5000))]);
        st = (r && r.valido) ? "aceitou" : "recusou";
      } catch (e) { st = e.message === "TRAVOU" ? "TRAVOU" : "recusou"; }
      if (st === "TRAVOU") erro(`parser travou com PDF truncado em ${frac * 100}%`);
      else if (st === "recusou") ok(`PDF truncado em ${frac * 100}%: recusado sem travar`);
      else (r.liquido === cheio.liquido && r.mes === cheio.mes && r.tipo === cheio.tipo)
        ? ok(`PDF truncado em ${frac * 100}%: aceito, prova contábil fechada e dados idênticos ao arquivo íntegro`)
        : erro(`PDF truncado em ${frac * 100}% aceito com dados DIVERGENTES do íntegro`);
    }
  }

  if (existsSync(join(RAIZ, "extrato.js"))) {
    (0, eval)(ler("extrato.js"));
    const ofx = "<OFX><STMTTRN><DTPOSTED>20260705120000<TRNAMT>-123.45<MEMO>UBER TRIP</STMTTRN><STMTTRN><DTPOSTED>20260706<TRNAMT>1000.00<NAME>PIX RECEBIDO</STMTTRN></OFX>";
    const ro = globalThis.Extrato.lerExtrato(ofx);
    (ro.valido && ro.transacoes.length === 2 && ro.transacoes[0].valor === -123.45 && ro.transacoes[0].data === "2026-07-05")
      ? ok("extrato OFX sintético: 2 transações com data e valor exatos") : erro("extrato OFX errado: " + JSON.stringify(ro));
    const csv = "Data;Descrição;Valor\n05/07/2026;UBER TRIP;-24,90\n06/07/2026;MERCADO GRANDE;1.234,56";
    const rc = globalThis.Extrato.lerExtrato(csv);
    (rc.valido && rc.transacoes.length === 2 && rc.transacoes[0].valor === -24.9 && rc.transacoes[1].valor === 1234.56 && rc.transacoes[0].data === "2026-07-05")
      ? ok("extrato CSV brasileiro (vírgula decimal, milhar com ponto): valores exatos") : erro("extrato CSV errado: " + JSON.stringify(rc));
    const ruins = ["", "texto solto sem cara de extrato", "a;b;c\n1;2;3"].filter(t => globalThis.Extrato.lerExtrato(t).valido);
    ruins.length ? erro("extrato aceitou entrada hostil") : ok("extrato recusa vazio, texto solto e CSV sem colunas de banco");
  }
}

/* ---------- 10. infra ---------- */
console.log("\n== 10. INFRA ==");
{
  const SRV = join(PROJ, "servidor-local.mjs");
  if (!existsSync(SRV)) info("servidor-local.mjs ausente nesta máquina; guarda de path traversal pulada");
  else {
    const srv = readFileSync(SRV, "utf8");
    const fonte = srv.match(/function dentroDe[\s\S]*?\n\}/);
    if (!fonte) erro("servidor-local.mjs sem a função dentroDe (guarda de path traversal)");
    else {
      const dentroDe = new Function("normalize", "sep", fonte[0] + "; return dentroDe;")(normalize, sep);
      const base = join(PROJ, "app");
      const casos = [
        [join(base, "index.html"), true], [base, true],
        [join(base, "..", "CLAUDE.md"), false], [join(base, "sub", "..", "..", "fora.txt"), false],
        ["C:\\Windows\\system32\\config", false], [join(base, "..", "..", "..", "segredo"), false],
      ];
      const ruins = casos.filter(([alvo, esperado]) => dentroDe(base, alvo) !== esperado);
      ruins.length ? erro("dentroDe deixou passar: " + ruins.map(([a]) => a).join("; "))
                   : ok(casos.length + " ataques de path traversal bloqueados pela guarda do servidor");
      srv.includes("if (!dentroDe(base, arquivo))") ? ok("servidor chama a guarda antes de servir arquivo")
                                                    : erro("servidor NÃO chama dentroDe antes de servir");
    }
  }

  const ZIP = join(PROJ, "maxbolso-deploy.zip");
  if (!existsSync(ZIP)) info("maxbolso-deploy.zip ausente; comparação de deploy pulada");
  else {
    const dir = mkdtempSync(join(tmpdir(), "maxbolso-zip-"));
    const tar = spawnSync("tar", ["-xf", ZIP, "-C", dir]);
    if (tar.status !== 0) info("não consegui extrair o zip com tar; comparação pulada");
    else {
      const anda = (d, pre = "") => readdirSync(d).flatMap(f =>
        statSync(join(d, f)).isDirectory() ? anda(join(d, f), pre + f + "/") : [pre + f]);
      const noZip = anda(dir).sort();
      const esperado = [...new Set([...sw.matchAll(/"\.\/([^"]+)"/g)].map(m => m[1]).concat(["sw.js", "index.html"]))].sort();
      const sobra = noZip.filter(f => !esperado.includes(f));
      const falta = esperado.filter(f => !noZip.includes(f));
      const normaliza = b => Buffer.from(b.toString("utf8").replace(/\r\n/g, "\n"));
      const diferentes = noZip.filter(f => esperado.includes(f) &&
        !normaliza(readFileSync(join(dir, f))).equals(normaliza(readFileSync(join(RAIZ, f)))));
      (sobra.length || falta.length) ? erro(`zip x runtime: sobra [${sobra.join(", ")}] falta [${falta.join(", ")}]`)
                                     : ok(`zip de deploy com exatamente os ${esperado.length} arquivos de runtime`);
      diferentes.length ? erro("zip DESATUALIZADO (conteúdo difere do repo): " + diferentes.join(", ") + " — regerar o zip")
                        : ok("conteúdo do zip idêntico ao repo (normalizado por quebra de linha)");
      rmSync(dir, { recursive: true, force: true });
    }
  }

  const HTMLU = join(PROJ, "maxbolso.html");
  if (!existsSync(HTMLU)) info("maxbolso.html (arquivo único) ausente; gere com: node app/gerar-html-unico.mjs");
  else {
    const h = createHash("sha256");
    for (const f of ["index.html", "kit/maxworks-ui.css", "kit/maxworks-ui.js", "app.css", "app.js", "icons.js", "holerite.js", "extrato.js"]) h.update(readFileSync(join(RAIZ, f)));
    h.update(readFileSync(join(RAIZ, "fonts/InterVariable.woff2")));
    const m = readFileSync(HTMLU, "utf8").match(/marca:([0-9a-f]{16})/);
    (m && m[1] === h.digest("hex").slice(0, 16))
      ? ok("maxbolso.html (arquivo único) gerado dos assets atuais")
      : erro("maxbolso.html DESATUALIZADO - regerar: node app/gerar-html-unico.mjs");
  }

  const hooks = spawnSync("git", ["-C", RAIZ, "config", "core.hooksPath"], { encoding: "utf8" }).stdout.trim();
  hooks === ".githooks" ? ok("pre-commit ativo via core.hooksPath=.githooks") : erro("core.hooksPath não aponta para .githooks (hook desligado): '" + hooks + "'");
  existsSync(join(RAIZ, ".githooks", "pre-commit")) ? ok("arquivo do hook pre-commit existe") : erro(".githooks/pre-commit sumiu");
  const status = spawnSync("git", ["-C", RAIZ, "status", "--short"], { encoding: "utf8" }).stdout.trim();
  status ? info("repo com mudanças não commitadas (normal no meio do trabalho):\n" + status.split("\n").map(l => "         " + l).join("\n"))
         : ok("repo limpo (tudo commitado)");
  const crlf = ["app.js", "app.css", "index.html", "icons.js", "holerite.js", "sw.js", "verificar.mjs", "auditoria.mjs"]
    .filter(f => existsSync(join(RAIZ, f)) && readFileSync(join(RAIZ, f), "utf8").includes("\r\n"));
  crlf.length ? info("arquivos com CRLF no disco (o git normaliza ao commitar, sem efeito no produto): " + crlf.join(", "))
              : ok("todos os fontes com LF no disco");
}

/* ---------- 11. docs ---------- */
console.log("\n== 11. DOCS ==");
{
  const claude = join(PROJ, "CLAUDE.md");
  if (!existsSync(claude)) info("CLAUDE.md da raiz ausente nesta máquina");
  else {
    const cm = readFileSync(claude, "utf8");
    const linhas = [...cm.matchAll(/^\| `([^`]+)` \|/gm)].map(m => m[1]);
    const mortos = linhas.filter(p => !existsSync(join(PROJ, p.replace(/[\\/]+$/, ""))));
    mortos.length ? erro("tabela do CLAUDE.md cita caminho inexistente: " + mortos.join(", "))
                  : ok(`tabela do CLAUDE.md: ${linhas.length} caminhos, todos existem`);
  }
  const docsDir = join(RAIZ, "docs");
  const mds = [];
  const anda = d => readdirSync(d).forEach(f => {
    const p = join(d, f);
    statSync(p).isDirectory() ? anda(p) : f.endsWith(".md") && mds.push(p);
  });
  anda(docsDir);
  const proibidos = [];
  for (const p of mds) {
    const t = readFileSync(p, "utf8");
    if (/antes era|antigamente o app/i.test(t)) proibidos.push(p.replace(RAIZ + sep, "") + " (vestígio de passado)");
  }
  for (const [n, t] of [["app.js", appjs], ["holerite.js", ler("holerite.js")], ["sw.js", sw]])
    if (/\/\/\s*(TODO|FIXME)\b/.test(t)) proibidos.push(n + " (TODO/FIXME esquecido)");
  proibidos.length ? erro("proibidos encontrados: " + proibidos.join("; ")) : ok("docs e código sem 'antes era' nem TODO/FIXME esquecido");
  const validar = [];
  for (const p of mds) {
    const t = readFileSync(p, "utf8");
    for (const m of t.matchAll(/VALIDAR:?\s*([^\n]*)/g)) validar.push(p.split(sep).pop() + ": " + m[1].slice(0, 70));
  }
  validar.length ? info(`marcadores VALIDAR em aberto (decisão do dono): ${validar.length}\n` + validar.map(v => "         " + v).join("\n"))
                 : ok("nenhum marcador VALIDAR pendente");
}

/* ---------- fecho ---------- */
console.log("\n== FORA DO ALCANCE DESTA MÁQUINA (precisa de gente ou IA) ==");
console.log("  - Conferir tabela INSS/IRRF nova em fonte oficial (gov.br) quando mudar a lei");
console.log("  - Julgar se o TEXTO dos docs conta a mesma história que o código (semântica)");
console.log("  - Pesquisa de mercado e sugestões de produto");
console.log("  - Olhar humano no visual (pixel, gosto, sensação)");

console.log("\n===============================");
if (falhas === 0) { console.log(`VERDE — tudo consistente (${avisos} aviso(s) informativos).`); process.exit(0); }
console.log(`VERMELHO — ${falhas} erro(s), ${avisos} aviso(s).`); process.exit(1);
