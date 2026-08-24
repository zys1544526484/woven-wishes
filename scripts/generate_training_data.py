"""Create the reproducible 1,440/360 wish-intent corpus.

The corpus is template-assisted draft data. Every row is stored so a human reviewer
can edit it before retraining; no network service is used by this script.
"""

from __future__ import annotations

import csv
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "generated"
LABELS = ("safety", "reunion", "courage", "abundance", "joy", "longevity")
RNG = random.Random(20260824)

PHRASES = {
    "safety": {
        "zh": ["家人平安", "一路顺遂", "健康安稳", "被温柔守护", "出入平安", "岁岁康宁", "旅途顺利", "生活安定"],
        "en": ["my family stays safe", "a peaceful journey", "health and safety", "gentle protection", "safe travels", "a calm life", "peace at home", "everyone stays well"],
    },
    "reunion": {
        "zh": ["一家团圆", "与故友重逢", "早日回家", "亲人常相聚", "团聚有期", "共度佳节", "家人围坐", "再见想念的人"],
        "en": ["our family reunites", "meeting old friends again", "coming home soon", "loved ones together", "a joyful reunion", "a festival together", "gathering around one table", "seeing those I miss"],
    },
    "courage": {
        "zh": ["勇敢向前", "跨过难关", "坚持自己的选择", "重新出发", "内心坚定", "不惧风雨", "拥有勇气", "成长得更坚韧"],
        "en": ["courage to move forward", "overcoming this challenge", "standing by my choice", "a brave new start", "a steady heart", "strength through storms", "finding my courage", "growing resilient"],
    },
    "abundance": {
        "zh": ["五谷丰登", "生活丰足", "事业有成", "收获满满", "家业兴旺", "灵感丰沛", "努力结出果实", "四季富足"],
        "en": ["an abundant harvest", "a plentiful life", "success in my work", "rewarding results", "a thriving home", "abundant inspiration", "effort bearing fruit", "prosperity through the seasons"],
    },
    "joy": {
        "zh": ["日日欢喜", "笑容常在", "心里明亮", "收获快乐", "分享喜悦", "幸福相伴", "遇见好消息", "生活有趣"],
        "en": ["joy every day", "many reasons to smile", "a bright heart", "finding happiness", "sharing delight", "lasting happiness", "wonderful news", "a playful life"],
    },
    "longevity": {
        "zh": ["长辈长寿", "情谊长久", "岁月绵长", "福寿安康", "美好延续", "陪伴到老", "初心长存", "家族故事代代相传"],
        "en": ["longevity for my elders", "a lasting friendship", "many meaningful years", "a long healthy life", "goodness that continues", "growing old together", "a purpose that endures", "family stories lasting generations"],
    },
}

TRAIN_PREFIX = {
    "zh": ["愿", "我希望", "把这个心愿送给未来：", "今年最想看到", "请替我织下", "我的愿望是", "真心期待", "想对明天说：", "愿望很简单，", "此刻我盼望"],
    "en": ["I wish for ", "May there be ", "Please weave a wish for ", "This year I hope for ", "My heart asks for ", "For tomorrow, I wish for ", "I want to see ", "Let this wish carry ", "My simple wish is ", "I sincerely hope for "],
}

TRAIN_SUFFIX = {
    "zh": ["。", "，也送给每一个努力的人。", "，在新的日子里。", "，这是我最珍重的期待。", "，从今天开始。", "，愿好事慢慢发生。", "，送给我在意的人。", "，一直记在心里。", "，不负每一次等待。", "。谢谢此刻的自己。"],
    "en": [".", " for everyone I care about.", " in the days ahead.", "—this matters deeply to me.", " starting today.", " as good things unfold.", " for the people close to me.", " and I will keep it in my heart.", " after every patient wait.", " with gratitude for this moment."],
}

TEST_PREFIX = {
    "zh": ["若能许愿，我会选择", "请让未来拥有", "把心里的期盼写成", "我想把祝福留给家人：", "下一段旅程，愿有"],
    "en": ["If I could make one wish: ", "For the next chapter, I choose ", "A wish I carry is ", "I send my loved ones ", "Let the road ahead bring "],
}

TEST_SUFFIX = {
    "zh": ["。", "，愿它如期而至。", "，也是给自己的约定。", "，让时间见证。", "，在平凡日子里发生。"],
    "en": [".", ", and may it arrive in time.", ", a promise to myself.", ", witnessed by time.", ", within ordinary days."],
}

TRAIN_OOD = [
    "窗外有三棵树", "今天穿蓝色衣服", "我在学习一门新语言", "桌上放着一本书", "这是一段普通描述",
    "the window faces east", "I wrote a short note", "there are three cups", "this is an ordinary sentence", "the room is quiet",
]

