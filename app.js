"use strict";
/* ============================================================
   Meu Bolso v2 — app pessoal de finanças
   Dados 100% locais (localStorage). Ícones: Lucide (ISC).
   ============================================================ */

/* ================= MOTOR DE SALÁRIO (validado c/ folha 2025) ================= */
const INSS_FAIXAS = [
  { ate: 1518.00, aliq: 0.075 },
  { ate: 2793.88, aliq: 0.09  },
  { ate: 4190.83, aliq: 0.12  },
  { ate: 8157.41, aliq: 0.14  },
];
const TETO_INSS = 951.62;
const IRRF_FAIXAS = [
  { ate: 2428.80, aliq: 0,     deduz: 0      },
  { ate: 2826.65, aliq: 0.075, deduz: 182.16 },
  { ate: 3751.05, aliq: 0.15,  deduz: 394.16 },
  { ate: 4664.68, aliq: 0.225, deduz: 675.49 },
  { ate: Infinity, aliq: 0.275, deduz: 908.73 },
];
const FAIXAS_META = [
  { min: 80,  label: "80 a 84%",   normal: 0,     especial: 0,     dezembro: 15000 },
  { min: 85,  label: "85 a 89%",   normal: 1500,  especial: 1500,  dezembro: 20000 },
  { min: 90,  label: "90 a 94%",   normal: 6000,  especial: 8000,  dezembro: 25000 },
  { min: 95,  label: "95 a 99%",   normal: 7500,  especial: 10000, dezembro: 30000 },
  { min: 100, label: "100 a 104%", normal: 10000, especial: 12000, dezembro: 35000 },
  { min: 105, label: "105 a 109%", normal: 12000, especial: 14000, dezembro: 40000 },
  { min: 110, label: "110 a 119%", normal: 14000, especial: 17000, dezembro: 45000 },
  { min: 120, label: "120% ou +",  normal: 15000, especial: 20000, dezembro: 50000 },
];
const MESES_NOME = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho",
                    "Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MESES_ESPECIAIS = [6, 8, 11];

const round2 = v => Math.round(v * 100) / 100;
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmt = v => brl.format(round2(v || 0));

function calcINSS(bruto) {
  let inss = 0, piso = 0;
  for (const f of INSS_FAIXAS) {
    const p = Math.min(bruto, f.ate) - piso;
    if (p <= 0) break;
    inss += p * f.aliq; piso = f.ate;
  }
  return Math.min(round2(inss), TETO_INSS);
}
function calcIRRF(base) {
  const f = IRRF_FAIXAS.find(f => base <= f.ate);
  return Math.max(0, round2(base * f.aliq - f.deduz));
}
function tipoDoMes(m) {
  if (m === 12) return "dezembro";
  if (MESES_ESPECIAIS.includes(m)) return "especial";
  return "normal";
}
function faixaDaMeta(pct) {
  let a = null;
  for (const f of FAIXAS_META) if (pct >= f.min) a = f;
  return a;
}
function calculaSalario(base, pctMeta, mesNum, outrosFolha) {
  const tipo = tipoDoMes(mesNum);
  const fx = faixaDaMeta(pctMeta);
  const premio = fx ? fx[tipo] : 0;
  const bruto = base + premio;
  const inss = calcINSS(bruto);
  const irrf = calcIRRF(bruto - inss);
  const liquido = round2(bruto - inss - irrf - outrosFolha);
  return { tipo, faixa: fx, premio, bruto, inss, irrf, outrosFolha, liquido };
}

