# 08. DADOS, BACKUP, MIGRAÇÃO E PWA

Fonte no código: `app.js` (`carregar`, `salvar`, `migrar`, `estadoDefault`,
handlers de backup) e `sw.js`, `manifest.webmanifest`, `icons.js`.

## 1. Estado (`S`) e persistência

Chave única do localStorage: `maxbolso.v1`. Se ela ainda não existir, o app lê
`meubolso.v1` e passa a gravar na chave nova: nada do que está no aparelho se
perde. Salvo integralmente a cada ação (`salvar()`). Esquema versão 2:

```
{
  version: 2,
  config: { salBase, descFolha, pctMinimo, pctPremioReserva, pctPremioLivre,
            reservaMeses, tema, mapaPeriodo, avisos, ultimoAviso,
            guardiaoUltimo, onboardingOculto? },
  categorias: [{ id, nome, icone, tipo, essencial, orcamento }],
  custosFixos: [{ id, nome, valor, catId, dia, assinatura, lembrete, variavel, ativo }],
  metas: [{ id, nome, icone, alvo, prazo, guardado, tipoReserva?, tipoInvest? }],
  contas: [{ id, nome, icone, saldo }],
  holerites: [{ id, tipo, mes, liquido, vencimentos, descontos, inss, irrf,
                outros, fgts, premio, base, adtoFerias, itens[], em }],
  aprendizado: { "descrição minúscula": catId },
  meses: { "AAAA-MM": { status, sal: { pctMeta, valorReal, registrado },
                        rendas[], gastos[], fixosStatus{}, aportes[],
                        snapshot: null | { tot, fixos, em, guardadoTotal, contasTotal } } }
}
```

Rendas criadas por holerite carregam `holeriteId` (permite substituição limpa
na reimportação e na exclusão). `migrar` garante `holerites: []`,
`aprendizado: {}` e `config.mapaPeriodo` em backups antigos.

Estado corrompido no load: console.warn e recomeço no default (sem crash).

## 2. Migração v1 -> v2 (`migrar`)

- Cria `contas: []` se não existir (backups v1 E v2 antigos; correção da
  auditoria de jul/2026: sem isso, importar backup antigo quebrava o render).
- Emojis viram ícones Phosphor: pelo id da categoria default, ou pelo
  `EMOJI_MAP`, com fallback coins (renda) / package (despesa); metas com
  `tipoReserva` viram life-buoy.
- Injeta categorias default que faltarem (sem tocar nas do usuário).
- `tema` ganha default; `carregar` ainda encurta 2 nomes default antigos
  (Governo, Investimentos) se não foram editados.

## 3. Backup e exportação (tela Configurações)

- **Exportar backup**: download do JSON completo
  (`maxbolso-backup-AAAA-MM.json`).
- **Importar backup**: valida version 1 ou 2 + presença de config e categorias;
  confirma ("SUBSTITUI os dados"); roda `migrar` e re-renderiza. Arquivo
  inválido: alerta com o motivo, estado intacto.
- **Exportar planilha (CSV)**: um por mês gravado (Mês; Renda; Custos; Saldo;
  Guardado no mês; Total guardado), separador `;`, vírgula decimal e BOM UTF-8
  embutido (Excel abre acentos direito). Sem mês gravado: toast orientando.
- **Zerar tudo**: dupla confirmação, volta ao `estadoDefault`.

## 4. Tema

`config.tema`: "claro" ou "escuro". O valor "auto" é resolvido UMA vez pelo
sistema (prefers-color-scheme) e persistido. O kit da marca
(`kit/maxworks-ui.js`) pinta a página antes de tudo, pelo atributo
`data-theme` no html ("light" ou "dark"), e guarda a escolha na chave
`maxworks-tema`; o botão único da topbar (lua no claro, sol no escuro)
alterna, e o CSS cobre os dois temas + fallback por media query.

## 5. PWA

- `manifest.webmanifest`: standalone, pt-BR, nome MAXBOLSO, ícones 192/512
  (maskable) e apple-touch-icon; fundo e tema no preto da marca #101014.
- Ícone de app no estilo do ícone de iPhone: quadrado de cantos arredondados,
  fundo preto e o X de ouro MAXWORKS centrado (`icons/`, mais o
  `icons/favicon.svg` da aba). Gerado por
  `orquestrador-universal/marca/kit-visual/gerar-icone-app.js`.
- `sw.js`: pré-cache do app shell (15 arquivos, o kit da marca junto) na instalação;
  **navegação: rede primeiro** (abrir o app nunca depende do cache; cache é
  reserva offline); demais arquivos: cache primeiro com preenchimento em
  runtime (só same-origin). `skipWaiting` + `clients.claim`.
- **Ritual de versão (obrigatório)**: qualquer mudança em asset exige bump do
  `VERSAO` do sw.js E do `?v=` no index.html, e depois `node verificar.mjs
  --selar`. O `verificar` compara o hash dos assets com o selado e fica
  VERMELHO se os assets mudarem sem bump (proteção contra cache velho).
- Fonte Inter variável embutida (woff2), `font-display: swap`.

## 6. Segurança e privacidade

- Nenhuma rede além do próprio host: sem analytics, sem CDN, dados só locais.
- Todo texto do usuário passa por `esc()` antes de virar HTML (anti-XSS).
- Backup é o único caminho de saída de dados, iniciado pelo usuário.

## 7. Sobrevivência sem GitHub (plano de continuidade)

O GitHub é só uma CÓPIA do código e uma hospedagem, nunca a fonte de nada:

- **Seus dados** nunca passam pelo GitHub: vivem no localStorage do aparelho e
  nos backups JSON (export manual + Guardião). O app instalado continua
  abrindo e funcionando offline pelo cache do service worker mesmo com o site
  fora do ar.
- **O código completo**, com todo o histórico git, vive em
  `E:\Projetos\salario-azzas\app` e em qualquer clone (ex.: o notebook). O
  `maxbolso-deploy.zip` na raiz do projeto é uma cópia pronta para hospedar.
- **Para voltar ao ar**: (a) local, sem internet nenhuma: `node
  servidor-local.mjs` na raiz do projeto e abrir http://localhost:8321;
  (b) novo remoto: criar repositório em qualquer serviço e rodar
  `git remote set-url origin <url nova>` + `git push --tags`; (c) nova
  hospedagem: subir o conteúdo do zip em qualquer host de site estático.
- **Recomendado ao dono**: manter uma cópia da pasta `E:\Projetos\salario-azzas`
  no mesmo dispositivo de backup dos holerites.

## 8. Versão em arquivo único (maxbolso.html)

`node app/gerar-html-unico.mjs` empacota o app INTEIRO num só arquivo na raiz
do projeto: as 2 folhas de estilo, os 5 scripts e a fonte Inter (data URI)
embutidos, sem manifest e sem service worker. Serve para mandar o app a alguém por WhatsApp,
e-mail ou pendrive: a pessoa abre com dois cliques, sem site e sem internet.

Regras e limites:

- O gerador carimba uma `marca` (hash dos assets); a auditoria acusa VERMELHO
  se o arquivo ficar defasado do app. Regerar a cada release.
- Sem service worker (não existe em `file://`): o arquivo já é offline por
  natureza. Sem instalação como PWA; é um arquivo, não um site.
- Guardião e Avisos dependem de APIs que alguns navegadores negam em
  `file://`; se negarem, os botões avisam por toast e nada quebra.
- Os dados de quem abre ficam no aparelho da pessoa, em origem própria,
  separados do site publicado; backup JSON é compatível entre os dois.
