from __future__ import annotations

from pathlib import Path
import os

import uvicorn


if __name__ == "__main__":
    project_root = Path(__file__).resolve().parent
    os.chdir(project_root)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
