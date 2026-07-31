#!/usr/bin/env python3
"""
카드 아트·프레임 이미지 생성 프롬프트를 만든다. (ChatGPT / DALL·E 용)

gen_decks.py의 DECKS를 읽어 카드 순서·코스트·태그를 가져오고, 아래 SUBJECT의
그림 소재를 붙여 프롬프트를 만든다. 카드가 바뀌면 다시 돌리면 된다.

출력: docs/art_prompts.html (복사 버튼 달린 문서) · docs/art_prompts.md

  python3 tools/gen_art_prompts.py
"""
import html
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import gen_decks as G  # noqa: E402

ELHEX = {"fire": "#C1462E", "water": "#2A6FB5", "nature": "#3F8B3A", "steel": "#6B7686",
         "earth": "#8A6A33", "dark": "#5B3E86", "light": "#B8912A"}
EL_EN = {"fire": "fire", "water": "water", "nature": "nature", "steel": "steel",
         "earth": "earth", "dark": "darkness", "light": "light"}
ELMOOD = {
    "fire":   "ember orange and scorched crimson, heat haze, drifting sparks",
    "water":  "deep teal and abyssal blue, refracted light, drifting bubbles",
    "nature": "moss green and amber sunlight, pollen motes, tangled growth",
    "steel":  "gunmetal grey and cold blue steel, forge sparks, oiled plate",
    "earth":  "ochre and weathered sandstone, dust in the air, cracked ground",
    "dark":   "violet shadow and dried blood, guttering candlelight, creeping mist",
    "light":  "pale gold and warm ivory, godrays, floating dust in sunbeams",
}

# 공통 스타일 계약 — 모든 프롬프트에 같은 문장을 넣어 140장의 톤을 맞춘다
STYLE = ("painterly digital fantasy illustration, dark storybook oil-painting feel, "
         "visible brushwork, dramatic single-source lighting, muted desaturated palette "
         "with one saturated accent, strong silhouette readable at thumbnail size, "
         "centered subject, shallow depth of field, no text, no letters, no numbers, "
         "no watermark, no border, no frame, no UI")

# 속성 상징 — 이걸 못 박지 않으면 생성기가 제멋대로 다른 속성을 만들어 낸다
ELSYM = {
    "fire":   "a flame",
    "water":  "a water droplet",
    "nature": "a leaf",
    "steel":  "an anvil with a crossed hammer",
    "earth":  "a mountain peak over layered strata",
    "dark":   "a crescent moon",
    "light":  "a radiant sun",
}

# 프레임 기하 — 프로토타입 CSS 실측값 (카드 5:7, 수치는 카드 높이 대비 %)
BANDS = [
    ("outer border", "3.1% of the card's width on all four sides"),
    ("NAME PLATE", "2.2% down to 14.0% — a blank plate for the card name"),
    ("COST STRIP", "14.0% down to 23.6% — a blank recessed strip, left-aligned, "
                   "wide enough for six small circular gems in a row. Draw NO gems here, "
                   "only the empty seat they will sit in."),
    ("ILLUSTRATION WINDOW", "23.6% down to 56.8% — flat empty rectangle, one neutral dark colour"),
    ("RULES PANEL", "56.9% down to 81.0% — a blank parchment panel"),
    ("STAT BAND", "81.0% down to 97.8%"),
]

TYPEKO = {"cr": "크리처", "sp": "스펠", "en": "인챈트", "ld": "지형"}

# 타입별로 달라지는 부분 — 하단 띠와 상단 표식
TYPESPEC = {
    "cr": ("a heraldic shield badge set into the top border",
           "STAT BAND: two empty circular sockets, one at the far left and one at the far right, "
           "each about 18% of the card's width across. They are empty recessed seats — "
           "no numbers, no symbols inside. The strip between them is plain."),
    "sp": ("a starburst / arcane spark badge set into the top border",
           "STAT BAND: completely plain. No sockets, no ornament — spells print no stats."),
    "en": ("a faceted crystal badge set into the top border",
           "STAT BAND: ONE empty circular socket at the far right only, about 18% of the card's "
           "width across, an empty recessed seat with nothing inside. The rest of the strip is plain."),
    "ld": ("a rune-carved keystone badge set into the top border",
           "STAT BAND: completely plain. No sockets."),
}
TYPENOTE = {
    "cr": "This is a CREATURE frame — it must carry attack and health.",
    "sp": "This is a SPELL frame — it prints no stats at all.",
    "en": "This is an ENCHANT frame — it carries a single charge counter.",
    "ld": "This is a TERRAIN frame — terrain cards cost nothing and print no stats. "
          "OMIT the cost strip entirely: the name plate runs from 2.2% down to 23.6% instead.",
}

