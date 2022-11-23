import asyncio
import functools
from typing import Optional

import discord

from utils.typings import CommandCallback


def transform_context(func: CommandCallback):
    @functools.wraps(func)
    async def decorator(self, interaction, *args, **kwargs):
        ctx = Context(interaction)
        return await func(self, ctx, *args, **kwargs)

    return decorator


class Context:
    def __init__(self, interaction: discord.Interaction):
        self.interaction: discord.Interaction = interaction
        self.whisper = False

    @property
    def guild(self):
        return self.interaction.guild

    @property
    def channel(self):
        return self.interaction.channel

    @property
    def author(self):
        return self.interaction.user

    @property
    def respond(self):
        if self.interaction.response.is_done():
            return self.interaction.followup.send
        else:
            return self.interaction.response.send_message

    @property
    def defer(self):
        return self.interaction.response.defer

    @property
    def followup(self):
        return self.interaction.followup

    @property
    def edit(self):
        return self.interaction.edit_original_response

    @property
    def bot(self):
        return self.interaction.client

    @property
    def me(self):
        return self.interaction.guild.me  # type: ignore

    @property
    def send(self):
        return self.interaction.channel.send  # type: ignore

    async def respond_or_edit(self, *args, **kwargs):
        """Respond to an interaction if not already responded, otherwise edit the original response.
        Takes in the same args and kwargs as `respond`.
        """

        # if self.interaction.response.is_done():
        #     print("?")
        #     if kwargs.get("followup"):
        #         if kwargs.get("view") is None:
        #             kwargs["view"] = discord.utils.MISSING

        #         if "followup" in kwargs:
        #             del kwargs["followup"]

        #         delete_after = kwargs.get("delete_after")
        #         if "delete_after" in kwargs:
        #             del kwargs["delete_after"]

        #         test = await self.followup.send(*args, **kwargs)
        #         if not kwargs.get("ephemeral") and delete_after is not None:
        #             await test.delete(delay=delete_after)
        #         return

        #     ephemeral = kwargs.get("ephemeral")
        #     if kwargs.get("ephemeral") is not None:
        #         del kwargs["ephemeral"]
        #     delete_after = kwargs.get("delete_after")
        #     if "delete_after" in kwargs:
        #         del kwargs["delete_after"]
        #     if "followup" in kwargs:
        #         del kwargs["followup"]

        #     await self.edit(*args, **kwargs)
        #     if delete_after and not ephemeral:
        #         await asyncio.sleep(delete_after)
        #         await self.interaction.delete_original_message()
        # else:
        #     if "followup" in kwargs:
        #         del kwargs["followup"]
        #     delete_after = kwargs.get("delete_after")
        #     if "delete_after" in kwargs:
        #         del kwargs["delete_after"]
        #     res = await self.respond(*args, **kwargs)
        #     if not kwargs.get("ephemeral") and delete_after is not None:
        #         await asyncio.sleep(delete_after)
        #         await self.interaction.delete_original_message()

        if (
            self.interaction.response.is_done()
        ):  # we've responded to the interaction already
            if not kwargs.get(
                "followup"
            ):  # is there a message to edit and do we want to edit it?
                ephemeral = kwargs.get("ephemeral")
                if kwargs.get("ephemeral") is not None:
                    del kwargs["ephemeral"]
                delete_after = kwargs.get("delete_after")
                if "delete_after" in kwargs:
                    del kwargs["delete_after"]
                if "followup" in kwargs:
                    del kwargs["followup"]
                if kwargs.get("view") is discord.utils.MISSING:
                    kwargs["view"] = None
                await self.edit(*args, **kwargs)
                if delete_after and not ephemeral:
                    self.bot.loop.create_task(
                        self.delay_delete(self.interaction, delete_after)
                    )
            else:  # we probably want to do a followup
                if kwargs.get("view") is None:
                    kwargs["view"] = discord.utils.MISSING

                if "followup" in kwargs:
                    del kwargs["followup"]

                delete_after = kwargs.get("delete_after")
                if "delete_after" in kwargs:
                    del kwargs["delete_after"]
                test = await self.followup.send(*args, **kwargs)
                if delete_after is not None:
                    try:
                        await test.delete(delay=delete_after)
                    except:
                        pass
        else:  # first time responding to this
            if "followup" in kwargs:
                del kwargs["followup"]
            delete_after = kwargs.get("delete_after")
            if "delete_after" in kwargs:
                del kwargs["delete_after"]
            await self.respond(*args, **kwargs)
            if not kwargs.get("ephemeral") and delete_after is not None:
                self.bot.loop.create_task(
                    self.delay_delete(self.interaction, delete_after)
                )

    async def delay_delete(self, ctx: discord.Interaction, delay: int):
        try:
            await asyncio.sleep(delay)
            await ctx.delete_original_response()
        except:
            pass

    async def send_followup(self, *args, **kwargs):
        delete_after = kwargs.get("delete_after")
        if "delete_after" in kwargs:
            del kwargs["delete_after"]

        response = await self.followup.send(*args, **kwargs)
        if not kwargs.get("ephemeral") and delete_after is not None:
            await response.delete(delay=delete_after)

    async def send_success(
        self,
        description: str,
        title: Optional[str] = None,
        footer=None,
        delete_after: Optional[float] = None,
        followup: Optional[bool] = None,
        ephemeral: Optional[bool] = False,
    ):
        """Send an embed response with green color to an interaction.
        Parameters
        ----------
        description : str
            Description of the embed
        title : Optional[str], optional
            Title of the embed, by default None
        delete_after : Optional[float], optional
            Number of seconds to delete the embed after (only if not responding ephemerally), by default None
        followup : Optional[bool], optional
            Whether to send this as a followup to the original response, by default None
        """

        embed = discord.Embed(
            title=title, description=description, color=discord.Color.dark_green()
        )
        if footer is not None:
            embed.set_footer(text=footer)

        return await self.respond_or_edit(
            content="",
            embed=embed,
            ephemeral=self.whisper or ephemeral,
            view=discord.utils.MISSING,
            delete_after=delete_after,
            followup=followup,
        )

    async def send_warning(
        self,
        description: str,
        title: Optional[str] = None,
        delete_after: Optional[float] = None,
        followup: Optional[bool] = None,
        ephemeral: Optional[bool] = False,
    ):
        """Send an embed response with orange color to an interaction.
        Parameters
        ----------
        description : str
            Description of the embed
        title : Optional[str], optional
            Title of the embed, by default None
        delete_after : Optional[float], optional
            Number of seconds to delete the embed after (only if not responding ephemerally), by default None
        followup : Optional[bool], optional
            Whether to send this as a followup to the original response, by default None
        """

        embed = discord.Embed(
            title=title, description=description, color=discord.Color.orange()
        )
        return await self.respond_or_edit(
            content="",
            embed=embed,
            ephemeral=self.whisper or ephemeral,
            view=discord.utils.MISSING,
            delete_after=delete_after,
            followup=followup,
        )

    async def send_error(
        self,
        description: str,
        title: Optional[str] = ":(\nYour command ran into a problem",
        delete_after: Optional[float] = None,
        followup: Optional[bool] = None,
        whisper: Optional[bool] = False,
    ):
        """Send an embed response with red color to an interaction.
        Parameters
        ----------
        description : str
            Description of the embed
        title : Optional[str], optional
            Title of the embed, by default None
        delete_after : Optional[float], optional
            Number of seconds to delete the embed after (only if not responding ephemerally), by default None
        followup : Optional[bool], optional
            Whether to send this as a followup to the original response, by default None
        """

        embed = discord.Embed(
            title=title, description=description, color=discord.Color.red()
        )
        embed.set_footer(
            text="Note: The bot maintainer will be pinged about this error automatically."
        )
        return await self.respond_or_edit(
            content="",
            embed=embed,
            ephemeral=self.whisper or whisper,
            view=discord.utils.MISSING,
            delete_after=delete_after,
            followup=followup,
        )
