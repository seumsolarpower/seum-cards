// 후보 짤을 한 페이지에 모아 봄 → jjal/review.html (폰 크롬으로 열어서 번호 고르기)
import { readFileSync, writeFileSync, existsSync } from "fs";
const CAT = JSON.parse(readFileSync(new URL("catalog.json", import.meta.url), "utf8"));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const blocks = CAT.items.filter(m => !m.image).map(m => {
  const dir = new URL(`candidates/${m.id}/`, import.meta.url), lf = new URL("list.json", dir);
  if (!existsSync(lf)) return "";
  const list = JSON.parse(readFileSync(lf, "utf8"));
  const imgs = list.map((c, i) => `<figure><img src="data:image/${c.file.split(".").pop().replace("jpg", "jpeg")};base64,${readFileSync(new URL(c.file, dir)).toString("base64")}"><figcaption>${i + 1}번 · ${c.w}×${c.h}</figcaption></figure>`).join("");
  return `<section><h2>${esc(m.name)} <small>${esc(m.source)} · id: ${m.id}</small></h2><div class="g">${imgs || "<p>후보 없음</p>"}</div></section>`;
}).join("");
writeFileSync(new URL("review.html", import.meta.url), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>짤 고르기</title>
<style>body{font-family:sans-serif;margin:16px;background:#f2f2f0;color:#111}h2{font-size:17px;margin:24px 0 8px}small{color:#777;font-weight:400}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}figure{margin:0;background:#fff;border-radius:8px;overflow:hidden}img{width:100%;height:150px;object-fit:cover;display:block}figcaption{font-size:12px;padding:6px 8px}</style>
<h1>짤 고르기</h1><p>마음에 드는 번호를 알려 주세요. 예: "무야호 3번"</p>${blocks}`);
console.log("jjal/review.html");