# ── 카드별 그림 소재 (140종) ─────────────────────────────────
SUBJECT = {
# 불
"불씨정령": "a tiny ember sprite, a floating mote of living flame with small glowing limbs",
"잿불새": "a small bird woven from glowing embers and grey ash, trailing sparks",
"작열병": "a foot soldier in scorched plate, armour cracking to reveal molten light beneath",
"화염정령": "a humanoid elemental of pure roaring fire, no face, only flame",
"불꽃광대": "a grinning jester in charred motley, juggling three fireballs",
"화염조": "a large raptor with outstretched wings of living fire",
"재의 수호자": "a towering guardian packed from ash and cinder, holding a wide slab shield",
"용암거인": "a colossal giant of cooled black rock, deep cracks glowing with lava",
"불사조": "a phoenix rising in a spiral column of flame, feathers dissolving into sparks",
"화신": "an avatar of fire, a lean burning warrior levelling a spear of flame",
"겁화룡": "a great dragon of conflagration, wings trailing a firestorm",
"불똥": "a single spark leaping across darkness toward something offscreen",
"분신": "a burning figure bursting apart into an expanding ring of fire",
"섬광 계시": "a blinding white flash revealing floating runes in the smoke",
"연쇄 폭발": "chained explosions rippling in a line across scorched ground",
"불의 군단": "a summoning circle disgorging two fire elementals",
"겁화": "a sweeping wall of firestorm crossing an open field",
"소이탄": "an incendiary shell bursting into a blossom of white-hot fire",
"연쇄 발화": "a floating rune of chained ignition, small flames arcing between its strokes",
"불의 제단": "a cracked stone altar crowned with an eternal flame",
# 물
"여울정령": "a tiny water sprite crouched in a shallow moonlit stream",
"파도술사": "a robed mage shaping a curling wave with both hands",
"산호방벽": "a defensive barrier grown from living coral, barnacled and hard",
"조수술사": "a tide-caller raising a conch, water spiralling upward around them",
"해무령": "a spirit of sea mist, a drifting formless shape with two pale glowing eyes",
"해류지기": "a manta-like guardian gliding on deep currents",
"심해수호": "an armoured deep-sea sentinel bearing a great shell shield",
"심연룡": "a serpentine dragon of the deep, bioluminescent along its flanks",
"만조의 수호자": "a high-tide colossus built of water, kelp and drowned timber",
"소용돌이 정령": "a whirlpool given humanoid form, spinning debris in its body",
"해신": "a sea god rising from the ocean with a trident, crowned in foam",
"잔물결": "a ripple of water shoving a small figure backwards off its feet",
"환수": "water flowing backwards up into a caster's open hand",
"조류 읽기": "a navigator reading glowing currents drawn on a sea chart",
"역류": "a reversed torrent hurling a creature back into the dark",
"밀물의 부름": "a rising tide taking the shape of two water figures",
"대해일": "a giant tsunami wall about to break over a shoreline",
"심연으로": "a figure dragged straight down into a lightless abyss",
"해무": "a drifting bank of sea fog rolling in as a protective veil",
"조수의 인장": "a tidal sigil burning blue on the surface of still water",
# 자연
"가시넝쿨": "a creeping thorn vine uncoiling across stone",
"묘목": "a small determined sapling pushing up through dead leaves",
"번식체": "a spore pod splitting open into identical copies of itself",
"숲지기": "a bark-armoured forest warden holding a round wooden shield",
"그리핀": "a griffin, eagle foreparts and lion hindquarters, wings half-raised",
"고목": "an ancient gnarled tree with a weathered face in its trunk",
"포자군체": "a crawling colony of fungal creatures sharing one glowing mass",
"대수호자": "a great treant guardian, moss-bearded, roots for feet",
"덩굴군주": "a vine lord whose arms end in lance-like thorn tendrils",
"숲의 여왕": "an elven queen crowned with blossom, vines trailing from her mantle",
"세계수": "a colossal world tree whose canopy fills the sky",
"가시": "a single long thorn punching through a leaf",
"가시덩쿨": "thorny vines lashing out and coiling tight",
"무성한 수확": "hands gathering an overgrown harvest of strange fruit",
"번성": "a plant surging with green growth light, doubling in size",
"번식": "seeds bursting apart into three young saplings",
"태고의 성장": "primordial growth erupting from the ground in a green column",
"포식": "a giant carnivorous plant closing over its prey",
"생명의 샘": "a spring of glowing water welling up among great roots",
"대지의 축복": "a blessing radiating outward over a moonlit grove",
# 강철
"파수병": "a sentry standing behind a tall tower shield",
"방벽병": "a bulwark soldier braced behind a wall-sized shield",
"검사": "a swordsman mid-guard, blade held low and ready",
"연마병": "a soldier grinding his blade on a spinning whetstone, sparks flying",
"강철수호": "a steel guardian in heavy layered plate, visor down",
"중장병": "heavy infantry in reinforced armour, shoulders squared",
"기사": "an armoured knight with a longsword and surcoat",
"파쇄병": "a breaker hefting a spiked maul over one shoulder",
"요새병": "a fortress soldier built like a walking bastion, shield plates riveted on",
"단조장인": "a master smith hammering glowing steel at a forge",
"철벽": "an iron wall construct, faceless, plates locked shut",
"쐐기": "an iron wedge driven into a seam of plate armour",
"주조": "molten steel poured into a weapon mould",
"용해": "armour dissolving into running molten metal",
"파쇄": "a glowing rune shattering into fragments",
"병기 조립": "an armoured construct being assembled from parts",
"강철 폭풍": "a storm of flying blades filling the air",
"분쇄추": "a massive wrecking hammer falling at the moment of impact",
"강철 의지": "a glowing sigil burning on a battered breastplate",
"병기고": "an armoury rack heavy with weapons in low lamplight",
# 대지
"돌덩이": "an animated boulder with two dim glowing eyes",
"가시병": "a pikeman levelling a very long spear",
"채석공": "a quarry worker swinging a heavy pick at cut stone",
"석벽": "a stone wall guardian, a slab of masonry given limbs",
"창병": "a spearman standing in disciplined formation",
"성문지기": "a gate warden planted before a lowered portcullis",
"돌파병": "a breakthrough lancer charging with couched lance",
"장군": "a general on high ground with a war banner behind him",
"공성탑": "a wooden siege tower rolling forward, shields on its face",
"지진술사": "an earthshaker mage slamming the ground, fissures spreading",
"공성귀": "a siege ogre carrying a battering ram under one arm",
"자갈": "a hurled stone flying at speed",
"관통 사격": "a spear punching clean through two overlapping shields",
"폐허 발굴": "torchlit excavation of a buried ruin",
"함몰": "the ground collapsing into a sudden sinkhole",
"축성": "fortifications being raised, stone blocks locking into place",
"산사태": "a landslide pouring down a mountainside",
"매몰": "a figure disappearing under a slide of rock",
"고대 제단": "an ancient stone altar half-swallowed by earth",
"전열 구축": "a battle line of shields locking together edge to edge",
# 어둠
"망령": "a wraith, a tattered hooded shade with nothing inside the hood",
"피의광신도": "a blood cultist raising a ritual dagger, robes stained",
"흡혈박쥐": "a vampire bat in flight, wings spread",
"흑기사": "a black knight in blackened plate, visor a dark slit",
"흡혈귀": "a vampire in a high collar, pale and still",
"그림자 습격자": "a shadow raider dropping from above on ragged wings",
"시체 수확자": "a corpse harvester dragging a scythe through fog",
"피의 군주": "a blood lord enthroned in a hall of red banners",
"어둠의 수호": "a dark guardian behind a shield built from bone",
"심연의 사제": "an abyssal priest, arms raised, a rift opening behind",
"파괴자": "a destroyer hefting a huge two-handed axe",
"피의 못": "an iron nail wet with blood driven into stone",
"피의 계약": "a blood pact being signed, a red handprint on parchment",
"금단의 지식": "a forbidden tome falling open, black light spilling out",
"어둠의 부름": "wraiths pouring up out of a torn rift",
"죽음의 계약": "skeletal hands closing on a contract in the dark",
"흡혈 파도": "a wave of blood sweeping across a battlefield",
"잠식": "darkness eroding a figure away from the edges inward",
"흡혈 의식": "a blood ritual circle drawn on flagstones, candles guttering",
"피의 성배": "an ornate chalice overflowing with blood",
# 빛
"빛의 시종": "a small acolyte of light carrying a votive lamp",
"성전사": "a templar planted behind a kite shield",
"사제": "a priest in white and gold, hands folded",
"치유사": "a healer with both hands glowing over a wound",
"빛의 매": "a hawk made of light, wings blazing",
"수호천사": "a guardian angel with folded wings and a drawn sword",
"성직기사": "a paladin cleric in gilded plate, mace in hand",
"천공수호": "a sky guardian with broad wings and a great round shield",
"성기사": "a holy knight with radiant wings and a lance of light",
"심판자": "a judicator raising a greatsword to sentence",
"대천사": "an archangel, six wings, face lost in glare",
"정화의 빛": "a narrow beam of purifying light burning away shadow",
"성수": "a vial of holy water spilling, droplets catching light",
"계시": "a revelation, light breaking through heavy cloud onto stone",
"가호의 빛": "a protective golden aura closing around a warrior",
"성광": "a pillar of holy radiance descending from above",
"천벌": "divine punishment striking down as a lance of white fire",
"심판": "a scale of judgment with a sword descending through it",
"빛의 장막": "a hanging veil of light drawn across a doorway",
"성화": "a sacred flame burning steady on a marble altar",
}

