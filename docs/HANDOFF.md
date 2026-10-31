# Handoff — como continuar em uma nova sessão

Esta sessão entregou o MVP. O contexto está alto; o trabalho pesado deve continuar em uma
sessão nova, com o prompt abaixo.

---

## Prompt para colar na nova sessão

```text
Assuma o projeto Mundivista em ~/projects/foss/mundivista (SvelteKit 3 + Svelte 5 +
TypeScript + Tailwind 4 + MapLibre 6, adapter-static).

Leia, nesta ordem:
1. README.md
2. docs/ROADMAP.md
3. docs/INSPIRATION.md
4. docs/HANDOFF.md

O dono do produto aprovou o nome "Mundivista". O MVP já tem mapa, 6 camadas, card de país,
20 indicadores do Banco Mundial, 5 jogos, pontuação e página de fontes. Estado: 44 testes
verdes, svelte-check 0 erros, build estático OK.

Objetivo desta sessão: executar o P0 do roadmap, com prioridade para:
(a) testar 3 direções de identidade visual e implementar a escolhida (menos "AI slop",
    mais atlas/cartografia/geopolítica; ícones próprios; tipografia com personalidade);
(b) mapa com tema claro/escuro + globo 3D + terreno opcional;
(c) seleção/pan/zoom mais fluidos e rápidos;
(d) camadas político/físico/demografia/economia/geopolítica/história com estilos
    cartográficos distintos, não só cores;
(e) card de país com hierarquia melhor, comparação, série temporal e link para dossiê;
(f) Play e jogos com mais animação, temas e UI própria;
(g) mobile: bottom sheet com snap points, controles e performance.

Regras:
- Não inventar dados. Todo indicador precisa de fonte, ano e unidade; lacuna = "não disponível".
- Não quebrar o worker do MapLibre: ele usa
  `import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'` +
  `setWorkerUrl(workerUrl)`. Testar build + preview após mexer.
- O motor de jogos não pode depender do mapa.
- O nome/branding vive em src/lib/brand.ts.
- Rodar `npm run check`, `npm test` e `npm run build` antes de cada commit.
- Commits pequenos e descritivos. Sem dados fictícios, sem botões decorativos.
- Se uma decisão visual for grande, gerar screenshots desktop (1440x900) e mobile (390x844)
  antes/depois e comparar.

Comece auditando a UI atual e propondo as 3 direções de identidade (com paleta, tipografia,
ícones e exemplo de mapa). Depois implemente a direção aprovada e siga para o mapa 3D/temas.
```

---

## Estado técnico (para não redescobrir)

### Comandos
```bash
cd ~/projects/foss/mundivista
npm run dev        # dev
npm run check      # svelte-check (deve dar 0)
npm test           # 44 testes
npm run build      # build estático em build/
npm run preview    # preview do build
npm run data:build # regenera dados com cache
npm run data:refresh
```

### Estrutura
```
src/lib/
  brand.ts
  components/{map,cards,navigation,games,ui}/
  configurations/map-layers.ts
  data/{generated,countries,organizations,historical,snippets,capitals-pt,physical-labels,world}.ts
  engines/{map-engine,game-engine,scoring-engine}/
  format.ts
  types.ts
src/routes/{explore,play,game/[slug],sobre}
tools/build-data.mjs
docs/{ROADMAP,INSPIRATION,HANDOFF}.md
```

### Decisões já tomadas
- Dados: Natural Earth 1:50m (fronteiras, rios, lagos, capitais), mledoze/countries
  (capital, moeda, área, vizinhos), World Bank (20 indicadores, 2016–2025, último valor
  por país com ano).
- O GeoJSON é importado com `?url` e servido como asset; não entra no bundle JS.
- Rótulos do mapa são DOM com colisão (não symbol layers), para tipografia própria.
- Coroplético por quantis com `feature-state` + expressão `interpolate`.
- Jogos: `GameRound` declara `rule` (code/set/text/order) e `interaction`; o motor valida
  e o `GameRunner` renderiza. Novos jogos entram em `registry.ts`.
- Tema escuro atual: `--color-ink-*`, `--color-mist-*`, `--color-gold-*`,
  `--color-signal-*` em `src/app.css`.

### Armadilhas conhecidas
- `#lib` exige `paths` no `tsconfig.json`; Vite resolve pelo `imports` do package.json.
- Rotas dinâmicas com `prerender = true` precisam de `entries` (jogo já tem).
- `npm run preview` precisa ser reiniciado após build; se a porta estiver ocupada,
  `fuser -k 4173/tcp` (não usar `pkill` com o padrão do próprio comando).
- O Firefox do Playwright está em `~/.cache/ms-playwright/firefox-1555/firefox/firefox`;
  `playwright-core` foi removido do projeto. Reinstalar como dev dep se for tirar screenshots.
- O card no mobile cobre boa parte do mapa; o próximo passo é bottom sheet com snap points.
- Microestados são difíceis de clicar em zoom mundial; considerar camada de pontos.
- O build atual tem um chunk grande (MapLibre ~1.1MB / 298KB gzip); avaliar lazy load.

---

## Backlog do dono (texto original, para não perder nada)

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

Itens já feitos desta lista: nome aprovado, links Wikipédia/Britannica no card.
