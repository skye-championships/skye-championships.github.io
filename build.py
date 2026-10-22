# يجمع index.html و motion.css و config.js و motion.js و app.js والصور في ملف واحد tournament-site.html
# الملف الواحد يفتح بدون سيرفر، بس ما فيه تثبيت كتطبيق (PWA)
import base64, mimetypes, re
from pathlib import Path
d = Path(__file__).parent

def data_uri(rel):
    f = d / rel
    if not f.is_file():
        return rel
    mime = mimetypes.guess_type(f.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(f.read_bytes()).decode()

s = (d / "index.html").read_text(encoding="utf-8")
# صور المؤسسين وغيرها اللي في config.js تنحط داخل الملف
config = re.sub(r'"((?:assets|icons)/[^"]+)"', lambda m: '"' + data_uri(m.group(1)) + '"', (d / "config.js").read_text(encoding="utf-8"))
s = s.replace('<script src="config.js"></script>', "<script>\n" + config + "\n</script>")
s = s.replace('<link rel="stylesheet" href="motion.css">', "<style>\n" + (d / "motion.css").read_text(encoding="utf-8") + "\n</style>")
s = s.replace('<script src="motion.js"></script>', "<script>\n" + (d / "motion.js").read_text(encoding="utf-8") + "\n</script>")
s = s.replace('<script src="app.js"></script>', "<script>\n" + (d / "app.js").read_text(encoding="utf-8") + "\n</script>")
s = s.replace('<link rel="manifest" href="manifest.webmanifest">\n', "")
s = re.sub(r'(<link rel="(?:icon|apple-touch-icon)" href=")([^"]+)"', lambda m: m.group(1) + data_uri(m.group(2)) + '"', s)
(d / "tournament-site.html").write_text(s, encoding="utf-8")