TAGART = {"수호": "planted defensively, shield forward",
          "비행": "airborne, clearly off the ground",
          "비행수호": "airborne and shielding, wings spread wide",
          "관통": "lunging forward, weapon leading"}


def sheet_prompt(el):
    """속성 한 장 = 4×5 시트 20칸."""
    deck = G.DECKS[el]
    items = []
    n = 0
    for (nm, c, tag, a, h, cp, keys) in deck["creatures"]:
        n += 1
        pose = f" — {TAGART[tag]}" if tag in TAGART else ""
        items.append(f"{n}. {SUBJECT.get(nm, nm)}{pose}")
    for (nm, c, kind, val, ref, adj, cp, rule) in deck["spells"]:
        n += 1
        items.append(f"{n}. {SUBJECT.get(nm, nm)}")
    for (nm, c, dr, E, C, scope, cp, rule) in deck["enchants"]:
        n += 1
        items.append(f"{n}. {SUBJECT.get(nm, nm)}")
    return (
        f"A single image laid out as a clean 4-column by 5-row grid of 20 separate "
        f"fantasy card illustrations, numbered left to right, top to bottom. "
        f"Every cell is its own self-contained square illustration with a thin dark gutter "
        f"between cells — do not blend the cells together.\n\n"
        f"Shared palette and mood for all 20: {ELMOOD[el]}.\n"
        f"Shared style for all 20: {STYLE}.\n\n"
        f"The 20 subjects, in order:\n" + "\n".join(items) + "\n\n"
        f"Square cells. No text, numbers, labels or borders inside any cell."
    )


