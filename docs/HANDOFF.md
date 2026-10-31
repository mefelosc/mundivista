# Handoff — como continuar em uma nova sessão

**Estado:** P0 e P1 do roadmap executados em 2026-10-31. O projeto está em
`~/projects/foss/mundivista`, com 77 testes, `svelte-check` sem erros, build estático,
axe sem violações sérias e smoke test em Firefox.

---

## Prompt para colar na nova sessão

```text
Assuma o projeto Mundivista em ~/projects/foss/mundivista (SvelteKit 3 + Svelte 5 +
TypeScript + Tailwind 4 + MapLibre 6, adapter-static).

Leia, nesta ordem:
1. README.md
2. docs/ROADMAP.md
3. docs/INSPIRATION.md (direção escolhida: B, Atlas Editorial)
4. docs/HANDOFF.md

O P0 e o P1 estão implementados. Antes de mexer, rode:
npm test && npm run check && npm run build
e, com preview em http://localhost:4173: npm run smoke && npm run a11y && npm run shots.

Regras:
- Não inventar dados. Todo indicador precisa de fonte, ano e unidade; lacuna = "não disponível".
- Não quebrar o worker do MapLibre:
  import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url' + setWorkerUrl.
  Testar build + preview após mexer.
- O motor de jogos não pode depender do mapa.
- O nome/branding vive em src/lib/brand.ts; a identidade em src/app.css.
- Commits pequenos e descritivos.
- Screenshots desktop (1440x900) e mobile (390x844), claro e escuro, para mudanças visuais.

Prioridades abertas (ver ROADMAP §3):
(a) seletor de dificuldade/vidas/timer opcional nos jogos;
(b) tradução EN completa do conteúdo editorial (i18n do shell já existe);
(c) biomas/clima, bathymetria e fluxos comerciais;
(d) HDI/TI/Freedom House/RSF com revisão de licença;
(e) budgets de performance no CI;
(f) P2: backend/PostGIS, contas, editor e ranking.
```

---

## Comandos

```bash
cd ~/projects/foss/mundivista
npm run dev        # dev
npm run check      # svelte-check (deve dar 0)
npm test           # 77 testes
npm run build      # build estático em build/
npm run preview    # preview do build (porta 4173)
npm run data:build # regenera dados com cache
npm run data:refresh
npm run data:subdivisions # unidades administrativas por país
npm run shots      # screenshots em docs/screenshots
npm run smoke      # interação no preview
npm run a11y       # axe-core WCAG 2.1 AA
```

---

## Estrutura

```
src/
  app.css              # tokens claro/escuro, tipografia, utilities, motion
  lib/
    brand.ts
    theme.svelte.ts    # preferência system/light/dark
    i18n.ts            # mensagens PT/EN do shell
    progress.ts        # recordes, progresso e desafio diário
    components/{map,cards,navigation,games,ui}/
      map/MapCanvas.svelte  # estilo, crossfade, globe, DEM, rótulos, hit area
      map/Timeline.svelte   # linha do tempo 1945–2026
      navigation/CommandPalette.svelte
      cards/CountryCard.svelte / LocatorMap.svelte / Sparkline.svelte
      games/GameRunner.svelte
    configurations/map-layers.ts  # camadas + cores por tema
    data/generated/    # countries, indicators, world, physical, cities, silhouettes
    data/{disputed,timeline,organizations,historical,snippets,cities,silhouettes}
    engines/{map-engine,game-engine,scoring-engine}/
  routes/{explore,country/[code],play,game/[slug],sobre}
tools/{build-data,build-subdivisions,screenshots,smoke,a11y}.mjs
docs/{ROADMAP,INSPIRATION,HANDOFF}.md
```

---

## Decisões desta sessão

- **Identidade:** direção B (Atlas Editorial); o escuro é o atlas à noite. Azul/água só
  dentro do mapa; a UI fora dele fica na paleta papel frio/verde/ametista/malva.
- **Mapa:** abre no mapa base **2D em Equal Earth** (`addProjection` + proj4 no main e no
  worker), sem camada temática; globo 3D e relevo ficam como opções no globo (DEM em
  Mercator). Crossfade por duas camadas de fill.
- **Camadas:** a camada `standard` (Padrão) é o estado inicial e não entra na lista de seis
  camadas temáticas; clicar de novo na camada ativa volta a ela.
- **Cards/dossiê:** o card virou ficha em blocos (identidade, métricas, abas curtas,
  cartões de indicador) sem mini-mapa redundante; o dossiê ganhou nav de seções com scroll
  spy, cards de seção, métricas com série e barra lateral fixa.
- **Portal/Play/HUD:** portal em tela cheia com mapa-múndi de fundo e quatro entradas
  grandes; Play como sala de jogos em cards; configurações com idioma, tema, som e texto;
  `focusCountry` centraliza o país ao lado do card e a bandeira cobre o território no acerto.
