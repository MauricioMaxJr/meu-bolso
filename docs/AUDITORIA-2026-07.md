# AUDITORIA 2026-07 - MAXBOLSO v1.1.1

Auditoria de lançamento executada em 27/07/2026 (skill /auditar). Método desta rodada:
caça multiagente parcial (3 frentes concluídas antes do limite: motor, mercado BR,
mercado global), leitura humana integral de app.js/index.html/sw.js/verificar.mjs,
prova do site publicado contra o repo, e a bateria mecânica completa que esta rodada
deixou de legado: `node app/auditoria.mjs` (verificar + 11 frentes, zero custo).

## 1. VEREDITO: PRONTO

Lançado e selado. v1.1.1 publicada (tag `v1.1.1`, commit `c4db2c7`, GitHub Pages).
Nenhuma pendência bloqueia uso. As duas baterias mecânicas estão VERDES e o site no
ar foi provado idêntico ao repo byte a byte. A melhoria de maior valor real hoje é o
backup automático (item 5 do ROADMAP): é o único ponto onde o produto ainda pode
perder dados do dono.

## 2. NOTA POR ÁREA

| Área | Nota | Evidência |
|---|---|---|
| Funcionalidade | 10 | Toda promessa da VISAO existe e roda: verificar VERDE (9 seções), tela de usuário novo com valores conferidos centavo a centavo no navegador (piso 10.182,38; estimativa 17.432,38). |
| Confiabilidade | 9,5 | Motor provado em 1,6 milhão de casos (bordas, monotonicidade, teto, IRRF contínuo); parser 67/67 holerites reais + 6 entradas hostis recusadas; import de backup agora rejeita arquivo que quebraria o app. -0,5: backup ainda é manual. |
| Código | 9,5 | Sem dependências externas (superfície de ataque zero, npm audit não se aplica); código morto removido; zero TODO/FIXME; paridade funcional app x calculadora em 62 mil comparações idênticas. |
| Segurança e privacidade | 10 | Sem chave no código; sem dado pessoal no repo (histórico varrido); toda interpolação de nome/descrição passa por esc(); path traversal do servidor local bloqueado (6 ataques testados); dados 100% no aparelho. |
| UX | 9 | Padrão visual 100% no app (maiúsculas até em form controls e zero travessão, provados por CSS computado no navegador). -1: calculadora ainda no estilo antigo (decisão pendente do dono). |
| Docs | 10 | Manual de 10 capítulos, Livro-Razão selado, zero divergência docs x código após a correção do contrato de paridade. |

## 3. CORRIGIDO NESTA AUDITORIA (commit `c4db2c7`)

- Import de backup blindado: backup corrompido (config sem números) era aceito, gravava
  estado quebrado e o app não abria mais no boot seguinte; agora cai na mensagem de
  arquivo inválido sem tocar nos dados (app.js).
- Contrato de paridade mentia sobre o código: citava teto INSS 988,09; corrigido para
  988,07 praticado, com o oficial anotado (docs/paridade/calculadora.md).
- Código morto removido: handler `d.rmCat` sem nenhum produtor (excluir categoria vive
  no dialog, capacidade intacta).
- Vestígios "v8" e travessões em comentários de app.js/app.css limpos.
- Zip de deploy regenerado e provado idêntico ao repo, arquivo a arquivo.
- Criado `auditoria.mjs`: a frota de auditoria de graça (11 frentes + verificar por
  dentro), que passa a ser a bateria oficial de release.

## 4. PENDENTE PRIORIZADO

Nenhum P0 e nenhum P1.

- P2 (decisão do dono) ⚠️ VALIDAR: calculadora-salario.html tem 38 travessões/estrelas
  no texto visível, estilo anterior ao padrão visual (tudo maiúsculo, sem travessão).
  Mudar é reforma visual: só com aprovação. O auditoria.mjs lista como INFO.
- P2 (bate-olho do dono): 10 empty states informativos sem botão (ex.: "Nenhuma conta
  pendente."). Julguei conformes por serem estados de sucesso, não de ação; a lista sai
  na seção 5 do auditoria.mjs para conferência visual.
- Cosmético: icons.js com CRLF no disco (git normaliza ao commitar; sem efeito).
- Vigiar em 2027: redutor IRRF da Lei 15.270/2025 segue documentado como não aplicável
  (renda tributável do esquema nunca fica abaixo de R$ 7.350). A frente de conferência
  em fonte oficial (gov.br) não rodou NESTA rodada (frota caiu antes); última
  conferência oficial foi na v1.0.0/v1.1.0 (jul/2026). Reconferir quando tabela mudar.
- ROADMAP segue valendo: pausar custo fixo, série histórica das Contas, dissídio na
  base, 13º e férias no app, backup automático.

## 5. SUGESTÕES DE EVOLUÇÃO (mercado BR + global, com fonte na pesquisa da sessão)

| # | Sugestão | Esforço | Impacto |
|---|---|---|---|
| 1 | BACKUP GUARDIÃO: export automático do JSON numa pasta local escolhida uma vez (File System Access API), últimas N cópias. Fecha o único ponto de perda total. | M | Alto |
| 2 | IMPORTAR EXTRATO (CSV/OFX do banco): irmão do Importar Holerite, gastos em lote lidos no aparelho, arquivo não guardado. Mata a digitação manual (base dos 5 líderes globais). | G | Alto |
| 3 | 13º E FÉRIAS NO APP: trazer o cálculo da calculadora para o Mapa, entrando na projeção anual (já é o item 4 do ROADMAP). | M | Alto |
| 4 | COLCHÃO: quantos meses de folga o saldo das Contas banca (equivalente local da "Age of Money" do YNAB), um número grande no Início. | P | Alto |
| 5 | CONTAS A PAGAR COM AVISO NO APARELHO: notificação local do PWA antes do vencimento (padrão Mobills/Organizze), sem nada sair do aparelho. | M | Alto |
| 6 | CATEGORIA QUE APRENDE: descrição repetida pré-seleciona a categoria (regras locais, padrão Firefly/Actual). | P | Médio-alto |
| 7 | VIGIA DE ASSINATURA: alertar quando assinatura subir de preço (padrão Monarch/Copilot; os dados já existem nos fixos variáveis). | P | Médio |
| 8 | PLANILHA DETALHADA: CSV por categoria e período em Relatórios (o CSV atual resume meses gravados; é recurso pago no Mobills). | P | Médio |

Trunfos que nenhum concorrente tem (preservar): parser de holerite local, motor de
folha que PREVÊ o líquido, Mapa de projeção, snapshot imutável de mês, privacidade
total sem conta e custo zero.

## 6. PROMPT PRONTO (para quando o dono quiser atacar)

"Leia CLAUDE.md, a memória e app/docs/AUDITORIA-2026-07.md. Rode node app/auditoria.mjs
e confirme VERDE. Tarefa: implementar o BACKUP GUARDIÃO (sugestão 1 do relatório,
evolução do item 5 do ROADMAP) - export automático do backup JSON em pasta local
escolhida uma vez, com histórico de cópias, mantendo local-first. Sem frota de agentes:
trabalho solo e sequencial, provado no navegador, fechando com auditoria VERDE,
bump de versão, zip, commit e push."
