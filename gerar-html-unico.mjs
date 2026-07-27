#!/usr/bin/env node
/* GERAR HTML ÚNICO - empacota o Meu Bolso num arquivo só (meu-bolso.html na
   raiz do projeto), para mandar por WhatsApp/e-mail/pendrive e abrir com dois
   cliques, sem servidor e sem internet.
   Uso: node gerar-html-unico.mjs   (regerar a cada release; a auditoria cobra)
   Limites documentados no manual, capítulo 08 seção 8. */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = dirname(fileURLToPath(import.meta.url));
const ler = f => readFileSync(join(RAIZ, f), "utf8");

const hash = createHash("sha256");
for (const f of ["index.html", "app.css", "app.js", "icons.js", "holerite.js", "extrato.js"])
  hash.update(readFileSync(join(RAIZ, f)));
hash.update(readFileSync(join(RAIZ, "fonts/InterVariable.woff2")));
const marca = hash.digest("hex").slice(0, 16);

let html = ler("index.html");

// CSS embutido, com a fonte Inter virando data URI (o arquivo é autossuficiente)
const fonte = readFileSync(join(RAIZ, "fonts/InterVariable.woff2")).toString("base64");
const css = ler("app.css").replace(/url\((?:"|')?[^)"']*InterVariable\.woff2(?:"|')?\)/,
  () => `url("data:font/woff2;base64,${fonte}")`);
html = html.replace(/<link rel="stylesheet"[^>]*>/, () => `<style>\n${css}\n</style>`);

// manifest e ícone de instalação não fazem sentido em arquivo local
html = html.replace(/^.*rel="manifest".*\r?\n/m, "");
html = html.replace(/^.*rel="apple-touch-icon".*\r?\n/m, "");

// scripts embutidos na mesma ordem do index (</script> em string vira <\/script>)
const antiFecho = s => s.replace(/<\/script/gi, "<\\/script");
for (const js of ["icons.js", "holerite.js", "extrato.js", "app.js"])
  html = html.replace(new RegExp(`<script src="${js}[^"]*"></script>`),
    () => `<script>\n${antiFecho(ler(js))}\n</script>`);

html = html.replace("</title>", " (arquivo único)</title>");
html = "<!-- GERADO por app/gerar-html-unico.mjs. NÃO editar na mão. marca:" + marca + " -->\n" + html;

if (/src="[a-z]/.test(html)) { console.error("ERRO: sobrou referência externa no arquivo único"); process.exit(1); }
const SAIDA = join(RAIZ, "..", "meu-bolso.html");
writeFileSync(SAIDA, html);
console.log("gerado: " + SAIDA + " (" + Math.round(html.length / 1024) + " KB, marca " + marca + ")");
