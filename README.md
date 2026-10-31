# Mundivista

> Atlas interativo de geografia, geopolítica e dados. O mapa é a interface — não o fundo.

**Status:** P0 e P1 do roadmap executados. 63 testes, `svelte-check` sem erros, build estático,
auditoria axe sem violações sérias e smoke test de interação em Firefox.

![Atlas](docs/screenshots/explore.png)

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build estático em build/
npm run preview
```

Verificações:

```bash
npm test           # 63 testes (motores, dados, timeline, i18n)
npm run check      # svelte-check, 0 erros
npm run build      # prerender + adapter-static
npm run smoke      # interação real no preview (Playwright/Firefox)
npm run a11y       # axe-core: WCAG 2.1 AA, sem violações sérias
npm run shots      # screenshots desktop/mobile claro/escuro em docs/screenshots
```

O `smoke`, `a11y` e `shots` esperam um preview em `http://localhost:4173`.

## O que existe

### Identidade — Atlas Editorial

- Papel quente, tinta, vinho, ocre e verde; modo escuro como o mesmo atlas à noite.
- Display serifada (Fraunces), UI em Inter e dados em JetBrains Mono.
- Conjunto próprio de ícones cartográficos (24 px, traço 1,5): rosa dos ventos, curva de
  nível, marco de fronteira, rio, densidade, aliança, linha do tempo.
- Réguas, ticks, numeração de seção e textura sutil de papel no lugar de glassmorphism.
- Tema claro/escuro/sistema persistido em `localStorage`, aplicado antes do primeiro paint.

### Atlas

- Mapa MapLibre com 241 territórios, Natural Earth 1:50m, rios, lagos, litoral e cidades.
- Seis camadas com identidade própria: político, físico, demografia, economia, geopolítica
  e história.
- Coropléticos por quantis, crossfade de camada, seleção por diferença de `feature-state`,
  hover em `requestAnimationFrame` com bbox de 4–6 px.
- Globo 3D como projeção padrão (sem o mapa plano Mercator); relevo 3D opcional com DEM público (AWS Terrain Tiles),
  hillshade e atribuição visível.
- Rótulos DOM com cache de medida, colisão, prioridade e teto de 82; microestados ganham
  pontos de capital clicáveis.
- Escala gráfica, rosa dos ventos, leitura de coordenadas e projeção no canto do mapa.
- Linha do tempo 1945–2026 na camada de história, com recorte de blocos e fontes por evento.
- Territórios com estatuto disputado recebem hachura e nota curada, sem atribuição de soberania.
- Busca global (⌘K) por país, camada ou jogo.

### Dossiês

- Card de país com “at a glance”, abas por camada, comparação com a mediana mundial,
  percentil, sparkline da série 2016–2025, mini-mapa de localização e vizinhos.
- Bottom sheet no mobile com snap points (peek/half/full) e arraste.
- Link direto para `/country/[code]` com ficha técnica, indicadores por seção, séries,
  comparação entre países, linha do tempo, organizações, leituras e fontes.
- Compartilhamento de país/camada via URL (`/explore?country=BRA&layer=economy`).

### Jogos

| Jogo | Mecânica |
| --- | --- |
| Países do Mundo | clicar no país no mapa |
| Capitais | resposta digitada (PT/EN) |
| Rankings do Mundo | ordenar o top 5 por indicador |
| Blocos e Alianças | seleção múltipla + intruso |
| Sem Litoral | escolher entre países destacados |
| Silhuetas | reconhecer o país pelo contorno |
| Cadeia de Fronteiras | vizinhos, intrusos e países do mesmo continente |

- Motor de jogo independente do mapa: rodadas, regras, validação e pontuação.
- Página Play editorial com categorias, dificuldade, progresso, “continuar jogando” e recordes.
- Onboarding de uma tela por mecânica, modo lista acessível, atalhos 1–4, feedback com fonte.
- Count-up de pontos, pulso de acerto/erro e resultado com stagger.
- Desafio diário com seed determinístico por data e compartilhamento sem spoiler.
- Progresso de rodada persistido localmente, inclusive feedback pendente.

### Dados

- **Natural Earth 1:50m / 1:110m** (domínio público): fronteiras, nomes em pt-BR, rios,
  lagos, litoral, capitais e cidades.
- **mledoze/countries** (ODbL): capital, moeda, área, idiomas e vizinhos.
- **World Bank Open Data** (CC BY 4.0): 32 indicadores, série 2016–2025, observação mais
  recente por país com ano preservado. Inclui WGI (governança) e séries para sparklines.
- **AWS Terrain Tiles** (dados públicos): modelo digital de elevação carregado sob demanda.

Nenhum valor é estimado pelo app: lacuna aparece como “não disponível”. O pipeline é
reproduzível:

```bash
npm run data:build     # usa cache
npm run data:refresh   # baixa tudo de novo
```

## Estrutura

```
src/
├── lib/
│   ├── components/{map,cards,navigation,games,ui}/
│   ├── configurations/map-layers.ts
│   ├── data/{generated,countries,organizations,historical,snippets,disputed,timeline}/
│   ├── engines/{map-engine,game-engine,scoring-engine}/
│   ├── progress.ts          # progresso/recordes/desafio diário
│   ├── theme.svelte.ts      # claro/escuro/sistema
│   └── i18n.ts              # estrutura PT/EN do shell
└── routes/{explore,country/[code],play,game/[slug],sobre}
tools/
├── build-data.mjs           # pipeline de dados
├── screenshots.mjs          # screenshots comparáveis
├── smoke.mjs                # interação real
└── a11y.mjs                 # axe-core
```

O motor de jogos não importa o mapa. O mapa é um renderizador entre outros possíveis.

## Limitações conhecidas

- Natural Earth 1:50m: fronteiras generalizadas; microestados usam pontos de capital.
- O relevo sombreado e o modo 3D dependem de tiles públicos carregados pela rede.
- Blocos históricos e a linha do tempo usam os polígonos atuais; não são fronteiras do período.
- Bathymetria, fluxos comerciais e biomas/clima ainda não estão implementados.
- Indicadores em dólares correntes não são comparáveis entre anos sem ajuste; o ano é sempre exibido.
- HDI, corrupção (TI) e liberdade (Freedom House/RSF) não foram adicionados: exigem revisão
  de licença e metodologia fora do Banco Mundial.
- i18n tem estrutura e chaves PT/EN do shell; o conteúdo editorial ainda está em português.
- Sem autenticação, ranking global, backend ou PWA.

## Documentação

- [`docs/ROADMAP.md`](docs/ROADMAP.md) — backlog priorizado, status e critérios de aceite.
- [`docs/INSPIRATION.md`](docs/INSPIRATION.md) — referências, anti-padrões e direção escolhida.
- [`docs/HANDOFF.md`](docs/HANDOFF.md) — estado técnico, decisões e o que continua aberto.

## Próximos passos

1. Licenciar e integrar HDI, corrupção e liberdade; avaliar Comtrade para fluxos.
2. Biomas/clima (Köppen/Beck) e bathymetria com tiles próprios.
3. Playwright como suíte de regressão visual em CI, com thresholds de performance.
4. i18n completo EN e revisão editorial.
5. P2: backend/PostGIS, contas, editor de jogos e ranking global.
