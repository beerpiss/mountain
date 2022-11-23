from typing import (TYPE_CHECKING, Callable, Concatenate, ParamSpec, TypeVar,
                    Union)

from discord.app_commands.commands import Coro, GroupT

T = TypeVar("T")
if TYPE_CHECKING:
    P = ParamSpec("P")
    CommandCallback = Union[
        Callable[Concatenate[GroupT, "Context", P], Coro[T]],
        Callable[Concatenate["Context", P], Coro[T]],
    ]
else:
    P = TypeVar("P")
    CommandCallback = Callable[..., Coro[T]]
