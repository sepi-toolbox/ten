#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""엘리멘츠 대전 모드 — 카드 데이터 생성기

  python3 tools/gen_etg.py        →  data/etg_cards.json

■ 왜 별도 파일인가
  이 모드의 카드는 **TEN 카드가 아니다.** 하나라도 POOL 로 새면 카드 뷰어·원정
  보상·덱 편집기에 남의 게임 카드가 섞인다. 그래서 정본을 data/cards.json 이
  아니라 **data/etg_cards.json** 에 따로 둔다. promote_decks.py 도, build_proto_data.py
  도 이 파일을 쳐다보지 않는다. 반대로 이 모드는 TEN 카드를 한 장도 싣지 않는다.

■ 원본
  data/etg_src/cards.csv      — openEtG (serprex/openEtG) 의 `src/vanilla/cards.csv`.
                                openEtG 의 자체 확장이 아니라 **원작(vanilla) 표**다.
  data/etg_src/skilltext.json — 같은 저장소 `src/rs/src/text.rs` 에서 뽑은 능력 설명.
  data/etg_src/revival.json   — **원작에 인쇄된 글과 능력 이름.**
                                Sparklmonkey/ElementsTheRevival(원작을 잇는 유니티 구현)의
                                `Assets/Resources/Cards/CardDatabase.json` 에서 뽑았다.
                                openEtG 는 능력을 일반화해 버려서 **이름이 없다**
                                (불의 정령도 독수리도 똑같이 `growth`). 원작에서는
                                각각 '아블레이즈' 와 '스캐빈저' 라는 다른 이름이다.

  ⚠ 원작 위키(elementsthegame.fandom.com)는 이 환경에서 402 로 막힌다.
    그래서 사람이 옮겨 적은 위키 대신 **기계가 읽는 표**를 정본으로 삼았다.
    수치를 손으로 옮기다 틀릴 일이 없다는 게 이 선택의 이유다.

■ 한 줄 형식 (10칸, '|' 구분)
  code|name|element|kind|rarity|cost[:costele]|attack|health|skills|status
  code 가 3xxx 면 **강화판(upgraded)** 이다. 1xxx 의 code+2000 이 짝.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "data", "etg_src")
OUT = os.path.join(ROOT, "data", "etg_cards.json")

# openEtG src/ui.js eleNames 순서. 0 은 무색(Chroma/Other).
ELS = ["other", "entropy", "death", "gravity", "earth", "life", "fire",
       "water", "light", "air", "time", "dark", "aether"]
ELKO = ["무색", "엔트로피", "죽음", "중력", "대지", "생명", "불",
        "물", "빛", "바람", "시간", "어둠", "에테르"]
# openEtG src/rs/src/game.rs enum Kind
KINDS = ["weapon", "shield", "perm", "spell", "creature"]

