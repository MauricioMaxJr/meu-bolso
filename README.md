# MAXBOLSO

App pessoal de finanças (PWA), um produto MAXWORKS. Dados 100% locais no
aparelho: sem servidor, sem analytics, sem rede além do próprio host.

A roupagem da marca (cores claro e escuro, Inter embutida, caixa alta, botão de
tema e selo do rodapé) vem do kit MAXWORKS copiado em `kit/`.

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
holerite.js, extrato.js, sw.js, manifest.webmanifest, kit/, fonts/, icons/) e
subir no host estático.
Antes de zipar: bump do `VERSAO` em sw.js + `?v=` no index.html + `--selar`.
