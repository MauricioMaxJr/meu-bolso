# Meu Bolso

App pessoal de finanças (PWA). Dados 100% locais no aparelho: sem servidor,
sem analytics, sem rede além do próprio host.

- **Visão e estado dos sistemas**: [docs/VISAO.md](docs/VISAO.md)
- **Manual completo** (recria o produto só de ler): [docs/manual/](docs/manual/)
- **Ordem de trabalho**: [docs/ROADMAP.md](docs/ROADMAP.md)

## Verificação (obrigatória antes de qualquer commit)

```
node verificar.mjs          # VERDE ou VERMELHO (o hook pre-commit bloqueia VERMELHO)
node verificar.mjs --selar  # regrava docs/canonicos.json após mudança intencional
```

Cobre: golden master do motor de salário, Livro-Razão de números canônicos,
paridade com a calculadora original, ícones, IDs do DOM, encoding, pré-cache e
versionamento do service worker, e consistência dos docs com o código.

## Deploy

Zipar SOMENTE os arquivos de runtime (index.html, app.js, app.css, icons.js,
sw.js, manifest.webmanifest, fonts/, icons/) e subir no host estático.
Antes de zipar: bump do `VERSAO` em sw.js + `?v=` no index.html + `--selar`.
