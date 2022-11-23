import os
import platform

import discord
from discord.ext import commands

from bot import MountainBot


class EventsCog(commands.Cog, name="Events"):
    def __init__(self, bot: MountainBot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_command_error(self, ctx, err):
        print(err)

    @commands.Cog.listener()
    async def on_ready(self):
        assert isinstance(self.bot.user, discord.ClientUser)
        print(f"Logged in as {self.bot.user.name}")
        print(f"Guild ID: {self.bot.cfg.guild_id}")
        print(f"discord.py API version: {discord.__version__}")
        print(f"Python version: {platform.python_version()}")
        print(f"Running on: {platform.system()} {platform.release()} ({os.name})")
        print(f"Developer mode: {self.bot.cfg.dev}")
        await self.bot.tree.sync(guild=discord.Object(id=self.bot.cfg.guild_id))


async def setup(bot: MountainBot):
    await bot.add_cog(EventsCog(bot))
