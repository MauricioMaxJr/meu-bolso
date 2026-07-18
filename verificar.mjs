#!/usr/bin/env node
/* ============================================================
   VERIFICAR — auditoria mecânica do Meu Bolso num comando.
   Uso:  node verificar.mjs           -> VERDE (exit 0) ou VERMELHO (exit 1)
         node verificar.mjs --selar   -> regrava docs/canonicos.json a partir
                                         do código (use SÓ após mudança
                                         intencional + bump do VERSAO do SW)
   O que cobre:
   1. Motor de salário: golden master + propriedades (teto, faixas, bordas).
   2. Livro-Razão (docs/canonicos.json): números derivados do código têm
      de bater com os selados — acusa mudança não intencional.
   3. Paridade com a calculadora original (se presente ao lado do repo).
   4. Ícones: todo nome usado existe em icons.js (sem fallback silencioso).
   5. IDs do DOM: toda referência do app.js resolve no index.html ou em HTML
      gerado dinamicamente.
   6. Encoding UTF-8 são + BOM do CSV presente.
   7. PWA: pré-cache do SW aponta só para arquivos existentes; ?v= uniforme;
      se os assets mudaram, o VERSAO do SW TEM de mudar (hash conferido).
   8. Docs: capítulos do índice existem; números canônicos citados no manual
      batem com o código; sem referências mortas de arquivo.
   ============================================================ */
import { readFileSync, existsSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const ler = p => readFileSync(join(RAIZ, p), "utf8");
const SELAR = process.argv.includes("--selar");

let falhas = 0;
const ok = m => console.log("  OK  " + m);
const erro = m => { falhas++; console.log("  ERRO " + m); };

const appjs = ler("app.js");
const iconsjs = ler("icons.js");
const indexhtml = ler("index.html");
const sw = ler("sw.js");

/* ---------- 1. motor ---------- */
console.log("\n== 1. MOTOR DE SALÁRIO ==");
const corte = appjs.indexOf("/* ================= ÍCONES");
if (corte < 0) { erro("marcador do fim do motor não encontrado em app.js"); process.exit(1); }
const M = new Function(appjs.slice(0, corte) +
  "; return { calcINSS, calcIRRF, calculaSalario, tipoDoMes, faixaDaMeta, INSS_FAIXAS, TETO_INSS, IRRF_FAIXAS, FAIXAS_META, MESES_ESPECIAIS };")();

const casos = [
  [10000, 0, 1, 160], [10000, 100, 1, 160], [12000, 85, 6, 160], [14000, 100, 1, 160],
  [14000, 100, 6, 160], [14000, 100, 12, 160], [14000, 120, 12, 160], [16000, 79, 1, 160],
  [16000, 200, 12, 160], [14000, 80, 1, 0], [14000, 104, 1, 160], [14000, 105, 1, 160],
];
let ruim = 0;
for (const [base, pct, mes, outros] of casos) {
  const r = M.calculaSalario(base, pct, mes, outros);
  const inss = M.calcINSS(r.bruto), irrf = M.calcIRRF(r.bruto - inss);
  const liq = Math.round((r.bruto - inss - irrf - outros) * 100) / 100;
  if (r.bruto !== base + r.premio || r.inss !== inss || r.irrf !== irrf || r.liquido !== liq)
    { ruim++; erro(`caso ${base}/${pct}%/m${mes} inconsistente: ${JSON.stringify(r)}`); }
  if (r.bruto >= M.INSS_FAIXAS.at(-1).ate && r.inss !== M.TETO_INSS)
    { ruim++; erro(`INSS não travou no teto p/ bruto ${r.bruto}`); }
}
if (!ruim) ok(casos.length + " casos do golden master consistentes; INSS trava no teto");

let mono = true;
for (let i = 1; i < M.FAIXAS_META.length; i++)
  for (const t of ["normal", "especial", "dezembro"])
    if (M.FAIXAS_META[i][t] < M.FAIXAS_META[i - 1][t]) mono = false;
mono ? ok("prêmios monotônicos nas 3 colunas") : erro("tabela de prêmios NÃO monotônica");

(M.faixaDaMeta(79) === null && M.faixaDaMeta(80).min === 80 && M.faixaDaMeta(84).min === 80 &&
 M.faixaDaMeta(85).min === 85 && M.faixaDaMeta(119).min === 110 && M.faixaDaMeta(120).min === 120)
  ? ok("bordas das faixas de meta corretas") : erro("bordas das faixas de meta erradas");

(M.tipoDoMes(12) === "dezembro" && M.tipoDoMes(6) === "especial" && M.tipoDoMes(8) === "especial" &&
 M.tipoDoMes(11) === "especial" && M.tipoDoMes(1) === "normal" && M.tipoDoMes(7) === "normal")
  ? ok("tipos de mês corretos") : erro("tipoDoMes errado");

/* ---------- 2. livro-razão ---------- */
console.log("\n== 2. LIVRO-RAZÃO (canonicos.json) ==");
const hashAssets = createHash("sha256");
for (const f of ["index.html", "app.js", "app.css", "icons.js", "sw.js", "manifest.webmanifest"])
  hashAssets.update(readFileSync(join(RAIZ, f)));
const derivado = {
  aviso: "GERADO por verificar.mjs --selar. NÃO editar na mão: é derivado do código.",
  versaoSW: sw.match(/VERSAO = "([^"]+)"/)[1],
  hashAssets: hashAssets.digest("hex"),
  inssFaixas: M.INSS_FAIXAS,
  tetoINSS: M.TETO_INSS,
  irrfFaixas: M.IRRF_FAIXAS.map(f => ({ ...f, ate: f.ate === Infinity ? "Infinity" : f.ate })),
  faixasMeta: M.FAIXAS_META,
  mesesEspeciais: M.MESES_ESPECIAIS,
  pisos160: Object.fromEntries([10000, 12000, 14000, 16000].map(b => [b, M.calculaSalario(b, 0, 1, 160).liquido])),
  ref14k100Normal: M.calculaSalario(14000, 100, 1, 160),
  ref14k120Dez: M.calculaSalario(14000, 120, 12, 160),
};
const CANON = join(RAIZ, "docs/canonicos.json");
if (SELAR) {
  writeFileSync(CANON, JSON.stringify(derivado, null, 2) + "\n");
  ok("canonicos.json selado a partir do código");
} else if (!existsSync(CANON)) {
  erro("docs/canonicos.json não existe — rode: node verificar.mjs --selar");
} else {
  const selado = JSON.parse(readFileSync(CANON, "utf8"));
  const a = JSON.stringify({ ...derivado, aviso: 0 }), b = JSON.stringify({ ...selado, aviso: 0 });
  if (a === b) ok("código bate com o Livro-Razão selado");
  else if (JSON.stringify({ ...derivado, aviso: 0, hashAssets: 0, versaoSW: 0 }) !==
           JSON.stringify({ ...selado, aviso: 0, hashAssets: 0, versaoSW: 0 }))
    erro("NÚMEROS DO MOTOR mudaram sem selar — se foi intencional: bump no VERSAO do sw.js + node verificar.mjs --selar");
  else if (derivado.versaoSW === selado.versaoSW)
    erro("assets mudaram mas o VERSAO do sw.js NÃO mudou — usuários ficariam com cache velho. Bump o VERSAO e rode --selar");
  else
    erro("assets/versão mudaram sem selar — rode: node verificar.mjs --selar");
}