/* ================= ÍCONES ================= */
const ico = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(window.LUCIDE && LUCIDE[n]) || LUCIDE["package"]}</svg>`;
const ICONES_ESCOLHA = ["target","life-buoy","award","plane","car","house","piggy-bank","gift",
  "laptop","dumbbell","baby","tree-palm","luggage","shopping-bag","gamepad-2","heart-pulse",
  "graduation-cap","key","landmark","briefcase","coins","shield","tv","wine","utensils",
  "paw-print","calendar","trending-up","wallet","package"];
const EMOJI_MAP = { "🏠":"house","🛒":"shopping-cart","⚡":"zap","🚗":"car","💊":"heart-pulse",
  "🎓":"graduation-cap","💳":"credit-card","🍽️":"utensils","🎮":"gamepad-2","🛍️":"shopping-bag",
  "📺":"tv","✈️":"plane","🐾":"paw-print","💈":"scissors","🎁":"gift","📦":"package",
  "💼":"briefcase","🧾":"rotate-ccw","🏖️":"tree-palm","📈":"trending-up","💰":"coins",
  "🛟":"life-buoy","🏆":"award","🚙":"car","🏝️":"tree-palm","📱":"laptop","🎂":"gift",
  "💍":"gift","🏋️":"dumbbell","⚽":"dumbbell","🎸":"gamepad-2","🖥️":"laptop","👶":"baby" };

/* ================= ESTADO ================= */
const LS_KEY = "meubolso.v1";
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

function categoriasDefault() {
  const d = (id, nome, icone, essencial) => ({ id, nome, icone, tipo: "despesa", essencial, orcamento: null });
  const r = (id, nome, icone) => ({ id, nome, icone, tipo: "renda", essencial: false, orcamento: null });
  return [
    d("moradia", "Moradia", "house", true),
    d("mercado", "Mercado", "shopping-cart", true),
    d("contas", "Contas de casa", "zap", true),
    d("internet", "Internet/Telefone", "wifi", true),
    d("transporte", "Transporte", "car", true),
    d("combustivel", "Combustível", "fuel", true),
    d("saude", "Saúde", "heart-pulse", true),
    d("farmacia", "Farmácia", "pill", true),
    d("educacao", "Educação", "graduation-cap", true),
    d("dividas", "Dívidas/Empréstimos", "credit-card", true),
    d("impostos", "Impostos e taxas", "receipt", true),
    d("seguros", "Seguros", "shield", true),
    d("filhos", "Filhos/Família", "baby", true),
    d("restaurantes", "Restaurantes/Delivery", "utensils", false),
    d("bares", "Bares/Vida noturna", "wine", false),
    d("lazer", "Lazer", "gamepad-2", false),
    d("compras", "Compras", "shopping-bag", false),
    d("vestuario", "Vestuário", "shirt", false),
    d("tecnologia", "Tecnologia", "laptop", false),
    d("assinaturas", "Assinaturas", "tv", false),
    d("academia", "Academia/Esportes", "dumbbell", false),
    d("viagens", "Viagens", "plane", false),
    d("viagem-trabalho", "Viagem a trabalho", "luggage", false),
    d("pets", "Pets", "paw-print", false),
    d("cuidados", "Cuidados pessoais", "scissors", false),
    d("presentes", "Presentes/Doações", "gift", false),
    d("outros", "Outros", "package", false),
    r("cat-salario", "Salário", "briefcase"),
    r("cat-reembolso", "Reembolso empresa", "rotate-ccw"),
    r("cat-ferias", "Férias", "tree-palm"),
    r("cat-decimo", "13º salário", "calendar-check"),
    r("cat-plr", "PLR/Participação", "trending-up"),
    r("cat-governo", "Governo (IR, FGTS)", "landmark"),
    r("cat-invest", "Investimentos", "piggy-bank"),
    r("cat-aluguel", "Aluguel recebido", "key"),
    r("cat-freela", "Vendas/Freelance", "hand-coins"),
    r("cat-extra", "Outras rendas", "coins"),
  ];
}

function estadoDefault() {
  return {
    version: 2,
    config: {
      salBase: 14000,
      descFolha: 160,
      pctMinimo: 20,
      pctPremioReserva: 50,
      pctPremioLivre: 30,
      reservaMeses: 6,
      tema: "auto",
    },
    categorias: categoriasDefault(),
    custosFixos: [],
    metas: [],
    contas: [],               // {id,nome,icone,saldo} - onde o dinheiro está
    meses: {},
  };
}

function migrar(st) {
  if (st.version === 2) return st;
  // v1 -> v2: emojis viram ícones Lucide, categorias novas entram, tema
  const defs = categoriasDefault();
  (st.categorias || []).forEach(c => {
    const def = defs.find(d => d.id === c.id);
    c.icone = def ? def.icone : (EMOJI_MAP[c.icone] || (c.tipo === "renda" ? "coins" : "package"));
  });
  defs.forEach(def => {
    if (!st.categorias.some(c => c.id === def.id)) st.categorias.push(def);
  });
  (st.metas || []).forEach(m => {
    m.icone = m.tipoReserva ? "life-buoy" : (EMOJI_MAP[m.icone] || "target");
  });
  st.config.tema = st.config.tema || "auto";
  st.version = 2;
  return st;
}

let S = carregar();
function carregar() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const st = JSON.parse(raw);
      if (st && (st.version === 1 || st.version === 2)) {
        migrar(st);
        // encurta nomes default antigos (só se não foram editados pelo usuário)
        const ren = { "cat-governo": ["Governo (restituição IR, FGTS...)", "Governo (IR, FGTS)"],
                      "cat-invest": ["Rendimentos/Investimentos", "Investimentos"] };
        Object.entries(ren).forEach(([id, [antigo, novo]]) => {
          const c = st.categorias.find(x => x.id === id);
          if (c && c.nome === antigo) c.nome = novo;
        });
        if (!st.contas) st.contas = [];
        return st;
      }
    }
  } catch (e) { console.warn("estado corrompido, recomeçando", e); }
  return estadoDefault();
}
function salvar() { localStorage.setItem(LS_KEY, JSON.stringify(S)); }

/* ================= TEMA ================= */
function aplicarTema() {
  let t = S.config.tema;
  if (t !== "claro" && t !== "escuro") { // resolve "auto" uma única vez pelo sistema
    t = matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
    S.config.tema = t; salvar();
  }
  document.documentElement.dataset.theme = t;
  const btn = document.getElementById("btn-tema");
  if (btn) btn.innerHTML = ico(t === "escuro" ? "moon" : "sun");
}

/* ================= MESES ================= */
function chaveHoje() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
let mesVisto = chaveHoje();

function getMes(chave) {
  if (!S.meses[chave]) {
    S.meses[chave] = {
      status: "aberto",
      sal: { pctMeta: 100, valorReal: null, registrado: false },
      rendas: [], gastos: [], fixosStatus: {}, aportes: [],
      snapshot: null,
    };
  }
  return S.meses[chave];
}
function mesNum(chave) { return parseInt(chave.slice(5), 10); }
function labelMes(chave) { return MESES_NOME[mesNum(chave) - 1] + " " + chave.slice(0, 4); }
function addMeses(chave, n) {
  let y = parseInt(chave.slice(0, 4), 10), m = mesNum(chave) - 1 + n;
  y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  return y + "-" + String(m + 1).padStart(2, "0");
}

function fixosDoMes(chave) {
  const mes = getMes(chave);
  if (mes.status === "gravado" && mes.snapshot) return mes.snapshot.fixos;
  return S.custosFixos.filter(f => f.ativo).map(f => {
    const st = mes.fixosStatus[f.id] || {};
    return { ...f, pago: !!st.pago, valorMes: st.valor != null ? st.valor : f.valor };
  });
}

function calcMes(chave) {
  const mes = getMes(chave);
  if (mes.status === "gravado" && mes.snapshot) return mes.snapshot.tot;

  const sal = calculaSalario(S.config.salBase, mes.sal.pctMeta, mesNum(chave), S.config.descFolha);
  const salRegistrado = !!mes.sal.registrado;
  const salValor = mes.sal.valorReal != null ? mes.sal.valorReal : sal.liquido;
  const salLiq = salRegistrado ? salValor : 0; // sem registro, salário não entra no mês
  const outrasRendas = mes.rendas.reduce((s, r) => s + r.valor, 0);
  const renda = round2(salLiq + outrasRendas);

  const fixos = fixosDoMes(chave);
  const totFixos = fixos.reduce((s, f) => s + f.valorMes, 0);
  const totAvulsos = mes.gastos.reduce((s, g) => s + g.valor, 0);
  const custos = round2(totFixos + totAvulsos);

  const porCat = {};
  fixos.forEach(f => porCat[f.catId] = (porCat[f.catId] || 0) + f.valorMes);
  mes.gastos.forEach(g => porCat[g.catId] = (porCat[g.catId] || 0) + g.valor);

  let essenciais = 0;
  Object.entries(porCat).forEach(([cid, v]) => { const c = catById(cid); if (c && c.essencial) essenciais += v; });
  essenciais = round2(essenciais);

  const piso = calculaSalario(S.config.salBase, 0, mesNum(chave) === 12 ? 1 : mesNum(chave), S.config.descFolha).liquido;
  const aportado = mes.aportes.reduce((s, a) => s + a.valor, 0);

  return { sal, salLiq, salValor, salRegistrado, outrasRendas, renda, totFixos, totAvulsos, custos, porCat, essenciais, piso, aportado, saldo: round2(renda - custos) };
}

/* ================= RECOMENDAÇÃO ================= */
function metaReserva() { return S.metas.find(m => m.tipoReserva); }

function essenciaisReferencia(chave) {
  const gravados = Object.keys(S.meses).filter(k => S.meses[k].status === "gravado" && S.meses[k].snapshot).sort().reverse().slice(0, 3);
  if (gravados.length) {
    const soma = gravados.reduce((s, k) => s + (S.meses[k].snapshot.tot.essenciais || 0), 0);
    const media = soma / gravados.length;
    if (media > 0) return round2(media);
  }
  return calcMes(chave).essenciais;
}

function recomendacao(chave) {
  const t = calcMes(chave);
  const cfg = S.config;
  const reserva = metaReserva();
  const essRef = essenciaisReferencia(chave);
  const reservaOk = reserva ? (reserva.alvo > 0 && reserva.guardado >= reserva.alvo) : false;

  const minimo = round2(t.renda * cfg.pctMinimo / 100);
  const excedente = Math.max(0, round2(t.renda - t.piso));
  const pctPremio = reservaOk ? cfg.pctPremioLivre : cfg.pctPremioReserva;
  const regraPremio = round2(excedente * pctPremio / 100);
  const teto = Math.max(0, t.saldo);
  const valor = Math.min(Math.max(minimo, regraPremio), teto);

  return { valor: round2(valor), minimo, excedente, pctPremio, regraPremio, teto,
           reservaOk, essRef, pisoOk: t.essenciais <= t.piso, t };
}

/* ================= DICAS ================= */
function gerarDicas(chave) {
  const r = recomendacao(chave);
  const t = r.t;
  const dicas = [];
  const cat = id => catById(id);

  if (!t.salRegistrado && S.meses[chave] && S.meses[chave].status !== "gravado")
    dicas.push({ nv: "info", ico: "briefcase", txt: `Salário de ${labelMes(chave)} não registrado. Registre em Renda para entrar no mês.` });
  if (!r.pisoOk)
    dicas.push({ nv: "critical", ico: "triangle-alert", txt: `Essenciais (${fmt(t.essenciais)}) acima do piso (${fmt(t.piso)}). Reveja os custos fixos.` });
  if (t.saldo < 0)
    dicas.push({ nv: "critical", ico: "triangle-alert", txt: `Mês no vermelho: custos ${fmt(t.custos)} × renda ${fmt(t.renda)}.` });

  S.categorias.filter(c => c.tipo === "despesa" && c.orcamento > 0).forEach(c => {
    const gasto = t.porCat[c.id] || 0;
    if (gasto > c.orcamento)
      dicas.push({ nv: "warning", ico: c.icone, txt: `${c.nome}: ${fmt(gasto)} de ${fmt(c.orcamento)}, orçamento estourado.` });
  });

  const naoEss = round2(t.custos - t.essenciais);
  if (t.renda > 0 && naoEss / t.renda > 0.30)
    dicas.push({ nv: "warning", ico: "circle-alert", txt: `Estilo de vida (${fmt(naoEss)}) acima de 30% da renda.` });

  const assin = S.custosFixos.filter(f => f.ativo && f.assinatura);
  const totAssin = assin.reduce((s, f) => s + f.valor, 0);
  if (totAssin > 0) {
    const top = assin.slice().sort((a, b) => b.valor - a.valor)[0];
    if (t.renda > 0 && totAssin / t.renda > 0.05)
      dicas.push({ nv: "warning", ico: "tv", txt: `Assinaturas: ${fmt(totAssin)}/mês = ${fmt(totAssin * 12)}/ano. Maior: ${top.nome}.` });
    else
      dicas.push({ nv: "info", ico: "tv", txt: `Assinaturas: ${fmt(totAssin)}/mês (${fmt(totAssin * 12)}/ano).` });
  }

  const gravados = Object.keys(S.meses).filter(k => k !== chave && S.meses[k].status === "gravado" && S.meses[k].snapshot).sort().reverse().slice(0, 3);
  if (gravados.length >= 2) {
    Object.entries(t.porCat).forEach(([cid, v]) => {
      const med = gravados.reduce((s, k) => s + (S.meses[k].snapshot.tot.porCat[cid] || 0), 0) / gravados.length;
      if (med > 100 && v > med * 1.3) {
        const c = cat(cid);
        dicas.push({ nv: "warning", ico: c.icone, txt: `${c.nome} ${Math.round((v / med - 1) * 100)}% acima da média (${fmt(v)} × ${fmt(med)}).` });
      }
    });
  }

  const reserva = metaReserva();
  if (!reserva)
    dicas.push({ nv: "info", ico: "life-buoy", txt: r.essRef > 0
      ? `Sem reserva de emergência. Alvo sugerido: ${fmt(r.essRef * S.config.reservaMeses)}. Crie em Metas.`
      : `Sem reserva de emergência. Crie em Metas.` });
  else if (!r.reservaOk)
    dicas.push({ nv: "info", ico: "life-buoy", txt: `Reserva de emergência: ${fmt(reserva.guardado)} de ${fmt(reserva.alvo)} (${Math.round(reserva.guardado / reserva.alvo * 100)}%).` });
  else
    dicas.push({ nv: "good", ico: "circle-check", txt: `Reserva de emergência completa (${fmt(reserva.guardado)}).` });

  if (chave === chaveHoje()) {
    const hoje = new Date().getDate();
    fixosDoMes(chave).filter(f => f.lembrete && !f.pago && f.dia && f.dia < hoje).forEach(f =>
      dicas.push({ nv: "critical", ico: "bell", txt: `${f.nome} venceu dia ${f.dia} (${fmt(f.valorMes)}).` }));
  }

  const ordem = { critical: 0, warning: 1, info: 2, good: 3 };
  return dicas.sort((a, b) => ordem[a.nv] - ordem[b.nv]);
}

/* ================= GRAVAR MÊS ================= */
function gravarMes(chave) {
  const mes = getMes(chave);
  const tot = calcMes(chave);
  const fixos = fixosDoMes(chave);
  mes.snapshot = { tot: JSON.parse(JSON.stringify(tot)), fixos: JSON.parse(JSON.stringify(fixos)), em: new Date().toISOString() };
  mes.status = "gravado";
  mes.aportes.forEach(a => {
    const m = S.metas.find(x => x.id === a.metaId);
    if (m) m.guardado = round2(m.guardado + a.valor);
  });
  mes.snapshot.guardadoTotal = round2(S.metas.reduce((s, m) => s + m.guardado, 0));
  mes.snapshot.contasTotal = round2(S.contas.reduce((s, c) => s + c.saldo, 0));
  salvar(); render();
  toast("Mês gravado. Aportes somados às metas.");
}
function reabrirMes(chave) {
  const mes = getMes(chave);
  mes.aportes.forEach(a => {
    const m = S.metas.find(x => x.id === a.metaId);
    if (m) m.guardado = round2(Math.max(0, m.guardado - a.valor));
  });
  mes.status = "aberto"; mes.snapshot = null;
  salvar(); render();
  toast("Mês reaberto. Aportes devolvidos.");
}

/* ================= UI HELPERS ================= */
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, 3200);
}
function catById(id) { return S.categorias.find(c => c.id === id) || { nome: "?", icone: "package", essencial: false }; }
function vazio(icone, texto, abrir, rotulo) {
  return `<div class="vazio">${ico(icone)}<span>${texto}</span>` +
    (abrir ? `<button class="btn primary" data-abrir="${abrir}">${rotulo || "Adicionar"}</button>` : "") + `</div>`;
}

/* ---------- dialog genérico ---------- */
function abrirDialog(titulo, campos, aoSalvar, valores = {}, aoExcluir = null) {
  const dlg = $("#dlg-item"), box = $("#dlg-campos");
  $("#dlg-titulo").textContent = titulo;
  box.innerHTML = "";
  const bxAntigo = document.getElementById("dlg-excluir");
  if (bxAntigo) bxAntigo.remove();
  if (aoExcluir) {
    const bx = el("button", "btn danger", "Excluir");
    bx.type = "button"; bx.id = "dlg-excluir";
    bx.onclick = () => { dlg.close("cancel"); aoExcluir(); };
    document.querySelector("#dlg-form .btn-row").prepend(bx);
  }
  campos.forEach(c => {
    if (c.tipo === "icone") {
      const wrap = el("label", null, esc(c.label));
      const grid = el("div", "icone-grid");
      let sel = valores[c.id] || c.padrao || ICONES_ESCOLHA[0];
      ICONES_ESCOLHA.forEach(nm => {
        const b = el("button", nm === sel ? "sel" : "", ico(nm));
        b.type = "button"; b.title = nm;
        b.onclick = () => { sel = nm; grid.querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); wrap.dataset.valor = sel; };
        grid.appendChild(b);
      });
      wrap.dataset.valor = sel; wrap.dataset.campo = c.id; wrap.appendChild(grid);
      box.appendChild(wrap);
    } else if (c.tipo === "check") {
      const wrap = el("label", "check-row");
      const inp = el("input"); inp.type = "checkbox"; inp.id = "f-" + c.id; inp.checked = !!valores[c.id];
      wrap.appendChild(inp); wrap.appendChild(document.createTextNode(" " + c.label));
      box.appendChild(wrap);
    } else if (c.tipo === "select") {
      const wrap = el("label", null, esc(c.label));
      const s = el("select"); s.id = "f-" + c.id;
      c.opcoes.forEach(o => { const op = el("option", null, esc(o.label)); op.value = o.valor; s.appendChild(op); });
      if (valores[c.id] != null) s.value = valores[c.id];
      wrap.appendChild(s); box.appendChild(wrap);
    } else {
      const wrap = el("label", null, esc(c.label));
      const inp = el("input"); inp.id = "f-" + c.id; inp.type = c.tipo || "text";
      if (c.tipo === "number") { inp.step = c.step || "0.01"; inp.min = c.min != null ? c.min : "0"; inp.inputMode = "decimal"; }
      if (c.tipo === "month") inp.type = "month";
      if (valores[c.id] != null) inp.value = valores[c.id];
      if (c.obrig) inp.required = true;
      if (c.placeholder) inp.placeholder = c.placeholder;
      wrap.appendChild(inp); box.appendChild(wrap);
    }
  });
  $("#dlg-form").onsubmit = (ev) => {
    if (dlg.returnValue === "cancel" || ev.submitter && ev.submitter.value === "cancel") return;
    const out = {};
    campos.forEach(c => {
      if (c.tipo === "icone") out[c.id] = box.querySelector(`[data-campo="${c.id}"]`).dataset.valor;
      else if (c.tipo === "check") out[c.id] = $("#f-" + c.id).checked;
      else if (c.tipo === "number") out[c.id] = parseFloat($("#f-" + c.id).value) || 0;
      else out[c.id] = $("#f-" + c.id).value;
    });
    aoSalvar(out);
  };
  dlg.showModal();
}

/* ================= NAVEGAÇÃO ================= */
let telaAtiva = "inicio";
const TITULOS = { inicio: "Início", renda: "Renda", custos: "Custos", metas: "Metas",
                  contas: "Contas", relatorios: "Relatórios", dicas: "Dicas", config: "Configurações" };

function trocaTela(nome) {
  telaAtiva = nome;
  document.querySelectorAll(".nav-lateral button").forEach(b => b.classList.toggle("ativo", b.dataset.tela === nome));
  document.querySelectorAll(".tela").forEach(t => t.hidden = t.id !== "tela-" + nome);
  $("#titulo-tela").textContent = TITULOS[nome];
  fechaDrawer();
  render();
  window.scrollTo({ top: 0 });
}
function abreDrawer() { $("#sidebar").classList.add("aberta"); $("#overlay").classList.add("visivel"); }
function fechaDrawer() { $("#sidebar").classList.remove("aberta"); $("#overlay").classList.remove("visivel"); }

/* ================= RENDERS ================= */
function render() {
  const mes = getMes(mesVisto);
  $("#mes-label").textContent = labelMes(mesVisto);
  const stat = $("#mes-status");
  stat.textContent = mes.status === "gravado" ? "Gravado" : "Em aberto";
  stat.className = "badge" + (mes.status === "gravado" ? " gravado" : "");
  renderInicio(); renderRenda(); renderCustos(); renderMetas(); renderContas();
  renderRelatorios(); renderDicas(); renderConfig();
}

/* ---------- Contas (onde o dinheiro está) ---------- */
function renderContas() {
  const total = round2(S.contas.reduce((s, c) => s + c.saldo, 0));
  $("#contas-total").innerHTML = `
    <div class="card destaque"><div class="label">Total em contas</div><div class="value">${fmt(total)}</div>
      <div class="sub">${S.contas.length} conta${S.contas.length === 1 ? "" : "s"}</div></div>`;
  $("#lista-contas").innerHTML = S.contas.length === 0
    ? vazio("banknote", "Cadastre onde seu dinheiro está: banco, caixinha, corretora.", "conta", "Adicionar conta")
    : S.contas.map(c => `
      <button class="chip conta-card" data-ed-conta="${c.id}" title="${esc(c.nome)}">
        ${ico(c.icone)}<span class="conta-info"><span class="chip-nome">${esc(c.nome)}</span>
        <span class="conta-saldo">${fmt(c.saldo)}</span></span>
      </button>`).join("");
}
function dlgConta(c) {
  abrirDialog(c ? "Editar conta" : "Nova conta", [
    { id: "nome", label: "Nome", obrig: true, placeholder: "ex.: Nubank, Caixinha, XP" },
    { id: "icone", label: "Ícone", tipo: "icone", padrao: "landmark" },
    { id: "saldo", label: "Saldo atual (R$)", tipo: "number" },
  ], out => {
    out.saldo = Math.max(0, out.saldo || 0); // conta nunca fica negativa
    if (c) Object.assign(c, out);
    else S.contas.push({ id: uid(), ...out });
    salvar(); render();
  }, c || {}, c ? () => {
    if (confirm("Excluir a conta " + c.nome + "?")) {
      S.contas = S.contas.filter(x => x.id !== c.id); salvar(); render();
    }
  } : null);
}

/* ---------- Início ---------- */
function renderOnboarding() {
  const box = $("#painel-onboarding");
  if (!box) return;
  const mesAtual = getMes(chaveHoje());
  const algumGravado = Object.values(S.meses).some(m => m.status === "gravado");
  const passos = [
    { ok: !!mesAtual.sal.registrado || algumGravado, txt: "Registre seu salário do mês", abrir: "salario" },
    { ok: S.custosFixos.length > 0, txt: "Cadastre seus custos fixos", abrir: "fixo" },
    { ok: !!metaReserva(), txt: "Crie a reserva de emergência", tela: "metas" },
  ];
  if (S.config.onboardingOculto || passos.every(p => p.ok)) { box.innerHTML = ""; return; }
  box.innerHTML = `<div class="panel onboarding">
    <div class="panel-head"><h2>${ico("sparkles")}Primeiros passos</h2>
    <button class="btn" id="btn-onboarding-x">Dispensar</button></div>
    ${passos.map(p => `
      <div class="passo${p.ok ? " feito" : ""}">
        <span class="p-ico">${ico(p.ok ? "circle-check" : "chevron-right")}</span>
        <span class="p-txt">${p.txt}</span>
        ${p.ok ? "" : (p.abrir ? `<button class="btn primary" data-abrir="${p.abrir}">Fazer</button>` : `<button class="btn primary" data-tela-ir="${p.tela}">Abrir</button>`)}
      </div>`).join("")}
  </div>`;
  $("#btn-onboarding-x").onclick = () => { S.config.onboardingOculto = true; salvar(); render(); };
}

function renderInicio() {
  renderOnboarding();
  const t = calcMes(mesVisto);
  const r = recomendacao(mesVisto);
  const mes = getMes(mesVisto);
  const salOk = t.salRegistrado || mes.status === "gravado";
  const sobraReal = round2(t.renda - t.custos - r.valor);
  const sobra = Math.max(0, sobraReal); // nada fica negativo

  $("#cards-resumo").innerHTML = `
    <div class="card"><div class="label">Renda do mês</div><div class="value">${fmt(t.renda)}</div>
      <div class="sub">${salOk ? "salário " + fmt(t.salLiq) : "salário não registrado"} · extras ${fmt(t.outrasRendas)}</div></div>
    <div class="card"><div class="label">Custos</div><div class="value${t.custos > t.renda ? " neg" : ""}">${fmt(t.custos)}</div>
      <div class="sub">fixos ${fmt(t.totFixos)} · avulsos ${fmt(t.totAvulsos)}</div></div>
    <div class="card destaque"><div class="label">Guardar</div><div class="value">${fmt(r.valor)}</div>
      <div class="sub">aportado ${fmt(t.aportado)}</div></div>
    <div class="card"><div class="label">Sobra livre</div><div class="value">${fmt(sobra)}</div>
      <div class="sub">${sobraReal < 0 ? `<span style="color:var(--danger)">passou ${fmt(-sobraReal)} do disponível</span>` : "após custos e guardar"}</div></div>`;

  const pisoUso = t.piso > 0 ? Math.min(100, t.essenciais / t.piso * 100) : 0;
  $("#painel-recomendacao").innerHTML = `
    <h2>${ico("compass")}Leitura do mês</h2>
    <div class="stats">
      <div class="stat"><div class="k">Piso (sem prêmio)</div><div class="v">${fmt(t.piso)}</div></div>
      <div class="stat"><div class="k">Excedente</div><div class="v">${fmt(r.excedente)}</div></div>
      <div class="stat"><div class="k">Regra do prêmio (${r.pctPremio}%)</div><div class="v">${fmt(r.regraPremio)}</div></div>
      <div class="stat"><div class="k">Mínimo (${S.config.pctMinimo}%)</div><div class="v">${fmt(r.minimo)}</div></div>
    </div>
    <div class="barra-wrap">
      <div class="barra"><div class="${t.essenciais > t.piso ? "estouro" : ""}" style="width:${pisoUso}%"></div></div>
      <div class="barra-leg"><span>Essenciais ${fmt(t.essenciais)}</span><span>Piso ${fmt(t.piso)}</span></div>
    </div>`;

  const pend = fixosDoMes(mesVisto).filter(f => f.lembrete && !f.pago).sort((a, b) => (a.dia || 32) - (b.dia || 32));
  const hoje = mesVisto === chaveHoje() ? new Date().getDate() : null;
  $("#painel-contas").innerHTML = `<h2>${ico("clock")}Contas a pagar</h2>` + (pend.length === 0
    ? vazio("circle-check", "Nenhuma conta pendente.")
    : `<ul class="lista">` + pend.map(f => `
        <li><span class="ico-cat">${ico(catById(f.catId).icone)}</span>
        <span class="info"><span class="nome">${esc(f.nome)}${hoje && f.dia && f.dia < hoje ? '<span class="selo atraso">atrasada</span>' : ""}</span>
        <span class="det">${f.dia ? "vence dia " + f.dia : "sem vencimento"}</span></span>
        <span class="valor">${fmt(f.valorMes)}</span></li>`).join("") + `</ul>`);

  $("#painel-metas-mini").innerHTML = `<h2>${ico("award")}Metas</h2>` + (S.metas.length === 0
    ? vazio("target", "Sem metas ainda.", "meta", "Criar meta")
    : S.metas.map(m => barraMeta(m)).join(""));

  const dicas = gerarDicas(mesVisto).slice(0, 3);
  $("#painel-dicas-mini").innerHTML = `<h2>${ico("lightbulb")}Dicas</h2>` +
    (dicas.length ? dicas.map(dicaHTML).join("") : vazio("circle-check", "Tudo em ordem."));

  const area = $("#gravar-area");
  if (mes.status === "gravado") {
    area.innerHTML = `<button class="btn-gravar reabrir" id="btn-gravar">${ico("lock-open")}Reabrir mês para edição</button>`;
    $("#btn-gravar").onclick = () => { if (confirm("Reabrir " + labelMes(mesVisto) + "? Os aportes serão devolvidos até você gravar de novo.")) reabrirMes(mesVisto); };
  } else if (!t.salRegistrado) {
    area.innerHTML = `<button class="btn-gravar" data-abrir="salario">${ico("check")}Registrar salário</button>
      <p class="soft" style="margin-top:8px">Sem registro, o salário não entra em ${labelMes(mesVisto)}.</p>`;
  } else {
    area.innerHTML = `<button class="btn-gravar" id="btn-gravar">${ico("lock")}Gravar mês</button>
      <p class="soft" style="margin-top:8px">Congela ${labelMes(mesVisto)} e soma os aportes às metas.</p>`;
    $("#btn-gravar").onclick = () => {
      const res = `Gravar ${labelMes(mesVisto)}?\n\nRenda: ${fmt(t.renda)}\nCustos: ${fmt(t.custos)}\nAportes em metas: ${fmt(t.aportado)}\nSaldo: ${fmt(Math.max(0, t.saldo))}`;
      if (confirm(res)) gravarMes(mesVisto);
    };
  }
}
function dicaHTML(d) {
  const rot = { critical: "Crítico", warning: "Atenção", info: "Info", good: "Em dia" };
  return `<div class="dica ${d.nv}"><span class="d-ico">${ico(d.ico)}</span><span class="d-corpo"><strong>${rot[d.nv]}:</strong> ${esc(d.txt)}</span></div>`;
}
function barraMeta(m) {
  if (!(m.alvo > 0)) {
    return `<div class="orc-item">
      <div class="orc-top"><span class="rotulo">${ico(m.icone)} ${esc(m.nome)}</span>
      <span style="color:var(--positivo)">${fmt(m.guardado)}</span></div>
    </div>`;
  }
  const pct = Math.min(100, m.guardado / m.alvo * 100);
  return `<div class="orc-item">
    <div class="orc-top"><span class="rotulo">${ico(m.icone)} ${esc(m.nome)}</span><span>${fmt(m.guardado)} / ${fmt(m.alvo)} (${pct.toFixed(0)}%)</span></div>
    <div class="barra"><div style="width:${pct}%"></div></div>
  </div>`;
}

/* ---------- Renda ---------- */
function renderRenda() {
  const mes = getMes(mesVisto);
  const gravado = mes.status === "gravado";
  const registrado = !!mes.sal.registrado;
  $("#sal-base").value = String(S.config.salBase);
  $("#sal-pct").value = mes.sal.pctMeta;
  ["sal-base", "sal-pct"].forEach(id => $("#" + id).disabled = gravado || registrado);

  const t = calcMes(mesVisto);
  const sal = t.sal;
  const nomeTipo = { normal: "mês normal", especial: "mês especial (jun/ago/nov)", dezembro: "dezembro (prêmios máximos)" };
  const manual = mes.sal.valorReal != null;
  $("#sal-resumo").innerHTML = sal ? `
    <div class="linha"><span>Tipo do mês</span><strong>${nomeTipo[sal.tipo] || "-"}</strong></div>
    <div class="linha"><span>Prêmio (${sal.faixa ? "faixa " + sal.faixa.label : "abaixo de 80%"})</span><span>${fmt(sal.premio)}</span></div>
    <div class="linha"><span>Bruto</span><span>${fmt(sal.bruto)}</span></div>
    <div class="linha"><span>INSS + IRRF + fixos da folha</span><span class="neg">− ${fmt(sal.inss + sal.irrf + sal.outrosFolha)}</span></div>
    <div class="linha total"><span>${registrado || gravado ? "Salário registrado" + (manual ? " (manual)" : "") : "Estimativa (não registrado)"}</span>
    <span>${fmt(registrado || gravado ? t.salValor : sal.liquido)}</span></div>` : "";
  const acao = $("#sal-acao");
  if (acao) acao.innerHTML = gravado ? "" : (registrado
    ? `<button class="btn" data-abrir="salario">${ico("pencil")}Editar registro</button>`
    : `<button class="btn primary" data-abrir="salario">${ico("check")}Registrar salário</button>`);

  const ul = $("#lista-rendas");
  ul.innerHTML = mes.rendas.length === 0 ? vazio("hand-coins", "Nenhuma renda extra.", gravado ? null : "renda", "Adicionar renda") :
    mes.rendas.map(r => `
      <li><span class="ico-cat">${ico(catById(r.catId).icone)}</span>
      <span class="info"><span class="nome">${esc(r.desc)}</span><span class="det">${esc(catById(r.catId).nome)}</span></span>
      <span class="valor renda">+ ${fmt(r.valor)}</span>
      ${gravado ? "" : `<span class="acoes"><button data-ed-renda="${r.id}" title="Editar">${ico("pencil")}</button><button data-rm-renda="${r.id}" title="Excluir">${ico("trash-2")}</button></span>`}</li>`).join("");
  $("#btn-add-renda").style.display = gravado ? "none" : "";
}

/* ---------- Custos ---------- */
function renderCustos() {
  const mes = getMes(mesVisto);
  const gravado = mes.status === "gravado";
  const fixos = fixosDoMes(mesVisto);

  $("#lista-fixos").innerHTML = fixos.length === 0 ? vazio("repeat", "Nenhum custo fixo.", gravado ? null : "fixo", "Adicionar custo fixo") :
    fixos.map(f => `
      <li><input type="checkbox" class="chk-pago" data-pago="${f.id}" ${f.pago ? "checked" : ""} ${gravado ? "disabled" : ""} title="pago?">
      <span class="ico-cat">${ico(catById(f.catId).icone)}</span>
      <span class="info"><span class="nome">${esc(f.nome)}${f.assinatura ? '<span class="selo assin">assinatura</span>' : ""}${f.lembrete ? '<span class="selo">lembrete</span>' : ""}${f.variavel ? '<span class="selo">variável</span>' : ""}</span>
      <span class="det">${esc(catById(f.catId).nome)}${f.dia ? " · vence dia " + f.dia : ""}</span></span>
      <span class="valor">${fmt(f.valorMes)}</span>
      ${gravado ? "" : `<span class="acoes"><button data-ed-fixo="${f.id}" title="Editar">${ico("pencil")}</button><button data-rm-fixo="${f.id}" title="Excluir">${ico("trash-2")}</button></span>`}</li>`).join("");

  $("#lista-gastos").innerHTML = mes.gastos.length === 0 ? vazio("receipt", "Nenhum gasto avulso no mês.", gravado ? null : "gasto", "Adicionar gasto") :
    mes.gastos.slice().sort((a, b) => (b.dia || 0) - (a.dia || 0)).map(g => `
      <li><span class="ico-cat">${ico(catById(g.catId).icone)}</span>
      <span class="info"><span class="nome">${esc(g.desc)}</span><span class="det">${esc(catById(g.catId).nome)}${g.dia ? " · dia " + g.dia : ""}</span></span>
      <span class="valor">${fmt(g.valor)}</span>
      ${gravado ? "" : `<span class="acoes"><button data-ed-gasto="${g.id}" title="Editar">${ico("pencil")}</button><button data-rm-gasto="${g.id}" title="Excluir">${ico("trash-2")}</button></span>`}</li>`).join("");

  $("#btn-add-fixo").style.display = gravado ? "none" : "";
  $("#btn-add-gasto").style.display = gravado ? "none" : "";

  const t = calcMes(mesVisto);
  const comOrc = S.categorias.filter(c => c.tipo === "despesa" && c.orcamento > 0);
  $("#orcamentos").innerHTML = comOrc.length === 0 ? vazio("target", "Nenhuma categoria com teto. Defina em Configurações.") :
    comOrc.map(c => {
      const v = t.porCat[c.id] || 0;
      const pct = Math.min(100, v / c.orcamento * 100);
      return `<div class="orc-item">
        <div class="orc-top"><span class="rotulo">${ico(c.icone)} ${esc(c.nome)}</span><span>${fmt(v)} / ${fmt(c.orcamento)}</span></div>
        <div class="barra"><div class="${v > c.orcamento ? "estouro" : ""}" style="width:${pct}%"></div></div></div>`;
    }).join("");
}

/* ---------- Metas ---------- */
function renderMetas() {
  const mes = getMes(mesVisto);
  const gravado = mes.status === "gravado";
  const box = $("#lista-metas");
  const r = recomendacao(mesVisto);

  let html = "";
  if (!metaReserva()) {
    const alvoTxt = r.essRef > 0
      ? `Alvo sugerido: <strong>${fmt(r.essRef * S.config.reservaMeses)}</strong>.`
      : `Cadastre seus custos fixos para calcular o alvo.`;
    html += `<div class="dica info"><span class="d-ico">${ico("life-buoy")}</span><span class="d-corpo">Comece pela <strong>reserva de emergência</strong>. ${alvoTxt}<span class="btn-row"><button class="btn primary" id="btn-criar-reserva">Criar agora</button></span></span></div>`;
  }
  if (!S.metas.some(m => m.tipoInvest)) {
    html += `<div class="dica info"><span class="d-ico">${ico("piggy-bank")}</span><span class="d-corpo">Além da reserva, acumule em <strong>investimentos</strong>, sem alvo, só crescer.<span class="btn-row"><button class="btn primary" id="btn-criar-invest">Criar agora</button></span></span></div>`;
  }
  html += S.metas.length === 0 ? vazio("target", "Nenhuma meta ainda.", "meta", "Criar meta") :
    S.metas.map(m => {
      const semAlvo = !(m.alvo > 0);
      const pct = semAlvo ? 0 : Math.min(100, m.guardado / m.alvo * 100);
      let prazoTxt = "";
      if (m.prazo && !semAlvo) {
        const [y, mm] = m.prazo.split("-").map(Number);
        const hoje = new Date();
        const meses = (y - hoje.getFullYear()) * 12 + (mm - 1 - hoje.getMonth());
        const falta = Math.max(0, m.alvo - m.guardado);
        prazoTxt = meses > 0
          ? `até ${String(mm).padStart(2, "0")}/${y}: ${fmt(falta / meses)}/mês`
          : (falta > 0 ? "prazo vencido, faltam " + fmt(falta) : "");
      }
      const selos = (m.tipoReserva ? ' <span class="selo assin">reserva</span>' : "") +
                    (m.tipoInvest ? ' <span class="selo assin">investimentos</span>' : "");
      const corpo = semAlvo
        ? `<div class="meta-sub" style="margin-top:8px">Acumulado: <strong style="color:var(--positivo)">${fmt(m.guardado)}</strong></div>`
        : `<div class="barra-wrap"><div class="barra"><div style="width:${pct}%"></div></div>
           <div class="barra-leg"><span>${fmt(m.guardado)}</span><span>${fmt(m.alvo)} (${pct.toFixed(0)}%)</span></div></div>`;
      return `<div class="meta-card${m.tipoReserva ? " reserva" : ""}">
        <div class="meta-head"><span class="ico-cat">${ico(m.icone)}</span>
          <div style="flex:1"><h3>${esc(m.nome)}${selos}</h3>
          <div class="meta-sub">${prazoTxt}</div></div>
          <span class="acoes"><button data-ed-meta="${m.id}" title="Editar">${ico("pencil")}</button><button data-rm-meta="${m.id}" title="Excluir">${ico("trash-2")}</button></span></div>
        ${corpo}
      </div>`;
    }).join("");
  box.innerHTML = html;
  const bci = $("#btn-criar-invest");
  if (bci) bci.onclick = () => {
    S.metas.push({ id: uid(), nome: "Investimentos", icone: "trending-up", alvo: 0, prazo: null, guardado: 0, tipoInvest: true });
    salvar(); render(); toast("Meta de investimentos criada.");
  };
  const bcr = $("#btn-criar-reserva");
  if (bcr) bcr.onclick = () => {
    S.metas.unshift({ id: uid(), nome: "Reserva de emergência", icone: "life-buoy", alvo: round2(r.essRef * S.config.reservaMeses) || 30000, prazo: null, guardado: 0, tipoReserva: true });
    salvar(); render(); toast("Reserva criada. Ajuste o alvo se quiser.");
  };

  const ap = $("#aportes-mes");
  if (S.metas.length === 0) { ap.innerHTML = vazio("piggy-bank", "Crie uma meta para aportar."); return; }
  const rec = r.valor;
  ap.innerHTML = `<p class="soft">Recomendado: <strong>${fmt(rec)}</strong> · aportado: <strong>${fmt(r.t.aportado)}</strong></p>` +
    S.metas.map(m => {
      const a = mes.aportes.find(x => x.metaId === m.id);
      return `<div class="orc-item"><div class="orc-top"><span class="rotulo">${ico(m.icone)} ${esc(m.nome)}</span>
        <span><input type="number" step="0.01" min="0" style="width:130px;padding:6px 9px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font:inherit"
        data-aporte="${m.id}" value="${a ? a.valor : ""}" placeholder="0,00" ${gravado ? "disabled" : ""}></span></div></div>`;
    }).join("") +
    (gravado ? "" : `<div class="btn-row"><button class="btn" id="btn-aporte-sugerido">Usar sugestão do motor</button></div>`);
  const bas = $("#btn-aporte-sugerido");
  if (bas) bas.onclick = () => {
    mes.aportes = [];
    let resta = rec;
    const res = metaReserva();
    if (res && res.guardado < res.alvo && resta > 0) {
      const v = round2(Math.min(resta, res.alvo - res.guardado));
      mes.aportes.push({ metaId: res.id, valor: v }); resta = round2(resta - v);
    }
    const outras = S.metas.filter(m => !m.tipoReserva && (!(m.alvo > 0) || m.guardado < m.alvo));
    if (outras.length && resta > 0) {
      const v = round2(resta / outras.length);
      outras.forEach(m => mes.aportes.push({ metaId: m.id, valor: v }));
    }
    salvar(); render();
  };
}

/* ---------- Dicas / Config ---------- */
function renderDicas() {
  const dicas = gerarDicas(mesVisto);
  $("#lista-dicas").innerHTML = dicas.length ? dicas.map(dicaHTML).join("") : vazio("circle-check", "Nada a apontar neste mês.");
  const assin = S.custosFixos.filter(f => f.ativo && f.assinatura).sort((a, b) => b.valor - a.valor);
  const tot = assin.reduce((s, f) => s + f.valor, 0);
  $("#painel-assinaturas").innerHTML = assin.length === 0 ? vazio("tv", "Nenhuma assinatura cadastrada.", "fixo", "Adicionar custo fixo") :
    `<ul class="lista">` + assin.map(f => `
      <li><span class="ico-cat">${ico(catById(f.catId).icone)}</span>
      <span class="info"><span class="nome">${esc(f.nome)}</span><span class="det">${fmt(f.valor * 12)}/ano</span></span>
      <span class="valor">${fmt(f.valor)}/mês</span></li>`).join("") +
    `</ul><p class="soft" style="margin-top:10px">Total: <strong>${fmt(tot)}/mês = ${fmt(tot * 12)}/ano</strong></p>`;
}

function renderConfig() {
  $("#cfg-minimo").value = S.config.pctMinimo;
  $("#cfg-premio1").value = S.config.pctPremioReserva;
  $("#cfg-premio2").value = S.config.pctPremioLivre;
  $("#cfg-reserva-meses").value = S.config.reservaMeses;
  $("#cfg-desc-folha").value = S.config.descFolha;

  const grupos = [
    { t: "Custos essenciais", ic: "shield", itens: S.categorias.filter(c => c.tipo === "despesa" && c.essencial) },
    { t: "Custos de estilo de vida", ic: "shopping-bag", itens: S.categorias.filter(c => c.tipo === "despesa" && !c.essencial) },
    { t: "Rendas", ic: "hand-coins", itens: S.categorias.filter(c => c.tipo === "renda") },
  ];
  $("#lista-categorias").innerHTML = grupos.map(g => `
    <div class="cat-grupo">
      <h3>${ico(g.ic)}${g.t}<span class="contagem">${g.itens.length}</span></h3>
      <div class="chips">${g.itens.map(c =>
        `<button class="chip" data-ed-cat="${c.id}" title="${esc(c.nome)}">${ico(c.icone)}<span class="chip-nome">${esc(c.nome)}</span>${c.orcamento > 0 ? `<span class="selo">teto</span>` : ""}</button>`).join("")}
      </div>
    </div>`).join("") +
    `<p class="soft" style="margin:12px 0 0">Toque numa categoria para editar ou excluir.</p>`;
}

/* ================= GRÁFICOS (SVG, paleta validada) ================= */
function tipShow(ev, txt) {
  const t = $("#chart-tooltip");
  t.textContent = txt; t.hidden = false;
  const x = Math.min(ev.clientX + 12, window.innerWidth - 180);
  t.style.left = x + "px"; t.style.top = (ev.clientY - 40) + "px";
}
function tipHide() { $("#chart-tooltip").hidden = true; }

function mesesComDados() {
  const keys = Object.keys(S.meses).filter(k => {
    const m = S.meses[k];
    if (m.status === "gravado") return true;
    return k === mesVisto;
  }).sort();
  return keys.slice(-12);
}
function rotuloCurto(k) { return (MESES_NOME[mesNum(k) - 1].slice(0, 3) + "/" + k.slice(2, 4)).toUpperCase(); }

function renderRelatorios() {
  $("#chart-cat-mes").textContent = labelMes(mesVisto);
  const keys = mesesComDados();
  const dados = keys.map(k => ({ k, t: calcMes(k), gravado: S.meses[k].status === "gravado" }));

  const box1 = $("#chart-renda-custos");
  if (dados.length === 0) { box1.innerHTML = vazio("chart-column", "Sem meses com dados ainda."); }
  else {
    const W = Math.max(320, Math.min(700, dados.length * 74)), H = 230;
    const padL = 8, padB = 26, padT = 14;
    const maxV = Math.max(1, ...dados.map(d => Math.max(d.t.renda, d.t.custos)));
    const grupoW = (W - padL) / dados.length;
    const barW = Math.min(26, grupoW / 2 - 6);
    let g = "";
    for (let i = 1; i <= 3; i++) {
      const y = padT + (H - padB - padT) * (1 - i / 3);
      g += `<line x1="${padL}" x2="${W}" y1="${y}" y2="${y}" stroke="var(--chart-grid)" stroke-width="1"/>`;
    }
    dados.forEach((d, i) => {
      const cx = padL + grupoW * i + grupoW / 2;
      const hR = (d.t.renda / maxV) * (H - padB - padT);
      const hC = (d.t.custos / maxV) * (H - padB - padT);
      const yBase = H - padB;
      g += `<rect class="mark" data-tip="${rotuloCurto(d.k)}
