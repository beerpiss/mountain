from pathlib import Path
from typing import Any

from dotenv import dotenv_values


class BotConfig:
    guild_id: int
    application_id: int
    owner_id: int
    token: str
    sync_commands_globally: bool
    dev: bool

    def __init__(self, cfg: dict[str, str | None]):
        for (key, value) in cfg.items():
            val: Any = value
            if value is None:
                print(f"[WARN] Empty key: {key}")
                continue
            if key in ["GUILD_ID", "APPLICATION_ID", "OWNER_ID"]:
                val = int(value)
            elif value.lower() in ["true", "false"]:
                val = value.lower() == "true"
            setattr(self, key.lower(), val)