def card_prompt(nm, el, kind, tag=None):
    subj = SUBJECT.get(nm, nm)
    extra = f", {TAGART[tag]}" if tag in TAGART else ""
    return (f"{subj}{extra}. "
            f"Palette and mood: {ELMOOD[el]}. "
            f"{STYLE}. Square 1:1 composition, subject centred with headroom.")


FRAME_RULES = (
    "Rules for every band:\n"
    "  - Draw NO text, letters or numbers anywhere. Every panel is blank — the game prints "
    "text into it later.\n"
    "  - The illustration window is a flat empty rectangle in one neutral dark colour. "
    "Absolutely nothing inside it; it gets replaced by artwork.\n"
    "  - The name plate, cost strip, rules panel and stat sockets are empty seats, not filled "
    "elements. Leave them clean and readable.\n"
    "  - All ornament lives in the outer border, the corner pieces and the thin dividers "
    "between bands: engraved metal, carved stone, worn leather.\n\n"
    "Flat straight-on view, no perspective, no drop shadow, no background outside the card, "
    "crisp edges, symmetrical left to right. No text, no letters, no numbers, no watermark."
)


def frame_prompt(el, k):
    badge, statline = TYPESPEC[k]
    bands = []
    for nm, desc in BANDS:
        if k == "ld" and nm == "COST STRIP":
            continue
        if k == "ld" and nm == "NAME PLATE":
            desc = "2.2% down to 23.6% — a blank plate for the card name (no cost strip on terrain)"
        if nm == "STAT BAND":
            desc = desc + " — " + statline.split("STAT BAND: ")[1]
        bands.append(f"  - {nm}: {desc}")
    return (
        f"A single fantasy trading-card FRAME — border and panel structure only, no artwork, "
        f"no text anywhere. Portrait card, exact 5:7 aspect ratio.\n\n"
        f"Element: {EL_EN[el]}. Its symbol is {ELSYM[el]}, set in a round badge in the top-left "
        f"corner of the border. Palette {ELMOOD[el]}, accent colour {ELHEX[el]}.\n"
        f"Card type: {badge}. {TYPENOTE[k]}\n\n"
        f"Divide the card into these horizontal bands, measured from the top as a percentage "
        f"of the card's height:\n" + "\n".join(bands) + "\n\n" + FRAME_RULES
    )