Renda: ${fmt(d.t.renda)}" x="${cx - barW - 1}" y="${yBase - hR}" width="${barW}" height="${Math.max(hR, 1)}" rx="4" fill="var(--s1)"/>`;
      g += `<rect class="mark" data-tip="${rotuloCurto(d.k)}
Custos: ${fmt(d.t.custos)}" x="${cx + 1}" y="${yBase - hC}" width="${barW}" height="${Math.max(hC, 1)}" rx="4" fill="var(--s6)"/>`;
      g += `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--chart-muted)">${rotuloCurto(d.k)}${d.gravado ? "" : "*"}</text>`;
    });
    g += `<line x1="${padL}" x2="${W}" y1="${H - padB}" y2="${H - padB}" stroke="var(--chart-axis)" stroke-width="1"/>`;
    box1.innerHTML = `<div class="chart-box"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Renda e custos por mês">${g}</svg></div>
      <div class="chart-legend"><span class="lg-renda">Renda</span><span class="lg-custos">Custos</span><span style="margin-left:auto">* mês em aberto</span></div>`;
    ligaTooltips(box1);
    const tot = dados.reduce((a, d) => ({ r: a.r + d.t.renda, c: a.c + d.t.custos, s: a.s + d.t.saldo, g: a.g + d.t.aportado }), { r: 0, c: 0, s: 0, g: 0 });
    $("#tabela-renda-custos").innerHTML = `<table><thead><tr><th>Mês</th><th>Renda</th><th>Custos</th><th>Saldo</th><th>Guardado</th></tr></thead><tbody>` +
      dados.map(d => `<tr><td>${rotuloCurto(d.k)}${d.gravado ? "" : " (aberto)"}</td><td>${fmt(d.t.renda)}</td><td>${fmt(d.t.custos)}</td><td>${fmt(Math.max(0, d.t.saldo))}</td><td>${fmt(d.t.aportado)}</td></tr>`).join("") +
      `</tbody><tfoot><tr><td>Total do período</td><td>${fmt(tot.r)}</td><td>${fmt(tot.c)}</td><td>${fmt(Math.max(0, tot.s))}</td><td>${fmt(tot.g)}</td></tr></tfoot></table>`;
  }

  const t = calcMes(mesVisto);
  const cats = Object.entries(t.porCat)
    .map(([cid, v]) => ({ c: catById(cid), v }))
    .filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const box2 = $("#chart-categorias");
  if (cats.length === 0) box2.innerHTML = vazio("receipt", "Nenhum gasto lançado neste mês.");
  else {
    const max = cats[0].v;
    box2.innerHTML = cats.map(x => `
      <div class="catbar-row">
        <span class="cb-label">${ico(x.c.icone)} ${esc(x.c.nome)}</span>
        <span class="cb-bar"><div style="width:${(x.v / max * 100).toFixed(1)}%"></div></span>
        <span class="cb-val">${fmt(x.v)}</span>
      </div>`).join("") +
      `<p class="soft" style="margin-top:6px">Total: <strong>${fmt(t.custos)}</strong> · essenciais ${fmt(t.essenciais)} (${t.custos > 0 ? (t.essenciais / t.custos * 100).toFixed(0) : 0}%)</p>`;
  }

  const box3 = $("#chart-poupanca");
  const serie = dados.filter(d => d.gravado && d.t.renda > 0).map(d => ({ k: d.k, pct: d.t.aportado / d.t.renda * 100 }));
  if (serie.length < 2) box3.innerHTML = vazio("trending-up", "Grave 2 meses para ver a evolução.");
  else {
    const W = Math.max(320, Math.min(700, serie.length * 74)), H = 190;
    const padL = 8, padB = 26, padT = 16;
    const maxP = Math.max(25, ...serie.map(s => s.pct));
    const stepX = (W - padL - 20) / Math.max(1, serie.length - 1);
    const px = i => padL + 10 + stepX * i;
    const py = v => padT + (H - padB - padT) * (1 - v / maxP);
    let g = "";
    [0.25, 0.5, 0.75, 1].forEach(f => {
      g += `<line x1="${padL}" x2="${W}" y1="${py(maxP * f)}" y2="${py(maxP * f)}" stroke="var(--chart-grid)" stroke-width="1"/>`;
      g += `<text x="${W - 2}" y="${py(maxP * f) - 3}" text-anchor="end" font-size="9" fill="var(--chart-muted)">${Math.round(maxP * f)}%</text>`;
    });
    g += `<polyline fill="none" stroke="var(--s1)" stroke-width="2" points="${serie.map((s, i) => px(i) + "," + py(s.pct)).join(" ")}"/>`;
    serie.forEach((s, i) => {
      g += `<circle class="mark" data-tip="${rotuloCurto(s.k)}
Poupança: ${s.pct.toFixed(1)}% da renda" cx="${px(i)}" cy="${py(s.pct)}" r="4.5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/>`;
      g += `<text x="${px(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--chart-muted)">${rotuloCurto(s.k)}</text>`;
    });
    g += `<line x1="${padL}" x2="${W}" y1="${H - padB}" y2="${H - padB}" stroke="var(--chart-axis)" stroke-width="1"/>`;
    box3.innerHTML = `<div class="chart-box"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Taxa de poupança por mês">${g}</svg></div>`;
    ligaTooltips(box3);
  }

  /* ---- 4. evolução do guardado (patrimônio das metas) ---- */
  const box4 = $("#chart-patrimonio");
  const pts = Object.keys(S.meses)
    .filter(k => S.meses[k].status === "gravado" && S.meses[k].snapshot && S.meses[k].snapshot.guardadoTotal != null)
    .sort().slice(-12).map(k => ({ k, v: S.meses[k].snapshot.guardadoTotal }));
  if (pts.length < 2) box4.innerHTML = vazio("piggy-bank", "Grave 2 meses para ver seu dinheiro crescer.");
  else {
    const W = Math.max(320, Math.min(700, pts.length * 74)), H = 190;
    const padL = 8, padB = 26, padT = 16;
    const maxV = Math.max(1, ...pts.map(p => p.v)) * 1.1;
    const stepX = (W - padL - 20) / Math.max(1, pts.length - 1);
    const px = i => padL + 10 + stepX * i;
    const py = v => padT + (H - padB - padT) * (1 - v / maxV);
    let g = "";
    [0.33, 0.66, 1].forEach(f => {
      g += `<line x1="${padL}" x2="${W}" y1="${py(maxV * f)}" y2="${py(maxV * f)}" stroke="var(--chart-grid)" stroke-width="1"/>`;
    });
    g += `<polyline fill="none" stroke="var(--s1)" stroke-width="2" points="${pts.map((p, i) => px(i) + "," + py(p.v)).join(" ")}"/>`;
    pts.forEach((p, i) => {
      g += `<circle class="mark" data-tip="${rotuloCurto(p.k)}
Guardado: ${fmt(p.v)}" cx="${px(i)}" cy="${py(p.v)}" r="4.5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/>`;
      g += `<text x="${px(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--chart-muted)">${rotuloCurto(p.k)}</text>`;
    });
    g += `<line x1="${padL}" x2="${W}" y1="${H - padB}" y2="${H - padB}" stroke="var(--chart-axis)" stroke-width="1"/>`;
    box4.innerHTML = `<div class="chart-box"><svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Evolução do total guardado">${g}</svg></div>`;
    ligaTooltips(box4);
  }

  /* ---- 5. comparativo ano a ano (aparece com 2+ anos) ---- */
  const anos = {};
  Object.keys(S.meses).filter(k => S.meses[k].status === "gravado" && S.meses[k].snapshot).forEach(k => {
    const y = k.slice(0, 4); const tt = S.meses[k].snapshot.tot;
    anos[y] = anos[y] || { r: 0, c: 0, g: 0, n: 0 };
    anos[y].r += tt.renda; anos[y].c += tt.custos; anos[y].g += tt.aportado; anos[y].n++;
  });
  const ys = Object.keys(anos).sort();
  $("#painel-anos").innerHTML = ys.length < 2 ? "" : `
    <div class="panel"><h2>${ico("calendar")}Ano a ano</h2>
    <div class="table-scroll"><table>
      <thead><tr><th>Ano</th><th>Meses</th><th>Renda</th><th>Custos</th><th>Guardado</th></tr></thead>
      <tbody>${ys.map(y => `<tr><td>${y}</td><td>${anos[y].n}</td><td>${fmt(anos[y].r)}</td><td>${fmt(anos[y].c)}</td><td>${fmt(anos[y].g)}</td></tr>`).join("")}</tbody>
    </table></div></div>`;
}
function ligaTooltips(root) {
  root.querySelectorAll(".mark").forEach(m => {
    m.addEventListener("mousemove", ev => tipShow(ev, m.dataset.tip));
    m.addEventListener("mouseleave", tipHide);
    m.addEventListener("click", ev => { tipShow(ev, m.dataset.tip); setTimeout(tipHide, 2200); });
  });
}

