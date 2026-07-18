"use strict";
/* ============================================================
   HOLERITE.JS — leitor de demonstrativos de pagamento (ADP/AZZAS)
   Parser de PDF próprio, sem biblioteca externa: os demonstrativos
   usam FlateDecode + fonte padrão + texto em operadores Td/Tj.
   Funciona no navegador (DecompressionStream) e no Node (inflate
   injetado pelo verificar.mjs). O PDF nunca é salvo: só os dados.
   Validado no corpus real: 67 demonstrativos de jan/2022 a jun/2026.
   ============================================================ */
(function (raiz) {

  /* ---------- inflate ---------- */
  async function inflateNavegador(bytes) {
    const tenta = async b => {
      const ds = new DecompressionStream("deflate");
      const resp = new Response(new Blob([b]).stream().pipeThrough(ds));
      return new Uint8Array(await resp.arrayBuffer());
    };
    try { return await tenta(bytes); }
    catch (e) { // alguns streams têm bytes soltos no fim
      for (let corte = 1; corte <= 4; corte++) {
        try { return await tenta(bytes.subarray(0, bytes.length - corte)); } catch (e2) { /* tenta de novo */ }
      }
      throw e;
    }
  }

  const dec1252 = typeof TextDecoder !== "undefined" ? new TextDecoder("windows-1252") : null;
  const paraTexto = bytes => dec1252 ? dec1252.decode(bytes) : Buffer.from(bytes).toString("latin1");
  const num = s => parseFloat(String(s).replace(/\./g, "").replace(",", "."));

  /* ---------- 1. extrai os fragmentos de texto do PDF ---------- */
  async function fragmentosDoPDF(bytes, inflate) {
    const inf = inflate || inflateNavegador;
    const raw = paraTexto(bytes);
    // localiza streams FlateDecode e usa o primeiro que contém texto (página 1)
    let conteudo = null;
    const re = /stream\r?\n/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      const ini = m.index + m[0].length;
      const fim = raw.indexOf("endstream", ini);
      if (fim < 0) continue;
      let dados = bytes.subarray(ini, fim);
      while (dados.length && (dados[dados.length - 1] === 0x0A || dados[dados.length - 1] === 0x0D))
        dados = dados.subarray(0, dados.length - 1);
      try {
        const txt = paraTexto(await inf(dados));
        if (txt.includes("BT") && txt.includes("Tj")) { conteudo = txt; break; }
      } catch (e) { /* stream que não é de conteúdo */ }
    }
    if (!conteudo) throw new Error("não parece um demonstrativo em PDF (sem stream de texto)");

    // percorre os operadores de texto acumulando posição (x, y)
    const frags = [];
    let x = 0, y = 0;
    const reOp = /(-?[\d.]+) (-?[\d.]+) Td|(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) Tm|\(((?:[^()\\]|\\.)*)\)Tj|\bBT\b/g;
    let op;
    while ((op = reOp.exec(conteudo)) !== null) {
      if (op[0] === "BT") { x = 0; y = 0; }
      else if (op[1] !== undefined) { x += parseFloat(op[1]); y += parseFloat(op[2]); }
      else if (op[3] !== undefined) { x = parseFloat(op[7]); y = parseFloat(op[8]); }
      else if (op[9] !== undefined) {
        const s = op[9].replace(/\\([0-7]{1,3}|.)/g, (t, e) =>
          /^[0-7]+$/.test(e) ? String.fromCharCode(parseInt(e, 8)) :
          e === "n" ? "\n" : e === "r" ? "\r" : e === "t" ? "\t" : e);
        if (s.trim()) frags.push({ x, y, s: s.trim() });
      }
    }
    return frags;
  }

  /* ---------- 2. monta linhas (mesmo y) e a tabela de verbas ---------- */
  function linhasDe(frags) {
    // fragmentos na mesma linha visual podem variar 1 a 2 pt de y (troca de
    // fonte no meio da linha), então agrupa por proximidade, não por y exato
    const orden = frags.slice().sort((a, b) => b.y - a.y || a.x - b.x);
    const grupos = [];
    for (const f of orden) {
      const g = grupos[grupos.length - 1];
      if (g && Math.abs(g.y - f.y) <= 2.5) g.fs.push(f);
      else grupos.push({ y: f.y, fs: [f] });
    }
    return grupos.map(g => g.fs.sort((a, b) => a.x - b.x));
  }

  /* ---------- 3. interpreta o demonstrativo ---------- */
  const CODS_FGTS = new Set(["2500", "2505"]);
  const CODS_INSS = new Set(["2000", "2002", "2003"]);
  const CODS_IRRF = new Set(["2004", "2005", "2012", "2014"]);

  async function lerHolerite(bytes, inflate) {
    const frags = await fragmentosDoPDF(bytes, inflate);
    const linhas = linhasDe(frags);
    const textoLinhas = linhas.map(fs => fs.map(f => f.s).join(" "));
    const texto = textoLinhas.join("\n");
    const erros = [];

    // mês/ano de referência: valor mais frequente no cabeçalho
    const votos = {};
    for (const m of texto.matchAll(/\b(\d{2}) \/ (\d{4})\b/g))
      votos[m[2] + "-" + m[1]] = (votos[m[2] + "-" + m[1]] || 0) + 1;
    let mesRef = Object.keys(votos).sort((a, b) => votos[b] - votos[a])[0] || null;
    if (!mesRef) erros.push("mês/ano não encontrado");

    // valor líquido: linha do recibo de quitação
    const recibo = texto.match(/R\$ ?([\d.,]+) RELATIVO/i);
    const liquido = recibo ? num(recibo[1]) : null;
    if (liquido == null) erros.push("valor do recibo não encontrado");

    // colunas da tabela de verbas: limites vêm do próprio cabeçalho
    const xDe = rotulo => { const f = frags.find(g => g.s.startsWith(rotulo)); return f ? f.x : null; };
    const xRef = xDe("REFERÊNCIA"), xVenc = xDe("VENCIMENTOS"), xDesc = xDe("DESCONTOS"), xDia = xDe("DIA");
    if (xVenc == null || xDesc == null) erros.push("cabeçalho da tabela de verbas não encontrado");

    // itens: linhas que começam com código de verba
    const itens = [];
    for (const fs of linhas) {
      const cod = fs[0] && /^\d{3,4}$/.test(fs[0].s) ? fs[0].s : null;
      if (!cod) continue;
      const it = { cod, desc: "", ref: null, vencimento: null, desconto: null };
      for (const f of fs.slice(1)) {
        if (xDia != null && f.x >= xDia - 8) break; // coluna DIA BATIDAS: fora da verba
        if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(f.s)) {
          const v = num(f.s);
          if (xDesc != null && f.x >= xDesc - 30) it.desconto = v;
          else if (xVenc != null && f.x >= xVenc - 30) it.vencimento = v;
          else it.ref = v;
        } else if (it.vencimento == null && it.desconto == null) {
          it.desc += (it.desc ? " " : "") + f.s;
        }
      }
      if (it.desc) itens.push(it);
    }
    if (itens.length === 0) erros.push("nenhuma verba encontrada");

    // consolida
    let vencimentos = 0, descontos = 0, inss = 0, irrf = 0, fgts = 0, premio = 0, base = 0, adtoFerias = 0;
    for (const it of itens) {
      if (CODS_FGTS.has(it.cod)) { fgts += it.vencimento || it.desconto || 0; continue; }
      vencimentos += it.vencimento || 0;
      descontos += it.desconto || 0;
      if (CODS_INSS.has(it.cod)) inss += it.desconto || 0;
      if (CODS_IRRF.has(it.cod)) irrf += it.desconto || 0;
      if (it.cod === "4249") premio += it.vencimento || 0;
      if (it.cod === "001") base += it.vencimento || 0;
      if (it.cod === "2101") adtoFerias += it.desconto || 0;
    }
    const r2 = v => Math.round(v * 100) / 100;
    vencimentos = r2(vencimentos); descontos = r2(descontos);
    const outros = r2(descontos - inss - irrf);

    // prova mecânica: vencimentos - descontos tem de bater com o recibo
    if (liquido != null && Math.abs(vencimentos - descontos - liquido) > 0.011)
      erros.push(`soma não fecha: vencimentos ${vencimentos} - descontos ${descontos} != líquido ${liquido}`);

    // tipo do documento, pelos códigos de verba
    const cods = new Set(itens.map(i => i.cod));
    let tipo = "salario";
    if (cods.has("1955")) tipo = "plr";
    else if (cods.has("800") || (mesRef && mesRef.endsWith("-13"))) tipo = "13-salario-integral";
    else if (cods.has("750")) tipo = "13-salario-adiantamento";
    else if (cods.has("2101") || cods.has("005")) tipo = "salario-ferias";
    else if (itens.length <= 3) tipo = "dissidio-retroativo";
    if (mesRef && mesRef.endsWith("-13")) mesRef = mesRef.slice(0, 4) + "-12"; // 13º integral é pago em dezembro

    return { tipo, mes: mesRef, liquido, vencimentos, descontos, inss: r2(inss), irrf: r2(irrf),
             outros, fgts: r2(fgts), premio: r2(premio), base: r2(base), adtoFerias: r2(adtoFerias),
             itens, valido: erros.length === 0, erros };
  }

  raiz.Holerite = { lerHolerite };
})(typeof window !== "undefined" ? window : globalThis);
