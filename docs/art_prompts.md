# TEN — 이미지 생성 프롬프트

ChatGPT / DALL·E 용. 카드가 바뀌면 `python3 tools/gen_art_prompts.py`로 다시 만든다.

## 1. 프레임 21장 (7속성 × 3타입)

### 불 · 크리처  →  `frame-fire-cr.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the fire element — ember orange and scorched crimson, heat haze, drifting sparks. Accent colour #C1462E.
Card type marker: a heraldic shield motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 불 · 스펠  →  `frame-fire-sp.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the fire element — ember orange and scorched crimson, heat haze, drifting sparks. Accent colour #C1462E.
Card type marker: a starburst / arcane spark motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 불 · 인챈트  →  `frame-fire-en.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the fire element — ember orange and scorched crimson, heat haze, drifting sparks. Accent colour #C1462E.
Card type marker: a faceted crystal motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 물 · 크리처  →  `frame-water-cr.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the water element — deep teal and abyssal blue, refracted light, drifting bubbles. Accent colour #2A6FB5.
Card type marker: a heraldic shield motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 물 · 스펠  →  `frame-water-sp.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the water element — deep teal and abyssal blue, refracted light, drifting bubbles. Accent colour #2A6FB5.
Card type marker: a starburst / arcane spark motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 물 · 인챈트  →  `frame-water-en.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the water element — deep teal and abyssal blue, refracted light, drifting bubbles. Accent colour #2A6FB5.
Card type marker: a faceted crystal motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 자연 · 크리처  →  `frame-nature-cr.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the nature element — moss green and amber sunlight, pollen motes, tangled growth. Accent colour #3F8B3A.
Card type marker: a heraldic shield motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 자연 · 스펠  →  `frame-nature-sp.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the nature element — moss green and amber sunlight, pollen motes, tangled growth. Accent colour #3F8B3A.
Card type marker: a starburst / arcane spark motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 자연 · 인챈트  →  `frame-nature-en.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the nature element — moss green and amber sunlight, pollen motes, tangled growth. Accent colour #3F8B3A.
Card type marker: a faceted crystal motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 강철 · 크리처  →  `frame-steel-cr.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the steel element — gunmetal grey and cold blue steel, forge sparks, oiled plate. Accent colour #6B7686.
Card type marker: a heraldic shield motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 강철 · 스펠  →  `frame-steel-sp.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the steel element — gunmetal grey and cold blue steel, forge sparks, oiled plate. Accent colour #6B7686.
Card type marker: a starburst / arcane spark motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 강철 · 인챈트  →  `frame-steel-en.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the steel element — gunmetal grey and cold blue steel, forge sparks, oiled plate. Accent colour #6B7686.
Card type marker: a faceted crystal motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 대지 · 크리처  →  `frame-earth-cr.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the earth element — ochre and weathered sandstone, dust in the air, cracked ground. Accent colour #8A6A33.
Card type marker: a heraldic shield motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 대지 · 스펠  →  `frame-earth-sp.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the earth element — ochre and weathered sandstone, dust in the air, cracked ground. Accent colour #8A6A33.
Card type marker: a starburst / arcane spark motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 대지 · 인챈트  →  `frame-earth-en.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the earth element — ochre and weathered sandstone, dust in the air, cracked ground. Accent colour #8A6A33.
Card type marker: a faceted crystal motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 어둠 · 크리처  →  `frame-dark-cr.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the darkness element — violet shadow and dried blood, guttering candlelight, creeping mist. Accent colour #5B3E86.
Card type marker: a heraldic shield motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 어둠 · 스펠  →  `frame-dark-sp.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the darkness element — violet shadow and dried blood, guttering candlelight, creeping mist. Accent colour #5B3E86.
Card type marker: a starburst / arcane spark motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 어둠 · 인챈트  →  `frame-dark-en.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the darkness element — violet shadow and dried blood, guttering candlelight, creeping mist. Accent colour #5B3E86.
Card type marker: a faceted crystal motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 빛 · 크리처  →  `frame-light-cr.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the light element — pale gold and warm ivory, godrays, floating dust in sunbeams. Accent colour #B8912A.
Card type marker: a heraldic shield motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 빛 · 스펠  →  `frame-light-sp.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the light element — pale gold and warm ivory, godrays, floating dust in sunbeams. Accent colour #B8912A.
Card type marker: a starburst / arcane spark motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

### 빛 · 인챈트  →  `frame-light-en.png`
```
A single fantasy trading-card FRAME (border and panel structure only, no artwork inside the picture window, no text anywhere). Portrait card, exact 5:7 aspect ratio.

Theme: the light element — pale gold and warm ivory, godrays, floating dust in sunbeams. Accent colour #B8912A.
Card type marker: a faceted crystal motif worked into the top band.

