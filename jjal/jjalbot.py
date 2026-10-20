# 짤봇(jjalbot.com)에서 짤 후보 받기: python3 -I jjalbot.py [짤id ...]
# 짤봇은 짤마다 제목·태그가 달려 있어서 일반 이미지 검색보다 정확함. 움짤(gif)은 건너뛰고 정지 이미지(png/jpg)만
import json,sys,os,urllib.parse,urllib.request
D=os.path.dirname(os.path.abspath(__file__)); N=int(os.environ.get("N","5"))
cat=json.load(open(os.path.join(D,"catalog.json"),encoding="utf8")); only=sys.argv[1:]
UA={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126 Safari/537.36"}
def api(q): return json.loads(urllib.request.urlopen(urllib.request.Request("https://jjalbot.com/api/jjals?text="+urllib.parse.quote(q),headers=UA),timeout=15).read() or b"[]")
for m in cat["items"]:
    if m.get("image") or (only and m["id"] not in only): continue
    seen,res=set(),[]
    for q in m.get("kw") or [m["name"]]:
        for j in api(q):
            if j["id"] in seen: continue
            seen.add(j["id"])
            st=[r for r in j["resources"] if r["contentType"] in ("image/png","image/jpeg")]
            if st: res.append((max(r["width"] for r in st), j, max(st,key=lambda r:r["width"])))
    res.sort(key=lambda x:-x[0])
    d=os.path.join(D,"candidates",m["id"]); os.makedirs(d,exist_ok=True)
    for f in os.listdir(d): os.remove(os.path.join(d,f))
    got=[]
    for w,j,r in res[:N]:
        ext="png" if r["contentType"]=="image/png" else "jpg"
        try: b=urllib.request.urlopen(urllib.request.Request(r["url"],headers=UA),timeout=15).read()
        except Exception: continue
        f=f"{len(got)+1}.{ext}"; open(os.path.join(d,f),"wb").write(b)
        got.append({"file":f,"from":r["url"],"title":j["title"],"w":r["width"],"h":r["height"],"tags":j.get("tags",[])})
    json.dump(got,open(os.path.join(d,"list.json"),"w",encoding="utf8"),ensure_ascii=False,indent=1)
    print(m["id"],len(got),[g["w"] for g in got])
