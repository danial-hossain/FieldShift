# FieldShift Overview story (illustrated, no WebGL)

Files
- src/overviewStory.js   — the story engine (vanilla JS, mount/update/destroy)
- src/overviewStory.css  — styles, scoped under .fsx
- src/OverviewStory.jsx  — React wrapper
- src/demoData.js        — DEMO data shape (do NOT ship these numbers; build the object from the APIs)
- public/overview/bd_map.json — Bangladesh district polygons (geoBoundaries gbOpen BGD ADM3, CC BY 4.0,
  via ifahimreza/bangladesh-geojson MIT), pre-projected; regions Barind / Haor / Coast tagged.

Assets it loads (relative to the app's public root)
- textures/earth_day_2048.jpg, textures/earth_clouds_1024.png   (already provided: earth_textures.zip)
- bg/layers/0_sky.svg … 4_fore.svg                             (already provided: village_layers.zip)
- overview/bd_map.json                                          (this pack)
Fonts used in cards: Space Grotesk, Inter, Instrument Serif (italic), Hind Siliguri (bn).

Sections (scroll): 0 orbit · 1 dive · 2 regions · 3 water · 4 climate · 5 soil · 6 rotation ·
7 stress · 8 learning · 9 start (Open My Fields / Open Planner).
onNavigate(page) receives: 'myfields' | 'planner' | 'water' | 'climate' | 'stress' | 'adaptive'.
