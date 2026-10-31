# Handoff — como continuar em uma nova sessão

**Estado:** P0 e P1 do roadmap executados em 2026-10-31. O projeto está em
`~/projects/foss/mundivista`, com 63 testes, `svelte-check` sem erros, build estático,
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
npm test           # 63 testes
npm run build      # build estático em build/
npm run preview    # preview do build (porta 4173)
npm run data:build # regenera dados com cache
npm run data:refresh
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
tools/{build-data,screenshots,smoke,a11y}.mjs
docs/{ROADMAP,INSPIRATION,HANDOFF}.md
```

---

## Decisões desta sessão

- **Identidade:** direção B (Atlas Editorial); o escuro é o atlas à noite.
- **Mapa:** Globo como padrão e 2D em Equal Earth (`addProjection` + proj4 no main e no
  worker); relevo 3D apenas no globo (DEM em Mercator); crossfade por duas camadas de fill.
- **Microestados:** pontos de capital clicáveis (`cities` com `micro: true`).
- **História:** timeline 1945–2026 com eventos curados e recorte de blocos; usa polígonos
  atuais e diz isso. CShapes não foi integrado.
- **Disputados:** lista curada (KOS, PSX, SAH, FLK, KAS, IOT), hachura e nota; Israel não
  é hachurado só porque o Natural Earth marca TYPE=Disputed.
- **Dados:** 32 indicadores, séries 2016–2025, cidades, litoral e silhuetas no pipeline.
- **Jogos:** 7 jogos; novos Silhuetas e Cadeia de Fronteiras; progresso persistente.
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
