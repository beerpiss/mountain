"""
Module for matching answer, based on BPO's syntax.

Specification
-------------
A~|B~|C: A or B or C
A~>B~>C: A, B and C in order (should accept ABC, 123)
A~+B~+C: A, B, C in any order

For letter-based answers, e.g. C~>A~>B~>D and 2~>3~>1~>4, automatic conversion is performed.

Precedence: ~> and ~+ first, then ~|.
Currently for ~> and ~+, there is a maximum of 9 answers.
"""
import re

player_ans_transtable = str.maketrans("", "", ",. \t\r\n\v\u00A0\u2003")
delims = re.compile(r"\bvà\b|,")


def convert_digit_to_letter(ans: str):
    if ans.isalpha():
        return ans
    ans = ans.upper()
    return "123456789"[: len(ans)].translate(str.maketrans(ans.ljust(9), "ABCDEFGHI"))


def match_answer(player_ans: str, ans: str) -> bool:
    if "~|" in ans:
        return any(match_answer(player_ans, x.strip()) for x in ans.split("~|"))
    elif "~>" in ans:
        sections = [x.lower().strip() for x in ans.split("~>")]

        if all(len(x) == 1 and x.isalpha() or x.isdigit() for x in sections):
            # BACD or 3214-type answers
            ans = convert_digit_to_letter(
                ans.replace("~>", "").translate(player_ans_transtable)
            )
            player_ans = convert_digit_to_letter(
                player_ans.translate(player_ans_transtable)
            )
            return ans.upper() == player_ans.upper()
        else:
            return all(
                player_section.lower().strip() == section
                for (player_section, section) in zip(player_ans.split(","), sections)
            )

    elif "~+" in ans:
        sections = sorted([x.lower().strip() for x in ans.split("~+")])

        if all(len(x) == 1 and x.isalpha() or x.isdigit() for x in sections):
            ans = "".join(
                sorted(ans.replace("~+", "").translate(player_ans_transtable))
            )
            player_ans = "".join(sorted(player_ans.translate(player_ans_transtable)))
            return ans.upper() == player_ans.upper()
        else:
            player_sections = sorted(
                [x.lower().strip() for x in delims.split(player_ans)]
            )
            return all(
                player_section == section
                for (player_section, section) in zip(player_sections, sections)
            )
    else:
        return ans.lower() == player_ans.lower()


if __name__ == "__main__":
    assert match_answer("alan turing", "Alan Turing")

    assert match_answer("56", "56~|năm mươi sáu")
    assert not match_answer("57", "56~|năm mươi sáu")
    assert match_answer("nĂm mƯƠi sáU", "56 ~| năm mươi sáu")

    assert match_answer("CABD", "C~>A~>B~>D")
    assert match_answer("cabd", "C~>A~>B~>D")
    assert match_answer("C,A,B,D", "C~>A~>B~>D")
    assert match_answer("2314", "C~>A~>B~>D")
    assert match_answer("Ong, thỏ", "ong~>thỏ")
    assert not match_answer("BA", "ong~>thỏ")
    assert not match_answer("1234", "C~>A~>B~>D")
    assert not match_answer("2314", "ong~>thỏ")
    assert not match_answer("ong, thỏ", "C~>A~>B~>D")

    assert match_answer("CAB", "C~+A~+B")
    assert match_answer("ABC", "C~+A~+B")

    assert match_answer(
        "ròng rọc cố định, ròng rọc động", "ròng rọc~|ròng rọc cố định~+ròng rọc động"
    )
    assert match_answer(
        "ròng rọc cố định và ròng rọc động", "ròng rọc~|ròng rọc cố định~+ròng rọc động"
    )
    assert match_answer("ong, thỏ", "ong và thỏ~|ong~+thỏ")
    assert match_answer("ong,thỏ", "ong và thỏ~|ong~+thỏ")
    assert match_answer("thỏ, ong", "ong và thỏ~|ong~+thỏ")
    assert match_answer("thỏ và ong", "ong và thỏ~|ong~+thỏ")
