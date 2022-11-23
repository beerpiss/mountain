from pathlib import Path

from dotenv import dotenv_values

from utils.config import BotConfig

BOT_DIR = Path(__file__).absolute().parent
cfg = BotConfig(dotenv_values(BOT_DIR / ".env"))

if not cfg.dev:
    try:
        import pyjion

        pyjion.enable()
    except ImportError as e:
        print(e)

import asyncio
import jishaku
import logging
import logging.handlers
import sys
from pathlib import Path

import aiosqlite
import discord
from discord.ext import commands
from discord.ext.commands import Bot


class MountainBot(Bot):
    cfg: BotConfig
    db: aiosqlite.Connection

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


async def startup():
    logger = logging.getLogger("discord")
    logger.setLevel(logging.DEBUG)

    handler = logging.handlers.RotatingFileHandler(
        filename="discord.log",
        encoding="utf-8",
        maxBytes=32 * 1024 * 1024,  # 32 MiB
        backupCount=5,  # Rotate through 5 files
    )
    dt_fmt = "%Y-%m-%d %H:%M:%S"
    formatter = logging.Formatter(
        "[{asctime}] [{levelname:<8}] {name}: {message}", dt_fmt, style="{"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    (intents := discord.Intents.default()).message_content = True
    bot = MountainBot(command_prefix=commands.when_mentioned_or("!"), intents=intents)

    if cfg.dev:
        await bot.load_extension("jishaku")
        print("Loaded jishaku")

    for file in (BOT_DIR / "cogs").glob("*.py"):
        try:
            await bot.load_extension(f"cogs.{file.stem}")
            print(f"Loaded cogs.{file.stem}")
        except Exception as e:
            print(f"Failed to load extension cogs.{file.stem}")
            print(f"{type(e).__name__}: {e}")

    async with aiosqlite.connect(BOT_DIR / "database" / "database.sqlite3") as db:
        with (BOT_DIR / "database" / "schema.sql").open() as f:
            await db.executescript(f.read())
        await db.commit()

        bot.db = db
        bot.cfg = cfg

        try:
            await bot.start(cfg.token)
        except discord.LoginFailure:
            sys.exit(
                "[ERROR] Token invalid, make sure the 'AUTOTSS_TOKEN' environment variable is set to your bot token. Exiting."
            )
        except discord.PrivilegedIntentsRequired:
            sys.exit(
                "[ERROR] Server Members Intent not enabled, go to 'https://discord.com/developers/applications' and enable the Server Members Intent. Exiting."
            )


if __name__ == "__main__":
    asyncio.run(startup())
