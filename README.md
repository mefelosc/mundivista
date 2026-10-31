# Mundivista

> **Nome provisório.** A identidade final ainda não foi decidida; todo o branding vive em
> `src/lib/brand.ts` e pode ser trocado sem mexer na arquitetura.

Plataforma interativa de **geografia, geopolítica e dados**: um mapa-múndi 2D como interface
central, um atlas com indicadores reais e minigames que usam o mapa como tabuleiro.

**Status:** MVP navegável. Explore, Play, 5 jogos, pontuação, fontes e métodos.

![Explore](docs/screenshots/explore.png)

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build estático em build/
npm run preview
```

Verificações:

```bash
npm test           # 44 testes (motores + integridade dos dados)
npm run check      # svelte-check, 0 erros
```

## O que já funciona

### Explore

- Mapa MapLibre com fronteiras Natural Earth 1:50m, zoom/pan e seleção de 241 territórios.
- Seis camadas: **Político, Físico, Demografia, Economia, Geopolítica, História**.
- Coropléticos por quantis (densidade, PIB per capita), rios/lagos, rótulos de relevo,
  capitais e graticula.
- Card contextual que muda com a camada: identidade, demografia, economia, meio físico,
  geopolítica e história.
- Links diretos para Wikipédia e Britannica em cada país.
- Cada indicador mostra **ano de referência**, unidade, ranking/percentil e fonte.
- Destaque de blocos (OTAN, UE, BRICS, OPEP, G20, ASEAN, URSS, Iugoslávia).
- Snippets de leitura rápida ligados ao país, com fonte.
- Layout responsivo: rail de camadas vira barra inferior; card vira bottom sheet.

### Play

Cinco jogos com mecânicas diferentes, todos usando dados reais:

| Jogo | Mecânica |
| --- | --- |
| Países do Mundo | clicar no país no mapa |
| Capitais | resposta digitada (aceita PT/EN) |
| Rankings do Mundo | ordenar o top 5 por indicador |
| Blocos e Alianças | seleção múltipla + “ache o intruso” |
| Sem Litoral | escolher entre países destacados |

- Motor de jogo independente do mapa: regras, validação e geração de rodadas em
  `src/lib/engines/game-engine/`.
- Pontuação com bônus de velocidade e sequência, tiers e recorde pessoal em `localStorage`.
- Feedback com explicação e fonte em cada rodada.

### Fontes e métodos

`/sobre` documenta bases, licenças, cobertura dos indicadores, critérios e limitações.
Nenhum dado é estimado pelo app: lacunas aparecem como “não disponível”.

## Dados

Pipeline reproduzível:

```bash
npm run data:build     # usa cache
npm run data:refresh   # baixa tudo de novo
```

Fontes:

- **Natural Earth 1:50m** (domínio público) — fronteiras, nomes em pt-BR, rios, lagos, capitais.
- **mledoze/countries** (ODbL) — capital, moeda, área, idiomas, vizinhos.
- **World Bank Open Data** (CC BY 4.0) — 20 indicadores; série 2016–2025, observação mais
  recente por país, com ano preservado.

O script grava `src/lib/data/generated/*.json` com data de extração e metadados.

## Estrutura

```
src/
├── lib/
│   ├── components/{map,cards,navigation,games,ui}/
│   ├── configurations/map-layers.ts
│   ├── data/{generated,countries,organizations,historical,snippets,capitals-pt}/
│   ├── engines/{map-engine,game-engine,scoring-engine}/
│   └── brand.ts
└── routes/{explore,play,game/[slug],sobre}
```

O motor de jogos não importa o mapa: recebe rodadas, valida respostas e devolve pontuação.
O mapa é um renderizador entre outros possíveis.

## Limitações conhecidas

- Natural Earth 1:50m: microestados muito pequenos são difíceis de clicar no zoom mundial.
- Blocos históricos são desenhados sobre fronteiras atuais (aproximação didática).
- Relevo é simplificado por rótulos curados; não há DEM nesta versão.
- Sem autenticação, comunidade ou editor — previstos para a fase 5.
- Datas de independência em casos disputados seguem a fonte e trazem ressalva.

## Documentação

- [`docs/ROADMAP.md`](docs/ROADMAP.md) — backlog priorizado (P0/P1/P2) e critérios de aceite.
- [`docs/INSPIRATION.md`](docs/INSPIRATION.md) — referências, anti-padrões e 3 direções de
  identidade visual para testar.
- [`docs/HANDOFF.md`](docs/HANDOFF.md) — estado técnico, armadilhas e prompt para continuar
  em uma nova sessão.

## Próximos passos

1. Busca de países (⌘K) e navegação por teclado no mapa.
2. Landing editorial e mais um jogo histórico (fronteiras dissolvidas).
3. Ajustes finos de mobile, performance e acessibilidade.
4. Comparação entre países e séries temporais.
5. Backend/Postgres/PostGIS, contas e editor comunitário.
