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
player_ans_transtable = str.maketrans("", "", ",. \t\r\n\v\u00A0\u2003")


def convert_digit_to_letter(ans: str):
    if ans.isalpha():
        return ans
    return "123456789"[: len(ans)].translate(str.maketrans(ans.ljust(9), "ABCDEFGHI"))


def match_answer(player_ans: str, ans: str) -> bool:
    if "~|" in ans:
        return any(match_answer(player_ans, x.strip()) for x in ans.split("~|"))
    elif "~>" in ans:
        sections = [x.strip() for x in ans.split("~>")]
        if all(len(x) == 1 and x.isalpha() or x.isdigit() for x in ans.split("~>")):
            ans = convert_digit_to_letter(
                ans.replace("~>", "").translate(player_ans_transtable)
            )
            player_ans = convert_digit_to_letter(
                player_ans.translate(player_ans_transtable)
            )
            return ans.capitalize() == player_ans.capitalize()
        else:
            pass
    elif "~+" in ans:
        ans = "".join(sorted(ans.replace("~+", "").translate(player_ans_transtable)))
        player_ans = "".join(sorted(player_ans.translate(player_ans_transtable)))
        return ans.capitalize() == player_ans.capitalize()
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
    assert not match_answer("1234", "C~>A~>B~>D")

    assert match_answer("CAB", "C~+A~+B")
    assert match_answer("ABC", "C~+A~+B")

    # assert match_answer("ròng rọc cố định, ròng rọc động", "ròng rọc~|ròng rọc cố định~+ròng rọc động")
    # assert match_answer("ong, thỏ", "ong và thỏ~|ong~+thỏ")
