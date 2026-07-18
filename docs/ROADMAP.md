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

## Próximos (em ordem)

1. **⚠️ VALIDAR proposta: Importar holerite (PDF vira dados)**: botão na tela
   Renda que lê o PDF da ADP no aparelho (parser próprio, sem biblioteca
   externa, provado no corpus dos 67), classifica o tipo (salário, férias,
   13º adiantamento/integral, PLR, dissídio), preenche o registro do mês com o
   líquido real e guarda o extrato estruturado em `S.holerites` para busca e
   relatórios. O PDF NÃO fica salvo. Decisões do Mauricio: nome do botão, o
   que fazer com PLR/13º (sugerido: entrar como Outras rendas nas categorias
   que já existem) e se importa o histórico 2022 a 2026 de uma vez.
2. **⚠️ VALIDAR proposta: Consultor / Mapa (previsibilidade)**: painel novo
   que cruza o histórico de líquido real (anos fechados) com custos e metas:
   projeção de fim de ano (guardado e reserva), "no ritmo atual a meta X
   completa em MM/AAAA", cenários de corte de custos, filtros de período
   (12m, 24m, tudo). Tudo baseado no líquido que caiu na conta.
3. **Pausar custo fixo pela interface**: o campo `ativo` existe e é respeitado,
   mas não há botão para desativar sem excluir (capítulo 04). Somar, não trocar.
4. **Série histórica das Contas**: `contasTotal` já entra em cada snapshot;
   falta um gráfico "Evolução das contas" em Relatórios.
5. **Dissídio na base**: opção de informar a base real de folha (12.556,32 em
   folha até jun/2026) mantendo a faixa nominal para o prêmio; hoje o ajuste é
   manual no registro do salário. Ganha força com o importador de holerite.
6. **13º e férias no app**: hoje só na calculadora (capítulo 01, seção 4);
   avaliar painel anual com as duas parcelas do 13º.
7. **Backup automático**: lembrete periódico de exportar (ex.: dica quando o
   último export passou de 60 dias).

## Ideias avaliadas e adiadas (com o porquê)

- Redutor IRRF da Lei 15.270/2025: fora da faixa de renda do esquema
  (documentado no capítulo 01); só entra se surgir cenário abaixo de R$ 7.350.
- Multiusuário/nuvem: contra a premissa de privacidade total do produto.