# ── 이름 (한국어) ─────────────────────────────────────────────────────────────
# 고유명사는 소리를 살리고, 뜻이 규칙과 붙어 있는 것(Momentum·Purify 등)은 뜻으로.
KO = {
"Quantum Pillar":"양자 기둥","Quantum Tower":"양자 탑",
"Mark of Entropy":"엔트로피 문장","Mark of Death":"죽음 문장","Mark of Gravity":"중력 문장",
"Mark of Earth":"대지 문장","Mark of Life":"생명 문장","Mark of Fire":"불 문장",
"Mark of Water":"물 문장","Mark of Light":"빛 문장","Mark of Air":"바람 문장",
"Mark of Time":"시간 문장","Mark of Darkness":"어둠 문장","Mark of Aether":"에테르 문장",
"Dagger":"단검","Dirk":"장단검","Short Sword":"단검류 소검","Long Sword":"장검",
"Hammer":"망치","Gavel":"의사봉","Malignant Cell":"악성 세포","Relic":"유물",
"Short Bow":"단궁","Long Bow":"장궁","Shield":"방패","Tower Shield":"타워 실드",
"Amethyst Pillar":"자수정 기둥","Amethyst Tower":"자수정 탑","Maxwell's Demon":"맥스웰의 악마",
"Abomination":"흉물","Micro Abomination":"작은 흉물","Purple Dragon":"보랏빛 용",
"Amethyst Dragon":"자수정 용","Dissipation Shield":"소산 방패","Dissipation Field":"소산 장막",
"Lycanthrope":"수화병자","Werewolf":"늑대인간","Chaos Seed":"혼돈의 씨앗","Chaos Power":"혼돈의 힘",
"Nova":"신성","Supernova":"초신성","Mutation":"돌연변이","Improved Mutation":"개량 돌연변이",
"Discord":"불협화음","Fallen Elf":"타락한 엘프","Fallen Druid":"타락한 드루이드",
"Antimatter":"반물질","Improved Antimatter":"개량 반물질","Butterfly Effect":"나비 효과",
"Pandemonium":"아수라장","Schrödinger's Cat":"슈뢰딩거의 고양이","Singularity":"특이점",
"Purple Nymph":"보랏빛 님프","Entropy Nymph":"엔트로피 님프","Shard of Serendipity":"우연의 파편",
"Entropy Pendulum":"엔트로피 진자",
"Bone Pillar":"뼈 기둥","Bone Tower":"뼈 탑","Bone Dragon":"뼈 용","Ivory Dragon":"상아 용",
"Virus":"바이러스","Retrovirus":"레트로바이러스","Flesh Spider":"살점 거미","Flesh Recluse":"살점 은둔거미",
"Vulture":"독수리","Condor":"콘도르","Skull Shield":"해골 방패","Skeleton":"해골",
"Elite Skeleton":"정예 해골","Boneyard":"백골 무덤","Graveyard":"묘지","Poison":"독",
"Deadly Poison":"맹독","Plague":"역병","Improved Plague":"개량 역병","Arsenic":"비소",
"Bone Wall":"뼈 장벽","Aflatoxin":"아플라톡신","Mummy":"미이라","Elite Mummy":"정예 미이라",
"Deathstalker":"죽음추적자","Soul Catcher":"영혼 포집기","Grey Nymph":"잿빛 님프",
"Death Nymph":"죽음 님프","Shard of Sacrifice":"희생의 파편","Death Pendulum":"죽음 진자",
"Gravity Pillar":"중력 기둥","Gravity Tower":"중력 탑","Sapphire Charger":"사파이어 돌격수",
"Elite Charger":"정예 돌격수","Armagio":"아르마지오","Elite Armagio":"정예 아르마지오",
"Graviton Mercenary":"중력자 용병","Graviton Guard":"중력자 수문장","Colossal Dragon":"거대 용",
"Massive Dragon":"육중한 용","Gravity Shield":"중력 방패","Momentum":"관성","Unstoppable":"막을 수 없음",
"Otyugh":"오티유","Elite Otyugh":"정예 오티유","Titan":"타이탄","Gravity Pull":"중력 견인",
"Gravity Force":"중력장","Graviton Fire Eater":"중력자 불먹보","Graviton Firemaster":"중력자 불지배자",
"Black Hole":"블랙홀","Chimera":"키메라","Catapult":"투석기","Trebuchet":"트레뷰셋",
"Acceleration":"가속","Overdrive":"과부하","Graviton Salvager":"중력자 해체공",
"Amber Nymph":"호박 님프","Gravity Nymph":"중력 님프","Shard of Focus":"집중의 파편",
"Gravity Pendulum":"중력 진자",
"Stone Pillar":"돌기둥","Stone Tower":"돌탑","Antlion":"개미귀신","Elite Antlion":"정예 개미귀신",
"Hematite Golem":"적철석 골렘","Steel Golem":"강철 골렘","Stone Dragon":"돌 용","Basalt Dragon":"현무암 용",
"Titanium Shield":"티타늄 방패","Diamond Shield":"다이아몬드 방패","Plate Armor":"판금 갑옷",
"Heavy Armor":"중갑","Gnome Rider":"노움 기수","Gnome Gemfinder":"노움 보석탐사자",
"Pulverizer":"분쇄기","Graboid":"그래보이드","Elite Graboid":"정예 그래보이드",
"Shrieker":"비명벌레","Elite Shrieker":"정예 비명벌레","Enchant Artifact":"기물 봉인",
"Protect Artifact":"기물 보호","Earthquake":"지진","Quicksand":"유사","Stone Skin":"돌 피부",
"Granite Skin":"화강암 피부","Basilisk Blood":"바실리스크의 피","Iridium Warden":"이리듐 파수꾼",
"Vanadium Warden":"바나듐 파수꾼","Shard Golem":"파편 골렘","Auburn Nymph":"적갈색 님프",
"Earth Nymph":"대지 님프","Shard of Integrity":"완전의 파편","Earth Pendulum":"대지 진자",
"Emerald Pillar":"에메랄드 기둥","Emerald Tower":"에메랄드 탑","Emerald Dragon":"에메랄드 용",
"Jade Dragon":"비취 용","Horned Frog":"뿔개구리","Giant Frog":"거대 개구리","Rustler":"목동",
"Leaf Dragon":"잎사귀 용","Cockatrice":"코카트리스","Elite Cockatrice":"정예 코카트리스",
"Forest Spirit":"숲의 정령","Forest Spectre":"숲의 망령","Heal":"치유","Improved Heal":"개량 치유",
"Thorn Carapace":"가시 등껍질","Spine Carapace":"가시돌기 등껍질","Emerald Shield":"에메랄드 방패",
"Jade Shield":"비취 방패","Druidic Staff":"드루이드 지팡이","Jade Staff":"비취 지팡이",
"Empathic Bond":"교감의 유대","Feral Bond":"야성의 유대","Adrenaline":"아드레날린",
"Epinephrine":"에피네프린","Forest Scorpion":"숲전갈","Scorpion":"전갈","Mitosis":"유사분열",
"Green Nymph":"초록 님프","Life Nymph":"생명 님프","Shard of Gratitude":"감사의 파편",
"Life Pendulum":"생명 진자",
"Burning Pillar":"불타는 기둥","Burning Tower":"불타는 탑","Ash Eater":"재먹보",
"Brimstone Eater":"유황먹보","Crimson Dragon":"진홍 용","Ruby Dragon":"루비 용",
"Fire Spirit":"불의 정령","Fire Spectre":"불의 망령","Fire Bolt":"화염 화살","Fire Lance":"화염 창",
"Fire Shield":"불 방패","Fire Buckler":"불 소방패","Deflagration":"폭연","Explosion":"폭발",
"Fahrenheit":"화씨","Rain of Fire":"불비","Fire Storm":"화염 폭풍","Immolation":"분신",
"Cremation":"화장","Lava Golem":"용암 골렘","Lava Destroyer":"용암 파괴자","Rage Potion":"분노의 물약",
"Rage Elixir":"분노의 영약","Phoenix":"불사조","Minor Phoenix":"작은 불사조","Ash":"잿더미",
"Seraph":"세라핌","Red Nymph":"붉은 님프","Fire Nymph":"불 님프","Shard of Bravery":"용기의 파편",
"Fire Pendulum":"불 진자",
"Water Pillar":"물 기둥","Water Tower":"물 탑","Chrysaora":"크리사오라","Physalia":"작은부레관해파리",
"Blue Crawler":"푸른 기어다니개","Abyss Crawler":"심연 기어다니개","Freeze":"동결","Congeal":"응결",
"Ice Bolt":"얼음 화살","Ice Lance":"얼음 창","Ice Shield":"얼음 방패","Permafrost Shield":"영구동토 방패",
"Purify":"정화","Arctic Squid":"북극 오징어","Arctic Octopus":"북극 문어","Trident":"삼지창",
"Poseidon":"포세이돈","Ice Dragon":"얼음 용","Arctic Dragon":"북극 용","Toadfish":"두꺼비고기",
"Puffer Fish":"복어","Mind Flayer":"마인드 플레이어","Ulitharid":"울리사리드","Nymph's Tears":"님프의 눈물",
"Flooding":"범람","Steam Machine":"증기 기관","Dry Spell":"가뭄","Dessication":"건조",
"Nymph Queen":"님프 여왕","Water Nymph":"물 님프","Shard of Patience":"인내의 파편",
"Water Pendulum":"물 진자",
"Light Pillar":"빛 기둥","Light Tower":"빛 탑","Photon":"광자","Ray of Light":"빛줄기",
"Golden Dragon":"황금 용","Light Dragon":"빛의 용","Pegasus":"페가수스","Elite Pegasus":"정예 페가수스",
"Holy Light":"성광","Holy Flash":"성광 섬광","Solar Shield":"태양 방패","Solar Buckler":"태양 소방패",
"Guardian Angel":"수호 천사","Archangel":"대천사","Blessing":"축복","Improved Blessing":"개량 축복",
"Reflective Shield":"반사 방패","Mirror Shield":"거울 방패","Morning Star":"모닝스타",
"Morning Glory":"모닝글로리","Miracle":"기적","Improved Miracle":"개량 기적","Luciferin":"루시페린",
"Luciferase":"루시페레이스","Hope":"희망","Crusader":"성전사","Sanctuary":"성역",
"Light Nymph":"빛 님프","Shard of Divinity":"신성의 파편","Light Pendulum":"빛 진자",
"Wind Pillar":"바람 기둥","Wind Tower":"바람 탑","Dragonfly":"잠자리","Damselfly":"실잠자리",
"Wyrm":"와이엄","Elite Wyrm":"정예 와이엄","Azure Dragon":"하늘빛 용","Sky Dragon":"창공의 용",
"Fog Shield":"안개 방패","Improved Fog":"개량 안개","Thunderstorm":"뇌우","Lightning Storm":"번개 폭풍",
"Flying Weapon":"비행 무기","Animate Weapon":"생명 부여 무기","Firefly Queen":"반딧불 여왕",
"Elite Firefly Queen":"정예 반딧불 여왕","Firefly":"반딧불","Elite Firefly":"정예 반딧불",
"Owl's Eye":"올빼미의 눈","Eagle's Eye":"독수리의 눈","Unstable Gas":"불안정한 기체",
"Shockwave":"충격파","Wings":"날개","Sky Blitz":"창공 강습","Blue Nymph":"푸른 님프",
"Air Nymph":"바람 님프","Shard of Freedom":"자유의 파편","Air Pendulum":"바람 진자",
"Time Factory":"시간 공장","Time Tower":"시간 탑","Déjà Vu":"데자뷰","Elite Déjà Vu":"정예 데자뷰",
"Fate Egg":"운명의 알","Procrastination":"미루기","Turtle Shield":"거북 방패","Reverse Time":"시간 역행",
"Rewind":"되감기","Golden Hourglass":"황금 모래시계","Electrum Hourglass":"호박금 모래시계",
"Devonian Dragon":"데본기 용","Silurian Dragon":"실루리아기 용","Anubis":"아누비스",
"Elite Anubis":"정예 아누비스","Eternity":"영겁","Sundial":"해시계","Scarab":"스카라브",
"Elite Scarab":"정예 스카라브","Precognition":"예지","Pharaoh":"파라오","Dune Scorpion":"사구 전갈",
"Ghost of the Past":"과거의 망령","Golden Nymph":"황금 님프","Shard of Readiness":"준비의 파편",
"Time Pendulum":"시간 진자",
"Obsidian Pillar":"흑요석 기둥","Obsidian Tower":"흑요석 탑","Black Dragon":"검은 용",
"Obsidian Dragon":"흑요석 용","Devourer":"포식자","Pest":"해충","Parasite":"기생충",
"Bloodsucker":"흡혈귀충","Dusk Mantle":"황혼의 장막","Improved Dusk":"개량 황혼","Steal":"강탈",
"Improved Steal":"개량 강탈","Nightfall":"땅거미","Eclipse":"일식","Vampire Stiletto":"흡혈귀 단도",
"Vampire Dagger":"흡혈귀 단검","Drain Life":"생명 흡수","Siphon Life":"생명 착취",
"Minor Vampire":"하급 뱀파이어","Vampire":"뱀파이어","Liquid Shadow":"액체 그림자","Gargoyle":"가고일",
"Voodoo Doll":"부두 인형","Nightmare":"악몽","Cloak":"장막","Black Nymph":"검은 님프",
"Dark Nymph":"어둠 님프","Shard of Void":"공허의 파편","Dark Pendulum":"어둠 진자",
"Aether Pillar":"에테르 기둥","Aether Tower":"에테르 탑","Spark":"불꽃","Ball Lightning":"구전뢰",
"Lightning":"번개","Thunderbolt":"벼락","Parallel Universe":"평행우주","Twin Universe":"쌍둥이 우주",
"Immortal":"불멸자","Elite Immortal":"정예 불멸자","Dimensional Shield":"차원 방패",
"Phase Shield":"위상 방패","Lobotomizer":"뇌엽절제기","Electrocutor":"감전기","Phase Dragon":"위상 용",
"Elite Phase Dragon":"정예 위상 용","Phase Spider":"위상 거미","Phase Recluse":"위상 은둔거미",
"Quintessence":"정수","Fractal":"프랙탈","Mindgate":"정신의 문","Silence":"침묵","Psion":"싸이온",
"Phase Salvager":"위상 해체공","Turquoise Nymph":"터키석 님프","Aether Nymph":"에테르 님프",
"Shard of Wisdom":"지혜의 파편","Aether Pendulum":"에테르 진자",
# 토큰(덱에 못 넣는 몸) — 능력이 만들어 낸다
"Pack Wolf":"무리 늑대","Elite Pack Wolf":"정예 무리 늑대",
}


