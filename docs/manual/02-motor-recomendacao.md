# 02. MOTOR DE RECOMENDAÇÃO (quanto guardar no mês)

Fonte no código: `app.js`, funções `recomendacao`, `essenciaisReferencia`,
`metaReserva` e o bloco de sugestão de aportes em `renderMetas`.

## 1. A filosofia

O salário tem um piso garantido (0% de meta) e um variável (prêmio). A regra
protege o essencial com o piso e converte parte do "excedente" em poupança:

1. **Piso** = salário líquido sem prêmio, no pior cenário
   (`calculaSalario(base, 0, mes, descFolha).liquido`). Os custos essenciais
   têm de caber no piso; se não cabem, dica crítica (capítulo 06).
2. **Excedente** = `max(0, renda do mês - piso)`. Tudo que veio acima do pior
   cenário (prêmio, extras) é candidato a poupança.
3. **Guardar** = `min( max(mínimo, regraPremio), teto )`, onde:
   - `mínimo = renda × pctMinimo/100` (padrão 20% da renda);
   - `regraPremio = excedente × pctPremio/100`, sendo `pctPremio` igual a
     `pctPremioReserva` (padrão 50%) enquanto a reserva de emergência não está
     completa, e `pctPremioLivre` (padrão 30%) depois dela completa;
   - `teto = max(0, saldo do mês)` (nunca recomenda mais do que sobrou).

Reserva completa = meta com `tipoReserva` tendo `alvo > 0` e
`guardado >= alvo`. Sem meta de reserva criada, vale o percentual de reserva
(50%): o motor assume o modo conservador.

## 2. Referência de essenciais (para o alvo da reserva)

`essenciaisReferencia(chave)`: média dos essenciais dos **3 últimos meses
gravados** (pelo snapshot). Se não há nenhum mês gravado (ou a média é zero),
usa os essenciais do mês atual em aberto. O alvo sugerido da reserva é
`essenciaisReferencia × config.reservaMeses` (padrão 6 meses). Se nada existe
ainda, o botão "Criar agora" usa 30.000 como fallback.

## 3. Sugestão de aportes ("Usar sugestão do motor")

Ordem de prioridade, com o valor recomendado `rec`:

1. Reserva de emergência incompleta: recebe primeiro,
   `min(rec, alvo - guardado)`.
2. O que restar é dividido em partes iguais entre as demais metas que ainda
   aceitam dinheiro (sem alvo, ou com `guardado < alvo`).

A sugestão substitui os aportes digitados do mês (o usuário pode editar depois,
campo a campo).

## 4. Configurações que alimentam o motor (tela Configurações)

| Campo | Chave | Padrão |
|---|---|---|
| Mínimo a guardar (% da renda) | `config.pctMinimo` | 20 |
| % do prêmio (reserva incompleta) | `config.pctPremioReserva` | 50 |
| % do prêmio (reserva completa) | `config.pctPremioLivre` | 30 |
| Reserva (meses de essenciais) | `config.reservaMeses` | 6 |
| Outros descontos da folha (R$) | `config.descFolha` | 160 |

## 5. Exemplo numérico completo (conferido em teste E2E real)

Mês normal, base 14.000, meta 100%, outros 160, renda extra de R$ 500,
custos R$ 3.500 (essenciais R$ 3.440,10), reserva incompleta:

- renda = líquido do mês + 500 (o teste E2E rodou com a tabela 2025:
  17.458,81 + 500 = 17.958,81)
- piso (com descFolha 160): o valor vigente está no canonicos.json e no
  capítulo 01 (tabela de pisos)
- excedente = renda - piso; mínimo = 20% × renda = 3.591,76
- regraPremio = 50% × excedente; recomendação = max(mínimo, regraPremio),
  limitada ao saldo do mês.
