from pathlib import Path
import subprocess
R=Path(__file__).resolve().parent
p=subprocess.run(['huamei','asset','get-detail','AI_JT5SnA1y2bABF','--json'],capture_output=True,text=True,timeout=90)
(R/'asset-detail.json').write_text(p.stdout)
assert p.returncode==0,p.stderr
subprocess.run(['python3',str(R/'publish_doc.py')],check=True)