/* ================= AÇÕES / EVENTOS ================= */
function camposCategoria(tipo) {
  return S.categorias.filter(c => c.tipo === tipo).map(c => ({ valor: c.id, label: c.nome }));
}

document.addEventListener("click", ev => {
  const b = ev.target.closest("button, input.chk-pago");
  if (!b) return;
  const mes = getMes(mesVisto);
  const d = b.dataset;

  if (d.abrir) {
    const abre = { renda: dlgRenda, gasto: dlgGasto, fixo: dlgFixo, meta: dlgMeta, cat: dlgCategoria, salario: dlgSalario, conta: dlgConta }[d.abrir];
    if (abre) abre(null);
    return;
  }
  if (d.telaIr) { trocaTela(d.telaIr); return; }
  if (d.pago !== undefined && b.type === "checkbox") {
    mes.fixosStatus[d.pago] = mes.fixosStatus[d.pago] || {};
    mes.fixosStatus[d.pago].pago = b.checked;
    const fx = S.custosFixos.find(f => f.id === d.pago);
    if (b.checked && fx && fx.variavel) {
      const st = mes.fixosStatus[d.pago];
      abrirDialog("Valor de " + fx.nome + " neste mês", [
        { id: "valor", label: "Valor pago (R$)", tipo: "number", obrig: true },
      ], out => {
        st.valor = Math.max(0, out.valor || 0);
        salvar(); render();
      }, { valor: st.valor != null ? st.valor : fx.valor });
    }
    salvar(); render(); return;
  }
  if (d.rmRenda) { mes.rendas = mes.rendas.filter(r => r.id !== d.rmRenda); salvar(); render(); }
  if (d.rmGasto) { mes.gastos = mes.gastos.filter(g => g.id !== d.rmGasto); salvar(); render(); }
  if (d.rmFixo) { if (confirm("Remover este custo fixo de todos os meses em aberto?")) { S.custosFixos = S.custosFixos.filter(f => f.id !== d.rmFixo); salvar(); render(); } }
  if (d.rmMeta) { if (confirm("Excluir esta meta?")) { S.metas = S.metas.filter(m => m.id !== d.rmMeta); salvar(); render(); } }
  if (d.rmCat) {
    const emUso = S.custosFixos.some(f => f.catId === d.rmCat) ||
      Object.values(S.meses).some(m => m.gastos.some(g => g.catId === d.rmCat) || m.rendas.some(r => r.catId === d.rmCat));
    if (emUso) { toast("Categoria em uso, não dá para excluir."); return; }
    S.categorias = S.categorias.filter(c => c.id !== d.rmCat); salvar(); render();
  }
  if (d.edConta) dlgConta(S.contas.find(c => c.id === d.edConta));
  if (d.edRenda) dlgRenda(mes.rendas.find(r => r.id === d.edRenda));
  if (d.edGasto) dlgGasto(mes.gastos.find(g => g.id === d.edGasto));
  if (d.edFixo) dlgFixo(S.custosFixos.find(f => f.id === d.edFixo));
  if (d.edMeta) dlgMeta(S.metas.find(m => m.id === d.edMeta));
  if (d.edCat) dlgCategoria(S.categorias.find(c => c.id === d.edCat));
});

