"""Aggiorna il codice di versione (?v=...) di style.css e main.js in index.html.

GitHub Pages fa tenere i file in cache per 10 minuti: senza un indirizzo che cambia,
un browser può combinare la pagina nuova con CSS/JS vecchi. Da lanciare dopo ogni
modifica a style.css o main.js, prima del commit:

    python3 tools/versiona.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
html_path = ROOT / "index.html"
html = html_path.read_text()
for asset in ("assets/css/style.css", "assets/js/main.js"):
    digest = hashlib.md5((ROOT / asset).read_bytes()).hexdigest()[:10]
    html, n = re.subn(rf'{re.escape(asset)}(\?v=[0-9a-f]+)?"', f'{asset}?v={digest}"', html)
    print(f"{asset}: v={digest} ({n} riferimento)")
html_path.write_text(html)
