from pathlib import Path

path = Path(r"C:\FieldShift\frontend\src\main.jsx")
content = path.read_text(encoding="utf-8")

# 1. Update CROP_META
old_crop_meta = """const CROP_META = {
  Mungbean: { family: 'Fabaceae', is_legume: true, water_mm: 350, duration: 75, icon: '🌱', bnf: true, desc: 'Biological N-Fixer, short duration dry pulse' },
  Lentil: { family: 'Fabaceae', is_legume: true, water_mm: 300, duration: 110, icon: '🌱', bnf: true, desc: 'High market pulse, soil enrichment' },
  Maize: { family: 'Poaceae', is_legume: false, water_mm: 600, duration: 110, icon: '🌽', bnf: false, desc: 'High biomass grain, strong market demand' },
  Rice: { family: 'Poaceae', is_legume: false, water_mm: 1200, duration: 130, icon: '🌾', bnf: false, desc: 'Staple cereal grain, wet season adapted' },
  Wheat: { family: 'Poaceae', is_legume: false, water_mm: 450, duration: 120, icon: '🌾', bnf: false, desc: 'Cool season cereal, moderate residue' },
  Mustard: { family: 'Brassicaceae', is_legume: false, water_mm: 350, duration: 100, icon: '🌼', bnf: false, desc: 'Oilseed crop, deep taproot, bio-fumigant' },
  Potato: { family: 'Solanaceae', is_legume: false, water_mm: 500, duration: 100, icon: '🥔', bnf: false, desc: 'High cash return tuber, intensive nutrient user' },
};"""

new_crop_meta = """const CROP_META = {
  Mungbean: { family: 'Fabaceae', is_legume: true, water_mm: 350, duration: 75, icon: '🌱', bnf: true, desc: 'Biological N-Fixer, short duration dry pulse' },
  Lentil: { family: 'Fabaceae', is_legume: true, water_mm: 300, duration: 110, icon: '🌱', bnf: true, desc: 'High market pulse, soil enrichment' },
  Maize: { family: 'Poaceae', is_legume: false, water_mm: 600, duration: 110, icon: '🌽', bnf: false, desc: 'High biomass grain, strong market demand' },
  Rice: { family: 'Poaceae', is_legume: false, water_mm: 1200, duration: 130, icon: '🌾', bnf: false, desc: 'Staple cereal grain, wet season adapted' },
  Wheat: { family: 'Poaceae', is_legume: false, water_mm: 450, duration: 120, icon: '🌾', bnf: false, desc: 'Cool season cereal, moderate residue' },
  Mustard: { family: 'Brassicaceae', is_legume: false, water_mm: 350, duration: 100, icon: '🌼', bnf: false, desc: 'Oilseed crop, deep taproot, bio-fumigant' },
  Potato: { family: 'Solanaceae', is_legume: false, water_mm: 500, duration: 100, icon: '🥔', bnf: false, desc: 'High cash return tuber, intensive nutrient user' },
  Chickpea: { family: 'Fabaceae', is_legume: true, water_mm: 280, duration: 95, icon: '🌱', bnf: true, desc: 'Drought-tolerant winter pulse, BNF N-fixer' },
  Soybean: { family: 'Fabaceae', is_legume: true, water_mm: 480, duration: 105, icon: '🌱', bnf: true, desc: 'High protein legume, strong residual biomass' },
  Sorghum: { family: 'Poaceae', is_legume: false, water_mm: 250, duration: 90, icon: '🌾', bnf: false, desc: 'Ultra drought-tolerant C4 cereal, deep rooting' },
  Sesame: { family: 'Pedaliaceae', is_legume: false, water_mm: 280, duration: 85, icon: '🌿', bnf: false, desc: 'High-value oilseed, low moisture requirement' },
  Groundnut: { family: 'Fabaceae', is_legume: true, water_mm: 450, duration: 120, icon: '🥜', bnf: true, desc: 'Cash oilseed pulse, BNF soil fertility boost' },
  Sunflower: { family: 'Asteraceae', is_legume: false, water_mm: 420, duration: 95, icon: '🌻', bnf: false, desc: 'Deep taproot scavenger, subsoil nutrient mobilizer' },
  Tomato: { family: 'Solanaceae', is_legume: false, water_mm: 550, duration: 105, icon: '🍅', bnf: false, desc: 'High economic cash margin vegetable crop' },
  Jute: { family: 'Malvaceae', is_legume: false, water_mm: 650, duration: 120, icon: '🎋', bnf: false, desc: 'Commercial fiber crop, substantial leaf litter residue' },
};"""

if old_crop_meta in content:
    content = content.replace(old_crop_meta, new_crop_meta)
    print("CROP_META replaced successfully!")
else:
    old_crlf = old_crop_meta.replace("\n", "\r\n")
    new_crlf = new_crop_meta.replace("\n", "\r\n")
    if old_crlf in content:
        content = content.replace(old_crlf, new_crlf)
        print("CROP_META replaced with CRLF!")
    else:
        print("CROP_META not found!")

path.write_text(content, encoding="utf-8")
