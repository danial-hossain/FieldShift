# scripts/generate_rural_bg.py
"""
Generates frontend/public/bg/rural_sunset_cybergrid.svg
A high-fidelity vector background matching the FieldShift design mockup:
- Dark atmospheric sky with warm amber/orange sunset horizon
- Rural Bangladesh silhouettes: palm trees, thatched huts, farmers, cows
- Glowing perspective green cyber-farm grid
"""

def generate_svg():
    w, h = 1920, 1080
    horizon_y = 410

    lines = []
    lines.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <!-- Sky Linear Gradient -->
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#020503"/>
      <stop offset="25%" stop-color="#050c07"/>
      <stop offset="42%" stop-color="#121f11"/>
      <stop offset="65%" stop-color="#2d1d07"/>
      <stop offset="85%" stop-color="#5a2f05"/>
      <stop offset="97%" stop-color="#9a5209"/>
      <stop offset="100%" stop-color="#c6730e"/>
    </linearGradient>

    <!-- Sunset Horizon Glow -->
    <radialGradient id="sunsetGlow" cx="50%" cy="100%" r="80%">
      <stop offset="0%" stop-color="#e08412" stop-opacity="0.75"/>
      <stop offset="20%" stop-color="#c66807" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#803803" stop-opacity="0.30"/>
      <stop offset="75%" stop-color="#301502" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#050a06" stop-opacity="0"/>
    </radialGradient>

    <!-- Ground Floor Gradient -->
    <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#081409"/>
      <stop offset="15%" stop-color="#050e06"/>
      <stop offset="50%" stop-color="#030904"/>
      <stop offset="100%" stop-color="#020402"/>
    </linearGradient>

    <!-- Grid Line Glow -->
    <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#22c55e" stop-opacity="0.25"/>
      <stop offset="40%" stop-color="#10b981" stop-opacity="0.35"/>
      <stop offset="80%" stop-color="#059669" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#047857" stop-opacity="0.08"/>
    </linearGradient>

    <!-- Star Glow -->
    <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="40%" stop-color="#a7f3d0" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#050a06" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- 1. Sky Area (0 to horizon_y) -->
  <rect x="0" y="0" width="{w}" height="{horizon_y}" fill="url(#skyGrad)"/>

  <!-- Sunset Ambient Glow over Horizon -->
  <rect x="0" y="{horizon_y - 220}" width="{w}" height="220" fill="url(#sunsetGlow)"/>

  <!-- Distant Stars in the upper sky -->
  <g opacity="0.6">
    <circle cx="240" cy="80" r="1.5" fill="#fff" opacity="0.8"/>
    <circle cx="580" cy="120" r="1.2" fill="#fff" opacity="0.6"/>
    <circle cx="920" cy="65" r="1.8" fill="#fff" opacity="0.9"/>
    <circle cx="1340" cy="110" r="1.4" fill="#fff" opacity="0.7"/>
    <circle cx="1680" cy="75" r="1.5" fill="#fff" opacity="0.85"/>
    <circle cx="410" cy="160" r="1.0" fill="#a7f3d0" opacity="0.5"/>
    <circle cx="1120" cy="140" r="1.1" fill="#a7f3d0" opacity="0.6"/>
    <circle cx="1510" cy="170" r="0.9" fill="#fff" opacity="0.5"/>
  </g>

  <!-- 2. Ground Area (horizon_y to bottom) -->
  <rect x="0" y="{horizon_y}" width="{w}" height="{h - horizon_y}" fill="url(#groundGrad)"/>
