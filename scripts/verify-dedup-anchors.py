#!/usr/bin/env python3
"""Verify every DEDUP_PROPOSAL.md edit anchor still resolves in the source tree.

Reads scripts/dedup-anchors.txt — pipe-delimited: item|file|expected_count|anchor
Anchors are written in human-readable form; TypeScript's escaped apostrophes
(\') are normalised away before matching.

Run before editing. A FAIL means either the tree moved or the proposal is wrong;
either way, do not edit by that anchor until it is resolved.
"""
import pathlib, sys

norm = lambda s: s.replace("\\'", "'")
SRC = {f: norm(pathlib.Path(f"src/lib/{f}").read_text())
       for f in ("curriculum.ts", "scenarios.ts", "exam.ts")}

bad = checked = 0
for raw in pathlib.Path("scripts/dedup-anchors.txt").read_text().splitlines():
    if not raw.strip():
        continue
    item, fname, expected, anchor = raw.split("|", 3)
    checked += 1
    got = SRC[fname].count(anchor)
    if got != int(expected):
        print(f"FAIL {item:3} {fname:14} expected {expected} got {got}  {anchor[:70]!r}")
        bad += 1

print(f"\n{checked} anchors checked, {bad} failed")
sys.exit(1 if bad else 0)
