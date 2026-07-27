# 11. Expansões da v1.2 (guardião, extrato, avisos e companhia)

As oito mecânicas aprovadas pelo Mauricio a partir de `docs/AUDITORIA-2026-07.md`
(seção 5). Regra geral: nada aqui remove ou troca capacidade; tudo soma.

## 11.1 Backup Guardião

- Em Configurações > Backup, o botão **PASTA DO GUARDIÃO** abre o seletor de
  pasta do navegador (`showDirectoryPicker`, modo leitura e escrita). O handle
  da pasta fica num IndexedDB próprio (`meubolso-guardiao`), porque handle não
  cabe no localStorage.
- A cada **mês gravado** (e ao escolher a pasta), o app grava sozinho
  `meubolso-backup-AAAA-MM-DD.json` (estado completo, mesmo formato do export
  manual) e apaga as cópias mais antigas, mantendo as **últimas 6**.
- A linha de status sob os botões mostra: navegador sem suporte / convite para
  escolher a pasta / "Guardião ativo. Última cópia: <nome>"
  (`config.guardiaoUltimo`).
- Falha de permissão ou de escrita nunca quebra o fluxo de gravar mês: no
  clique do botão avisa por toast; no automático, falha em silêncio.

## 11.2 Importar Extrato (CSV/OFX vira gastos)

- Tela Custos > Gastos avulsos > **IMPORTAR EXTRATO** (`extrato.js`, parser
  próprio sem biblioteca, mesmo contrato do holerite: o arquivo é lido no
  aparelho e NÃO é guardado).
- Formatos: **OFX** (blocos `STMTTRN`: `DTPOSTED`, `TRNAMT`, `MEMO`/`NAME`) e
  **CSV** de banco (separador `;` ou `,` detectado pela 1ª linha; colunas
  achadas pelo cabeçalho: data/dia, valor/quantia/montante, descrição/histórico/
  lançamento/estabelecimento; datas `AAAA-MM-DD` ou `DD/MM/AAAA`; valor
  brasileiro `1.234,56` ou com ponto decimal).
- Só **débitos** (valor negativo) viram gasto; créditos são contados e
  ignorados de propósito (renda entra pelo holerite, evita contagem dupla).
- Sempre abre **prévia** (regra dura de mutação em massa): tabela com
  checkbox, dia, descrição, valor e categoria editável por linha. Suspeita de
  duplicata (mesmo dia, valor e descrição no mês) vem desmarcada com selo
  "repetido?"; transação de mês **gravado** vem travada com selo "mês gravado".
- Categoria sugerida: 1º o aprendizado (11.3), 2º palavras-chave
  (`CHAVES_CATEGORIA`: uber->transporte, ifood->restaurantes etc.), 3º "outros".
  Confirmar a prévia também ensina o aprendizado.

## 11.3 Categoria que aprende

- Dicionário local `S.aprendizado` (descrição minúscula/sem espaços extras ->
  catId), limitado a 500 entradas (a mais antiga sai).
- Aprende ao salvar gasto (dialog) e ao confirmar prévia de extrato. Ao digitar
  descrição conhecida num gasto NOVO, a categoria muda sozinha no formulário
  (edição não mexe). Só vale para categorias de despesa existentes.

## 11.4 Colchão

- Quinto cartão do Início: **COLCHÃO** = total das Contas dividido pelo custo
  médio real (`custoMedioReal()`: média dos custos dos últimos 3 meses
  gravados; sem histórico, usa o mês atual). Exibido como "N,N MESES"; verde a
  partir de 1 mês (você vive com o dinheiro do mês passado).
- Sem contas ou sem custo: mostra "-" com o convite "cadastre contas e custos".

## 11.5 13º e férias no Mapa

- Painel novo "13º e férias" no Mapa: parcelas 1 (nov, metade da base, sem
  descontos) e 2 (dez, base - INSS - IRRF - parcela 1) via `calcula13(base)`,
  função IDÊNTICA à da calculadora (paridade conferida pela auditoria);
  **prêmio não integra o 13º**.
- Férias: média dos adiantamentos REAIS (`adtoFerias` dos holerites
  `salario-ferias` importados); sem holerite de férias, convite para importar.
- Linha "Fim de <ano> somando o 13º" = projeção do ritmo + 13º líquido total
  (só até novembro). A projeção principal do painel "Onde você chega" fica
  intocada de propósito: 13º é renda extraordinária, não ritmo.

## 11.6 Avisos de vencimento

- Configurações > Avisos > **ATIVAR AVISOS**: pede permissão de notificação e
  liga `config.avisos`. O botão vira "DESATIVAR AVISOS" quando ativo.
- Ao **abrir o app** (limite honesto de PWA local: não existe push sem
  servidor), notifica UMA vez por dia (`config.ultimoAviso`) os custos fixos
  com lembrete, não pagos, vencendo em até 3 dias ou vencidos, agregados numa
  única notificação em maiúsculas ("ALUGUEL (DIA 5), ... E MAIS N").
- Usa `showNotification` do service worker com queda para `new Notification`.

## 11.7 Vigia de assinatura

- Nova dica (nível atenção): para cada custo fixo marcado como assinatura, se
  o valor do mês atual for MAIOR que o do mesmo fixo no último mês gravado
  (comparação pelo snapshot), sai "X subiu de A para B. Vale conferir.".
- No painel Assinaturas (tela Dicas), cada linha ganhou "vence dia N".

## 11.8 Planilha detalhada

- Relatórios > **EXPORTAR PLANILHA DETALHADA**: CSV (BOM Excel-safe) com uma
  linha por mês gravado x categoria: `Mês;Grupo;Categoria;Valor`, incluindo
  salário e rendas extras (Grupo Renda) e custos por categoria (Grupo Custo).
  Meses abertos ficam de fora: planilha é verdade congelada.
- O export resumido antigo (Configurações > Backup) continua igual.

## Dados novos no estado (migração automática, schema segue version 2)

- `config.avisos` (bool), `config.ultimoAviso` ("AAAA-MM-DD" ou null),
  `config.guardiaoUltimo` (nome do arquivo ou null), `S.aprendizado` ({}).
- `migrar()` cria `aprendizado` em backups antigos; backups novos importam nos
  aparelhos antigos sem quebrar (campos extras são ignorados pelo código velho).