def frame_sheet_prompt():
    """7속성 × 4타입 = 28칸 한 장. 이게 기본 경로 — 톤이 저절로 맞는다."""
    els = list(G.DECKS.keys())
    elline = "\n".join(
        f"  Column {i+1} — {EL_EN[e]}: symbol is {ELSYM[e]}, palette {ELMOOD[e]}, accent {ELHEX[e]}"
        for i, e in enumerate(els))
    rows = "\n".join(
        f"  Row {i+1} — {TYPEKO[k]} ({k}): {TYPESPEC[k][0]}. {TYPENOTE[k]} {TYPESPEC[k][1]}"
        for i, k in enumerate(["cr", "sp", "en", "ld"]))
    bands = "\n".join(f"  - {nm}: {desc}" for nm, desc in BANDS)
    return (
        f"A single image laid out as a 7-column by 4-row grid of 28 fantasy trading-card FRAMES. "
        f"Every cell is one complete empty card frame, portrait, exact 5:7 aspect ratio, with a "
        f"black gutter between cells. Border and panel structure only — no artwork, no text.\n\n"
        f"Columns are the seven elements (same element down each column):\n{elline}\n\n"
        f"Rows are the four card types (same type across each row):\n{rows}\n\n"
        f"All 28 frames share one identical layout, measured from the top as a percentage of "
        f"card height:\n{bands}\n\n"
        f"Only two things change between cells: the element colour and corner symbol (by column), "
        f"and the type badge and stat band (by row). Everything else is identical.\n\n"
        + FRAME_RULES
    )


def cost_module_prompt():
    """코스트 동그라미는 프레임에 굽지 않고 별도 리소스로 만들어 붙인다."""
    orbs = "\n".join(
        f"  {i+1}. {EL_EN[e]} — a polished round gem in {ELHEX[e]}, {ELSYM[e]} faintly "
        f"etched on its face" for i, e in enumerate(G.DECKS.keys()))
    return (
        "A single image laid out as a 4-column by 2-row grid of 8 separate small game icons, "
        "each icon centred in its own cell.\n\n"
        "Every icon is the same object: a circular resource gem seated in a thin metal ring, "
        "viewed flat straight-on, like a UI token. Same size, same ring, same lighting in all "
        "eight — only the gem colour changes.\n\n"
        "The eight icons, in order:\n" + orbs + "\n"
        "  8. generic — the same metal ring but EMPTY: a hollow socket with nothing in it, "
        "showing dark shadow inside.\n\n"
        "Put every icon on a solid flat pure magenta background (#FF00FF) so the background can "
        "be keyed out. No gradients in the background, no shadows cast onto the background, no "
        "text, no numbers, no labels, no border."
    )


