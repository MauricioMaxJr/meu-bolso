# 04. CUSTOS, CATEGORIAS E ORÇAMENTOS

Fonte no código: `app.js`, `categoriasDefault`, `dlgFixo`, `dlgGasto`,
`dlgCategoria`, `renderCustos`, `renderConfig` e o handler global de cliques.

## 1. Custos fixos (`S.custosFixos`, globais)

"Entram sozinhos todo mês." Campos: nome, valor mensal, categoria (despesa),
dia de vencimento (1 a 31, opcional) e três marcadores:

- `assinatura`: entra no painel Assinaturas (Dicas) e nas dicas de custo anual;
- `lembrete`: aparece em "Contas a pagar" (Início) e gera dica crítica quando
  vence sem estar pago (só no mês corrente);
- `variavel`: ao marcar como pago, pergunta o valor daquele mês (capítulo 03).

Campo `ativo` (true na criação): filtra o fixo dos meses; hoje não há botão de
desativar na interface, excluir remove dos meses em aberto (os gravados guardam
o snapshot). Melhoria futura anotada no ROADMAP.

## 2. Gastos avulsos (`mes.gastos`, por mês)

Descrição, valor, categoria (despesa) e dia do mês (opcional, pré-preenchido
com hoje; a lista ordena do dia maior para o menor).

## 3. Categorias (`S.categorias`)

37 categorias default: 13 essenciais de despesa, 14 de estilo de vida e 10 de
renda (ids fixos, ex.: `moradia`, `mercado`, `cat-salario`). Cada uma tem nome,
ícone (Phosphor), `tipo` (despesa/renda), `essencial` e `orcamento` (teto).

- `essencial: true` entra no cálculo do piso e do alvo da reserva.
- Criar/editar/excluir na tela Configurações (chips por grupo, com contagem).
- **Excluir é bloqueado se estiver em uso** (em fixos, gastos ou rendas de
  qualquer mês): toast "Categoria em uso".
- Migração v1 -> v2 converte emojis nos ícones equivalentes (`EMOJI_MAP`) e
  injeta categorias novas sem tocar nas do usuário (capítulo 08).

## 4. Orçamentos (teto mensal por categoria)

`orcamento` (R$; 0 = sem teto) definido na categoria. Aparece em:

- Custos > "Orçamento por categoria": barra de progresso, vermelha ao estourar;
- Dicas: warning "orçamento estourado" quando `gasto > orcamento` (capítulo 06).

## 5. Regras transversais

- Valores monetários: inputs `type=number`, `min=0` (validação nativa impede
  negativos), passo 0,01, `inputMode: decimal`.
- Todos os textos do usuário passam por `esc()` antes de virar HTML (anti-XSS,
  conferido em auditoria).
- Empty states sempre com botão de ação direta (padrão do produto).
