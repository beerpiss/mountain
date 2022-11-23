import io

import pylightxl as xl
from discord import Attachment, Color, Embed, File, app_commands
from discord.ext import commands
from pylightxl.pylightxl import Worksheet

from bot import BOT_DIR, MountainBot, cfg
from utils.context import Context, transform_context
from utils.framework.checks import always_whisper


# TODO:
# - editing questions
# - update, remove, list packs
class QuestionManagementCog(commands.Cog, name="Question Manager"):
    def __init__(self, bot: MountainBot):
        self.bot = bot

    async def __import_start_questions_o23(self, pack_id: int, data: Worksheet):
        inserted_data = (
            [
                (
                    pack_id,
                    1,
                    data.address(f"B{x}"),
                    data.address(f"C{x}"),
                    data.address(f"D{x}"),
                )
                for x in range(6, 14)
                if data.address(f"B{x}").strip()  # import only if there's a question
            ]
            + [
                (
                    pack_id,
                    2,
                    data.address(f"B{x}"),
                    data.address(f"C{x}"),
                    data.address(f"D{x}"),
                )
                for x in range(16, 28)
                if data.address(f"B{x}").strip()  # import only if there's a question
            ]
            + [
                (
                    pack_id,
                    3,
                    data.address(f"B{x}"),
                    data.address(f"C{x}"),
                    data.address(f"D{x}"),
                )
                for x in range(30, 46)
                if data.address(f"B{x}").strip()  # import only if there's a question
            ]
        )
        await self.bot.db.executemany(
            "INSERT INTO starting(pack_id, round, question, answer, image_url) VALUES(?, ?, ?, ?, ?)",
            inserted_data,
        )

    async def __import_start_questions_o22(self, pack_id: int, data: Worksheet):
        inserted_data = [
            (
                pack_id,
                x,
                data.address(f"B{y}"),
                data.address(f"C{y}"),
                data.address(f"D{y}"),
            )
            for x in range(1, 4)
            for y in range((x - 1) * 27 + 6, (x - 1) * 27 + 31)
            if data.address(f"B{y}").strip()  # import only if there's a question
        ]
        await self.bot.db.executemany(
            "INSERT INTO starting(pack_id, round, question, answer, image_url) VALUES(?, ?, ?, ?, ?)",
            inserted_data,
        )

    async def __import_obstacle(self, pack_id: int, data: Worksheet):
        async with self.bot.db.cursor() as cursor:
            if not data.address("C3"):
                return
            await cursor.execute(
                "INSERT INTO obstacle(pack_id, answer, image_url, display_type) VALUES(?,?,?,?)",
                (
                    pack_id,
                    data.address("C3"),
                    data.address("B3"),
                    int(data.address("D3")),
                ),
            )
            obstacle_id = cursor.lastrowid
            for row in range(5, 10):
                row_idx = row - 4 if row != 9 else 0
                await cursor.execute(
                    "INSERT INTO obstacle_questions(obstacle_id, row, question, answer) VALUES(?,?,?,?)",
                    (
                        obstacle_id,
                        row_idx,
                        data.address(f"B{row}"),
                        data.address(f"C{row}"),
                    ),
                )

    async def __import_acceleration(self, pack_id: int, data: Worksheet):
        async with self.bot.db.cursor() as cursor:
            for row in range(4, 8):
                if not data.address(f"B{row}"):
                    continue
                await cursor.execute(
                    "INSERT INTO acceleration(pack_id, question, answer, answer_image_url, first_image_with_question) VALUES(?,?,?,?,?)",
                    (
                        pack_id,
                        data.address(f"B{row}"),
                        data.address(f"C{row}"),
                        data.address(f"D{row}"),
                        data.address(f"E{row}") == 1,
                    ),
                )
                acceleration_id = cursor.lastrowid

                imgset_column = chr(
                    (row - 4) * 2 + 66
                )  # image sets are in column B, D, F, H
                time_column = chr((row - 4) * 2 + 67)
                imgcount = int(data.address(f"{imgset_column}12"))
                for imgrow in range(13, 13 + imgcount):
                    await cursor.execute(
                        "INSERT INTO acceleration_images(acceleration_id, ord, image_url, image_time) VALUES(?,?,?,?)",
                        (
                            acceleration_id,
                            imgrow - 13,
                            data.address(f"{imgset_column}{imgrow}"),
                            float(time)
                            if (time := data.address(f"{time_column}{imgrow}").strip())
                            else 0,
                        ),
                    )

    async def __import_finish(self, pack_id: int, data: Worksheet):
        inserted_data = [
            (
                pack_id,
                rnd,
                20 if row <= (rnd - 1) * 8 + 7 else 30,
                data.address(f"B{row}"),
                data.address(f"C{row}"),
                data.address(f"D{row}"),
                data.address(f"E{row}"),
            )
            for rnd in range(1, 4)
            for row in range((rnd - 1) * 8 + 5, (rnd - 1) * 8 + 11)
            if data.address(f"B{row}")
        ]
        await self.bot.db.executemany(
            "INSERT INTO finish(pack_id, rnd, score, question, answer, image_url, explanation) VALUES(?,?,?,?,?,?,?)",
            inserted_data,
        )

        inserted_data_chp = [
            (pack_id, data.address(f"B{row}"), data.address(f"C{row}"))
            for row in range(38, 41)
            if data.address(f"B{row}")
        ]
        await self.bot.db.executemany(
            "INSERT INTO chp(pack_id, question, answer) VALUES(?,?,?)",
            inserted_data_chp,
        )

    @app_commands.guilds(cfg.guild_id)
    @app_commands.command(name="import", description="Nhập một bộ đề")
    @app_commands.describe(name="Tên bộ đề")
    @app_commands.describe(
        xlsx="File Excel 2010 (.xlsx) có bộ đề cần nhập (dùng /template để lấy form nhập đề)"
    )
    @app_commands.describe(banned="Bộ đề có bị loại khỏi luyện tập hay không")
    @transform_context
    @always_whisper
    # TODO: permission check
    async def _import(
        self, ctx: Context, name: str, xlsx: Attachment, banned: bool = True
    ):
        await ctx.defer()
        if (
            xlsx.content_type
            != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ):
            embed = Embed(
                title="Invalid File",
                description="Đây không phải file Excel 2010!",
                color=Color.red(),
            )
            await ctx.respond_or_edit(embed=embed, delete_after=10)
            return

        fp = io.BytesIO()
        await xlsx.save(fp)

        # import vcnv tt and vd
        try:
            db = xl.readxl(fp)

            async with self.bot.db.cursor() as cursor:
                await cursor.execute("INSERT INTO packs(name) VALUES(?)", (name,))
                pack_id = cursor.lastrowid

            if (data := db.ws("Khởi động")).address("A4") == "LƯỢT 1 (8 CÂU)":
                await self.__import_start_questions_o23(pack_id, data)
            elif (data := db.ws("Khởi động")).address("A4") == "LƯỢT 1 (60 GIÂY)":
                await self.__import_start_questions_o22(pack_id, data)

            await self.__import_obstacle(pack_id, db.ws("Vượt chướng ngại vật"))
            await self.__import_acceleration(pack_id, db.ws("Tăng tốc"))
            await self.__import_finish(pack_id, db.ws("Về đích"))
        except Exception as e:
            await self.bot.db.rollback()
            embed = Embed(
                title="Lỗi",
                description=f"Đã xảy ra lỗi khi nhập đề. Đề không được nhập.\n```{e}```",
                color=Color.red(),
            )
            await ctx.respond_or_edit(embed=embed)
            return

        await self.bot.db.commit()
        embed = Embed(
            title="Thành công!",
            description=f"Đã nhập bộ đề {name}, ID {pack_id}",
            color=Color.green(),
        )
        await ctx.respond_or_edit(embed=embed)

    @app_commands.guilds(cfg.guild_id)
    @app_commands.command(description="Lấy form nhập đề mẫu")
    @transform_context
    async def template(self, ctx: Context):
        await ctx.respond_or_edit(
            file=File(BOT_DIR / "resources" / "Form nhập đề thi.xlsx")
        )


async def setup(bot: MountainBot):
    await bot.add_cog(QuestionManagementCog(bot))
