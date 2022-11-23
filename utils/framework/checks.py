import functools

from utils.context import Context
from utils.typings import CommandCallback


def always_whisper(func: CommandCallback):
    """Always respond ephemerally"""

    @functools.wraps(func)
    async def decorator(self, ctx: Context, *args, **kwargs):
        ctx.whisper = True
        await func(self, ctx, *args, **kwargs)

    return decorator
