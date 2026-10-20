// 고른 후보를 확정: node jjal/pick.mjs mooyaho 3 → assets/jjal/mooyaho.jpg + catalog.json 에 기록
import { readFileSync, writeFileSync, copyFileSync } from "fs";
const [id, n] = process.argv.slice(2);
const catF = new URL("catalog.json", import.meta.url), CAT = JSON.parse(readFileSync(catF, "utf8"));
const m = CAT.items.find(x => x.id === id); if (!m) throw new Error("없는 짤 id: " + id);
const dir = new URL(`candidates/${id}/`, import.meta.url), list = JSON.parse(readFileSync(new URL("list.json", dir), "utf8"));
const c = list[Number(n) - 1]; if (!c) throw new Error(`${n}번 후보가 없음`);
const out = `jjal/${id}.${c.file.split(".").pop()}`;
copyFileSync(new URL(c.file, dir), new URL(`../assets/${out}`, import.meta.url));
m.image = out; m.from = c.from;
writeFileSync(catF, JSON.stringify(CAT, null, 2) + "\n");
console.log(`${m.name} → assets/${out}`);
