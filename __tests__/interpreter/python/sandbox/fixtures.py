"""Small deterministic fixtures baked into the read-only test image."""
from pathlib import Path
import pandas as pd

root = Path('/fixtures')
root.mkdir()
with pd.ExcelWriter(root / 'data.xlsx') as writer:
    pd.DataFrame({'value': [2, 4]}).to_excel(writer, sheet_name='First', index=False)
    pd.DataFrame({'value': [8]}).to_excel(writer, sheet_name='Second', index=False)