''')

    # 3. Perspective Grid Lines
    lines.append('  <!-- Perspective Cyber-Farm Grid -->')
    lines.append('  <g stroke="url(#gridFade)" stroke-width="1.2" opacity="0.85">')
    
    # Transverse perspective lines (getting closer towards horizon)
    # Using geometric spacing
    transverse_ys = [
        horizon_y + 4,
        horizon_y + 10,
        horizon_y + 20,
        horizon_y + 35,
        horizon_y + 56,
        horizon_y + 85,
        horizon_y + 125,
        horizon_y + 178,
        horizon_y + 248,
        horizon_y + 340,
        horizon_y + 458,
        horizon_y + 606,
    ]
    for ty in transverse_ys:
        if ty <= h:
            lines.append(f'    <line x1="0" y1="{ty}" x2="{w}" y2="{ty}" stroke-opacity="{0.15 + (ty - horizon_y) / (h - horizon_y) * 0.25:.2f}"/>')

    # Radial longitude lines converging at horizon vanishing point (960, horizon_y)
    vx, vy = 960, horizon_y
    bottom_xs = [-400, -150, 80, 280, 460, 620, 760, 870, 960, 1050, 1160, 1300, 1460, 1640, 1840, 2070, 2320]
    for bx in bottom_xs:
        lines.append(f'    <line x1="{vx}" y1="{vy}" x2="{bx}" y2="{h}" stroke-opacity="0.32"/>')

    lines.append('  </g>')

    # 4. Silhouettes on Horizon
    # Dark silhouette color
    sil = "#050a06"
    sil_layer2 = "#081009"
    lines.append(f'  <!-- Rural Silhouettes along Horizon ({horizon_y}px) -->')
    lines.append(f'  <g fill="{sil}">')

    # Helper function for a coconut palm tree
    def palm_tree(cx, base_y, scale=1.0, curve_dir=1):
        trunk_w = 4 * scale
        trunk_h = 130 * scale
        top_x = cx + (25 * curve_dir * scale)
        top_y = base_y - trunk_h
        
        tree_svg = f'''
        <!-- Palm Tree at {cx} -->
        <path d="M{cx - trunk_w/2} {base_y} Q{cx + (10 * curve_dir * scale)} {base_y - trunk_h*0.5} {top_x} {top_y} L{top_x + trunk_w} {top_y} Q{cx + (10 * curve_dir * scale) + trunk_w} {base_y - trunk_h*0.5} {cx + trunk_w/2} {base_y} Z"/>
        <!-- Fronds -->
        <path d="M{top_x} {top_y} Q{top_x - 60*scale} {top_y - 40*scale} {top_x - 90*scale} {top_y - 10*scale} Q{top_x - 55*scale} {top_y - 25*scale} {top_x} {top_y} Z"/>
        <path d="M{top_x} {top_y} Q{top_x - 45*scale} {top_y - 60*scale} {top_x - 65*scale} {top_y - 45*scale} Q{top_x - 35*scale} {top_y - 40*scale} {top_x} {top_y} Z"/>
        <path d="M{top_x} {top_y} Q{top_x - 10*scale} {top_y - 75*scale} {top_x - 15*scale} {top_y - 65*scale} Q{top_x} {top_y - 50*scale} {top_x} {top_y} Z"/>
        <path d="M{top_x} {top_y} Q{top_x + 35*scale} {top_y - 70*scale} {top_x + 55*scale} {top_y - 50*scale} Q{top_x + 30*scale} {top_y - 45*scale} {top_x} {top_y} Z"/>
        <path d="M{top_x} {top_y} Q{top_x + 65*scale} {top_y - 50*scale} {top_x + 95*scale} {top_y - 20*scale} Q{top_x + 60*scale} {top_y - 30*scale} {top_x} {top_y} Z"/>
        <path d="M{top_x} {top_y} Q{top_x + 50*scale} {top_y - 15*scale} {top_x + 85*scale} {top_y + 15*scale} Q{top_x + 45*scale} {top_y} {top_x} {top_y} Z"/>
        <path d="M{top_x} {top_y} Q{top_x - 50*scale} {top_y - 15*scale} {top_x - 85*scale} {top_y + 15*scale} Q{top_x - 45*scale} {top_y} {top_x} {top_y} Z"/>
        '''
        return tree_svg

    # Helper function for village thatched hut (chala ghar)
    def village_hut(hx, base_y, scale=1.0):
        w = 90 * scale
        h_wall = 40 * scale
        roof_peak = 35 * scale
        overhang = 12 * scale
        hut_svg = f'''
        <!-- Village Hut at {hx} -->
        <!-- Wall -->
        <rect x="{hx}" y="{base_y - h_wall}" width="{w}" height="{h_wall}" rx="2"/>
        <!-- Pitched Sloped Roof -->
        <polygon points="{hx - overhang},{base_y - h_wall} {hx + w/2},{base_y - h_wall - roof_peak} {hx + w + overhang},{base_y - h_wall}"/>
        <!-- Small Door -->
        <rect x="{hx + w*0.4}" y="{base_y - h_wall*0.75}" width="{w*0.22}" height="{h_wall*0.75}" fill="#020402"/>
        '''
        return hut_svg

    # Helper function for farmer silhouette with mathal (straw hat) and walking stick
    def farmer(fx, base_y, scale=1.0, direction=1):
        fh = 55 * scale
        farmer_svg = f'''
        <!-- Farmer Silhouette at {fx} -->
        <!-- Head & Hat -->
        <ellipse cx="{fx}" cy="{base_y - fh + 6*scale}" rx="{9*scale}" ry="{3.5*scale}"/>
        <circle cx="{fx}" cy="{base_y - fh + 7*scale}" r="{4.5*scale}"/>
        <!-- Torso -->
        <path d="M{fx - 4*scale} {base_y - fh + 12*scale} L{fx + 4*scale} {base_y - fh + 12*scale} L{fx + 5*scale} {base_y - fh + 32*scale} L{fx - 5*scale} {base_y - fh + 32*scale} Z"/>
        <!-- Legs walking -->
        <path d="M{fx - 3*scale} {base_y - fh + 32*scale} L{fx - 7*scale} {base_y} L{fx - 3*scale} {base_y} L{fx - 1*scale} {base_y - fh + 32*scale} Z"/>
        <path d="M{fx + 2*scale} {base_y - fh + 32*scale} L{fx + 8*scale} {base_y} L{fx + 11*scale} {base_y} L{fx + 4*scale} {base_y - fh + 32*scale} Z"/>
        <!-- Arms and Stick -->
        <line x1="{fx + 3*scale}" y1="{base_y - fh + 16*scale}" x2="{fx + 12*scale}" y2="{base_y - 2*scale}" stroke="{sil}" stroke-width="{1.8*scale}"/>
        <line x1="{fx + 10*scale}" y1="{base_y - fh - 10*scale}" x2="{fx + 14*scale}" y2="{base_y + 4*scale}" stroke="{sil}" stroke-width="{1.5*scale}"/>
        '''
        return farmer_svg

    # Helper function for cow / bullock silhouette
    def cow(cx, base_y, scale=1.0):
        cow_svg = f'''
        <!-- Cow at {cx} -->
        <!-- Body -->
        <ellipse cx="{cx}" cy="{base_y - 20*scale}" rx="{24*scale}" ry="{14*scale}"/>
        <!-- Neck and Head -->
        <path d="M{cx + 18*scale} {base_y - 26*scale} L{cx + 34*scale} {base_y - 34*scale} L{cx + 36*scale} {base_y - 22*scale} L{cx + 22*scale} {base_y - 14*scale} Z"/>
        <ellipse cx="{cx + 36*scale}" cy="{base_y - 26*scale}" rx="{7*scale}" ry="{6*scale}"/>
        <!-- Horns -->
        <path d="M{cx + 34*scale} {base_y - 31*scale} Q{cx + 36*scale} {base_y - 40*scale} {cx + 32*scale} {base_y - 42*scale}" stroke="{sil}" stroke-width="{2*scale}" fill="none"/>
        <!-- Hump -->
        <circle cx="{cx + 14*scale}" cy="{base_y - 32*scale}" r="{5*scale}"/>
        <!-- Legs -->
        <rect x="{cx - 18*scale}" y="{base_y - 14*scale}" width="{3.5*scale}" height="{14*scale}"/>
        <rect x="{cx - 11*scale}" y="{base_y - 14*scale}" width="{3.5*scale}" height="{14*scale}"/>
        <rect x="{cx + 10*scale}" y="{base_y - 14*scale}" width="{3.5*scale}" height="{14*scale}"/>
        <rect x="{cx + 17*scale}" y="{base_y - 14*scale}" width="{3.5*scale}" height="{14*scale}"/>
        <!-- Tail -->
        <path d="M{cx - 24*scale} {base_y - 24*scale} Q{cx - 28*scale} {base_y - 14*scale} {cx - 25*scale} {base_y - 6*scale}" stroke="{sil}" stroke-width="{1.8*scale}" fill="none"/>
        '''
        return cow_svg

    # Helper function for round canopy tree (banyan/mango/neem)
    def leafy_tree(tx, base_y, scale=1.0):
        th = 80 * scale
        return f'''
        <!-- Tree at {tx} -->
        <rect x="{tx - 3*scale}" y="{base_y - th}" width="{6*scale}" height="{th}"/>
        <circle cx="{tx}" cy="{base_y - th - 15*scale}" r="{28*scale}"/>
        <circle cx="{tx - 18*scale}" cy="{base_y - th - 5*scale}" r="{20*scale}"/>
        <circle cx="{tx + 18*scale}" cy="{base_y - th - 8*scale}" r="{22*scale}"/>
        '''

    # Place silhouettes along the horizon
    # Cluster 1: Left palms and trees (150 - 350)
    lines.append(palm_tree(180, horizon_y, scale=0.85, curve_dir=-1))
    lines.append(palm_tree(240, horizon_y, scale=1.1, curve_dir=1))
    lines.append(leafy_tree(310, horizon_y, scale=0.75))

    # Cluster 2: Center-left village cluster (650 - 850)
    lines.append(village_hut(680, horizon_y, scale=0.9))
    lines.append(village_hut(750, horizon_y, scale=0.75))
    lines.append(palm_tree(840, horizon_y, scale=1.25, curve_dir=-1))
    lines.append(leafy_tree(880, horizon_y, scale=0.85))

    # Center-right: Farmer and cattle walking along the ridge (1050 - 1300)
    lines.append(farmer(1080, horizon_y, scale=1.05))
    lines.append(cow(1135, horizon_y, scale=0.85))
    lines.append(cow(1185, horizon_y, scale=0.80))
    lines.append(farmer(1240, horizon_y, scale=0.95))

    # Cluster 3: Right village settlement and tall palms (1450 - 1750)
    lines.append(village_hut(1480, horizon_y, scale=0.95))
    lines.append(village_hut(1560, horizon_y, scale=0.8))
    lines.append(palm_tree(1630, horizon_y, scale=1.15, curve_dir=1))
    lines.append(palm_tree(1710, horizon_y, scale=0.95, curve_dir=-1))
    lines.append(cow(1770, horizon_y, scale=0.75))

    # Horizon ridge base line
    lines.append(f'    <rect x="0" y="{horizon_y - 2}" width="{w}" height="4" fill="{sil}"/>')

    lines.append('  </g>')

    # 5. Vignette overlays for smooth integration
    lines.append(f'''
  <!-- Side & Top Vignettes -->
  <rect x="0" y="0" width="{w}" height="{h}" fill="none" opacity="0.4"/>
</svg>
''')

    return "\n".join(lines)

if __name__ == "__main__":
    svg_content = generate_svg()
    out_path = "frontend/public/bg/rural_sunset_cybergrid.svg"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated {out_path} ({len(svg_content)} bytes)")

