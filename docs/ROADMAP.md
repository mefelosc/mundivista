# Roadmap — Mundivista

**Nome aprovado:** Mundivista.
**Estado (2026-10-31):** P0 executado e P1 executado com as pendências explícitas abaixo.
Commit de referência desta sessão ao final do histórico.
**Objetivo do produto:** atlas interativo + camadas de dados + minigames, com o mapa como
interface central e dados verificáveis.

---

## 1. Princípios que não mudam

1. **O mapa é o produto.** Se uma decisão de UI reduz o mapa a um fundo, ela está errada.
2. **Nada de dado inventado.** Lacuna = “não disponível”; todo número tem ano e fonte.
3. **Original, não genérico.** Sem glassmorphism, gradientes roxos, cards iguais ou emojis
   como ícones.
4. **Geográfico e editorial.** Cartografia, atlas impressos, instrumentos de navegação e
   jornalismo de dados.
5. **Rápido é parte do design.** Pan fluido, seleção imediata, transições curtas.
6. **Acessível por padrão.** Teclado, contraste, movimento reduzido, fallback em lista.
7. **Arquitetura desacoplada.** Jogo ≠ mapa ≠ dados ≠ UI.

---

## 2. O que já existe

- SvelteKit 3 + Svelte 5 + TypeScript + Tailwind 4 + MapLibre 6, adapter-static.
- Mapa 1:50m com 241 territórios, seleção, hover, rótulos com colisão, graticula,
  rios/lagos, litoral, cidades, capitais e relevo sombreado opcional.
- 6 camadas: político, físico, demografia, economia, geopolítica, história.
- Globo 3D, relevo 3D, tema claro/escuro/sistema, Mercator, crossfade de camada.
- Coropléticos por quantis, feature-state, destaque de blocos e de vizinhos sob demanda no card.
- Card com “at a glance”, abas, mediana/percentil, sparkline, mini-mapa e compartilhamento.
- Dossiê `/country/[code]` com séries, comparação, timeline, organizações e fontes.
- 32 indicadores do Banco Mundial com ano, série, cobertura e fonte; página `/sobre`.
- 7 jogos, motor desacoplado, progresso local, onboarding, modo lista e desafio diário.
- Landing editorial, busca ⌘K, i18n do shell PT/EN.
- 63 testes, `svelte-check` 0 erros, build estático, axe sem violações sérias, smoke test.
- Worker do MapLibre corrigido com `?worker&url` (não remover).

---

## 3. Prioridades

### P0 — executado

#### 3.1 Identidade visual — direção B, Atlas Editorial

- [x] Auditar a UI e listar o que parecia template genérico.
- [x] Comparar as três direções de `INSPIRATION.md` (Carta Náutica, Atlas Editorial,
      Sala de Mapas) e escolher **B** como base, com o escuro como “atlas à noite”.
      Decisão delegada pelo dono nesta sessão.
- [x] Implementar tokens de tema (papel, tinta, vinho, ocre, água, verde) e modo escuro
      com a mesma hierarquia.
- [x] Criar conjunto próprio de ícones cartográficos 24 px / traço 1,5.
- [x] Tipografia: Fraunces (display), Inter (UI), JetBrains Mono (dados).
- [x] Remover gradientes/vidro genéricos; usar réguas, ticks, numeração, legenda e grão.
- [x] Motion system 180–320 ms, `cubic-bezier(.22,1,.36,1)`, stagger e reduced-motion.

**Aceite:** direção implementada em Explore, Play, Game, Dossiê e Sobre, com screenshots
comparáveis em `docs/screenshots/` (desktop/mobile, claro/escuro).

#### 3.2 Mapa: tema claro/escuro + 3D + fluidez

- [x] Toggle claro/escuro/sistema persistido em `localStorage`, aplicado antes do paint.
- [x] Globo 3D com `projection: { type: 'globe' }` e controle 2D/Globo.
- [x] Terreno 3D opcional com raster-dem Terrarium (AWS), hillshade, pitch e atribuição.
- [x] Seleção fluida: bbox de 4–6 px, hover em `requestAnimationFrame`, estados por diferença.
- [x] `flyTo` com `essential: true`, curva e velocidade ajustadas.
- [x] Hit area para microestados via pontos de capital (42 microterritórios).
- [x] Crossfade de camada com duas camadas de fill e transição de 340 ms.
- [x] Rótulos DOM com cache de medida, prioridade, colisão e teto de 82.
- [x] Escala gráfica, rosa dos ventos, coordenadas e projeção.
- [x] Mercator e Globo testados. Equal Earth não é suportada pelo MapLibre 6; documentado
      em vez de simular uma projeção.

**Aceite:** alternância claro/escuro/3D sem reload; seleção perceptivelmente imediata;
sem flash de camada. Medição formal de 60 fps em hardware intermediário segue pendente.

#### 3.3 Camadas com personalidade cartográfica

- [x] **Político:** tints continentais, litoral mais forte que fronteira, capitais, vizinhos
      sob demanda no card, rótulos com halo.
- [x] **Físico:** hillshade real, rios/lagos, litoral, rótulos de relevo; cores de país não
      fingem ser hipsometria.
- [x] **Demografia:** coroplético de densidade + pontos de cidades principais.
- [x] **Economia:** coroplético de PIB per capita em ocre; setores no card/dossiê.
- [x] **Geopolítica:** destaque de bloco, membros, hachura para estatuto disputado e nota.
- [x] **História:** linha do tempo 1945–2026, recorte de blocos e eventos com fonte.
- [x] Cada camada tem legenda, nota de método e fonte.