/* ---------- 3. paridade com a calculadora original ---------- */
console.log("\n== 3. PARIDADE COM A CALCULADORA ==");
const CALC = join(RAIZ, "..", "calculadora-salario.html");
if (!existsSync(CALC)) console.log("  INFO calculadora-salario.html não está ao lado do repo; paridade pulada");
else {
  const calc = readFileSync(CALC, "utf8");
  const bloco = (src, nome) => {
    const m = src.match(new RegExp("const " + nome + " = (\\[[\\s\\S]*?\\]|[\\d.]+);"));
    return m && m[1].replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/[^\d.,:{}\[\]-]/g, "").replace(/,+/g, ",");
  };
  for (const nome of ["INSS_FAIXAS", "TETO_INSS", "IRRF_FAIXAS", "FAIXAS_META", "MESES_ESPECIAIS"]) {
    const a = bloco(appjs, nome), b = bloco(calc, nome);
    (a && b && a === b) ? ok(nome + " idêntico") : erro(nome + " DIVERGE entre app.js e calculadora");
  }
}

/* ---------- 4. ícones ---------- */
console.log("\n== 4. ÍCONES ==");
const definidos = new Set([...iconsjs.matchAll(/^"([a-z0-9-]+)":/gm)].map(m => m[1]));
const usados = new Set();
for (const re of [/ico\("([a-z0-9-]+)"\)/g, /icone?:\s*"([a-z0-9-]+)"/g, /ico:\s*"([a-z0-9-]+)"/g, /padrao:\s*"([a-z0-9-]+)"/g])
  for (const m of appjs.matchAll(re)) usados.add(m[1]);
