"""Aggiorna il codice di versione (?v=...) di style.css e main.js in tutte le pagine del sito.

GitHub Pages fa tenere i file in cache per 10 minuti: senza un indirizzo che cambia,
un browser può combinare la pagina nuova con CSS/JS vecchi. Da lanciare dopo ogni
modifica a style.css o main.js, prima del commit:

    python3 tools/versiona.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ("assets/css/style.css", "assets/js/main.js")
digests = {a: hashlib.md5((ROOT / a).read_bytes()).hexdigest()[:10] for a in ASSETS}

for html_path in sorted(ROOT.glob("*.html")):
    page = html_path.name
    html = html_path.read_text()
    for asset, digest in digests.items():
        html, n = re.subn(rf'{re.escape(asset)}(\?v=[0-9a-f]+)?"', f'{asset}?v={digest}"', html)
        if n:
            print(f"{page}: {asset} v={digest}")
    html_path.write_text(html)
