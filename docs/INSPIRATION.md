# Referências e direções de identidade

Objetivo: sair do visual “template de IA” e construir uma linguagem própria de **atlas
interativo de geografia e geopolítica**. Inspirar-se em quem resolveu problemas parecidos,
sem copiar layout, paleta ou marca.

---

## 1. Referências que valem estudo

| Referência | O que aprender | O que não copiar |
| --- | --- | --- |
| [Our World in Data](https://ourworldindata.org) | Hierarquia editorial, fontes visíveis, gráficos legíveis, texto que explica o dado | Densidade excessiva de texto |
| [Reuters Graphics](https://www.reuters.com/graphics/) | Anotações no mapa, paletas contidas, foco narrativo | Estilo jornalístico datado |
| [FT Visual & Data Journalism](https://www.ft.com/visual-and-data-journalism) | Papel/tinta, tipografia editorial, mapas com hachura | Formalidade excessiva |
| [The Pudding](https://pudding.cool) | Interação com propósito, scroll como narrativa | Scroll hijacking |
| [ArcGIS Living Atlas](https://livingatlas.arcgis.com) | Catálogo de camadas, metadados, legendas | Complexidade de GIS profissional |
| [Google Earth](https://earth.google.com) | Globo 3D, fly-to, card de lugar | Chrome de produto Google |
| [MapLibre examples](https://maplibre.org/maplibre-gl-js/docs/examples/) | Globo, terreno, hillshade, performance | Demos sem curadoria |
| [Natural Earth](https://www.naturalearthdata.com) | Contenção cartográfica, hierarquia de feições | — |
| [CIA World Factbook](https://www.cia.gov/the-world-factbook/) | Estrutura de fatos por país, categorias | Estética institucional |
| [Britannica](https://www.britannica.com) / [Wikipédia](https://pt.wikipedia.org) | Estrutura de verbete, seções, links | Layout de enciclopédia |
| [GeoGuessr](https://www.geoguessr.com) | Loop de jogo curto, feedback imediato | Gamificação infantil |
| [Seterra](https://www.seterra.com) | Aprendizado por repetição, modos | UI datada |
| [Worldle](https://worldle.teuteuf.fr) / [Globle](https://globle-game.com) | Desafio diário, compartilhamento sem spoiler | Cópia de mecânica |
| [Radio Garden](https://radio.garden) | Interação de mapa que dá prazer | Novidade sem substância |
| [Earth Nullschool](https://earth.nullschool.net) | Camadas físicas, visualização científica | Performance pesada |
| [Windy](https://www.windy.com) | Camadas meteorológicas, legenda clara | Excesso de controles |
| [David Rumsey Map Collection](https://www.davidrumsey.com) | Estética de atlas histórico, tipografia, ornamento | Nostalgia sem função |
| [Atlas of Economic Complexity](https://atlas.hks.harvard.edu) | Densidade de dados com hierarquia | Complexidade de entrada |
| [Datawrapper](https://www.datawrapper.de) | Legendas, eixos, clareza | — |
| [NASA Earth Observatory](https://earthobservatory.nasa.gov) | Imagens físicas, contexto científico | — |

### Padrões que funcionam
- Mapa em tela cheia + painéis flutuantes **contextuais** (não permanentes).
- Uma legenda por camada, com unidade, período e fonte.
- Progressão do geral para o específico: mundo → país → indicador → fonte.
- Tipografia com papéis claros: display, UI, dados (mono).
- Cor com função: uma cor de destaque, uma de alerta, uma de seleção; o resto é neutro.
- Microinterações rápidas (150–300ms) e feedback imediato.
- Fontes e metodologia sempre a um clique.
- Modo claro e escuro com a mesma hierarquia, não uma inversão automática.

### Anti-padrões (“ai slop”)
- Glassmorphism em tudo, cartões arredondados idênticos, sombras difusas sem função.
- Gradiente roxo/azul de SaaS, hero centralizado com “Welcome to…”.
- Emojis como ícones; ícones de bibliotecas diferentes misturados.
- Excesso de pills, badges e microanimações decorativas.
- Mapa como papel de parede, com UI competindo por atenção.
- Dados sem ano/fonte; “estimativas” silenciosas.

---

## 1.1 Direção escolhida (implementada)

**B — Atlas Editorial**, com o modo escuro lido como o mesmo atlas à noite.

- Papel frio, tinta, verde e ametista; sem vidro ou gradiente decorativo.
- Newsreader para display, Instrument Sans para UI, IBM Plex Mono para dados e metadados.
- Ícones próprios de 24 px / traço 1,5, derivados de símbolos cartográficos.
- Réguas de 1 px, ticks, numeração de seção, legendas de instrumento e grão de papel.
- Motion: 180–320 ms, `cubic-bezier(.22, 1, .36, 1)`, stagger de 30–50 ms; tudo respeita
  `prefers-reduced-motion`.
- Telas de referência implementadas: Explore, Play, Game, Dossiê, Sobre e landing.

As direções A (Carta Náutica) e C (Sala de Mapas) continuam documentadas como alternativas;
A foi absorvida parcialmente no modo escuro (azul-tinta e latão) e C ficou como referência de
arquivo/fichas para uma futura página de coleções.

---

## 2. Três direções de identidade (referência)

### A. Carta Náutica — “instrumento de navegação”
- **Sensação:** carta marítima noturna, latão, tinta, precisão.
- **Paleta escura:** tinta #070b12, azul-profundo #0d1a26, latão #d8a84e,
  marfim #efe6d2, sinal #7fc4e8.
- **Paleta clara:** papel #f2ecdf, areia #e4d7bf, tinta #1d2430, latão #a97a2b.
- **Tipografia:** display sans condensada (ex.: Archivo Narrow) + Inter + IBM Plex Mono.
- **Ícones:** linha 1.5px, símbolos de carta (rosa dos ventos, sonda, marco, corrente).
- **Motion:** fly-to de 800ms, crossfade de camada 350ms, painéis 240ms.
- **Risco:** pode ficar parecido com o atual; precisa de mais textura e tipografia.

### B. Atlas Editorial — “livro de mapas contemporâneo”
- **Sensação:** atlas impresso de luxo, papel quente, tinta, vinho, mapas com hachura.
- **Paleta clara:** papel #f4efe4, tinta #1b1a17, vinho #7a2f2f, ocre #b8863b,
  água #cfdde0, floresta #4f6650.
- **Paleta escura:** tinta #12100d, papel #e8dfcc, vinho #c46a5f, ocre #d8a84e.
- **Tipografia:** display serifada (Fraunces / Instrument Serif) + Inter + IBM Plex Mono.
- **Ícones:** gravura/linha, hachura, setas de bússola, curvas de nível.
- **Motion:** transições de página 280ms, map fly 700ms, feedback 200ms.
- **Risco:** serifada em excesso cansa; usar só em títulos e números grandes.
- **Por que testar primeiro:** é a direção mais distante do “dashboard genérico”.

### C. Sala de Mapas — “arquivo cartográfico”
- **Sensação:** mapoteca, verde profundo, cobre oxidado, fichas de catálogo.
- **Paleta:** verde-tinta #0f1a15, cobre #b87333, pergaminho #e6dcc3, musgo #6f7f5e.
- **Tipografia:** grotesca editorial (Söhne/Inter Tight) + mono.
- **Ícones:** carimbos, fichas, coordenadas, selos.
- **Motion:** discreto, quase arquivístico.
- **Risco:** pode ficar pesado e pouco “jogo”.

**Recomendação:** testar **B** como direção principal (mais original) e **A** como modo
escuro. Se B não funcionar nos jogos, usar A como base e importar a tipografia/ornamento
de B.

---

## 3. Receitas de estilo do mapa

### Político
- Base papel/tinta, continentes com tints muito dessaturados.
- Costa mais forte que fronteiras internas; fronteiras com 0.5–1px.
- Capitais com ponto + rótulo em mono; países vizinhos com tint de seleção.
- Rótulos com halo suave, caixa alta, tracking 0.08em.
- Graticula fina, escala gráfica, rosa dos ventos discreta.

### Físico
- Tints hipsométricos (verde→ocre→marrom→branco) + hillshade + bathymetria.
- Rios/lagos em azul dessaturado; rótulos de cordilheira/deserto em itálico.
- Sem coroplético de país; bordas muito fracas.
- Modo 3D com exageração 1.2–1.5.

### Demografia
- Coroplético de densidade (log) + pontos de cidades principais.
- Em zoom alto, dot density por população (se houver dados).
- Rótulos de grandes cidades; legenda com “hab/km²”.

### Economia
- Coroplético de PIB per capita (log) em ocre/latão.
- Setores como pequenos gráficos no card, não no mapa.
- Avaliar fluxos comerciais como arcos finos com opacidade baixa.

### Geopolítica
- Bloco selecionado em latão; demais em cinza.
- Membros com contorno; país selecionado com anel.
- Territórios disputados com hachura + nota, nunca cor chapada de “dono”.

### História
- Linha do tempo horizontal; snapshots de fronteiras (CShapes) ou blocos históricos.
- Paleta sépia; rótulos com anos.
- Deixar claro: “fronteiras de 1960” ≠ “fronteiras atuais”.

---

## 4. UI/UX: padrões específicos

- **Cantos de mapa:** ticks de coordenada, escala, “N”, zoom, projeção.
- **Painéis:** réguas de 1px, numeração de seção (01, 02…), tipografia mono para metadados.
- **Legenda:** bloco de instrumento, com gradiente, unidade, período e fonte.
- **Card de país:** “at a glance” + abas por camada + comparação com mediana + links.
- **Busca:** command palette (⌘K) com países, camadas e jogos.
- **Mobile:** bottom sheet com snap points; controles acima da sheet; safe areas.
- **Jogos:** HUD discreto, progresso como trilha, feedback com explicação e fonte.
- **Temas:** claro/escuro/sistema, persistidos; mapa acompanha.

## 5. Motion

- Mapa: fly 700–900ms, `essential: true`; zoom 200ms.
- Camadas: crossfade 300–400ms.
- Painéis: 240–320ms, ease-out.
- Feedback: 180–220ms; pontos com count-up de 400ms.
- Stagger de listas: 30–50ms.
- Respeitar `prefers-reduced-motion` em tudo.
