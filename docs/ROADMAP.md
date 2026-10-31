# Roadmap — Mundivista

**Nome aprovado:** Mundivista (provisório apenas em termos de marca registrada; a identidade
visual definitiva ainda será testada).
**Estado:** MVP navegável em `~/projects/foss/mundivista`, commit `bd1f1bc`.
**Objetivo do produto:** atlas interativo + camadas de dados + minigames, com o mapa como
interface central e dados verificáveis.

---

## 1. Princípios que não mudam

1. **O mapa é o produto.** Se uma decisão de UI reduz o mapa a um fundo, ela está errada.
2. **Nada de dado inventado.** Lacuna = “não disponível”; todo número tem ano e fonte.
3. **Original, não genérico.** Evitar glassmorphism padrão, gradientes roxos, cards
   arredondados iguais, emojis como ícones e hero centralizado de SaaS.
4. **Geográfico e editorial.** A linguagem visual deve lembrar cartografia, atlas impressos,
   instrumentos de navegação e jornalismo de dados — não um dashboard genérico.
5. **Rápido é parte do design.** 60 fps ao arrastar, seleção imediata, transições curtas.
6. **Acessível por padrão.** Teclado, contraste, movimento reduzido, fallback em lista.
7. **Arquitetura desacoplada.** Jogo ≠ mapa ≠ dados ≠ UI.

---

## 2. O que já existe (não refazer)

- SvelteKit 3 + Svelte 5 + TypeScript + Tailwind 4 + MapLibre 6, adapter-static.
- Mapa 1:50m com 241 territórios, seleção, hover, rótulos com colisão, graticula,
  rios/lagos, capitais e relevo simplificado.
- 6 camadas: político, físico, demografia, economia, geopolítica, história.
- Coropléticos por quantis, feature-state, destaque de blocos.
- Card contextual com identidade, demografia, economia, meio físico, geopolítica, história,
  vizinhos, snippet e links Wikipédia/Britannica.
- 20 indicadores do Banco Mundial com ano, cobertura e fonte; página `/sobre`.
- 5 jogos (mapa single, mapa multi, texto, ordem), motor desacoplado, pontuação,
  feedback, recorde local.
- 44 testes, `svelte-check` 0 erros, build estático funcionando.
- Worker do MapLibre corrigido com `?worker&url` (não remover).

---

## 3. Prioridades

### P0 — próxima sessão (impacto visual e de experiência)

#### 3.1 Identidade visual (o maior ganho)
- [ ] Auditar a UI atual e listar tudo que parece “template genérico”.
- [ ] Testar **3 direções** em páginas estáticas/screenshots:
  - **A. Carta Náutica** — azul-tinta, latão, marfim, painéis de instrumento.
  - **B. Atlas Editorial** — papel quente, tinta, vinho, serifada de display.
  - **C. Sala de Mapas** — verde profundo, cobre oxidado, curvas de nível.
- [ ] Escolher uma direção com o dono do produto.
- [ ] Implementar tokens de tema (cores, tipografia, espaçamento, raios, sombras, motion).
- [ ] Criar conjunto de ícones próprio (24px, traço 1.5, grade consistente), baseado em
  símbolos cartográficos: rosa dos ventos, curva de nível, marco de fronteira, globo,
  estrato, rio, pico, densidade, moeda, aliança, linha do tempo.
- [ ] Tipografia: display (serifada ou sans condensada) + Inter para UI + mono para dados.
  Testar legibilidade em 10–11px nos rótulos do mapa.
- [ ] Remover gradientes e vidros genéricos; usar réguas finas, ticks, numeração de seção,
  legendas de mapa e textura sutil de papel/ruído.
- [ ] Definir motion system: 180–320ms, `cubic-bezier(.22,1,.36,1)`, stagger 30–60ms,
  `prefers-reduced-motion`.

**Aceite:** 3 screenshots comparáveis (desktop/mobile) e uma direção implementada em
Explore, Play, Game e Sobre.

