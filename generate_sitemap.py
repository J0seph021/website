"""
generate_sitemap.py - Regenere automatiquement sitemap.xml pour galogix.ca.

Le site est statique (GitHub Pages, pas de build Jekyll). Ce script scanne les pages,
lit leurs propres balises canonical et hreflang, exclut les pages noindex, et ecrit
un sitemap a jour. Lance automatiquement par .github/workflows/sitemap.yml a chaque
push touchant fr/ ou en/. Peut aussi etre lance a la main:  python generate_sitemap.py

Regles:
- Scanne fr/*.html et en/*.html.
- Exclut toute page avec <meta name="robots" content="...noindex...">.
- <loc> = URL canonique de la page (corrige /fr/index.html -> /fr/).
- Alternates hreflang = lues directement dans le <head> de la page (auto-maintenu).
- <lastmod> = date de derniere modification du fichier.
- priority / changefreq = heuristique par type de page.
"""
import re
import subprocess
from pathlib import Path
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent

def git_lastmod(rel):
    """Date du dernier commit touchant le fichier (stable), sinon None."""
    try:
        r = subprocess.run(["git", "log", "-1", "--format=%cs", "--", rel],
                           cwd=str(HERE), capture_output=True, text=True, timeout=10)
        d = r.stdout.strip()
        return d or None
    except Exception:
        return None
# Fonctionne que fr/ soit a la racine (repo GitHub Pages) ou sous site/ (copie locale)
ROOT = HERE / "site" if (HERE / "site" / "fr").exists() else HERE
BASE = "https://www.galogix.ca"

def read(p):
    return p.read_text(encoding="utf-8", errors="ignore")

def find(html, pat):
    m = re.search(pat, html, re.I | re.S)
    return m.group(1).strip() if m else None

def is_noindex(html):
    m = re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']*)["\']', html, re.I)
    return bool(m and "noindex" in m.group(1).lower())

def page_priority(url):
    u = url.lower()
    if u.rstrip("/").endswith("galogix.ca/fr") or u.rstrip("/").endswith("galogix.ca/en"):
        return "0.9", "weekly"
    if re.search(r"/(forestlogix|mobilelogix|siglogix|synclogix|tracklogix|produits)\.html$", u):
        return "0.9", "weekly"
    if "/blog-" in u:
        return "0.6", "monthly"
    if "/actualites" in u:
        return "0.7", "weekly"
    if re.search(r"/(guide-|reforestation-tracking|solutions|forestry-software-)", u):
        return "0.8", "monthly"
    return "0.7", "monthly"

def collect():
    entries = {}
    for folder in ("fr", "en"):
        d = ROOT / folder
        if not d.exists():
            continue
        for f in sorted(d.glob("*.html")):
            html = read(f)
            if is_noindex(html):
                continue
            canonical = find(html, r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']')
            loc = canonical or f"{BASE}/{folder}/{f.name}"
            alts = re.findall(r'<link[^>]+rel=["\']alternate["\'][^>]+hreflang=["\']([^"\']+)["\'][^>]+href=["\']([^"\']+)["\']', html, re.I)
            if not alts:
                alts = re.findall(r'<link[^>]+hreflang=["\']([^"\']+)["\'][^>]+href=["\']([^"\']+)["\']', html, re.I)
            rel = f"{folder}/{f.name}"
            mtime = git_lastmod(rel) or datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%d")
            prio, freq = page_priority(loc)
            if loc not in entries:
                entries[loc] = {"loc": loc, "lastmod": mtime, "priority": prio,
                                "changefreq": freq, "alts": alts}
    return list(entries.values())

def build_xml(entries):
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
           '        xmlns:xhtml="http://www.w3.org/1999/xhtml">', ""]
    def sortkey(e):
        lang = 0 if "/fr/" in e["loc"] or e["loc"].rstrip("/").endswith("/fr") else 1
        return (lang, -float(e["priority"]), e["loc"])
    for e in sorted(entries, key=sortkey):
        out.append("  <url>")
        out.append(f'    <loc>{e["loc"]}</loc>')
        out.append(f'    <lastmod>{e["lastmod"]}</lastmod>')
        out.append(f'    <changefreq>{e["changefreq"]}</changefreq>')
        out.append(f'    <priority>{e["priority"]}</priority>')
        for lang, href in e["alts"]:
            out.append(f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{href}"/>')
        out.append("  </url>")
    out.append("")
    out.append("</urlset>")
    return "\n".join(out)

def main():
    entries = collect()
    (ROOT / "sitemap.xml").write_text(build_xml(entries), encoding="utf-8")
    print(f"OK sitemap regenere: {ROOT / 'sitemap.xml'}")
    print(f"  {len(entries)} URLs indexables (pages noindex exclues automatiquement)")

if __name__ == "__main__":
    main()