The frame must divide the card into these horizontal bands, measured from the top as a percentage of the card's height:
  - outer border: 3.1% of the card's width, all four sides
  - name / cost band: from 2.2% down to 23.6% of card height
  - illustration window: from 23.6% down to 56.8%
  - rules-text band: from 56.9% down to 81.0%
  - stat band: from 81.0% down to 97.8%

Rules for the bands:
  - The illustration window is a plain flat empty rectangle in a single neutral dark colour. Absolutely nothing drawn inside it — it will be replaced by artwork.
  - The name band, effect band and stat band are plain flat parchment panels with nothing printed on them. Leave them empty and readable.
  - All ornament lives in the outer border and in the thin dividers between bands: engraved metal, carved stone, worn leather corners.

Flat straight-on view, no perspective, no drop shadow, no background outside the card, crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark.
```

## 2. 일러스트 — 속성별 4×5 시트 7장

### 불 20종 시트  →  `sheet-fire.png`
```
A single image laid out as a clean 4-column by 5-row grid of 20 separate fantasy card illustrations, numbered left to right, top to bottom. Every cell is its own self-contained square illustration with a thin dark gutter between cells — do not blend the cells together.

Shared palette and mood for all 20: ember orange and scorched crimson, heat haze, drifting sparks.
Shared style for all 20: painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI.

The 20 subjects, in order:
1. a tiny ember sprite, a floating mote of living flame with small glowing limbs
2. a small bird woven from glowing embers and grey ash, trailing sparks — airborne, clearly off the ground
3. a foot soldier in scorched plate, armour cracking to reveal molten light beneath
4. a humanoid elemental of pure roaring fire, no face, only flame
5. a grinning jester in charred motley, juggling three fireballs
6. a large raptor with outstretched wings of living fire — airborne, clearly off the ground
7. a towering guardian packed from ash and cinder, holding a wide slab shield — planted defensively, shield forward
8. a colossal giant of cooled black rock, deep cracks glowing with lava
9. a phoenix rising in a spiral column of flame, feathers dissolving into sparks — airborne, clearly off the ground
10. an avatar of fire, a lean burning warrior levelling a spear of flame — lunging forward, weapon leading
11. a great dragon of conflagration, wings trailing a firestorm — airborne, clearly off the ground
12. a single spark leaping across darkness toward something offscreen
13. a burning figure bursting apart into an expanding ring of fire
14. a blinding white flash revealing floating runes in the smoke
15. chained explosions rippling in a line across scorched ground
16. a summoning circle disgorging two fire elementals
17. a sweeping wall of firestorm crossing an open field
18. an incendiary shell bursting into a blossom of white-hot fire
19. a floating rune of chained ignition, small flames arcing between its strokes
20. a cracked stone altar crowned with an eternal flame

Square cells. No text, numbers, labels or borders inside any cell.
```

### 물 20종 시트  →  `sheet-water.png`
```
A single image laid out as a clean 4-column by 5-row grid of 20 separate fantasy card illustrations, numbered left to right, top to bottom. Every cell is its own self-contained square illustration with a thin dark gutter between cells — do not blend the cells together.

Shared palette and mood for all 20: deep teal and abyssal blue, refracted light, drifting bubbles.
Shared style for all 20: painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI.

The 20 subjects, in order:
1. a tiny water sprite crouched in a shallow moonlit stream
2. a robed mage shaping a curling wave with both hands
3. a defensive barrier grown from living coral, barnacled and hard — planted defensively, shield forward
4. a tide-caller raising a conch, water spiralling upward around them
5. a spirit of sea mist, a drifting formless shape with two pale glowing eyes — airborne, clearly off the ground
6. a manta-like guardian gliding on deep currents — airborne, clearly off the ground
7. an armoured deep-sea sentinel bearing a great shell shield — planted defensively, shield forward
8. a serpentine dragon of the deep, bioluminescent along its flanks — airborne, clearly off the ground
9. a high-tide colossus built of water, kelp and drowned timber — planted defensively, shield forward
10. a whirlpool given humanoid form, spinning debris in its body
11. a sea god rising from the ocean with a trident, crowned in foam
12. a ripple of water shoving a small figure backwards off its feet
13. water flowing backwards up into a caster's open hand
14. a navigator reading glowing currents drawn on a sea chart
15. a reversed torrent hurling a creature back into the dark
16. a rising tide taking the shape of two water figures
17. a giant tsunami wall about to break over a shoreline
18. a figure dragged straight down into a lightless abyss
19. a drifting bank of sea fog rolling in as a protective veil
20. a tidal sigil burning blue on the surface of still water

