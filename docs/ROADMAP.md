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

## Próximos (em ordem)

1. **⚠️ VALIDAR INSS 2026 na folha real**: conferir num demonstrativo de 2026
   se o INSS praticado é exatamente R$ 988,09 (capítulo 01 do manual).
2. **Pausar custo fixo pela interface**: o campo `ativo` existe e é respeitado,
   mas não há botão para desativar sem excluir (capítulo 04). Somar, não trocar.
3. **Série histórica das Contas**: `contasTotal` já entra em cada snapshot;
   falta um gráfico "Evolução das contas" em Relatórios.
4. **Dissídio na base**: opção de informar a base real de folha (ex.:
   12.556,32) mantendo a faixa nominal para o prêmio; hoje o ajuste é manual no
   registro do salário.
5. **13º e férias no app**: hoje só na calculadora (capítulo 01, seção 4);
   avaliar painel anual com as duas parcelas do 13º.
6. **Backup automático**: lembrete periódico de exportar (ex.: dica quando o
   último export passou de 60 dias).

## Ideias avaliadas e adiadas (com o porquê)

- Redutor IRRF da Lei 15.270/2025: fora da faixa de renda do esquema
  (documentado no capítulo 01); só entra se surgir cenário abaixo de R$ 7.350.
- Multiusuário/nuvem: contra a premissa de privacidade total do produto.
