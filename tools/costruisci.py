"""Riscrive la rastrelliera di index.html partendo da data/bici.json.

Le bici sono dati (data/bici.json), non HTML scritto a mano: così le può cambiare
chiunque dal pannello di gestione, senza toccare il sito. Questo script rigenera
le schede dentro index.html, in modo che il sito resti statico: le bici si vedono
anche a JavaScript spento e Google le legge nella pagina.

    python3 tools/costruisci.py

Gira anche da sola su GitHub a ogni modifica di data/bici.json
(.github/workflows/costruisci.yml).
"""
import json
import pathlib
import re
import sys
from urllib.parse import quote

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATI = ROOT / "data" / "bici.json"
STATO = ROOT / "data" / "pubblicato.json"
PAGINA = ROOT / "index.html"

APRE = "      <!-- bici: generate da data/bici.json con tools/costruisci.py, non a mano -->"
CHIUDE = "      <!-- /bici -->"

# Le stesse larghezze che il sito chiede già alle foto: 26vw su desktop, 80vw su telefono.
LARGHEZZE_UNSPLASH = (480, 800, 1200, 1800, 2400)
LARGHEZZE_SITO = (480, 800, 1200, 1800)
SIZES = "(min-width: 900px) 26vw, 80vw"


def testo(s):
    """Testo dentro un tag."""
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def attr(s):
    """Valore di un attributo fra apici doppi."""
    return testo(s).replace('"', "&quot;")


def scatti_di(bici):
    """Le foto di una bici, sempre come lista (una volta ce n'era una sola)."""
    foto = bici.get("foto")
    if isinstance(foto, dict):
        foto = [foto]
    return [s for s in (foto or []) if s.get("chiave")]


def immagine(scatto):
    if scatto.get("sorgente") == "unsplash":
        url = lambda w: f"https://images.unsplash.com/{scatto['chiave']}?auto=format&fit=crop&w={w}&q=78"
        larghezze = LARGHEZZE_UNSPLASH
    else:
        url = lambda w: f"assets/img/{scatto['chiave']}-{w}.webp"
        # Una foto piccola non viene ingrandita: il pannello carica solo le misure
        # che ci stanno dentro e le scrive qui.
        larghezze = [int(w) for w in scatto.get("larghezze") or LARGHEZZE_SITO]
    base = 1200 if 1200 in larghezze else max(larghezze)
    srcset = ", ".join(f"{url(w)} {w}w" for w in sorted(larghezze))
    # Taglio verticale della foto nella scheda (la scheda è 4:5): 50% è il centro.
    inq = scatto.get("inquadratura", 50)
    stile = f' style="object-position:50% {inq}%"' if inq not in (50, None, "") else ""
    return (f'<img src="{attr(url(base))}" srcset="{attr(srcset)}" sizes="{SIZES}"'
            f' alt="{attr(scatto.get("alt", ""))}" decoding="async" draggable="false"'
            f' loading="lazy"{stile}>')


def foto_html(scatti):
    """Una foto sola resta una foto sola; da due in su diventa una pila che scorre."""
    if not scatti:
        return ""
    if len(scatti) == 1:
        return f'<div class="rcard__img">{immagine(scatti[0])}</div>'
    pallini = "".join(
        f'<button class="rcard__dot{" is-active" if i == 0 else ""}" type="button"'
        f' data-vai="{i}" aria-label="Foto {i + 1} di {len(scatti)}"'
        + (' aria-current="true"' if i == 0 else "")
        + "></button>"
        for i in range(len(scatti)))
    return (
        '<div class="rcard__img" data-galleria>'
        # Ogni foto nel suo riquadro: così l'ingrandimento al passaggio del mouse
        # resta dentro la sua, senza farsi vedere da quella accanto.
        + '<div class="rcard__strip" data-strip>'
        + "".join(f'<span class="rcard__slide">{immagine(s)}</span>' for s in scatti)
        + "</div>"
        f'<div class="rcard__dots">{pallini}</div>'
        "</div>")


def cta_href(cta, numero):
    if cta.get("tipo") == "whatsapp":
        return f"https://wa.me/{numero}?text={quote(cta.get('messaggio', ''), safe='!')}"
    return cta.get("url", "")


def scheda(bici, numero):
    r = ["        <li class=\"rack__item\">"]
    r.append('          <svg class="rack__hook" viewBox="0 0 36 64" aria-hidden="true">'
             '<path d="M18 64V22c0-11-13-12-13-3"/></svg>')
    r.append('          <article class="rcard">')
    img = foto_html(scatti_di(bici))
    if img:
        r.append(f"            {img}")
    r.append('            <div class="rcard__body">')
    r.append(f'              <h3 class="rcard__title">{testo(bici["titolo"])}</h3>')
    prezzo, taglia = bici.get("prezzo", "").strip(), bici.get("taglia", "").strip()
    if prezzo or taglia:
        meta = ""
        if prezzo:
            meta += f'<span class="rcard__price">{testo(prezzo)}</span>'
        if taglia:
            meta += f'<span class="rcard__size">{testo(taglia)}</span>'
        r.append(f'              <p class="rcard__meta">{meta}</p>')
    if bici.get("descrizione", "").strip():
        r.append(f'              <p>{testo(bici["descrizione"])}</p>')
    if bici.get("modelli", "").strip():
        r.append(f'              <p class="rcard__brands">{testo(bici["modelli"])}</p>')
    cta = bici.get("cta") or {}
    href = cta_href(cta, numero)
    if href and cta.get("testo", "").strip():
        r.append(f'              <a class="rcard__cta" href="{attr(href)}" target="_blank"'
                 f' rel="noopener">{testo(cta["testo"])}'
                 '<svg aria-hidden="true"><use href="#i-arrow"/></svg></a>')
    r.append("            </div>")
    r.append("          </article>")
    r.append("        </li>")
    return "\n".join(r)


def main():
    dati = json.loads(DATI.read_text())
    numero = dati.get("whatsapp", "393337648755")
    bici = [b for b in dati.get("bici", []) if b.get("stato") != "bozza"]
    if not bici:
        sys.exit("data/bici.json: nessuna bici pubblicata, index.html non toccato")

    blocco = "\n".join([
        APRE,
        '      <ul class="rack__track" data-rack-track>',
        *[scheda(b, numero) for b in bici],
        "      </ul>",
        CHIUDE,
    ])

    # Il pannello di gestione legge questo file dal sito vero per sapere se la
    # pubblicazione è arrivata online: contiene lo stesso "aggiornato" di bici.json.
    STATO.write_text(json.dumps(
        {"aggiornato": dati.get("aggiornato", ""), "bici": len(bici)},
        ensure_ascii=False, indent=2) + "\n")

    html = PAGINA.read_text()
    nuovo, n = re.subn(
        rf"{re.escape(APRE)}.*?{re.escape(CHIUDE)}",
        lambda _: blocco,
        html,
        flags=re.S,
    )
    if not n:
        sys.exit(f"index.html: segnaposto delle bici non trovato ({APRE.strip()})")
    if nuovo == html:
        print(f"index.html già aggiornato ({len(bici)} bici)")
        return
    PAGINA.write_text(nuovo)
    bozze = len(dati.get("bici", [])) - len(bici)
    print(f"index.html: {len(bici)} bici" + (f", {bozze} in bozza (non pubblicate)" if bozze else ""))


if __name__ == "__main__":
    main()
