import asyncio
from random import shuffle
from time import time
from typing import Literal, Optional

from discord import Color, Embed, Message, app_commands
from discord.ext import commands

from bot import MountainBot, cfg
from utils.context import Context, transform_context
from utils.rounds.answer_matching import match_answer
from utils.rounds.start import LastQuestionState, StartQuestion, rulesets
from utils.views.start import StartingMenu


class StartCog(commands.Cog, name="Start"):
    def __init__(self, bot: MountainBot):
        self.bot = bot

    async def _fetch_questions(
        self, pack_id: Optional[int] = None
    ) -> list[StartQuestion]:
        cur = await (
            await self.bot.db.execute(
                "SELECT * FROM starting WHERE pack_id = ?", (pack_id,)
            )
            if pack_id
            else await self.bot.db.execute("SELECT * FROM starting")
        ).fetchall()
        return [StartQuestion(x[2], x[3], x[4], x[5]) for x in cur]

    async def _start(
        self,
        ctx: Context,
        questions: list[StartQuestion],
        limit_users: dict[int, str],
        results: Optional[dict[int, int]] = None,
        limit_time: Optional[float] = None,
        limit_count: int = -1,
        correct_awarded: int = 10,
        incorrect_deducted: int = 5,
        timeout: Optional[int] = 10,
    ) -> dict[int, int]:
        """
        Initiates a Starting round

        Parameters
        ----------
        ctx: Bot context
        questions: List of questions to use for this round
        limit_users: Only allow user(s) with given ID(s) to answer the questions (single for O20/21, multi for O22+)

        Optional parameters
        -------------------
        results: Last round's results (irrelevant if pre-O21 rules)
        limit_time: Limit this starting round by time length in seconds
        limit_count: Limit this starting round by number of questions (O20, O23)
        correct_awarded: Award this much on answering correctly
        incorrect_deducted: Deduct this much on answering incorrectly
        timeout: Number of seconds to wait before moving on to next question

        Returns
        -------
        A dict of this round's results

        Notes
        -----
        - Any questions used will be removed from the `questions` list.
        - If a results dict is passed in, it will be mutated according to the current round.
        """
        if results is None:
            results = {user: 0 for user in limit_users.keys()}
        end_time: Optional[float] = None
        lqstate: LastQuestionState = LastQuestionState.Unknown
        lqanswer: Optional[str] = None
        if limit_time:
            end_time = time() + limit_time

        for (idx, question) in enumerate(questions):
            if (end_time is not None and time() >= end_time) or idx == limit_count:
                break

            remaining = end_time - time() if end_time is not None else None

            match lqstate:
                case LastQuestionState.Correct:
                    embed_color = Color.green()
                case LastQuestionState.Incorrect:
                    embed_color = Color.red()
                case LastQuestionState.Timeout:
                    embed_color = Color.yellow()
                case _:
                    embed_color = Color.blurple()
            embed = Embed(
                title=f"Câu hỏi thứ {idx + 1}",
                description=question.question,
                color=embed_color,
            )
            if end_time is not None:
                assert (
                    remaining is not None
                )  # we know it is not None if there is "the END" (before the "BEGINNING")
                embed.add_field(name="Thời gian", value=round(remaining))
            if question.image_url:
                embed.set_image(url=question.image_url)

            if lqanswer is not None:
                embed.add_field(name="Đáp án câu trước", value=lqanswer)
            else:
                embed.add_field(name="\u200B", value="\u200B")

            embed.add_field(name="\u200B", value="\u200B")
            for (idx, (k, v)) in enumerate(results.items()):
                if idx == 2:
                    embed.add_field(name="\u200B", value="\u200B")
                embed.add_field(name=limit_users[k], value=v)

            questions.remove(question)
            await ctx.send(embed=embed)
            try:
                if timeout and end_time is not None:
                    assert (
                        remaining is not None
                    )  # we know it is not None if there is "the END" (before the "BEGINNING")
                    to = min(remaining, timeout)
                elif end_time is not None:
                    to = remaining
                else:
                    to = timeout

                msg: Message = await self.bot.wait_for(
                    "message",
                    check=lambda m: m.author.id in limit_users.keys(),
                    timeout=to,
                )
                if match_answer(msg.content, question.answer):
                    results[msg.author.id] += correct_awarded
                    lqstate = LastQuestionState.Correct
                else:
                    results[msg.author.id] -= incorrect_deducted
                    lqstate = LastQuestionState.Incorrect
            except asyncio.TimeoutError:
                lqstate = LastQuestionState.Timeout

            if "~|" in question.answer:
                lqanswer = question.answer.split("~|")[0]
            elif "~>" or "~+" in question.answer:
                lqanswer = question.answer.translate(str.maketrans("", "", "~>+"))
        await ctx.send(content=f"Đáp án: {lqanswer}")
        return results

    async def _send_results(
        self,
        ctx: Context,
        players: dict[int, str],
        results: dict[int, int],
        title: str = "Kết quả",
    ):
        embed = Embed(title=title, color=Color.blurple())
        for (player_id, score) in dict(
            sorted(results.items(), key=lambda x: x[1], reverse=True)
        ).items():
            embed.add_field(name=players[player_id], value=score)
        await ctx.send(embed=embed)

    @app_commands.guilds(cfg.guild_id)
    @app_commands.command(description="Bắt đầu một vòng Khởi động")
    @app_commands.describe(ruleset="Luật Khởi động")
    @app_commands.describe(pack_id="Giới hạn các câu hỏi vào một bộ đề")
    @transform_context
    async def start(
        self,
        ctx: Context,
        ruleset: Literal["o21", "o22", "o23"],
        pack_id: Optional[int] = None,
    ):
        await ctx.defer()

        starting_time = time()
        ending_time = round(starting_time) + 60
        players = {}
        players[ctx.author.id] = ctx.author.display_name

        embed = Embed(
            title="Bắt đầu vòng khởi động",
            description=f"Một vòng khởi động sẽ bắt đầu <t:{ending_time}:R>.",
            color=Color.blurple(),
        )
        embed.add_field(name="Luật chơi", value=ruleset.capitalize())
        embed.add_field(name="Người chơi", value=", ".join(players.values()))
        view = StartingMenu(ctx, players, timeout=ending_time - time())

        await ctx.respond_or_edit(embed=embed, view=view)
        await asyncio.sleep(ending_time - time())

        embed.description = "Một vòng khởi động đã bắt đầu!"
        await ctx.respond_or_edit(embed=embed)

        players = view.players
        results: dict[int, int] = {user: 0 for user in view.players.keys()}
        questions = await self._fetch_questions(pack_id)
        shuffle(questions)
        if len(players) < 2:
            if ruleset != "o21":
                await ctx.send(
                    embed=Embed(
                        title="Chỉ có 1 người tham gia",
                        description="Luật khởi động O21 sẽ được áp dụng.",
                        color=Color.yellow(),
                    )
                )
            results = await self._start(
                ctx,
                questions,
                players,
                incorrect_deducted=0,
                timeout=None,
                limit_time=60,
            )
        elif ruleset == "o21":
            for (id, name) in players.items():
                embed = Embed(
                    title=f"Lượt khởi động của {name}",
                    description=f"Lượt khởi động sẽ bắt đầu <t:{time() + 5}:R>. Bạn có 60 giây để hoàn thành lượt khởi động của mình. Chúc bạn thành công!",
                    color=Color.blurple(),
                )
                await ctx.send(embed=embed)
                await asyncio.sleep(5)
                results.update(
                    await self._start(
                        ctx,
                        questions,
                        dict([(id, name)]),
                        **rulesets[ruleset],
                    )
                )
                await ctx.send(
                    content=f"Chúc mừng {name} đã kết thúc vòng thi khởi động với {results[id]} điểm!"
                )
        elif ruleset == "o22" or ruleset == "o23":
            for rnd in range(1, 4):
                if ruleset == "o22":
                    requirement = f"Các bạn có {60 if rnd <= 2 else 90} để hoàn thành lượt khởi động"
                else:
                    requirement = f"Các bạn sẽ phải trả lời {rulesets[f'{ruleset}_{rnd}']['limit_count']} câu hỏi"
                embed = Embed(
                    title=f"Lượt khởi động {rnd}",
                    description=f"Lượt khởi động sẽ bắt đầu <t:{time() + 5}:R>. {requirement}. Chúc các bạn thành công!",
                    color=Color.blurple(),
                )
                await ctx.send(embed=embed)
                await asyncio.sleep(5)
                await self._start(
                    ctx,
                    questions,
                    players,
                    results=results,
                    **rulesets[f"{ruleset}_{rnd}"],
                )
                await self._send_results(
                    ctx, players, results, title=f"Kết quả vòng {rnd}"
                )

        await self._send_results(ctx, players, results)


async def setup(bot: MountainBot):
    await bot.add_cog(StartCog(bot))
