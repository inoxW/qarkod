#!/usr/bin/env python3
"""Minimal generator for the experimental Qarkod matrix format."""

from __future__ import annotations

import argparse
import hashlib
import html
from pathlib import Path

QUIET_ZONE = 4
FINDER_SIZE = 7


def bits_for(data: bytes) -> list[int]:
    """Return a small self-describing payload: magic, length, data, checksum."""
    payload = b"QK1" + len(data).to_bytes(2, "big") + data
    payload += hashlib.sha256(payload).digest()[:2]
    return [(byte >> shift) & 1 for byte in payload for shift in range(7, -1, -1)]


def finder(matrix: list[list[int]], top: int, left: int) -> None:
    """Draw a QR-like position marker."""
    for y in range(FINDER_SIZE):
        for x in range(FINDER_SIZE):
            edge = x in (0, 6) or y in (0, 6)
            center = 2 <= x <= 4 and 2 <= y <= 4
            matrix[top + y][left + x] = int(edge or center)


def make_matrix(text: str) -> list[list[int]]:
    data = text.encode("utf-8")
    bits = bits_for(data)
    side = max(21, 1 + int((len(bits) * 1.35) ** 0.5))
    side += (side - 1) % 2  # odd size makes the layout easier to extend
    if len(bits) > (side - 8) * (side - 8):
        side += 2
    matrix = [[0] * side for _ in range(side)]
    finder(matrix, 0, 0)
    finder(matrix, 0, side - FINDER_SIZE)
    finder(matrix, side - FINDER_SIZE, 0)

    reserved = set()
    for top, left in ((0, 0), (0, side - FINDER_SIZE), (side - FINDER_SIZE, 0)):
        for y in range(top - 1, top + FINDER_SIZE + 1):
            for x in range(left - 1, left + FINDER_SIZE + 1):
                if 0 <= x < side and 0 <= y < side:
                    reserved.add((y, x))

    index = 0
    for y in range(side - 1, -1, -1):
        columns = range(side - 1, -1, -1) if (side - 1 - y) % 2 == 0 else range(side)
        for x in columns:
            if (y, x) in reserved:
                continue
            # A deterministic mask keeps large empty areas visually balanced.
            value = bits[index] if index < len(bits) else 0
            matrix[y][x] = value ^ int((x + y) % 3 == 0)
            index += 1
    return matrix


def to_svg(matrix: list[list[int]], scale: int = 10) -> str:
    size = len(matrix) + QUIET_ZONE * 2
    cells = []
    for y, row in enumerate(matrix):
        for x, value in enumerate(row):
            if value:
                cells.append(
                    f'<rect x="{(x + QUIET_ZONE) * scale}" '
                    f'y="{(y + QUIET_ZONE) * scale}" width="{scale}" height="{scale}"/>'
                )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size * scale} {size * scale}" '
        f'width="{size * scale}" height="{size * scale}" role="img" '
        f'aria-label="Qarkod">\n'
        f'<rect width="100%" height="100%" fill="white"/>\n'
        f'<g fill="black">{"".join(cells)}</g>\n</svg>\n'
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an experimental Qarkod SVG.")
    parser.add_argument("text", help="Text to encode")
    parser.add_argument("-o", "--output", type=Path, default=Path("qarkod.svg"))
    parser.add_argument("--scale", type=int, default=10, help="Pixels per module")
    args = parser.parse_args()
    if args.scale < 1:
        parser.error("--scale must be positive")
    args.output.write_text(to_svg(make_matrix(args.text), args.scale), encoding="utf-8")
    print(f"Created {args.output}")


if __name__ == "__main__":
    main()