# ── 능력 이름 (원작) ─────────────────────────────────────────────────────────
# ⚠ 이름은 **카드마다** 다르다. openEtG 로는 알 수 없다 — 거기서는 불의 정령도 독수리도
#   똑같이 `growth` 다. 원작에서는 '아블레이즈' 와 '스캐빈저' 로 아예 다른 능력이다.
ABILKO = {
"Ablaze":"아블레이즈","Adrenaline":"아드레날린","Aflatoxin":"아플라톡신","Antimatter":"반물질",
"Black Hole":"블랙홀","Burrow":"굴파기","Congeal":"응결","Dead and Alive":"삶과 죽음",
"Deja Vu":"데자뷰","Devour":"포식","Dive":"급강하","Divine shield":"신성한 방패",
"Duality":"이중성","Endow":"부여","Evolve":"진화","Firefly":"반딧불 소환","Freeze":"동결",
"Gravity Pull":"중력 견인","Growth":"성장","Guard":"수문","Hasten":"재촉","Hatch":"부화",
"Heal":"치유","Ignite (Sacrifice card)":"점화","Immortality":"불멸","Improved Mutation":"개량 돌연변이",
"Infection":"감염","Inflate":"팽창","Liquid Shadow":"액체 그림자","Luciferin":"루시페린",
"Lycanthropy":"변이","Mutation":"돌연변이","Nymph's tears":"님프의 눈물","Paradox":"역설",
"Petrify":"석화","Photosynthesis":"광합성","Poison":"독","Precognition":"예지",
"Psionic wave":"정신파","Rage":"분노","Rebirth":"환생","Scarab":"스카라브 소환","Steam":"증기",
"Stone form":"돌 형상","Unstable gas":"불안정한 기체","Web":"거미줄","Sniper":"저격",
# 지속형
"Bioluminescence":"생물발광","Deadly Venom":"맹독","Immaterial":"실체 없음","Incandescence":"백열",
"Infect":"감염","Plague":"역병","Scavenger":"시체 청소","Undead":"언데드","Vampire":"흡혈",
"Venom":"독액","Voodoo":"부두",
}
# openEtG 이름 ↔ 리바이벌 이름의 철자 차이. **뜻이 같은 것만** 잇는다 —
# 확신 없는 것(Dry Spell ↔ Inundation 등)은 잇지 않고 원문 없음으로 남긴다.
ALIAS = {
"Basilisk Blood":"Basilisk's Blood", "Déjà Vu":"Deja Vu", "Elite Déjà Vu":"Elite Deja Vu",
"Electrocutor":"Electrocuter", "Elite Firefly Queen":"Elite Queen", "Fire Storm":"Firestorm",
"Long Bow":"Longbow", "Luciferase":"Luciferaze", "Schrödinger's Cat":"Schrodinger's Cat",
}