def build():
    cards, frames = [], []
    for el in G.DECKS:
        deck = G.DECKS[el]
        n = 0
        for (nm, c, tag, a, h, cp, keys) in deck["creatures"]:
            n += 1
            cards.append((el, n, nm, c, "cr", tag, card_prompt(nm, el, "cr", tag)))
        for (nm, c, kind, val, ref, adj, cp, rule) in deck["spells"]:
            n += 1
            cards.append((el, n, nm, c, "sp", kind, card_prompt(nm, el, "sp")))
        for (nm, c, dr, E, C, scope, cp, rule) in deck["enchants"]:
            n += 1
            cards.append((el, n, nm, c, "en", dr, card_prompt(nm, el, "en")))
    for el in G.DECKS:
        for k in ("cr", "sp", "en", "ld"):
            frames.append((el, k, frame_prompt(el, k)))
    sheets = [(el, sheet_prompt(el)) for el in G.DECKS]
    missing = [nm for (_, _, nm, *_r) in cards if nm not in SUBJECT]
    return cards, frames, sheets, missing


def md(cards, frames, sheets, frame_sheet, cost):
    L = ["# TEN — 이미지 생성 프롬프트", "",
         "ChatGPT / DALL·E 용. 카드가 바뀌면 `python3 tools/gen_art_prompts.py`로 다시 만든다.", "",
         "## 1. 프레임 28칸 시트 (권장)  →  `frames-sheet.png`", "", "```", frame_sheet, "```", "",
         "## 2. 코스트 모듈 8종  →  `cost-orbs.png`", "", "```", cost, "```", "",
         "## 3. 프레임 개별 28장 (7속성 × 4타입)", ""]
    for el, k, p in frames:
        L += [f"### {G.KO[el]} · {TYPEKO[k]}  →  `frame-{el}-{k}.png`", "```", p, "```", ""]
    L += ["## 4. 일러스트 — 속성별 4×5 시트 7장", ""]
    for el, p in sheets:
        L += [f"### {G.KO[el]} 20종 시트  →  `sheet-{el}.png`", "```", p, "```", ""]
    L += ["## 5. 일러스트 — 카드별 개별 (재작업용) 140장", ""]
    cur = None
    for el, n, nm, c, k, tag, p in cards:
        if el != cur:
            cur = el
            L += [f"### {G.KO[el]}", ""]
        L += [f"**{n:02d}. {nm}** ({c}코 {TYPEKO[k]}) → `art-{el}-{n:02d}.png`", "```", p, "```", ""]
    return "\n".join(L)


HTML_TPL = r"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light only"><title>TEN — 이미지 생성 프롬프트</title>
<link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@700;900&family=Noto+Sans+KR:wght@300;400;700&family=JetBrains+Mono:wght@400;500&display=swap"
 rel="stylesheet" media="print" onload="this.media='all'">
<style>
:root{--paper:#EDEFF2;--paper-2:#E3E6EB;--ink:#141821;--ink-soft:#4A5364;--ink-faint:#8A94A6;--rule:#C6CCD6;--ok:#0F8A80}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:'Noto Sans KR',sans-serif;padding:22px 14px 70px;line-height:1.7}
.wrap{max-width:900px;margin:0 auto}
.meta{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint)}
h1{font-family:'Gothic A1',sans-serif;font-weight:900;font-size:clamp(26px,5vw,38px);letter-spacing:-.03em;line-height:1.1;margin-top:4px}
.lede{font-size:14.5px;color:var(--ink-soft);font-weight:300;max-width:64ch;margin:12px 0}
h2{font-family:'Gothic A1',sans-serif;font-weight:900;font-size:19px;margin:40px 0 6px;padding-top:16px;border-top:2px solid var(--ink)}
h2 span{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;color:var(--ink-faint);letter-spacing:.16em;display:block;margin-bottom:5px}
h3{font-family:'Gothic A1',sans-serif;font-weight:700;font-size:15px;margin:24px 0 4px}
p{font-size:14px;color:var(--ink-soft);font-weight:300;max-width:68ch}
p b,li b{color:var(--ink);font-weight:700}
ul{margin:8px 0 8px 18px}li{font-size:14px;color:var(--ink-soft);font-weight:300;margin:4px 0}
.pbox{border:1px solid var(--rule);border-left:4px solid var(--c,var(--ink));border-radius:7px;background:var(--paper-2);margin:8px 0 16px}
.phead{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid var(--rule);flex-wrap:wrap}
.pname{font-family:'Gothic A1',sans-serif;font-weight:700;font-size:14px}
.pfile{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--ink-faint)}
.copy{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;border:1px solid var(--ink);
 background:var(--ink);color:var(--paper);border-radius:4px;padding:4px 11px;cursor:pointer}