**Aceite:** cada camada tem identidade visual distinta e legenda que explica a codificação.
Bathymetria, fluxos comerciais e CShapes ficam como evolução.

#### 3.4 Card do país + página profunda

- [x] Links Wikipédia/Britannica.
- [x] Hierarquia “at a glance” + abas por camada + mediana mundial + percentil.
- [x] Sparkline das séries 2016–2025.
- [x] Mini-mapa de localização e vizinhos.
- [x] Botão “Abrir dossiê” → `/country/[code]` com fontes por seção, timeline e organizações.
- [x] Compartilhar link direto de país/camada e restaurar estado pela URL.
- [x] Mobile: bottom sheet com snap points (peek/half/full), drag handle e backdrop.

**Aceite:** card não cobre o mapa inteiro no mobile por padrão; toda afirmação tem fonte
acessível a um clique.

#### 3.5 Play + jogos

- [x] Redesenhar Play com destaque editorial, categorias, dificuldade, progresso,
      “continuar jogando” e recordes.
- [x] Temas por categoria com acentos distintos.
- [x] Animações: fly-to, pulso de acerto/erro, count-up de pontos, stagger no resultado.
- [x] Onboarding de uma tela por mecânica.
- [x] Modo lista acessível para jogos de mapa.
- [x] Novos jogos: **Silhuetas** e **Cadeia de Fronteiras**.
- [x] Desafio diário com seed determinístico e compartilhamento sem spoiler.
- [x] Dificuldade exibida por jogo.
- [ ] Dificuldade selecionável, vidas e timer opcional. Hints já existem e são sempre
      exibidos; falta o seletor de modo.

**Aceite:** jogar do início ao fim sem mouse (modo lista); animações fluidas; Play com
identidade própria.

### P1 — executado com pendências

- [x] Busca/command palette (⌘K) por país, camada e jogo.
- [x] Landing editorial com manifesto, contorno do mundo, camadas e teasers.
- [x] Mais dados: Gini, desemprego, inflação, dívida, CO₂ total, energia, turismo,
      educação, saúde e WGI (governança).
- [x] Séries temporais (sparklines) e comparação entre países no dossiê.
- [x] Acessibilidade: foco, `aria-live`, contraste, teclado, skip link, axe sem violações sérias.
- [x] Performance: MapLibre e command palette em chunks lazy; dados compartilhados reduzidos.
- [x] Testes de interação e screenshots Playwright/Firefox (`smoke`, `a11y`, `shots`).
- [x] i18n: estrutura de mensagens PT/EN do shell, com paridade testada.
- [ ] Tradução completa do conteúdo editorial para EN.
- [ ] Biomas/clima (Köppen/Beck) e camadas físicas derivadas.
- [ ] Bathymetria e fluxos comerciais.
- [ ] HDI, corrupção (TI), liberdade (Freedom House/RSF): exigem licença/uso comercial.
- [ ] Orçamento de performance no CI (Lighthouse/bundle budgets).

### P2 — expansão

- [ ] Backend/Postgres/PostGIS, autenticação, perfis.
- [ ] Editor visual de jogos e comunidade.
- [ ] Ranking global, comentários, moderação.
- [ ] Subdivisões administrativas (admin-1) e dados subnacionais.
- [ ] App/PWA offline.

---

## 4. Dados: estado e próximos passos

1. [x] `src/lib/data/sources.ts`-equivalente: metadados vivem em
   `generated/sources.json` + `indicatorMeta`.
2. [x] Pipeline com séries temporais (não só o último valor).
3. [x] Testes de integridade: fonte/ano por indicador, códigos no GeoJSON, séries ordenadas.
4. [x] Licenças avaliadas para Natural Earth (PD), World Bank (CC BY 4.0), mledoze (ODbL),
   AWS Terrain Tiles (dados públicos).
5. [x] Anos/metodologias preservados (`retrievedAt`, `y`, `lastUpdated`).
6. [x] Territórios disputados com contexto curado, hachura e fonte; sem tratar como consenso.

Pendente: decidir licença de HDI/TI/FH/RSF e de eventuais bases de biomas/bathymetria.

---

## 5. Notas técnicas e riscos

- **Worker do MapLibre:** `import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'`
  + `setWorkerUrl(workerUrl)`. Testar build + preview após trocar de versão.
- **Globo 3D:** MapLibre 6 suporta `projection: { type: 'globe' }`; rótulos DOM são checados
  contra a face visível com `unproject`.
- **Terreno:** DEM público tem licença/atribuição; o app não guarda API key e carrega os tiles
  sob demanda. Sem rede, o mapa permanece plano.
- **Adapter static:** rotas dinâmicas precisam de `entries`; jogos e dossiês já usam.
- **Bundle:** MapLibre ~1,1 MB (298 KB gzip) em chunk lazy. O chunk compartilhado caiu de
  ~1,44 MB para ~307 KB após carregar a command palette sob demanda.
- **Rótulos DOM:** teto de 82 e cache de largura; migrar para canvas só se o custo aparecer.
- **Microestados:** pontos de capital com clique ampliado.
- **Dados históricos:** fronteiras mudam; a timeline usa polígonos atuais e diz isso.

---

## 6. Definição de pronto

- `npm run check` 0 erros, `npm test` verde, `npm run build` OK.
- Screenshots desktop (1440) e mobile (390) da mudança.
- Nenhum dado novo sem fonte/ano.
- Nenhuma regressão perceptível de performance.
- Texto em PT-BR consistente, sem jargão desnecessário.
- Commit pequeno e descritivo.
