# 12. Tela Esquema (a régua salarial explicada)

Décima tela do app (nav entre Dicas e Configurações). Traz para dentro do
produto o conteúdo didático da calculadora original: só consulta, sem entrada
de dados. Fonte no código: `renderEsquema()` em app.js.

Regra de ouro: NADA ali é digitado à mão; todas as tabelas nascem das
constantes e funções do motor, então a paridade é garantida por construção.

- **Faixas por tempo de função**: gerada das opções do select `#sal-base` da
  tela Renda (fonte única dos rótulos); a base atual sai em negrito com
  "(sua base)".
- **Prêmio por meta**: a `FAIXAS_META` inteira nas 3 colunas (mês normal,
  jun/ago/nov, dezembro), com a nota de que abaixo de 80% não há prêmio e de
  que dezembro paga os máximos.
- **Líquido estimado por faixa**: para a base atual (`config.salBase`) e os
  descontos fixos (`config.descFolha`), o líquido de `calculaSalario` em cada
  faixa de meta x cada tipo de mês (meses 1, 6 e 12 como representantes),
  mais a linha "Abaixo de 80%".
- **Regras do esquema**: meses especiais; 13º sem prêmio (aponta para o
  painel do Mapa); teto INSS praticado (`TETO_INSS`); IRRF da última faixa
  (alíquota e dedução lidas de `IRRF_FAIXAS`); FGTS não é desconto.

A `calculadora-salario.html` continua existindo na raiz do repo como simulador
independente; a tela Esquema é a versão viva dentro do produto.
