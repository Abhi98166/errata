from __future__ import annotations

Finger = str
Row = str
Hand = str

_FINGER_KEYS: dict[Finger, str] = {
    "left pinky": "qaz1`",
    "left ring": "wsx2",
    "left middle": "edc3",
    "left index": "rfvtgb45",
    "right index": "yhnujm67",
    "right middle": "ik,8",
    "right ring": "ol.9",
    "right pinky": "p;/'[]\\0-=",
    "thumb": " ",
}

_SHIFT_PAIRS = {
    "!": "1", "@": "2", "#": "3", "$": "4", "%": "5", "^": "6",
    "&": "7", "*": "8", "(": "9", ")": "0", "_": "-", "+": "=",
    ":": ";", '"': "'", "<": ",", ">": ".", "?": "/", "~": "`",
    "{": "[", "}": "]", "|": "\\",
}

_ROW_KEYS: dict[Row, str] = {
    "number": "1234567890-=`",
    "top": "qwertyuiop[]\\",
    "home": "asdfghjkl;'",
    "bottom": "zxcvbnm,./",
    "space": " ",
}


def _invert(table: dict[str, str]) -> dict[str, str]:
    return {char: label for label, chars in table.items() for char in chars}


_CHAR_TO_FINGER = _invert(_FINGER_KEYS)
_CHAR_TO_ROW = _invert(_ROW_KEYS)


def _canonical(char: str) -> str:
    lowered = char.lower()
    return _SHIFT_PAIRS.get(lowered, lowered)


def finger_for(char: str) -> Finger | None:
    return _CHAR_TO_FINGER.get(_canonical(char))


def row_for(char: str) -> Row | None:
    return _CHAR_TO_ROW.get(_canonical(char))


def hand_for(char: str) -> Hand | None:
    finger = finger_for(char)
    if finger is None or finger == "thumb":
        return None
    return finger.split()[0]


def are_adjacent(a: str, b: str) -> bool:
    rows = ["1234567890-=", "qwertyuiop[]", "asdfghjkl;'", "zxcvbnm,./"]
    a, b = _canonical(a), _canonical(b)

    positions: dict[str, tuple[int, int]] = {}
    for r, row in enumerate(rows):
        for c, char in enumerate(row):
            positions[char] = (r, c)

    if a not in positions or b not in positions:
        return False

    (ra, ca), (rb, cb) = positions[a], positions[b]
    return abs(ra - rb) <= 1 and abs(ca - cb) <= 1


ENGLISH_FREQ: dict[str, float] = {
    "e": 12.7, "t": 9.1, "a": 8.2, "o": 7.5, "i": 7.0, "n": 6.7,
    "s": 6.3, "h": 6.1, "r": 6.0, "d": 4.3, "l": 4.0, "c": 2.8,
    "u": 2.8, "m": 2.4, "w": 2.4, "f": 2.2, "g": 2.0, "y": 2.0,
    "p": 1.9, "b": 1.5, "v": 1.0, "k": 0.8, "j": 0.15, "x": 0.15,
    "q": 0.10, "z": 0.07, " ": 15.0,
}


def impact_weight(char: str) -> float:
    return ENGLISH_FREQ.get(char.lower(), 0.5) / 12.7
