# 08. DADOS, BACKUP, MIGRAÇÃO E PWA

Fonte no código: `app.js` (`carregar`, `salvar`, `migrar`, `estadoDefault`,
handlers de backup) e `sw.js`, `manifest.webmanifest`, `icons.js`.

## 1. Estado (`S`) e persistência

Chave única do localStorage: `meubolso.v1`. Salvo integralmente a cada ação
(`salvar()`). Esquema versão 2:

```
{
  version: 2,
  config: { salBase, descFolha, pctMinimo, pctPremioReserva, pctPremioLivre,
            reservaMeses, tema, onboardingOculto? },
  categorias: [{ id, nome, icone, tipo, essencial, orcamento }],
  custosFixos: [{ id, nome, valor, catId, dia, assinatura, lembrete, variavel, ativo }],
  metas: [{ id, nome, icone, alvo, prazo, guardado, tipoReserva?, tipoInvest? }],
  contas: [{ id, nome, icone, saldo }],
  meses: { "AAAA-MM": { status, sal: { pctMeta, valorReal, registrado },
                        rendas[], gastos[], fixosStatus{}, aportes[],
                        snapshot: null | { tot, fixos, em, guardadoTotal, contasTotal } } }
}
```

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
  (`meubolso-backup-AAAA-MM.json`).
- **Importar backup**: valida version 1 ou 2 + presença de config e categorias;
  confirma ("SUBSTITUI os dados"); roda `migrar` e re-renderiza. Arquivo
  inválido: alerta com o motivo, estado intacto.
- **Exportar planilha (CSV)**: um por mês gravado (Mês; Renda; Custos; Saldo;
  Guardado no mês; Total guardado), separador `;`, vírgula decimal e BOM UTF-8
  embutido (Excel abre acentos direito). Sem mês gravado: toast orientando.
- **Zerar tudo**: dupla confirmação, volta ao `estadoDefault`.

## 4. Tema

`config.tema`: "claro" ou "escuro". O valor "auto" é resolvido UMA vez pelo
sistema (prefers-color-scheme) e persistido; o botão da topbar alterna e o CSS
cobre os dois temas + fallback por media query.

## 5. PWA

- `manifest.webmanifest`: standalone, pt-BR, ícones 192/512 (maskable) e
  apple-touch-icon; tema azul #17548a.
- `sw.js`: pré-cache do app shell (10 arquivos) na instalação;
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
