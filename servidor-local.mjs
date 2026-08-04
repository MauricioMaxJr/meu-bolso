// servidor-local.mjs: servidor estático para testar o MAXBOLSO no navegador.
// Uso: node app/servidor-local.mjs  ->  http://localhost:8321
// Serve a pasta app/ e, se E:\Holerites existir, expõe os PDFs em /holerites/
// (GET /holerites/ lista os nomes em JSON) para testes do importador.
// Sem dependências. Vive no repositório (ferramenta de teste); fica fora do
// zip de deploy e do pré-cache do PWA.
import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(fileURLToPath(import.meta.url), "..");
const HOLERITES = "E:\\Holerites";
const PORTA = 8321;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};

function dentroDe(base, alvo) {
  const n = normalize(alvo);
  return n === base || n.startsWith(base + sep);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORTA}`);
    let caminho = decodeURIComponent(url.pathname);

    if (caminho === "/holerites" || caminho === "/holerites/") {
      const nomes = await readdir(HOLERITES);
      res.writeHead(200, { "Content-Type": MIME[".json"] });
      res.end(JSON.stringify(nomes.filter((n) => n.toLowerCase().endsWith(".pdf"))));
      return;
    }

    let base = RAIZ;
    if (caminho.startsWith("/holerites/")) {
      base = HOLERITES;
      caminho = caminho.slice("/holerites/".length);
    } else if (caminho === "/") {
      caminho = "index.html";
    } else {
      caminho = caminho.slice(1);
    }

    const arquivo = join(base, caminho);
    if (!dentroDe(base, arquivo)) {
      res.writeHead(403);
      res.end("Proibido");
      return;
    }
    if (!(await stat(arquivo).catch(() => null))?.isFile()) {
      res.writeHead(404);
      res.end("Não encontrado");
      return;
    }

    const ext = arquivo.slice(arquivo.lastIndexOf(".")).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(await readFile(arquivo));
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
}).listen(PORTA, () => {
  console.log(`MAXBOLSO em http://localhost:${PORTA} (servindo ${RAIZ})`);
});