Square cells. No text, numbers, labels or borders inside any cell.
```

### 자연 20종 시트  →  `sheet-nature.png`
```
A single image laid out as a clean 4-column by 5-row grid of 20 separate fantasy card illustrations, numbered left to right, top to bottom. Every cell is its own self-contained square illustration with a thin dark gutter between cells — do not blend the cells together.

Shared palette and mood for all 20: moss green and amber sunlight, pollen motes, tangled growth.
Shared style for all 20: painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI.

The 20 subjects, in order:
1. a creeping thorn vine uncoiling across stone
2. a small determined sapling pushing up through dead leaves
3. a spore pod splitting open into identical copies of itself
4. a bark-armoured forest warden holding a round wooden shield — planted defensively, shield forward
5. a griffin, eagle foreparts and lion hindquarters, wings half-raised — airborne, clearly off the ground
6. an ancient gnarled tree with a weathered face in its trunk
7. a crawling colony of fungal creatures sharing one glowing mass
8. a great treant guardian, moss-bearded, roots for feet — planted defensively, shield forward
9. a vine lord whose arms end in lance-like thorn tendrils — lunging forward, weapon leading
10. an elven queen crowned with blossom, vines trailing from her mantle
11. a colossal world tree whose canopy fills the sky
12. a single long thorn punching through a leaf
13. thorny vines lashing out and coiling tight
14. hands gathering an overgrown harvest of strange fruit
15. a plant surging with green growth light, doubling in size
16. seeds bursting apart into three young saplings
17. primordial growth erupting from the ground in a green column
18. a giant carnivorous plant closing over its prey
19. a spring of glowing water welling up among great roots
20. a blessing radiating outward over a moonlit grove

Square cells. No text, numbers, labels or borders inside any cell.
```

### 강철 20종 시트  →  `sheet-steel.png`
```
A single image laid out as a clean 4-column by 5-row grid of 20 separate fantasy card illustrations, numbered left to right, top to bottom. Every cell is its own self-contained square illustration with a thin dark gutter between cells — do not blend the cells together.

Shared palette and mood for all 20: gunmetal grey and cold blue steel, forge sparks, oiled plate.
Shared style for all 20: painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI.

The 20 subjects, in order:
1. a sentry standing behind a tall tower shield — planted defensively, shield forward
2. a bulwark soldier braced behind a wall-sized shield — planted defensively, shield forward
3. a swordsman mid-guard, blade held low and ready
4. a soldier grinding his blade on a spinning whetstone, sparks flying
5. a steel guardian in heavy layered plate, visor down — planted defensively, shield forward
6. heavy infantry in reinforced armour, shoulders squared — planted defensively, shield forward
7. an armoured knight with a longsword and surcoat
8. a breaker hefting a spiked maul over one shoulder — lunging forward, weapon leading
9. a fortress soldier built like a walking bastion, shield plates riveted on — planted defensively, shield forward
10. a master smith hammering glowing steel at a forge
11. an iron wall construct, faceless, plates locked shut — planted defensively, shield forward
12. an iron wedge driven into a seam of plate armour
13. molten steel poured into a weapon mould
14. armour dissolving into running molten metal
15. a glowing rune shattering into fragments
16. an armoured construct being assembled from parts
17. a storm of flying blades filling the air
18. a massive wrecking hammer falling at the moment of impact
19. a glowing sigil burning on a battered breastplate
20. an armoury rack heavy with weapons in low lamplight

Square cells. No text, numbers, labels or borders inside any cell.
```

### 대지 20종 시트  →  `sheet-earth.png`
```
A single image laid out as a clean 4-column by 5-row grid of 20 separate fantasy card illustrations, numbered left to right, top to bottom. Every cell is its own self-contained square illustration with a thin dark gutter between cells — do not blend the cells together.

Shared palette and mood for all 20: ochre and weathered sandstone, dust in the air, cracked ground.
Shared style for all 20: painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI.

The 20 subjects, in order:
1. an animated boulder with two dim glowing eyes — planted defensively, shield forward
2. a pikeman levelling a very long spear — lunging forward, weapon leading
3. a quarry worker swinging a heavy pick at cut stone
4. a stone wall guardian, a slab of masonry given limbs — planted defensively, shield forward
5. a spearman standing in disciplined formation
6. a gate warden planted before a lowered portcullis — planted defensively, shield forward
7. a breakthrough lancer charging with couched lance — lunging forward, weapon leading
8. a general on high ground with a war banner behind him
9. a wooden siege tower rolling forward, shields on its face — planted defensively, shield forward
10. an earthshaker mage slamming the ground, fissures spreading — lunging forward, weapon leading
11. a siege ogre carrying a battering ram under one arm — lunging forward, weapon leading
12. a hurled stone flying at speed
13. a spear punching clean through two overlapping shields
14. torchlit excavation of a buried ruin
15. the ground collapsing into a sudden sinkhole
16. fortifications being raised, stone blocks locking into place
17. a landslide pouring down a mountainside
18. a figure disappearing under a slide of rock
19. an ancient stone altar half-swallowed by earth
20. a battle line of shields locking together edge to edge

