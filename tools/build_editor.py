#!/usr/bin/env python3
"""
data/의 CSV·rules.json을 읽어 카드 에디터(card_editor.html)를 생성한다.
데이터가 바뀌면 이 스크립트를 다시 돌려 에디터의 기본값을 최신으로 맞춘다.

  python3 tools/build_editor.py
"""
import csv
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")


def load_csv(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return list(csv.DictReader(f))


def num(row, *fields):
    for f in fields:
        try:
            row[f] = int(row[f])
        except (ValueError, KeyError, TypeError):
            row[f] = 0
    return row


def main():
    rules = json.load(open(os.path.join(DATA, "rules.json"), encoding="utf-8"))
    creatures = [num(r, "cost", "atk", "hp", "copies") for r in load_csv("creatures.csv")]
    spells = [num(r, "cost", "value", "copies") for r in load_csv("spells.csv")]
    enchants = [num(r, "cost", "effect_value", "charge", "copies") for r in load_csv("enchants.csv")]

    blob = {"rules": rules, "creatures": creatures, "spells": spells, "enchants": enchants}
    template = open(os.path.join(HERE, "card_editor.template.html"), encoding="utf-8").read()
    html = template.replace("__DATA__", json.dumps(blob, ensure_ascii=False))

    out = os.path.join(HERE, "card_editor.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"wrote tools/card_editor.html  (crea={len(creatures)} spell={len(spells)} enchant={len(enchants)})")


if __name__ == "__main__":
    main()
