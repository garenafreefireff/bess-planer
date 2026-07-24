from typing import Annotated

from pydantic import Field

ObjectIdStr = Annotated[str, Field(pattern=r"^[a-fA-F0-9]{24}$")]