Square cells. No text, numbers, labels or borders inside any cell.
```

### 어둠 20종 시트  →  `sheet-dark.png`
```
A single image laid out as a clean 4-column by 5-row grid of 20 separate fantasy card illustrations, numbered left to right, top to bottom. Every cell is its own self-contained square illustration with a thin dark gutter between cells — do not blend the cells together.

Shared palette and mood for all 20: violet shadow and dried blood, guttering candlelight, creeping mist.
Shared style for all 20: painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI.

The 20 subjects, in order:
1. a wraith, a tattered hooded shade with nothing inside the hood
2. a blood cultist raising a ritual dagger, robes stained
3. a vampire bat in flight, wings spread — airborne, clearly off the ground
4. a black knight in blackened plate, visor a dark slit — lunging forward, weapon leading
5. a vampire in a high collar, pale and still
6. a shadow raider dropping from above on ragged wings — airborne, clearly off the ground
7. a corpse harvester dragging a scythe through fog
8. a blood lord enthroned in a hall of red banners
9. a dark guardian behind a shield built from bone — planted defensively, shield forward
10. an abyssal priest, arms raised, a rift opening behind
11. a destroyer hefting a huge two-handed axe
12. an iron nail wet with blood driven into stone
13. a blood pact being signed, a red handprint on parchment
14. a forbidden tome falling open, black light spilling out
15. wraiths pouring up out of a torn rift
16. skeletal hands closing on a contract in the dark
17. a wave of blood sweeping across a battlefield
18. darkness eroding a figure away from the edges inward
19. a blood ritual circle drawn on flagstones, candles guttering
20. an ornate chalice overflowing with blood

Square cells. No text, numbers, labels or borders inside any cell.
```

### 빛 20종 시트  →  `sheet-light.png`
```
A single image laid out as a clean 4-column by 5-row grid of 20 separate fantasy card illustrations, numbered left to right, top to bottom. Every cell is its own self-contained square illustration with a thin dark gutter between cells — do not blend the cells together.

Shared palette and mood for all 20: pale gold and warm ivory, godrays, floating dust in sunbeams.
Shared style for all 20: painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI.

The 20 subjects, in order:
1. a small acolyte of light carrying a votive lamp
2. a templar planted behind a kite shield — planted defensively, shield forward
3. a priest in white and gold, hands folded
4. a healer with both hands glowing over a wound
5. a hawk made of light, wings blazing — airborne, clearly off the ground
6. a guardian angel with folded wings and a drawn sword — planted defensively, shield forward
7. a paladin cleric in gilded plate, mace in hand
8. a sky guardian with broad wings and a great round shield — airborne and shielding, wings spread wide
9. a holy knight with radiant wings and a lance of light — airborne and shielding, wings spread wide
10. a judicator raising a greatsword to sentence — lunging forward, weapon leading
11. an archangel, six wings, face lost in glare — airborne, clearly off the ground
12. a narrow beam of purifying light burning away shadow
13. a vial of holy water spilling, droplets catching light
14. a revelation, light breaking through heavy cloud onto stone
15. a protective golden aura closing around a warrior
16. a pillar of holy radiance descending from above
17. divine punishment striking down as a lance of white fire
18. a scale of judgment with a sword descending through it
19. a hanging veil of light drawn across a doorway
20. a sacred flame burning steady on a marble altar