function dlgSalario() {
  const mes = getMes(mesVisto);
  if (mes.status === "gravado") return;
  const calc = calculaSalario(S.config.salBase, mes.sal.pctMeta, mesNum(mesVisto), S.config.descFolha);
  abrirDialog("Registrar salário de " + labelMes(mesVisto), [
    { id: "pct", label: "% da meta no mês", tipo: "number", step: "1", min: 0 },
    { id: "valor", label: "Valor recebido (R$), ajuste se for diferente (férias, etc.)", tipo: "number", obrig: true },
  ], out => {
    mes.sal.pctMeta = out.pct || 0;
    const calcNovo = calculaSalario(S.config.salBase, mes.sal.pctMeta, mesNum(mesVisto), S.config.descFolha);
    mes.sal.valorReal = Math.abs(out.valor - calcNovo.liquido) < 0.005 ? null : Math.max(0, out.valor);
    mes.sal.registrado = true;
    salvar(); render(); toast("Salário registrado.");
  }, { pct: mes.sal.pctMeta, valor: mes.sal.valorReal != null ? mes.sal.valorReal : calc.liquido },
  mes.sal.registrado ? () => {
    if (confirm("Remover o registro do salário deste mês?")) {
      mes.sal.registrado = false; mes.sal.valorReal = null;
      salvar(); render(); toast("Registro removido.");
    }
  } : null);
}

