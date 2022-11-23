import discord

from utils.context import Context, transform_context


class StartingMenu(discord.ui.View):
    def __init__(self, ctx: Context, players: dict[int, str], *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.ctx = ctx
        self.players = players
        self.add_item(StartingButton())

    async def wait_for_timeout(self):
        pass

    async def on_timeout(self):
        for child in self.children:
            child.disabled = True  # type: ignore
        await self.ctx.respond_or_edit(view=self)


class StartingButton(discord.ui.Button["StartingMenu"]):
    view: StartingMenu

    def __init__(self):
        super().__init__(style=discord.ButtonStyle.primary, label="Tham gia")

    async def callback(self, interaction: discord.Interaction):
        self.view.players[interaction.user.id] = interaction.user.display_name

        assert interaction.message is not None
        embed = interaction.message.embeds[0]
        embed.fields[1].value = ", ".join(self.view.players.values())

        if len(self.view.players) > 4:
            self.disabled = True
            self.view.stop()

        await interaction.response.edit_message(embed=embed)
