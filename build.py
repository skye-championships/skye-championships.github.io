# يجمع index.html و config.js و app.js في ملف واحد tournament-site.html
from pathlib import Path
d = Path(__file__).parent
s = (d / "index.html").read_text(encoding="utf-8")
s = s.replace('<script src="config.js"></script>', "<script>\n" + (d / "config.js").read_text(encoding="utf-8") + "\n</script>")
s = s.replace('<script src="app.js"></script>', "<script>\n" + (d / "app.js").read_text(encoding="utf-8") + "\n</script>")
(d / "tournament-site.html").write_text(s, encoding="utf-8")