TEST_OOD = [
    "下午三点去车站", "这句话没有明确愿望", "铅笔放在第二个抽屉", "我看见一块灰色石头", "明天可能下雨",
    "the chair is beside the table", "I counted seven steps", "this sentence describes a fact", "the notebook has a green cover", "the train leaves at noon",
    "想一想再说", "没有特别的方向", "随便写下一句话", "今天和昨天不太一样", "只是路过这里",
]


def single_text(label: str, locale: str, index: int, test: bool = False) -> str:
    phrases = PHRASES[label][locale]
    prefixes = TEST_PREFIX[locale] if test else TRAIN_PREFIX[locale]
    suffixes = TEST_SUFFIX[locale] if test else TRAIN_SUFFIX[locale]
    phrase = phrases[(index * 3 + (1 if test else 0)) % len(phrases)]
    prefix = prefixes[(index * 7 + len(label)) % len(prefixes)]
    suffix = suffixes[(index * 11 + len(phrase)) % len(suffixes)]
    if locale == "en" and prefix.endswith("for ") and phrase.startswith(("a ", "an ")):
        phrase = phrase.split(" ", 1)[1]
    return f"{prefix}{phrase}{suffix}"


def mixed_text(primary: str, secondary: str, locale: str, index: int, test: bool = False) -> str:
    first = PHRASES[primary][locale][index % 8]
    second = PHRASES[secondary][locale][(index * 5 + 2) % 8]
    if locale == "zh":
        connectors = ["，也愿", "，同时盼望", "；更希望", "，还想把祝福送给"]
        return f"{TEST_PREFIX['zh'][index % 5] if test else TRAIN_PREFIX['zh'][index % 10]}{first}{connectors[index % 4]}{second}。"
    connectors = [", and also ", "; I also hope for ", ", together with ", ", while carrying "]
    prefix = TEST_PREFIX["en"][index % 5] if test else TRAIN_PREFIX["en"][index % 10]
    return f"{prefix}{first}{connectors[index % 4]}{second}."


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["id", "split", "locale", "label", "secondary", "is_fallback", "text", "review_status"])
        writer.writeheader()
        writer.writerows(rows)


def build_train() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for label in LABELS:
        for index in range(160):
            locale = "zh" if index < 80 else "en"
            rows.append({"split": "train-single", "locale": locale, "label": label, "secondary": "", "is_fallback": "0", "text": single_text(label, locale, index), "review_status": "template-reviewed"})
    for primary_index, primary in enumerate(LABELS):
        for index in range(40):
            secondary = LABELS[(primary_index + 1 + index % 5) % 6]
            locale = "zh" if index < 20 else "en"
            rows.append({"split": "train-mixed", "locale": locale, "label": primary, "secondary": secondary, "is_fallback": "0", "text": mixed_text(primary, secondary, locale, index), "review_status": "template-reviewed"})
    # The same vague/observational utterances are paired evenly with all labels. This
    # teaches the six-way softmax to remain low-confidence outside the wish domain.
    ood_variants = [f"{base} {index + 1}" for index in range(4) for base in TRAIN_OOD]
    for label in LABELS:
        for text in ood_variants:
            locale = "en" if text[0].isascii() else "zh"
            rows.append({"split": "train-ambiguous", "locale": locale, "label": label, "secondary": "", "is_fallback": "1", "text": text, "review_status": "template-reviewed"})
    RNG.shuffle(rows)
    for index, row in enumerate(rows, 1):
        row["id"] = f"train-{index:04d}"
    assert len(rows) == 1440
    return rows


def build_test() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for label in LABELS:
        for index in range(40):
            locale = "zh" if index < 20 else "en"
            rows.append({"split": "test-single", "locale": locale, "label": label, "secondary": "", "is_fallback": "0", "text": single_text(label, locale, index, True), "review_status": "gold-template-reviewed"})
    for primary_index, primary in enumerate(LABELS):
        for index in range(10):
            secondary = LABELS[(primary_index + 2 + index % 4) % 6]
            locale = "zh" if index < 5 else "en"
            rows.append({"split": "test-mixed", "locale": locale, "label": primary, "secondary": secondary, "is_fallback": "0", "text": mixed_text(primary, secondary, locale, index, True), "review_status": "gold-template-reviewed"})
    fallback_texts = [f"{TEST_OOD[index % len(TEST_OOD)]} {index + 1}" for index in range(60)]
    for index, text in enumerate(fallback_texts):
        locale = "en" if text[0].isascii() else "zh"
        rows.append({"split": "test-fallback", "locale": locale, "label": "", "secondary": "", "is_fallback": "1", "text": text, "review_status": "gold-template-reviewed"})
    RNG.shuffle(rows)
    for index, row in enumerate(rows, 1):
        row["id"] = f"test-{index:03d}"
    assert len(rows) == 360
    return rows


if __name__ == "__main__":
    write_csv(OUT / "train.csv", build_train())
    write_csv(OUT / "test.csv", build_test())
    print("Wrote 1,440 training rows and 360 held-out rows to data/generated/.")