Square cells. No text, numbers, labels or borders inside any cell.
```

## 3. 일러스트 — 카드별 개별 (재작업용) 140장

### 불

**01. 불씨정령** (1코 크리처) → `art-fire-01.png`
```
a tiny ember sprite, a floating mote of living flame with small glowing limbs. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**02. 잿불새** (2코 크리처) → `art-fire-02.png`
```
a small bird woven from glowing embers and grey ash, trailing sparks, airborne, clearly off the ground. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**03. 작열병** (2코 크리처) → `art-fire-03.png`
```
a foot soldier in scorched plate, armour cracking to reveal molten light beneath. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**04. 화염정령** (3코 크리처) → `art-fire-04.png`
```
a humanoid elemental of pure roaring fire, no face, only flame. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**05. 불꽃광대** (3코 크리처) → `art-fire-05.png`
```
a grinning jester in charred motley, juggling three fireballs. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**06. 화염조** (4코 크리처) → `art-fire-06.png`
```
a large raptor with outstretched wings of living fire, airborne, clearly off the ground. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**07. 재의 수호자** (4코 크리처) → `art-fire-07.png`
```
a towering guardian packed from ash and cinder, holding a wide slab shield, planted defensively, shield forward. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**08. 용암거인** (5코 크리처) → `art-fire-08.png`
```
a colossal giant of cooled black rock, deep cracks glowing with lava. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**09. 불사조** (5코 크리처) → `art-fire-09.png`
```
a phoenix rising in a spiral column of flame, feathers dissolving into sparks, airborne, clearly off the ground. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**10. 화신** (5코 크리처) → `art-fire-10.png`
```
an avatar of fire, a lean burning warrior levelling a spear of flame, lunging forward, weapon leading. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**11. 겁화룡** (6코 크리처) → `art-fire-11.png`
```
a great dragon of conflagration, wings trailing a firestorm, airborne, clearly off the ground. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**12. 불똥** (1코 스펠) → `art-fire-12.png`
```
a single spark leaping across darkness toward something offscreen. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**13. 분신** (2코 스펠) → `art-fire-13.png`
```
a burning figure bursting apart into an expanding ring of fire. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**14. 섬광 계시** (3코 스펠) → `art-fire-14.png`
```
a blinding white flash revealing floating runes in the smoke. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**15. 연쇄 폭발** (3코 스펠) → `art-fire-15.png`
```
chained explosions rippling in a line across scorched ground. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**16. 불의 군단** (4코 스펠) → `art-fire-16.png`
```
a summoning circle disgorging two fire elementals. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**17. 겁화** (5코 스펠) → `art-fire-17.png`
```
a sweeping wall of firestorm crossing an open field. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**18. 소이탄** (6코 스펠) → `art-fire-18.png`
```
an incendiary shell bursting into a blossom of white-hot fire. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**19. 연쇄 발화** (2코 인챈트) → `art-fire-19.png`
```
a floating rune of chained ignition, small flames arcing between its strokes. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**20. 불의 제단** (4코 인챈트) → `art-fire-20.png`
```
a cracked stone altar crowned with an eternal flame. Palette and mood: ember orange and scorched crimson, heat haze, drifting sparks. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

### 물

**01. 여울정령** (1코 크리처) → `art-water-01.png`
```
a tiny water sprite crouched in a shallow moonlit stream. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**02. 파도술사** (2코 크리처) → `art-water-02.png`
```
a robed mage shaping a curling wave with both hands. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**03. 산호방벽** (2코 크리처) → `art-water-03.png`
```
a defensive barrier grown from living coral, barnacled and hard, planted defensively, shield forward. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**04. 조수술사** (3코 크리처) → `art-water-04.png`
```
a tide-caller raising a conch, water spiralling upward around them. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**05. 해무령** (3코 크리처) → `art-water-05.png`
```
a spirit of sea mist, a drifting formless shape with two pale glowing eyes, airborne, clearly off the ground. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**06. 해류지기** (4코 크리처) → `art-water-06.png`
```
a manta-like guardian gliding on deep currents, airborne, clearly off the ground. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**07. 심해수호** (4코 크리처) → `art-water-07.png`
```
an armoured deep-sea sentinel bearing a great shell shield, planted defensively, shield forward. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**08. 심연룡** (5코 크리처) → `art-water-08.png`
```
a serpentine dragon of the deep, bioluminescent along its flanks, airborne, clearly off the ground. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**09. 만조의 수호자** (5코 크리처) → `art-water-09.png`
```
a high-tide colossus built of water, kelp and drowned timber, planted defensively, shield forward. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**10. 소용돌이 정령** (5코 크리처) → `art-water-10.png`
```
a whirlpool given humanoid form, spinning debris in its body. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**11. 해신** (6코 크리처) → `art-water-11.png`
```
a sea god rising from the ocean with a trident, crowned in foam. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**12. 잔물결** (1코 스펠) → `art-water-12.png`
```
a ripple of water shoving a small figure backwards off its feet. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**13. 환수** (2코 스펠) → `art-water-13.png`
```
water flowing backwards up into a caster's open hand. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**14. 조류 읽기** (3코 스펠) → `art-water-14.png`
```
a navigator reading glowing currents drawn on a sea chart. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**15. 역류** (3코 스펠) → `art-water-15.png`
```
a reversed torrent hurling a creature back into the dark. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**16. 밀물의 부름** (4코 스펠) → `art-water-16.png`
```
a rising tide taking the shape of two water figures. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**17. 대해일** (5코 스펠) → `art-water-17.png`
```
a giant tsunami wall about to break over a shoreline. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**18. 심연으로** (6코 스펠) → `art-water-18.png`
```
a figure dragged straight down into a lightless abyss. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**19. 해무** (2코 인챈트) → `art-water-19.png`
```
a drifting bank of sea fog rolling in as a protective veil. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**20. 조수의 인장** (4코 인챈트) → `art-water-20.png`
```
a tidal sigil burning blue on the surface of still water. Palette and mood: deep teal and abyssal blue, refracted light, drifting bubbles. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

### 자연

**01. 가시넝쿨** (1코 크리처) → `art-nature-01.png`
```
a creeping thorn vine uncoiling across stone. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**02. 묘목** (2코 크리처) → `art-nature-02.png`
```
a small determined sapling pushing up through dead leaves. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**03. 번식체** (2코 크리처) → `art-nature-03.png`
```
a spore pod splitting open into identical copies of itself. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**04. 숲지기** (3코 크리처) → `art-nature-04.png`
```
a bark-armoured forest warden holding a round wooden shield, planted defensively, shield forward. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**05. 그리핀** (3코 크리처) → `art-nature-05.png`
```
a griffin, eagle foreparts and lion hindquarters, wings half-raised, airborne, clearly off the ground. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**06. 고목** (4코 크리처) → `art-nature-06.png`
```
an ancient gnarled tree with a weathered face in its trunk. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**07. 포자군체** (4코 크리처) → `art-nature-07.png`
```
a crawling colony of fungal creatures sharing one glowing mass. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**08. 대수호자** (5코 크리처) → `art-nature-08.png`
```
a great treant guardian, moss-bearded, roots for feet, planted defensively, shield forward. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**09. 덩굴군주** (5코 크리처) → `art-nature-09.png`
```
a vine lord whose arms end in lance-like thorn tendrils, lunging forward, weapon leading. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**10. 숲의 여왕** (5코 크리처) → `art-nature-10.png`
```
an elven queen crowned with blossom, vines trailing from her mantle. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**11. 세계수** (6코 크리처) → `art-nature-11.png`
```
a colossal world tree whose canopy fills the sky. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**12. 가시** (1코 스펠) → `art-nature-12.png`
```
a single long thorn punching through a leaf. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**13. 가시덩쿨** (2코 스펠) → `art-nature-13.png`
```
thorny vines lashing out and coiling tight. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**14. 무성한 수확** (3코 스펠) → `art-nature-14.png`
```
hands gathering an overgrown harvest of strange fruit. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**15. 번성** (3코 스펠) → `art-nature-15.png`
```
a plant surging with green growth light, doubling in size. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**16. 번식** (4코 스펠) → `art-nature-16.png`
```
seeds bursting apart into three young saplings. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**17. 태고의 성장** (5코 스펠) → `art-nature-17.png`
```
primordial growth erupting from the ground in a green column. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**18. 포식** (6코 스펠) → `art-nature-18.png`
```
a giant carnivorous plant closing over its prey. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**19. 생명의 샘** (2코 인챈트) → `art-nature-19.png`
```
a spring of glowing water welling up among great roots. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**20. 대지의 축복** (4코 인챈트) → `art-nature-20.png`
```
a blessing radiating outward over a moonlit grove. Palette and mood: moss green and amber sunlight, pollen motes, tangled growth. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

### 강철

**01. 파수병** (1코 크리처) → `art-steel-01.png`
```
a sentry standing behind a tall tower shield, planted defensively, shield forward. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**02. 방벽병** (2코 크리처) → `art-steel-02.png`
```
a bulwark soldier braced behind a wall-sized shield, planted defensively, shield forward. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**03. 검사** (2코 크리처) → `art-steel-03.png`
```
a swordsman mid-guard, blade held low and ready. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**04. 연마병** (3코 크리처) → `art-steel-04.png`
```
a soldier grinding his blade on a spinning whetstone, sparks flying. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**05. 강철수호** (3코 크리처) → `art-steel-05.png`
```
a steel guardian in heavy layered plate, visor down, planted defensively, shield forward. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**06. 중장병** (4코 크리처) → `art-steel-06.png`
```
heavy infantry in reinforced armour, shoulders squared, planted defensively, shield forward. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**07. 기사** (4코 크리처) → `art-steel-07.png`
```
an armoured knight with a longsword and surcoat. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**08. 파쇄병** (5코 크리처) → `art-steel-08.png`
```
a breaker hefting a spiked maul over one shoulder, lunging forward, weapon leading. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**09. 요새병** (5코 크리처) → `art-steel-09.png`
```
a fortress soldier built like a walking bastion, shield plates riveted on, planted defensively, shield forward. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**10. 단조장인** (5코 크리처) → `art-steel-10.png`
```
a master smith hammering glowing steel at a forge. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**11. 철벽** (6코 크리처) → `art-steel-11.png`
```
an iron wall construct, faceless, plates locked shut, planted defensively, shield forward. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**12. 쐐기** (1코 스펠) → `art-steel-12.png`
```
an iron wedge driven into a seam of plate armour. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**13. 주조** (2코 스펠) → `art-steel-13.png`
```
molten steel poured into a weapon mould. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**14. 용해** (3코 스펠) → `art-steel-14.png`
```
armour dissolving into running molten metal. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**15. 파쇄** (3코 스펠) → `art-steel-15.png`
```
a glowing rune shattering into fragments. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**16. 병기 조립** (4코 스펠) → `art-steel-16.png`
```
an armoured construct being assembled from parts. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**17. 강철 폭풍** (5코 스펠) → `art-steel-17.png`
```
a storm of flying blades filling the air. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**18. 분쇄추** (6코 스펠) → `art-steel-18.png`
```
a massive wrecking hammer falling at the moment of impact. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**19. 강철 의지** (2코 인챈트) → `art-steel-19.png`
```
a glowing sigil burning on a battered breastplate. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**20. 병기고** (4코 인챈트) → `art-steel-20.png`
```
an armoury rack heavy with weapons in low lamplight. Palette and mood: gunmetal grey and cold blue steel, forge sparks, oiled plate. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

### 대지

**01. 돌덩이** (1코 크리처) → `art-earth-01.png`
```
an animated boulder with two dim glowing eyes, planted defensively, shield forward. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**02. 가시병** (2코 크리처) → `art-earth-02.png`
```
a pikeman levelling a very long spear, lunging forward, weapon leading. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**03. 채석공** (2코 크리처) → `art-earth-03.png`
```
a quarry worker swinging a heavy pick at cut stone. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**04. 석벽** (3코 크리처) → `art-earth-04.png`
```
a stone wall guardian, a slab of masonry given limbs, planted defensively, shield forward. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**05. 창병** (3코 크리처) → `art-earth-05.png`
```
a spearman standing in disciplined formation. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**06. 성문지기** (4코 크리처) → `art-earth-06.png`
```
a gate warden planted before a lowered portcullis, planted defensively, shield forward. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**07. 돌파병** (4코 크리처) → `art-earth-07.png`
```
a breakthrough lancer charging with couched lance, lunging forward, weapon leading. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**08. 장군** (5코 크리처) → `art-earth-08.png`
```
a general on high ground with a war banner behind him. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**09. 공성탑** (5코 크리처) → `art-earth-09.png`
```
a wooden siege tower rolling forward, shields on its face, planted defensively, shield forward. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**10. 지진술사** (5코 크리처) → `art-earth-10.png`
```
an earthshaker mage slamming the ground, fissures spreading, lunging forward, weapon leading. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**11. 공성귀** (6코 크리처) → `art-earth-11.png`
```
a siege ogre carrying a battering ram under one arm, lunging forward, weapon leading. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**12. 자갈** (1코 스펠) → `art-earth-12.png`
```
a hurled stone flying at speed. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**13. 관통 사격** (2코 스펠) → `art-earth-13.png`
```
a spear punching clean through two overlapping shields. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**14. 폐허 발굴** (3코 스펠) → `art-earth-14.png`
```
torchlit excavation of a buried ruin. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**15. 함몰** (3코 스펠) → `art-earth-15.png`
```
the ground collapsing into a sudden sinkhole. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**16. 축성** (4코 스펠) → `art-earth-16.png`
```
fortifications being raised, stone blocks locking into place. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**17. 산사태** (5코 스펠) → `art-earth-17.png`
```
a landslide pouring down a mountainside. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**18. 매몰** (6코 스펠) → `art-earth-18.png`
```
a figure disappearing under a slide of rock. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**19. 고대 제단** (2코 인챈트) → `art-earth-19.png`
```
an ancient stone altar half-swallowed by earth. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**20. 전열 구축** (4코 인챈트) → `art-earth-20.png`
```
a battle line of shields locking together edge to edge. Palette and mood: ochre and weathered sandstone, dust in the air, cracked ground. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

### 어둠

**01. 망령** (1코 크리처) → `art-dark-01.png`
```
a wraith, a tattered hooded shade with nothing inside the hood. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**02. 피의광신도** (2코 크리처) → `art-dark-02.png`
```
a blood cultist raising a ritual dagger, robes stained. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**03. 흡혈박쥐** (2코 크리처) → `art-dark-03.png`
```
a vampire bat in flight, wings spread, airborne, clearly off the ground. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**04. 흑기사** (3코 크리처) → `art-dark-04.png`
```
a black knight in blackened plate, visor a dark slit, lunging forward, weapon leading. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**05. 흡혈귀** (3코 크리처) → `art-dark-05.png`
```
a vampire in a high collar, pale and still. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**06. 그림자 습격자** (4코 크리처) → `art-dark-06.png`
```
a shadow raider dropping from above on ragged wings, airborne, clearly off the ground. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**07. 시체 수확자** (4코 크리처) → `art-dark-07.png`
```
a corpse harvester dragging a scythe through fog. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**08. 피의 군주** (5코 크리처) → `art-dark-08.png`
```
a blood lord enthroned in a hall of red banners. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**09. 어둠의 수호** (5코 크리처) → `art-dark-09.png`
```
a dark guardian behind a shield built from bone, planted defensively, shield forward. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**10. 심연의 사제** (5코 크리처) → `art-dark-10.png`
```
an abyssal priest, arms raised, a rift opening behind. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**11. 파괴자** (6코 크리처) → `art-dark-11.png`
```
a destroyer hefting a huge two-handed axe. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**12. 피의 못** (1코 스펠) → `art-dark-12.png`
```
an iron nail wet with blood driven into stone. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**13. 피의 계약** (2코 스펠) → `art-dark-13.png`
```
a blood pact being signed, a red handprint on parchment. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**14. 금단의 지식** (3코 스펠) → `art-dark-14.png`
```
a forbidden tome falling open, black light spilling out. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**15. 어둠의 부름** (3코 스펠) → `art-dark-15.png`
```
wraiths pouring up out of a torn rift. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**16. 죽음의 계약** (4코 스펠) → `art-dark-16.png`
```
skeletal hands closing on a contract in the dark. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**17. 흡혈 파도** (5코 스펠) → `art-dark-17.png`
```
a wave of blood sweeping across a battlefield. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**18. 잠식** (6코 스펠) → `art-dark-18.png`
```
darkness eroding a figure away from the edges inward. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**19. 흡혈 의식** (2코 인챈트) → `art-dark-19.png`
```
a blood ritual circle drawn on flagstones, candles guttering. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**20. 피의 성배** (4코 인챈트) → `art-dark-20.png`
```
an ornate chalice overflowing with blood. Palette and mood: violet shadow and dried blood, guttering candlelight, creeping mist. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

### 빛

**01. 빛의 시종** (1코 크리처) → `art-light-01.png`
```
a small acolyte of light carrying a votive lamp. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**02. 성전사** (2코 크리처) → `art-light-02.png`
```
a templar planted behind a kite shield, planted defensively, shield forward. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**03. 사제** (2코 크리처) → `art-light-03.png`
```
a priest in white and gold, hands folded. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**04. 치유사** (3코 크리처) → `art-light-04.png`
```
a healer with both hands glowing over a wound. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**05. 빛의 매** (3코 크리처) → `art-light-05.png`
```
a hawk made of light, wings blazing, airborne, clearly off the ground. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**06. 수호천사** (4코 크리처) → `art-light-06.png`
```
a guardian angel with folded wings and a drawn sword, planted defensively, shield forward. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**07. 성직기사** (4코 크리처) → `art-light-07.png`
```
a paladin cleric in gilded plate, mace in hand. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**08. 천공수호** (5코 크리처) → `art-light-08.png`
```
a sky guardian with broad wings and a great round shield, airborne and shielding, wings spread wide. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**09. 성기사** (5코 크리처) → `art-light-09.png`
```
a holy knight with radiant wings and a lance of light, airborne and shielding, wings spread wide. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**10. 심판자** (5코 크리처) → `art-light-10.png`
```
a judicator raising a greatsword to sentence, lunging forward, weapon leading. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**11. 대천사** (6코 크리처) → `art-light-11.png`
```
an archangel, six wings, face lost in glare, airborne, clearly off the ground. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**12. 정화의 빛** (1코 스펠) → `art-light-12.png`
```
a narrow beam of purifying light burning away shadow. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**13. 성수** (2코 스펠) → `art-light-13.png`
```
a vial of holy water spilling, droplets catching light. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**14. 계시** (3코 스펠) → `art-light-14.png`
```
a revelation, light breaking through heavy cloud onto stone. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**15. 가호의 빛** (3코 스펠) → `art-light-15.png`
```
a protective golden aura closing around a warrior. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**16. 성광** (4코 스펠) → `art-light-16.png`
```
a pillar of holy radiance descending from above. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**17. 천벌** (5코 스펠) → `art-light-17.png`
```
divine punishment striking down as a lance of white fire. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**18. 심판** (6코 스펠) → `art-light-18.png`
```
a scale of judgment with a sword descending through it. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**19. 빛의 장막** (2코 인챈트) → `art-light-19.png`
```
a hanging veil of light drawn across a doorway. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```

**20. 성화** (4코 인챈트) → `art-light-20.png`
```
a sacred flame burning steady on a marble altar. Palette and mood: pale gold and warm ivory, godrays, floating dust in sunbeams. painterly digital fantasy illustration, dark storybook oil-painting feel, visible brushwork, dramatic single-source lighting, muted desaturated palette with one saturated accent, strong silhouette readable at thumbnail size, centered subject, shallow depth of field, no text, no letters, no numbers, no watermark, no border, no frame, no UI. Square 1:1 composition, subject centred with headroom.
```
