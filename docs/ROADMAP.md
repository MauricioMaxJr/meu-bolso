# ROADMAP

Ordem de execução recomendada. Regras inegociáveis: nunca remover capacidade;
mudança de comportamento só com aviso e aprovação do Mauricio ANTES; toda
entrega termina com `node verificar.mjs` VERDE + teste real no navegador.

## Feito (v1.0.0, jul/2026)

- [x] App completo (8 telas) com motor de salário validado na folha 2025.
- [x] Tabelas INSS 2026 (Portaria MPS/MF nº 13/2026) no app e na calculadora.
- [x] Correção: salvar após cancelar um dialog era engolido (returnValue preso).
- [x] Correção: importar backup v1/v2 antigo (sem Contas) quebrava o render.
- [x] Auditoria mecânica (`verificar.mjs`) + Livro-Razão (`docs/canonicos.json`)
      + hook pre-commit + manual completo (8 capítulos) + paridade.

## Feito (v1.0.1, 18/07/2026)

- [x] INSS 2026 validado na folha real (6 demonstrativos): praticado R$ 988,07;
      motor calibrado para o valor da folha (capítulo 01, seção 5).
- [x] 67 holerites de E:\Holerites lidos, classificados e renomeados
      (AAAA-MM tipo.pdf); histórico real 2022 a 2026 extraído.

## Feito (v1.1.0, 18/07/2026, aprovado pelo Mauricio)

- [x] **Importar holerite**: painel na tela Renda, parser próprio validado nos
      67 demonstrativos reais (golden no verificar), importação em lote,
      % de meta inferida do prêmio, PLR/13º/dissídio/férias como rendas,
      busca e detalhe por verba. O PDF não é salvo (capítulo 09).
- [x] **Mapa**: nona tela; ritmo real, projeções (fim do ano, 1/3/5 anos),
      metas com data prevista, cenários de corte, alavancas por categoria e
      ano a ano do líquido real (capítulo 10).

## Feito (v1.2.0, 27/07/2026, as 8 evoluções aprovadas na auditoria)

- [x] **Backup Guardião**: cópia automática do JSON numa pasta local escolhida
      uma vez, últimas 6 cópias (capítulo 11.1). Supera o antigo item
      "backup automático por lembrete".
- [x] **Importar Extrato** (CSV/OFX vira gastos com prévia, dedupe e categoria
      sugerida; parser próprio em `extrato.js`) (capítulo 11.2).
- [x] **13º e férias no Mapa** (`calcula13` idêntico à calculadora; férias pela
      média real dos holerites) (capítulo 11.5).
- [x] **Colchão** no Início, **Categoria que aprende**, **Avisos de
      vencimento**, **Vigia de assinatura**, **Planilha detalhada**
      (capítulos 11.3 a 11.8).

## Feito (v1.3.0, 27/07/2026)

- [x] **Tela Esquema**: o conteúdo didático da calculadora dentro do app
      (faixas por tempo de função, tabela completa de prêmios, líquido
      estimado por faixa e regras), tudo gerado das constantes do motor
      (capítulo 12).
- [x] Plano de continuidade sem GitHub documentado (capítulo 08, seção 7).

## Próximos (em ordem)

1. **Pausar custo fixo pela interface**: o campo `ativo` existe e é respeitado,
   mas não há botão para desativar sem excluir (capítulo 04). Somar, não trocar.
2. **Série histórica das Contas**: `contasTotal` já entra em cada snapshot;
   falta um gráfico "Evolução das contas" em Relatórios.
3. **Dissídio na base**: opção de informar a base real de folha (12.556,32 em
   folha até jun/2026) mantendo a faixa nominal para o prêmio; hoje o ajuste é
   manual no registro do salário. Ganha força com o importador de holerite.

## Ideias avaliadas e adiadas (com o porquê)

- Redutor IRRF da Lei 15.270/2025: fora da faixa de renda do esquema
  (documentado no capítulo 01); só entra se surgir cenário abaixo de R$ 7.350.
- Multiusuário/nuvem: contra a premissa de privacidade total do produto.
