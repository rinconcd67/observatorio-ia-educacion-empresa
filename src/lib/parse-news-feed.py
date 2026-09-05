"""Parse RSS/Atom without resolving entities, scripts or embedded HTML."""
import json
import sys
import xml.etree.ElementTree as ET

raw = sys.stdin.buffer.read(2_000_001)
if len(raw) > 2_000_000:
    raise ValueError("Feed exceeds 2 MB")
# Reject DTDs entirely, including UTF-16 encoded declarations.
text = raw.decode("utf-8-sig")
if "<!DOCTYPE" in text.upper() or "<!ENTITY" in text.upper():
    raise ValueError("DTD and entities are not permitted")
root = ET.fromstring(text)

def local(tag):
    return tag.rsplit("}", 1)[-1]

if local(root.tag) not in ("rss", "feed", "RDF"):
    raise ValueError("Expected RSS or Atom")

items = []
for item in root.iter():
    if local(item.tag) not in ("item", "entry"):
        continue
    fields = {}
    for child in item:
        name = local(child.tag)
        value = "".join(child.itertext()).strip()
        if name == "link":
            if child.get("href") and child.get("rel", "alternate") == "alternate":
                fields["url"] = child.get("href")
            elif value:
                fields["url"] = value
        elif name == "title":
            fields["title"] = value
        elif name in ("pubDate", "published", "date"):
            fields["published_at"] = value
    items.append(fields)
print(json.dumps(items, ensure_ascii=False))