def parse_cost(s, ele):
    """`3` 이면 자기 속성 3, `2:0` 이면 무색 2. 0 이면 색이 없다."""
    if ":" in s:
        a, b = s.split(":", 1)
        return int(a), int(b)
    v = int(s)
    return v, (ele if v else 0)


def parse_skills(raw, kind, ele):
    """`3=freeze 3+hit=poison 1` → [{ev,id,arg,cast,castel}]

    ⚠ 규칙: 숫자로 시작하는 event 는 event 가 아니라 **발동 비용**이다.
      `1=mend` = 1퀀텀 내고 쓰는 능력. openEtG build.rs 와 같은 해석."""
    out, cast, castel = [], 0, 0
    if not raw:
        return out, cast, castel
    for tok in raw.split("+"):
        if "=" in tok:
            ev, body = tok.split("=", 1)
            if re.match(r"^-?\d", ev):
                cast, castel = parse_cost(ev, ele)
                ev = "cast"
        else:
            ev, body = ("cast" if kind == 3 else "ownattack"), tok
        parts = body.split(" ")
        # ⚠⚠ 값이 **여러 개**인 능력이 있다 — `growth 2 0` 은 공격 +2, 체력 +0 이다.
        #   처음에는 첫 값만 읽고 나머지를 버렸다. 그래서 불의 정령이 원작의 +2|+0 이 아니라
        #   +2|+2 로 자랐다 — 글만 틀린 게 아니라 **수치가 틀렸다.**
        #   `summon 1908` 처럼 값이 **카드 번호**인 것도 있다(이름이 아니다).
        vals = []
        for v in parts[1:]:
            vals.append(int(v) if re.match(r"^-?\d+$", v) else v)
        out.append({"ev": ev, "id": parts[0],
                    "arg": (vals[0] if vals else None),
                    "args": vals})
    return out, cast, castel