for (const m of indexhtml.matchAll(/data-ic="([a-z0-9-]+)"/g)) usados.add(m[1]);
for (const m of appjs.match(/ICONES_ESCOLHA = \[[\s\S]*?\];/)[0].matchAll(/"([a-z0-9-]+)"/g)) usados.add(m[1]);
for (const m of appjs.match(/EMOJI_MAP = \{[\s\S]*?\};/)[0].matchAll(/:"([a-z0-9-]+)"/g)) usados.add(m[1]);
for (const m of appjs.match(/function categoriasDefault\(\) \{[\s\S]*?\n\}/)[0].matchAll(/[dr]\("[^"]+", "[^"]+", "([a-z0-9-]+)"/g)) usados.add(m[1]);
usados.delete("ICONES_ESCOLHA");
const semDef = [...usados].filter(n => !definidos.has(n));
semDef.length ? erro("ícones usados sem definição (cairiam no fallback): " + semDef.join(", "))
              : ok(`${usados.size} ícones usados, todos definidos em icons.js`);

/* ---------- 5. IDs do DOM ---------- */
console.log("\n== 5. IDs DO DOM ==");
const idsHtml = new Set([...indexhtml.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
const idsDin = new Set([...appjs.matchAll(/id="([a-zA-Z0-9-]+)"/g)].map(m => m[1]));
for (const m of appjs.matchAll(/\.id = "([a-zA-Z0-9-]+)"/g)) idsDin.add(m[1]);
const refs = new Set();
for (const m of appjs.matchAll(/\$\("#([a-zA-Z0-9-]+)"\)/g)) refs.add(m[1]);
for (const m of appjs.matchAll(/getElementById\("([a-zA-Z0-9-]+)"\)/g)) refs.add(m[1]);
const quebradas = [...refs].filter(id => !idsHtml.has(id) && !idsDin.has(id) && !id.startsWith("f-"));
quebradas.length ? erro("IDs sem alvo: " + quebradas.join(", ")) : ok(`${refs.size} referências de ID resolvem`);

/* ---------- 6. encoding ---------- */
console.log("\n== 6. ENCODING ==");
let encRuim = 0;
for (const f of ["app.js", "app.css", "index.html", "icons.js", "sw.js", "manifest.webmanifest"]) {
  const buf = readFileSync(join(RAIZ, f));
  if (buf.toString("utf8").includes("�")) { encRuim++; erro(f + ": bytes inválidos em UTF-8"); }
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) { encRuim++; erro(f + ": BOM indevido no início do arquivo"); }
}
if (!encRuim) ok("todos os arquivos UTF-8 sem BOM");
appjs.includes('let csv = "﻿') ? ok("BOM embutido na string do CSV (Excel-safe)") : erro("BOM do CSV sumiu da exportação");

/* ---------- 7. PWA ---------- */
console.log("\n== 7. PWA / CACHE ==");
const vs = new Set([...indexhtml.matchAll(/\?v=(\d+)/g)].map(m => m[1]));
vs.size === 1 ? ok("querystring ?v= uniforme (v=" + [...vs] + ")") : erro("?v= divergente no index.html: " + [...vs].join(","));
const swFiles = [...sw.matchAll(/"\.\/([^"]+)"/g)].map(m => m[1]);
const swFaltando = swFiles.filter(f => !existsSync(join(RAIZ, f)));
swFaltando.length ? erro("pré-cache do SW aponta p/ arquivo inexistente: " + swFaltando.join(", "))
                  : ok(`pré-cache do SW: ${swFiles.length} arquivos, todos existem`);
sw.includes("ignoreSearch: true") ? ok("SW ignora querystring no match") : erro("SW sem ignoreSearch");

/* ---------- 8. docs ---------- */
console.log("\n== 8. DOCS ==");
const DOCS = join(RAIZ, "docs");
if (!existsSync(DOCS)) erro("pasta docs/ não existe");
else {
  const visao = readFileSync(join(DOCS, "VISAO.md"), "utf8");
  const citados = [...visao.matchAll(/\((?:docs\/)?(manual\/[\w-]+\.md|ROADMAP\.md|paridade\/[\w-]+\.md)\)/g)].map(m => m[1]);
  const mortos = citados.filter(p => !existsSync(join(DOCS, p)));
  mortos.length ? erro("VISAO.md cita docs inexistentes: " + mortos.join(", ")) : ok(`VISAO.md: ${citados.length} referências de docs vivas`);
  const capitulos = existsSync(join(DOCS, "manual")) ? readdirSync(join(DOCS, "manual")).filter(f => f.endsWith(".md")) : [];
  const foraDoIndice = capitulos.filter(c => !citados.includes("manual/" + c));
  foraDoIndice.length ? erro("capítulos fora do índice da VISAO.md: " + foraDoIndice.join(", ")) : ok(`manual: ${capitulos.length} capítulos, todos no índice`);
  // números canônicos citados no manual têm de bater com o código
  if (existsSync(join(DOCS, "manual/01-motor-salario.md"))) {
    const cap1 = readFileSync(join(DOCS, "manual/01-motor-salario.md"), "utf8");
    const brl = v => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const precisa = [
      brl(M.TETO_INSS),
      ...M.FAIXAS_META.flatMap(f => [f.normal, f.especial, f.dezembro]).map(v => v.toLocaleString("pt-BR")),
      brl(derivado.ref14k100Normal.liquido),
    ];
    const faltam = [...new Set(precisa)].filter(n => n !== "0" && !cap1.includes(n));
    faltam.length ? erro("manual/01 sem os números atuais do código: " + faltam.join(" | "))
                  : ok("manual/01 cita os números canônicos vigentes (teto INSS, 24 prêmios, líquido de referência)");
  } else erro("manual/01-motor-salario.md não existe");
}

console.log("\n===============================");
if (falhas === 0) { console.log("VERDE — tudo consistente."); process.exit(0); }
console.log(`VERMELHO — ${falhas} erro(s).`); process.exit(1);
