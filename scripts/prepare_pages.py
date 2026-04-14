"""Prepare a safe GitHub Pages artifact.

Only frontend files are copied to dist/. Source Excel files and project notes in
the repository root are intentionally excluded from the deployable artifact.
"""

from __future__ import annotations

import shutil
import stat
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
INCLUDE_FILES = ["index.html", ".nojekyll", "CNAME"]
INCLUDE_DIRS = ["src", "public"]


def copy_tree(source: Path, target: Path) -> None:
    if target.exists():
        remove_tree(target)
    shutil.copytree(source, target)


def remove_readonly(func, path, exc_info) -> None:
    Path(path).chmod(stat.S_IWRITE)
    func(path)


def remove_tree(path: Path) -> None:
    for attempt in range(3):
        try:
            shutil.rmtree(path, onerror=remove_readonly)
            return
        except PermissionError:
            if attempt == 2:
                raise
            time.sleep(0.5)


def main() -> None:
    if DIST.exists():
        remove_tree(DIST)
    DIST.mkdir(parents=True)

    for filename in INCLUDE_FILES:
        source = ROOT / filename
        if source.exists():
            shutil.copy2(source, DIST / filename)

    for dirname in INCLUDE_DIRS:
        copy_tree(ROOT / dirname, DIST / dirname)

    print(f"Artifact preparado en {DIST}")


if __name__ == "__main__":
    main()