#### 3.2 Mapa: tema claro/escuro + 3D + fluidez
- [ ] Toggle **claro/escuro** no mapa, persistido em `localStorage`, com opção “sistema”.
  - Claro: papel (#f3eee3), terra (#e7ddc9), água (#dfe9ee), bordas (#8a7a5f), texto (#2a241b).
  - Escuro: manter o atual, mas com mais contraste e menos “cinza morto”.
- [ ] **Globo 3D** com `projection: { type: 'globe' }` e botão “2D / 3D”.
  - Testar performance em 390px e 1440px; limitar `maxZoom` e rótulos no globo.
- [ ] **Terreno 3D** opcional: `raster-dem` (avaliar AWS Terrarium / MapTiler / DEM local),
  `terrain: { source, exaggeration }`, hillshade. Registrar atribuição e licença.
- [ ] Seleção mais fluida:
  - `queryRenderedFeatures` com bbox de 4–6px e throttle em `requestAnimationFrame`.
  - Pré-calcular centróides; evitar 241 `setFeatureState` por hover.
  - `flyTo` com `essential: true`, `speed`/`curve` ajustados; evitar saltos.
  - Hit area mínima para microestados: usar círculo de seleção em zoom alto.
- [ ] Transições de camada: crossfade de 300–400ms, sem recarregar o GeoJSON.
- [ ] Rótulos: substituir DOM por canvas (ou manter DOM com cache e limite de 60–80),
  medir custo em mobile; mostrar menos rótulos em zoom mundial.
- [ ] Adicionar escala gráfica, rosa dos ventos e leitura de coordenadas mais editorial.
- [ ] Testar projeções: Mercator (padrão), Globo; avaliar Equal Earth como modo estático.

**Aceite:** alternância claro/escuro/3D sem reload; pan a 60fps em notebook intermediário;
seleção < 100ms; nenhum “flash” de camada.

#### 3.3 Camadas com personalidade cartográfica
- [ ] **Político:** hierarquia de bordas (costa mais forte), capitais, países vizinhos
  destacados, continentes com tints dessaturados, rótulos com halo.
- [ ] **Físico:** tints hipsométricos + hillshade + bathymetria + rios/lagos + rótulos de
  cordilheiras/desertos; opção “relevo 3D”.
- [ ] **Demografia:** coroplético de densidade + pontos de população/cidades principais;
  talvez dot density em zoom alto.
- [ ] **Economia:** PIB per capita + setores; avaliar fluxos comerciais (dados Comtrade)
  como arcos discretos.
- [ ] **Geopolítica:** destacar bloco + linhas/matriz de membros; hachura para territórios
  disputados com nota contextual.
- [ ] **História:** linha do tempo (1945–hoje) com snapshots de fronteiras (CShapes 2.0)
  ou, no mínimo, blocos históricos + eventos; nunca apresentar como fronteira “atual”.
- [ ] Cada camada com legenda própria, nota de método e fonte.

**Aceite:** cada camada tem identidade visual distinta e legenda que explica a codificação.

#### 3.4 Card do país + página profunda
- [x] Links Wikipédia/Britannica (feito).
- [ ] Reorganizar hierarquia: “at a glance” (população, PIB pc, área, capital) + abas por
  camada + comparação com mediana mundial + percentil.
- [ ] Adicionar série temporal (sparkline) quando houver dados.
- [ ] Mini-mapa de localização/vizinhos no card.
- [ ] Botão “Abrir dossiê” → `/country/[code]` com tudo, fontes por seção, timeline,
  organizações, snippets e links externos.
- [ ] Compartilhar link direto do país/camada.
- [ ] No mobile: bottom sheet com snap points (peek/half/full), drag handle, backdrop.

**Aceite:** card não cobre o mapa inteiro no mobile; toda afirmação tem fonte acessível.

#### 3.5 Play + jogos
- [ ] Redesenhar a página Play: destaque editorial, categorias, dificuldade, progresso,
  “continuar jogando”, recordes.
- [ ] Temas por categoria (político/físico/dados/história) com acentos distintos.
- [ ] Animações: fly-to do round, pulso de acerto/erro, contagem de pontos, transição de
  feedback, resultado com stagger.
- [ ] Onboarding de 1 tela por mecânica (sem tutorial chato).
- [ ] Modo lista acessível para jogos de mapa.
- [ ] Novos jogos: fronteiras históricas, rios/montanhas, cadeia de fronteiras,
  “qual país é este?” por silhueta, recursos naturais.
- [ ] Desafio diário com seed determinístico + compartilhar resultado (sem spoiler).
- [ ] Dificuldade/hints/lives/timer opcional.

**Aceite:** jogar do início ao fim sem mouse (modo lista); 60fps nas animações; página Play
com identidade própria.

### P1 — depois do P0

- [ ] Busca/command palette (⌘K), navegação por teclado no mapa.
- [ ] Landing editorial com manifesto, globo/mapa e teasers.
- [ ] Mais dados: HDI, Gini, desemprego, inflação, dívida, CO₂ total, energia, turismo,
  educação, saúde, governança (WGI), corrupção (TI), liberdade (Freedom House/RSF).
- [ ] Séries temporais e comparação entre países.
- [ ] Camadas físicas com DEM/clima/biomas (Köppen/Beck et al., RESOLVE, ESA).
- [ ] Acessibilidade completa (AA, foco, aria-live, contraste, daltonismo).
- [ ] Performance: code-split do MapLibre, preload do GeoJSON, budgets, Lighthouse.
- [ ] Testes visuais Playwright (desktop/mobile, claro/escuro).
- [ ] i18n PT/EN (estrutura de mensagens, não traduzir tudo agora).

### P2 — expansão

- [ ] Backend/Postgres/PostGIS, autenticação, perfis.
- [ ] Editor visual de jogos e comunidade.
- [ ] Ranking global, comentários, moderação.
- [ ] Subdivisões administrativas (admin-1) e dados subnacionais.
- [ ] App/PWA offline.

---

## 4. Dados: próximos passos

1. Criar `src/lib/data/sources.ts` como registro único (nome, URL, licença, cobertura,
   data de extração, método).
2. Estender o pipeline para séries temporais (não só último valor).
3. Validar automaticamente: todo indicador tem fonte/ano; nenhum valor sem metadado;
   códigos de país existem no GeoJSON.
4. Avaliar licenças antes de adicionar: Natural Earth (PD), World Bank (CC BY 4.0),
   mledoze (ODbL), UNDP (verificar), TI/Freedom House/RSF (verificar uso comercial),
   CShapes (verificar), Köppen/Beck (CC BY 4.0), RESOLVE (CC BY 4.0), ESA (verificar).
5. Nunca misturar anos/metodologias sem aviso; manter `retrievedAt` e `lastUpdated`.
6. Para territórios disputados: apresentar contexto, critério e fonte; não tratar como
   consenso.

---

## 5. Notas técnicas e riscos

- **Worker do MapLibre:** já corrigido com `import workerUrl from
  'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'` + `setWorkerUrl(workerUrl)`.
  Se trocar de versão, testar build + preview.
- **Globo 3D:** MapLibre 6 suporta `projection: { type: 'globe' }`; validar rótulos DOM
  (posições/projeção) e performance.
- **Terreno:** DEM público tem licença/atribuição; evitar tiles com API key em build
  estático. Considerar DEM local de baixa resolução para o modo 3D.
- **Adapter static:** rotas dinâmicas precisam de `entries`; jogos já usam.
- **Bundle:** MapLibre ~1.1MB (298KB gzip). Lazy load só nas rotas de mapa; medir.
- **Rótulos DOM:** 241 elementos; se o custo aparecer, migrar para canvas.
- **Microestados:** 1:50m ainda é difícil de clicar; considerar camada de pontos
  (capitais) com hit area maior em zoom alto.
- **Dados históricos:** fronteiras mudam; não fingir precisão. Usar snapshots e notas.

---

## 6. Definição de pronto (por entrega)

- `npm run check` 0 erros, `npm test` verde, `npm run build` OK.
- Screenshots desktop (1440) e mobile (390) da mudança.
- Nenhum dado novo sem fonte/ano.
- Nenhuma regressão de performance perceptível (pan/zoom fluido).
- Texto em PT-BR consistente, sem jargão desnecessário.
- Commit pequeno e descritivo.