.copy.done{background:var(--ok);border-color:var(--ok)}
pre{font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.65;color:var(--ink-soft);
 padding:11px 13px;white-space:pre-wrap;word-break:break-word;max-height:none}
.note{border:1px solid var(--rule);border-left:5px solid var(--ok);border-radius:6px;background:var(--paper-2);padding:13px 16px;margin:14px 0}
.note b{color:var(--ink)}
</style></head><body><div class="wrap">
__BODY__
</div>
<script>
document.querySelectorAll('.copy').forEach(b=>b.onclick=async()=>{
  const t=b.closest('.pbox').querySelector('pre').textContent;
  try{await navigator.clipboard.writeText(t);}catch(e){
    const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();
    document.execCommand('copy');a.remove();}
  b.textContent='복사됨';b.classList.add('done');
  setTimeout(()=>{b.textContent='복사';b.classList.remove('done');},1400);
});
</script></body></html>"""


def box(name, file, prompt, color):
    return (f'<div class="pbox" style="--c:{color}"><div class="phead">'
            f'<span class="pname">{html.escape(name)}</span>'
            f'<span class="pfile">{html.escape(file)}</span>'
            f'<button class="copy">복사</button></div>'
            f'<pre>{html.escape(prompt)}</pre></div>')


def build_html(cards, frames, sheets, frame_sheet, cost):
    B = ['<div class="meta">TEN · IMAGE PROMPTS · 2026.07</div>',
         '<h1>이미지 생성 프롬프트 — 프레임 28 + 코스트 모듈 + 일러스트 140</h1>',
         '<p class="lede">ChatGPT / DALL·E 기준. 각 상자의 <b>복사</b>를 눌러 그대로 붙여넣으면 된다. '
         '카드가 바뀌면 <code>python3 tools/gen_art_prompts.py</code>로 다시 만든다.</p>',
         '<div class="note"><b>먼저 읽을 것 — 파일 이름을 규칙대로 주셔야 자동으로 붙습니다.</b>'
         '<ul><li>프레임 시트: <code>frames-sheet.png</code> · 코스트 모듈: <code>cost-orbs.png</code></li>'
         '<li>프레임 개별: <code>frame-&lt;속성&gt;-&lt;타입&gt;.png</code> — 타입은 <code>cr sp en ld</code> (예: <code>frame-fire-cr.png</code>)</li>'
         '<li>시트: <code>sheet-&lt;속성&gt;.png</code> — 제가 20칸으로 잘라 씁니다</li>'
         '<li>개별: <code>art-&lt;속성&gt;-&lt;번호&gt;.png</code> (예: <code>art-dark-08.png</code>)</li></ul>'
         '번호는 아래 05번 목록의 번호와 같습니다. 시트로 주시면 개별 파일은 필요 없습니다.</div>',
         '<div class="note" style="border-left-color:#B03A3F"><b>지난 시트에서 실제로 어긋났던 것.</b> '
         '속성이 <b>강철·대지 대신 neutral·arcane</b>으로 바뀌어 나왔고, 이름판·코스트 자리·능력치 소켓이 '
         '통째로 빠졌으며 세 타입이 작은 뱃지 하나만 빼고 같았습니다. 그래서 이번 프롬프트는 '
         '<b>속성 7종의 상징을 하나씩 못 박고</b>, 타입별로 하단 띠를 다르게 지정했습니다. '
         '받으시면 열 순서(불·물·자연·강철·대지·어둠·빛)부터 확인해 주세요.</div>',
         '<div class="note" style="border-left-color:#B87400"><b>DALL·E의 한계 두 가지.</b> '
         '투명 배경과 정확한 픽셀 좌표는 못 맞춥니다. 그래서 프레임 프롬프트는 '
         '<b>일러스트 창을 단색 빈 사각형</b>으로, <b>글자 들어갈 띠는 빈 판</b>으로 그리게 했습니다. '
         '받으면 제가 창 부분을 잘라내 투명하게 만들고 비율을 실제 카드(5:7)에 맞춰 보정합니다. '
         '코스트 동그라미는 <b>순수 마젠타 배경(#FF00FF)</b>으로 받아서 제가 키잉해 투명화합니다. '
         '띠 위치가 % 단위로 정확히 안 나와도 괜찮습니다 — 순서와 대략의 비율만 맞으면 제가 맞춥니다.</div>',
         '<h2><span>01 — 프레임 · 한 장으로</span>7속성 × 4타입 = 28칸 (권장)</h2>',
         '<p>지난번처럼 한 이미지에 전부 담는 방식입니다. <b>열이 속성, 행이 카드 타입</b>입니다. '
         '한 장에서 뽑으면 28칸의 톤이 저절로 맞습니다. 이걸 먼저 돌려보고, 특정 칸만 이상하면 '
         '아래 03번 개별 프롬프트로 그 칸만 다시 뽑으면 됩니다.</p>',
         box("프레임 28칸 시트", "frames-sheet.png", frame_sheet, "#141821"),
         '<h2><span>02 — 코스트 모듈</span>프레임에 굽지 말고 따로 붙인다</h2>',
         '<p>코스트는 1~6개로 개수가 변하고 유색·무색 조합도 카드마다 다릅니다. 프레임에 그려 넣으면 '
         '절대 안 맞습니다. <b>동그라미 8종(속성 7 + 무색 1)을 따로 리소스로 뽑아</b> 프레임의 코스트 '
         '자리에 코드로 얹는 방식이 맞습니다.</p>',
         box("자원 동그라미 8종", "cost-orbs.png", cost, "#B87400"),
         '<h2><span>03 — 프레임 · 개별</span>특정 칸만 다시 뽑을 때 (28장)</h2>',
         '<p>속성색·상징과 타입별 하단 띠만 다르고 나머지 구조는 전부 같습니다.</p>']
    for el, k, p in frames:
        B.append(box(f"{G.KO[el]} · {TYPEKO[k]}", f"frame-{el}-{k}.png", p, ELHEX[el]))
    B += ['<h2><span>04 — 일러스트 · 시트</span>속성별 4×5 = 7장으로 140장</h2>',
          '<p>한 번에 20칸을 뽑는 방식입니다. 지난번 4×5 시트와 같은 방법이고, '
          '이게 가장 빠르고 톤도 잘 맞습니다. 칸 순서는 아래 3번 목록 번호와 같습니다.</p>']
    for el, p in sheets:
        B.append(box(f"{G.KO[el]} 20종 시트", f"sheet-{el}.png", p, ELHEX[el]))
    B += ['<h2><span>05 — 일러스트 · 개별</span>마음에 안 드는 칸만 다시 뽑을 때</h2>',
          '<p>시트에서 특정 칸만 마음에 안 들 때 그 카드만 개별로 다시 뽑습니다. 전부 돌릴 필요는 없습니다.</p>']
    cur = None
    for el, n, nm, c, k, tag, p in cards:
        if el != cur:
            cur = el
            B.append(f'<h3>{G.KO[el]} — {G.MECH[el][0]}</h3>')
        B.append(box(f"{n:02d}. {nm} ({c}코 {TYPEKO[k]})", f"art-{el}-{n:02d}.png", p, ELHEX[el]))
    return HTML_TPL.replace("__BODY__", "\n".join(B))


def main():
    cards, frames, sheets, missing = build()
    if missing:
        print(f"⚠ 소재가 없는 카드 {len(missing)}종: {', '.join(missing[:10])}")
    out_html = os.path.join(ROOT, "docs", "art_prompts.html")
    out_md = os.path.join(ROOT, "docs", "art_prompts.md")
    fs, cm = frame_sheet_prompt(), cost_module_prompt()
    open(out_html, "w", encoding="utf-8").write(build_html(cards, frames, sheets, fs, cm))
    open(out_md, "w", encoding="utf-8").write(md(cards, frames, sheets, fs, cm))
    print(f"프레임 {len(frames)} · 시트 {len(sheets)} · 카드 {len(cards)}")
    print(f"wrote {out_html}\nwrote {out_md}")


if __name__ == "__main__":
    main()