def main():
    rows = [l.split("|") for l in open(os.path.join(SRC, "cards.csv"), encoding="utf-8").read().split("\n") if l]
    sktext = json.load(open(os.path.join(SRC, "skilltext.json"), encoding="utf-8"))
    rev = json.load(open(os.path.join(SRC, "revival.json"), encoding="utf-8"))
    # ⚠⚠ 카드에 실릴 한국어 글. 예전에는 **능력별 설명을 이어 붙여** 만들었는데,
    #   그건 원문을 옮긴 것이 아니라 내가 쓴 요약이라 문장이 조각나고 읽기 어려웠다
    #   (성권: "니 멋대로 축약하고 정리하니까 … 읽어봐도 뭔 말인지 모르겠어").
    #   이제 카드마다 **인쇄된 글을 문장 그대로 옮긴 한국어**를 붙인다.
    kotxt = json.load(open(os.path.join(ROOT, "data", "etg_kotxt.json"), encoding="utf-8"))
    cards, byname = [], {}
    for r in rows:
        if len(r) != 10:
            sys.exit("칸이 10개가 아니다: " + "|".join(r))
        code = int(r[0]); ele = int(r[2]); kind = int(r[3])
        upped = (code - 1000) % 4000 >= 2000
        cost, costel = parse_cost(r[5], ele)
        sk, cast, castel = parse_skills(r[8], kind, ele)
        flags, stats = [], {}
        for st in (r[9].split("+") if r[9] else []):
            if "=" in st:
                k, v = st.split("=", 1)
                stats[k] = int(v)
            else:
                flags.append(st)
        name = r[1]
        c = {
            "code": code, "en": name, "ko": KO.get(name, name),
            "el": ele, "kind": KINDS[kind], "rarity": int(r[4]),
            "cost": cost, "costel": costel,
            "atk": int(r[6]) if r[6] else 0, "hp": int(r[7]) if r[7] else 0,
            "sk": sk, "cast": cast, "castel": castel,
            "flags": flags, "stats": stats, "up": upped,
        }
        # ── 원작에 인쇄된 글과 능력 이름을 붙인다 ────────────────────────────
        kt = kotxt.get(name)
        if kt is None:
            kt = kotxt.get(ALIAS.get(name, ""))
        # ⚠ 빈 글("")도 **적을 것이 없다는 답**이다 — 없는 것과 구별해서 넣는다.
        #   `if kt:` 로 적어 두면 빈 글이 통째로 빠져 옛 요약으로 되돌아간다.
        if kt is not None:
            c["kotxt"] = kt
        r = rev.get(name) or rev.get(ALIAS.get(name, ""))
        if r:
            c["otxt"] = r["txt"]                      # 원문 그대로(속성 아이콘만 글자로)
            if r["abil"]:
                c["abil"] = r["abil"]
                c["abilko"] = ABILKO.get(r["abil"], r["abil"])
                c["abilkind"] = r["kind"]
        cards.append(c)
        byname.setdefault(name, c)

    # 짝 맞추기 — 강화판 code = 기본 code + 2000
    idx = {c["code"]: c for c in cards}
    for c in cards:
        if not c["up"]:
            u = idx.get(c["code"] + 2000)
            c["upcode"] = u["code"] if u else None
        else:
            c["upcode"] = None

    missing = sorted({s["id"] for c in cards for s in c["sk"] if s["id"] not in sktext})
    # ⚠ 빈 글("")과 못 찾음(키 없음)은 다르다 — 용·골렘은 원래 능력 글이 없다.
    noorig = [c["en"] for c in cards if "otxt" not in c]
    noname = sorted({c["abil"] for c in cards if c.get("abil") and c["abil"] not in ABILKO})
    data = {
        "els": ELS, "elko": ELKO,
        "src": "openEtG serprex/openEtG src/vanilla/cards.csv (원작 vanilla 표)",
        "cards": cards,
        "sktext": sktext,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    # 모드 페이지가 읽는 사본. fetch 가 아니라 <script src> 로 싣는다 —
    # file:// 로 열어도(=검사가 그렇게 연다) 그대로 돌아가야 하기 때문이다.
    js = os.path.join(ROOT, "prototype", "etg", "data.js")
    os.makedirs(os.path.dirname(js), exist_ok=True)
    with open(js, "w", encoding="utf-8") as f:
        f.write("window.ETG=")
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    base = [c for c in cards if not c["up"]]
    noko = [c["en"] for c in cards if c["en"] not in KO]
    print(f"카드 {len(cards)}장 (기본 {len(base)} · 강화 {len(cards)-len(base)}) → {OUT}")
    print(f"능력 설명 {len(sktext)}종 · 설명 없는 능력 {len(missing)}종: {', '.join(missing) or '없음'}")
    named = sum(1 for c in cards if c.get("abil"))
    withtxt = sum(1 for c in cards if c.get("otxt"))
    print(f"원문 이은 카드 {len(cards)-len(noorig)}/{len(cards)} (그중 글이 있는 것 {withtxt}장) · 능력 이름 {named}장")
    if noorig:
        print(f"  ⚠ 원문을 못 찾은 카드 {len(noorig)}장: {', '.join(sorted(set(noorig)))}")
    if noname:
        print(f"  ⚠ 한국어 이름 없는 능력: {', '.join(noname)}")
    if noko:
        print(f"⚠ 한국어 이름 없는 카드 {len(noko)}장: {', '.join(noko)}")


if __name__ == "__main__":
    main()
