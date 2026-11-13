"""Generate the Unicode property ranges used by DuckDB text profiles."""

import hashlib
import json
import sys
from pathlib import Path
from zipfile import ZipFile


# https://www.unicode.org/Public/zipped/13.0.0/UCD.zip
# tangled_up_in_unicode 0.2.0 exposes these Unicode 13 property values.
UCD_SHA256 = "2f76973b4d36ae45584f5a45ec65b47138932d777dd23a5669c89535ef3da951"
OUTPUT = Path(__file__).resolve().parents[2] / "src/duckdb/unicode-properties.json"


def records(zip_file, name):
    for line in zip_file.read(name).decode("utf-8").splitlines():
        content = line.partition("#")[0].strip()
        if content:
            yield [part.strip() for part in content.split(";")]


def ranges(zip_file, name, labels):
    entries = []
    for span, value in records(zip_file, name):
        label = labels(value)
        if label is None:
            continue
        bounds = span.split("..")
        entries.append((int(bounds[0], 16), int(bounds[-1], 16), label))

    compact = []
    names = sorted({label for _, _, label in entries})
    positions = {name: i for i, name in enumerate(names)}
    for start, end, name in sorted(entries):
        position = positions[name]
        if compact and compact[-1][1] + 1 == start and compact[-1][2] == position:
            compact[-1][1] = end
        else:
            compact.append([start, end, position])
    return {"names": names, "ranges": compact}


def main():
    archive = Path(sys.argv[1])
    if hashlib.sha256(archive.read_bytes()).hexdigest() != UCD_SHA256:
        raise ValueError("Expected the Unicode Character Database 13.0.0 archive")
    with ZipFile(archive) as source:
        aliases = list(records(source, "PropertyValueAliases.txt"))
        categories = {short: long for kind, short, long, *_ in aliases if kind == "gc" and short != "Cn"}
        blocks = {long.replace("_", " "): short.replace("_", " ") for kind, short, long, *_ in aliases if kind == "blk"}
        result = {
            "category": ranges(source, "extracted/DerivedGeneralCategory.txt", categories.get),
            "block": ranges(source, "Blocks.txt", blocks.get),
            "script": ranges(source, "Scripts.txt", lambda name: name),
        }
    sections = []
    for prop, data in result.items():
        rows = data["ranges"]
        chunks = [", ".join(json.dumps(entry) for entry in rows[i:i + 5]) for i in range(0, len(rows), 5)]
        sections.append(f'  "{prop}": {{\n    "names": {json.dumps(data["names"])},\n'
                        '    "ranges": [\n      ' + ',\n      '.join(chunks) + '\n    ]\n  }')
    OUTPUT.write_text("{\n" + ",\n".join(sections) + "\n}\n", encoding="utf-8")


if __name__ == "__main__":
    main()