function dlgRenda(r) {
  abrirDialog(r ? "Editar renda" : "Nova renda extra", [
    { id: "desc", label: "Descrição", obrig: true, placeholder: "ex.: Reembolso viagem SP" },
    { id: "valor", label: "Valor (R$)", tipo: "number", obrig: true },
    { id: "catId", label: "Categoria", tipo: "select", opcoes: camposCategoria("renda") },
  ], out => {
    const mes = getMes(mesVisto);
    if (r) Object.assign(r, out);
    else mes.rendas.push({ id: uid(), ...out });
    salvar(); render();
  }, r || { catId: "cat-reembolso" });
}
function dlgGasto(g) {
  abrirDialog(g ? "Editar gasto" : "Novo gasto avulso", [
    { id: "desc", label: "Descrição", obrig: true, placeholder: "ex.: mercado da semana" },
    { id: "valor", label: "Valor (R$)", tipo: "number", obrig: true },
    { id: "catId", label: "Categoria", tipo: "select", opcoes: camposCategoria("despesa") },
    { id: "dia", label: "Dia do mês", tipo: "number", step: "1", min: 1 },
  ], out => {
    out.dia = out.dia ? Math.min(31, Math.round(out.dia)) : null;
    const mes = getMes(mesVisto);
    if (g) Object.assign(g, out);
    else mes.gastos.push({ id: uid(), ...out });
    salvar(); render();
  }, g || { dia: new Date().getDate() });
}
function dlgFixo(f) {
  abrirDialog(f ? "Editar custo fixo" : "Novo custo fixo", [
    { id: "nome", label: "Nome", obrig: true, placeholder: "ex.: Aluguel, Netflix, Internet" },
    { id: "valor", label: "Valor mensal (R$)", tipo: "number", obrig: true },
    { id: "catId", label: "Categoria", tipo: "select", opcoes: camposCategoria("despesa") },
    { id: "dia", label: "Dia de vencimento", tipo: "number", step: "1", min: 1 },
    { id: "assinatura", label: "É assinatura (streaming, app, clube...)", tipo: "check" },
    { id: "lembrete", label: "Lembrar de pagar (aparece em Contas a pagar)", tipo: "check" },
    { id: "variavel", label: "Valor varia todo mês (luz, água...): pergunta ao pagar", tipo: "check" },
  ], out => {
    out.dia = out.dia ? Math.min(31, Math.round(out.dia)) : null;
    if (f) Object.assign(f, out);
    else S.custosFixos.push({ id: uid(), ativo: true, ...out });
    salvar(); render();
  }, f || { catId: "contas", lembrete: true });
}
function dlgMeta(m) {
  abrirDialog(m ? "Editar meta" : "Nova meta", [
    { id: "nome", label: "Nome", obrig: true, placeholder: "ex.: Viagem, Carro, Reserva" },
    { id: "icone", label: "Ícone", tipo: "icone", padrao: "target" },
    { id: "alvo", label: "Valor alvo (R$), deixe 0 para só acumular", tipo: "number" },
    { id: "guardado", label: "Já guardado (R$)", tipo: "number" },
    { id: "prazo", label: "Prazo (opcional)", tipo: "month" },
    { id: "tipoReserva", label: "É a reserva de emergência", tipo: "check" },
    { id: "tipoInvest", label: "É investimentos (acumular sem alvo)", tipo: "check" },
  ], out => {
    out.prazo = out.prazo || null;
    out.guardado = Math.max(0, out.guardado || 0);
    out.alvo = Math.max(0, out.alvo || 0);
    if (out.tipoReserva) S.metas.forEach(x => { if (!m || x.id !== m.id) x.tipoReserva = false; });
    if (m) Object.assign(m, out);
    else S.metas.push({ id: uid(), ...out });
    salvar(); render();
  }, m || {});
}
function dlgCategoria(c) {
  abrirDialog(c ? "Editar categoria" : "Nova categoria", [
    { id: "nome", label: "Nome", obrig: true },
    { id: "icone", label: "Ícone", tipo: "icone", padrao: "package" },
    { id: "tipo", label: "Tipo", tipo: "select", opcoes: [{ valor: "despesa", label: "Despesa" }, { valor: "renda", label: "Renda" }] },
    { id: "essencial", label: "É custo essencial (entra no cálculo do piso e da reserva)", tipo: "check" },
    { id: "orcamento", label: "Teto mensal (R$, 0 = sem teto)", tipo: "number" },
  ], out => {
    out.orcamento = out.orcamento > 0 ? out.orcamento : null;
    if (c) Object.assign(c, out);
    else S.categorias.push({ id: uid(), ...out });
    salvar(); render();
  }, c || {}, c ? () => {
    const emUso = S.custosFixos.some(f => f.catId === c.id) ||
      Object.values(S.meses).some(m => m.gastos.some(g => g.catId === c.id) || m.rendas.some(r => r.catId === c.id));
    if (emUso) { toast("Categoria em uso, não dá para excluir."); return; }
    if (confirm("Excluir a categoria " + c.nome + "?")) {
      S.categorias = S.categorias.filter(x => x.id !== c.id); salvar(); render();
    }
  } : null);
}

