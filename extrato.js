/* MAXBOLSO - leitor de extrato bancário (OFX e CSV), 100% local.
   O arquivo não é guardado: vira transações {data:"AAAA-MM-DD", desc, valor} e morre.
   valor negativo = débito (vira gasto na importação); positivo = crédito (ignorado). */
(function () {
  "use strict";
  const norm = s => s.replace(/\s+/g, " ").trim();

  function lerOFX(txt) {
    const trans = [];
    for (const b of txt.split(/<STMTTRN>/i).slice(1)) {
      const pega = tag => { const m = b.match(new RegExp("<" + tag + ">([^<\\r\\n]+)", "i")); return m ? norm(m[1]) : null; };
      const dt = pega("DTPOSTED"), vl = pega("TRNAMT");
      const desc = pega("MEMO") || pega("NAME") || "Lançamento";
      if (!dt || !vl) continue;
      const m = dt.match(/^(\d{4})(\d{2})(\d{2})/);
      const valor = parseFloat(vl.replace(",", "."));
      if (!m || !isFinite(valor) || valor === 0) continue;
      trans.push({ data: m[1] + "-" + m[2] + "-" + m[3], desc, valor });
    }
    return trans;
  }

  function lerCSV(txt) {
    const linhas = txt.split(/\r?\n/).filter(l => l.trim());
    if (linhas.length < 2) return [];
    const sep = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ";" : ",";
    const cab = linhas[0].toLowerCase().split(sep).map(norm);
    const iData = cab.findIndex(c => /data|dia/.test(c));
    const iValor = cab.findIndex(c => /valor|quantia|montante|amount/.test(c));
    const iDesc = cab.findIndex(c => /descri|hist|lan[cç]amento|estabelecimento|memo|title/.test(c));
    if (iData < 0 || iValor < 0) return [];
    const trans = [];
    for (const l of linhas.slice(1)) {
      const c = l.split(sep);
      if (c.length <= Math.max(iData, iValor)) continue;
      const dm = norm(c[iData] || "").match(/(\d{4})-(\d{2})-(\d{2})|(\d{2})\/(\d{2})\/(\d{4})/);
      const vtxt = norm(c[iValor] || "").replace(/R\$|\s/g, "");
      const valor = parseFloat(vtxt.includes(",") ? vtxt.replace(/\./g, "").replace(",", ".") : vtxt);
      if (!dm || !isFinite(valor) || valor === 0) continue;
      const data = dm[1] ? dm[1] + "-" + dm[2] + "-" + dm[3] : dm[6] + "-" + dm[5] + "-" + dm[4];
      const desc = iDesc >= 0 && c[iDesc] ? norm(c[iDesc]) : "Lançamento";
      trans.push({ data, desc, valor });
    }
    return trans;
  }

  function lerExtrato(texto) {
    if (typeof texto !== "string" || !texto.trim())
      return { valido: false, transacoes: [], erros: ["arquivo vazio"] };
    let trans = [];
    if (/<OFX|<STMTTRN/i.test(texto)) trans = lerOFX(texto);
    else if (/[;,]/.test(texto.split(/\r?\n/)[0] || "")) trans = lerCSV(texto);
    else return { valido: false, transacoes: [], erros: ["não parece OFX nem CSV de banco"] };
    if (!trans.length) return { valido: false, transacoes: [], erros: ["nenhuma transação reconhecida no arquivo"] };
    return { valido: true, transacoes: trans, erros: [] };
  }

  const api = { lerExtrato };
  if (typeof window !== "undefined") window.Extrato = api;
  if (typeof globalThis !== "undefined") globalThis.Extrato = api;
})();
