// 릴스 하나를 인스타에 바로 올림 (API, 음원은 영상에 깔린 무료 음원). 캐러셀 승인과는 따로.
// 실행: MEDIA_BASE_URL=https://.../media node publish-reel.mjs 2026-10-21 rent-166   (mp4는 media/날짜/세트-reel.mp4 에 먼저 올려 둠)
// out/날짜/posted/세트.reel 에 기록해서 두 번 안 올림
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { instagramReel } from "./lib/platforms.mjs";

const [date, id] = process.argv.slice(2);
const C = JSON.parse(readFileSync(new URL(`content/${date}.json`, import.meta.url), "utf8"));
const s = C.sets.find(x => x.id === id); if (!s) throw new Error("세트 없음: " + id);
const dir = new URL(`out/${date}/posted/`, import.meta.url); mkdirSync(dir, { recursive: true });
const mark = new URL(`${id}.reel`, dir);
if (existsSync(mark)) { console.log("이미 올림", id, readFileSync(mark, "utf8").trim()); process.exit(0) }
const videoUrl = `${process.env.MEDIA_BASE_URL.replace(/\/$/, "")}/${date}/${id}-reel.mp4`;
const caption = s.caption.reel || s.caption.instagram;
const mid = await instagramReel({ videoUrl, caption });
writeFileSync(mark, `${new Date().toISOString()} ${mid}\n`);
console.log("릴스 올림", id, mid);