/* ---------- listeners fixos ---------- */
$("#btn-add-renda").onclick = () => dlgRenda(null);
$("#btn-add-gasto").onclick = () => dlgGasto(null);
$("#btn-add-fixo").onclick = () => dlgFixo(null);
$("#btn-add-meta").onclick = () => dlgMeta(null);
$("#btn-add-cat").onclick = () => dlgCategoria(null);
$("#btn-add-conta").onclick = () => dlgConta(null);

$("#mes-prev").onclick = () => { mesVisto = addMeses(mesVisto, -1); render(); };
$("#mes-next").onclick = () => { mesVisto = addMeses(mesVisto, 1); render(); };

document.querySelectorAll(".nav-lateral button").forEach(b => b.onclick = () => trocaTela(b.dataset.tela));
$("#btn-menu").onclick = abreDrawer;
$("#overlay").onclick = fechaDrawer;

$("#btn-tema").onclick = () => {
  S.config.tema = S.config.tema === "escuro" ? "claro" : "escuro";
  salvar(); aplicarTema();
};

/* salário (mês aberto) */
$("#sal-base").addEventListener("input", e => { S.config.salBase = Number(e.target.value); salvar(); render(); });
$("#sal-pct").addEventListener("input", e => { getMes(mesVisto).sal.pctMeta = Number(e.target.value) || 0; salvar(); render(); });