- **HUD:** rail de camadas recolhível (persistido em `mundivista:rail`), legenda contextual
  recolhível, descrição da camada dentro da legenda e controles agrupados no canto inferior
  direito. No mobile, os controles ficam no topo direito para não ficarem sob o card.
- **Unidades administrativas:** na camada política, o país selecionado carrega sob demanda
  `generated/subdivisions/{ADM0_A3}.json` (Natural Earth 1:10m, simplificado) e desenha
  contornos + rótulos, além da lista no card. O nível varia por país.
- **Microestados:** pontos de capital clicáveis (`cities` com `micro: true`).
- **História:** timeline 1945–2026 com eventos curados e recorte de blocos; usa polígonos
  atuais e diz isso. CShapes não foi integrado.
- **Mares:** rótulos vêm de `ne_50m_geography_marine_polys`; a posição é calculada dentro do
  polígono (polylabel simplificado) e o `name_pt` é usado.
- **Países pequenos:** camada invisível `country-hit-points` com raio de 16 px; o clique
  escolhe o ponto mais próximo antes de consultar os polígonos.
- **Dependências:** `sovereignCountry()` liga Groenlândia → Dinamarca, Ilhas Feroe → Dinamarca,
  Porto Rico → EUA etc., exibido no card e no dossiê.
- **Disputados:** lista curada (KOS, PSX, SAH, FLK, KAS, IOT), hachura e nota; Israel não
  é hachurado só porque o Natural Earth marca TYPE=Disputed.
- **Dados:** 32 indicadores, séries 2016–2025, cidades, litoral e silhuetas no pipeline.
  Códigos históricos do WB são resolvidos por candidatos (COD, NOR, ROU, TLS, PSE, NRU);
  Somalilândia tem fatos próprios e não herda Somália; lacunas sem série continuam explícitas.
- **Jogos:** 9 jogos; novos Silhuetas, Cadeia de Fronteiras, Bandeiras e Economia em Números; progresso persistente.
  Rankings usa montagem por cliques (pool + lista), sem setas; a interface é toda focável.
  A biblioteca usa capas visuais e tema por categoria; no jogo de países os rótulos do mapa
  ficam ocultos, e no jogo de bandeiras as alternativas não mostram bandeiras.
- **Som:** `src/lib/sound.svelte.ts` sintetiza clique/acerto/erro/fim com WebAudio; botão de mudo no TopBar.
- **Busca:** command palette carregada sob demanda no TopBar, disponível em todas as rotas.

---

## Armadilhas conhecidas

- `#lib` exige `paths` no `tsconfig.json`; Vite resolve pelo `imports` do package.json.
- Rotas dinâmicas com `prerender = true` precisam de `entries` (jogo e dossiê já têm).
- `page.url.searchParams` não pode ser lido durante prerender; o TopBar usa
  `typeof window` para escolher o locale.
- A projeção customizada precisa existir no estilo antes das sources carregarem. Trocar
  Globo ↔ 2D remonta o `MapCanvas` via `{#key projection}`; não use `setProjection`
  depois do load.
- O worker em `src/lib/map/worker.ts` importa o worker do MapLibre e registra o handler
  do proj4. Sem ele, o GeoJSON é desenhado na posição errada em Equal Earth.
- `npm run preview` precisa ser reiniciado após build; se a porta estiver ocupada,
  `fuser -k 4173/tcp`.
- Firefox do Playwright está em `~/.cache/ms-playwright/firefox-1555/firefox/firefox`;
  os scripts usam esse caminho.
- O skip link aponta para `#conteudo`; toda rota nova precisa desse id.
- O build tem dois chunks grandes (>500 kB): MapLibre é lazy; o chunk compartilhado foi
  reduzido ao carregar a palette sob demanda.
- `PSE`/`PSX`, `XKX`/`KOS`, `SSD`/`SDS` são aliases; o mapa usa os códigos do Natural Earth.

---

## Backlog do dono (texto original)

> o mapa em si precisa de mais refino, ter escolha entre fundo claro ou escuro do mapa,
> deixar o mapa mais fluído de e escolher os países, animações mais fluidas e mais rápido,
> opção de mapa 3d acho que também é necessário, os mapas políticos, relevo, e afins estão
> muito pouco personalizados, apenas umas cores, nada demais, da pra melhorar todos eles,
> a própria UI/UX do site ta muito ai slop, deixe mais original, focado em geografia e
> geopolitica, com ícones legais, temas, e os cards dos países também, outra coisa é que
> além dos cards da pra ter algum botão para enviar o usuário para um link do wiki ou
> britannica sobre o país, outra coisa é refinar os jogos, mais animações, temas, melhorar
> a ui da página jogos, outra coisa é pegar inspiração em sites já bem acessados com o mesmo
> tema, e se inspirar no que funciona, mas somos originais, então vamos seguir com o resto
> das otimizações tbm, mobile, mais dados, mais modos, melhorar a ui/ux, testar diferentes
> identidades visuais, polir a perfomance/animações e afins.
