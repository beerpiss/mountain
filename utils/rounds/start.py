from dataclasses import dataclass
from enum import Enum
from typing import Optional


@dataclass
class StartQuestion:
    rnd: int
    question: str
    answer: str
    image_url: Optional[str]


class LastQuestionState(Enum):
    Correct = 1
    Incorrect = 2
    Unknown = 3
    Timeout = 4


rulesets = {
    "o21": {
        "limit_time": 60,
        "incorrect_deducted": 0,
        "timeout": None,
    },
    "o22_1": {
        "limit_time": 60,
    },
    "o22_2": {
        "limit_time": 60,
    },
    "o22_3": {
        "limit_time": 90,
    },
    "o23_1": {
        "limit_count": 8,
    },
    "o23_2": {
        "limit_count": 12,
    },
    "o23_3": {
        "limit_count": 16,
    },
}
