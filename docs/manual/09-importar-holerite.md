# 09. IMPORTAR HOLERITE (PDF vira dados)

Fonte no código: `holerite.js` (parser) e `app.js` (`aplicarHolerite`,
`importarHolerites`, `renderHolerites`, `dlgHolerite`, `inferePctMeta`,
`TIPO_HOLERITE`). Painel na tela Renda. **O PDF nunca é salvo**: o app lê o
arquivo no aparelho, extrai os dados e descarta o arquivo.

## 1. O parser (holerite.js), sem biblioteca externa

Os demonstrativos da ADP/AZZAS são PDFs de texto com estrutura fixa:
FlateDecode, fonte padrão (Arial, sem subset), texto em operadores `Td`/`Tj`.
O parser:

1. Localiza o primeiro stream de conteúdo com texto e o descomprime
   (navegador: `DecompressionStream("deflate")`; Node/verificar: zlib
   injetado; há tolerância a bytes soltos no fim do stream).
2. Percorre os operadores acumulando posição e junta os fragmentos em linhas
   por proximidade de `y` (tolerância 2,5pt: troca de fonte desloca 1 a 2pt).
3. Extrai: mês/ano (voto majoritário do cabeçalho), valor líquido (linha do
   RECIBO "R$ X RELATIVO"), e a tabela de verbas usando os `x` do próprio
   cabeçalho (CÓD/REFERÊNCIA/VENCIMENTOS/DESCONTOS/DIA) para classificar cada
   número por coluna.
4. **Prova contábil embutida**: vencimentos menos descontos (FGTS fora, códigos
   2500/2505) tem de bater com o líquido do recibo; senão o arquivo é
   rejeitado como inválido.
5. Classifica o tipo pelos códigos de verba: 1955 = PLR; 800 (ou mês "13") =
   13º integral (referência movida para dezembro); 750 = 13º adiantamento;
   2101 ou 005 = salário com férias; 3 itens ou menos = dissídio retroativo;
   senão salário comum.

Códigos consolidados: INSS 2000/2002/2003; IRRF 2004/2005/2012/2014; prêmio
4249; base 001; adiantamento de férias 2101; FGTS 2500/2505 (informativo).
`outros` = descontos menos INSS menos IRRF.

Validação: 67 de 67 demonstrativos reais (jan/2022 a jun/2026) lidos com tipo,
mês e líquido exatos. O `verificar.mjs` roda esse golden test quando a pasta
E:\Holerites está presente (fora dela, pula com aviso).

## 2. O que a importação faz no app (`aplicarHolerite`)

Por arquivo (aceita vários de uma vez):

- Guarda o extrato estruturado em `S.holerites` (tipo, mês, líquido, bruto,
  INSS, IRRF, outros, FGTS, prêmio, base, verbas item a item). Reimportar o
  mesmo tipo+mês substitui o registro e as rendas que ele tinha criado (sem
  duplicar).
- **Mês gravado**: só entra no histórico; o mês congelado não muda.
- **Salário / salário com férias** (mês aberto): registra o salário do mês com
  o líquido real (`valorReal`), infere o `% da meta` pelo prêmio e pelo tipo do
  mês (prêmio 8.000 em junho = faixa 90 a 94, por exemplo; prêmio fora da
  tabela mantém o % atual; sem prêmio = 0). No salário com férias, o
  adiantamento de férias (verba 2101) entra como renda extra "Adiantamento de
  férias" (categoria Férias) no mesmo mês, para o caixa do ano fechar.
- **PLR, 13º (adiantamento e integral), dissídio retroativo**: entram como
  renda extra do mês nas categorias que já existem (PLR/Participação,
  13º salário, Salário).

## 3. Painel Holerites (tela Renda)

- Botão "Importar PDF" (aceita múltiplos arquivos de uma vez: dá para importar
  a pasta inteira de anos anteriores).
- Busca livre: ano, mês, tipo ou valor.
- Cada item: tipo, mês, prêmio (quando há) e líquido; ações de detalhe
  (tabela de verbas completa, com FGTS destacado como depósito do empregador)
  e exclusão (remove as rendas criadas em mês aberto; registro de salário
  permanece; mês gravado não é tocado).

## 4. Limites conhecidos (documentados de propósito)

- O parser é feito para o layout da ADP/AZZAS. Outro formato de PDF é
  rejeitado com aviso, nunca importado errado (a prova contábil barra).
- O adiantamento de férias entra no mês da folha de férias (aproximação de
  caixa; o pagamento real acontece dias antes do início das férias).
- Holerites de 2022 (era gerente: comissões, códigos 5100+) importam com o
  líquido real e % de meta 0, sem inferência de faixa (esquema antigo).