/* aportes */
document.addEventListener("input", ev => {
  const inp = ev.target.closest("[data-aporte]");
  if (!inp) return;
  const mes = getMes(mesVisto);
  const v = parseFloat(inp.value) || 0;
  const id = inp.dataset.aporte;
  mes.aportes = mes.aportes.filter(a => a.metaId !== id);
  if (v > 0) mes.aportes.push({ metaId: id, valor: v });
  salvar();
});

/* config */
[["cfg-minimo", "pctMinimo"], ["cfg-premio1", "pctPremioReserva"], ["cfg-premio2", "pctPremioLivre"],
 ["cfg-reserva-meses", "reservaMeses"], ["cfg-desc-folha", "descFolha"]].forEach(([id, key]) => {
  $("#" + id).addEventListener("change", e => { S.config[key] = parseFloat(e.target.value) || 0; salvar(); render(); });
});

/* backup */
$("#btn-export").onclick = () => {
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "meubolso-backup-" + chaveHoje() + ".json";
  a.click(); URL.revokeObjectURL(a.href);
};
$("#btn-csv").onclick = () => {
  const keys = Object.keys(S.meses).filter(k => S.meses[k].status === "gravado" && S.meses[k].snapshot).sort();
  if (!keys.length) { toast("Grave um mês primeiro."); return; }
  const num = v => (Math.round((v || 0) * 100) / 100).toFixed(2).replace(".", ",");
  let csv = "﻿Mês;Renda;Custos;Saldo;Guardado no mês;Total guardado\n";
  keys.forEach(k => {
    const s = S.meses[k].snapshot, tt = s.tot;
    csv += `${labelMes(k)};${num(tt.renda)};${num(tt.custos)};${num(Math.max(0, tt.saldo))};${num(tt.aportado)};${num(s.guardadoTotal)}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "meubolso-meses.csv"; a.click();
  URL.revokeObjectURL(a.href);
};
$("#btn-import").onclick = () => $("#file-import").click();
$("#file-import").addEventListener("change", async ev => {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    const st = JSON.parse(await file.text());
    if (!st || (st.version !== 1 && st.version !== 2) || !st.config || !st.categorias) throw new Error("formato inválido");
    if (confirm("Importar backup? Isso SUBSTITUI os dados atuais deste aparelho.")) {
      S = migrar(st); salvar(); aplicarTema(); render(); toast("Backup importado.");
    }
  } catch (e) { alert("Arquivo de backup inválido: " + e.message); }
  ev.target.value = "";
});
$("#btn-reset").onclick = () => {
  if (confirm("Apagar TODOS os dados deste aparelho? Não tem volta (exporte um backup antes).") &&
      confirm("Confirma mesmo? Última chance.")) {
    S = estadoDefault(); salvar(); aplicarTema(); render(); toast("Tudo zerado.");
  }
};

/* ================= PWA ================= */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

/* ================= START ================= */
document.querySelectorAll("[data-ic]").forEach(e => e.insertAdjacentHTML("afterbegin", ico(e.dataset.ic)));
aplicarTema();
salvar(); // persiste migração, se houve
render();
