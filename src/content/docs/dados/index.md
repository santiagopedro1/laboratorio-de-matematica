---
title: Introdução aos dados
description: Datasets reais de medidas biológicas usados nas atividades de modelagem matemática do laboratório.
---

Esta seção reúne os conjuntos de dados utilizados nas atividades de modelagem matemática do laboratório. São medidas reais, coletadas em experimentos e observações, organizadas em arquivos CSV que podem ser baixados e analisados livremente.

Cada dataset tem uma coluna de identificação — a amostra, a espécie ou o indivíduo medido — seguida pelas variáveis numéricas. Nos cabeçalhos, os nomes das variáveis aparecem por extenso e com a unidade de medida ao final, entre parênteses, como em `Peso total (g)` ou `Comprimento da sépala (mm)`.

## Datasets disponíveis

- **[Laranjas](/dados/laranjas/)** — pesos e dimensões de laranjas, em gramas e centímetros.
- **[Oenothera](/dados/oenothera/)** — medidas morfológicas de flores de três espécies do gênero _Oenothera_, em milímetros.
- **[Ovos](/dados/ovos/)** — massas do ovo inteiro, da clara, da gema e da casca de quatro tipos de ovos, em gramas.

## Como usar os gráficos

As páginas de cada dataset trazem gráficos interativos construídos a partir dos mesmos arquivos CSV disponibilizados para download. Nos gráficos de dispersão, use os seletores **Eixo X** e **Eixo Y** para escolher quais variáveis comparar; passe o cursor sobre os pontos para ver os valores.

Esses gráficos são um ponto de partida para o estudo de correlações e para a escolha de modelos, etapas centrais da modelagem matemática. A partir deles é possível investigar, por exemplo, se o peso da clara cresce junto com o peso total do ovo ou se o comprimento do tubo está relacionado ao comprimento da pétala.

## Formato dos arquivos

Todos os arquivos estão em formato CSV (valores separados por vírgula), com uma linha de cabeçalho e uma linha por amostra. Os nomes dos arquivos seguem o padrão minúsculo-com-hífen, como `ovos-codorna.csv` e `oenothera-affinis.csv`.
