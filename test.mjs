// 브라우저·네트워크 없이 도는 검사: 카드 HTML, X 글자 수, OAuth 서명(트위터 문서 예시값)
import assert from "assert/strict";
import { readFileSync, readdirSync } from "fs";
import { cardHtml, rich } from "./lib/cards.mjs";
import { oauth1, xText } from "./lib/platforms.mjs";

let n = 0; const ok = (m, f) => { f(); n++; console.log("  ✓", m) };

ok("허용 태그만 살림", () => {
  assert.equal(rich("<em>a</em><mk>b</mk><br><script>x</script>"), '<em>a</em><span class="mk">b</span><br>&lt;script&gt;x&lt;/script&gt;');
});
for (const f of readdirSync(new URL("content/", import.meta.url)).filter(f => f.endsWith(".json"))) {
  const C = JSON.parse(readFileSync(new URL("content/" + f, import.meta.url), "utf8"));
  ok(`${f}: 세트마다 카드 2~10장, 표지가 첫 장`, () => C.sets.forEach(s => { assert.ok(s.cards.length >= 2 && s.cards.length <= 10); assert.equal(s.cards[0].type, "cover") }));
  ok(`${f}: 모든 카드 HTML 생성`, () => C.sets.forEach(s => s.cards.forEach((c, i) => { const h = cardHtml(c, i + 1, s.cards.length, C.palette, C.brand); assert.ok(h.includes(`${i + 1}/${s.cards.length}`)) })));
  ok(`${f}: 캡션 길이 (인스타 2200, 스레드 500, X 280)`, () => C.sets.forEach(s => {
    assert.ok([...s.caption.instagram].length <= 2200); assert.ok([...s.caption.threads].length <= 500);
    assert.equal(xText(s.caption.x), s.caption.x, "X 글이 잘림: " + s.id);
  }));
}
ok(`${"형광펜은 카드당 한 군데"}`, () => {
  for (const f of readdirSync(new URL("content/", import.meta.url)).filter(f => f.endsWith(".json"))) {
    const C = JSON.parse(readFileSync(new URL("content/" + f, import.meta.url), "utf8"));
    C.sets.forEach(s => s.cards.forEach((c, i) => assert.ok((JSON.stringify(c).match(/<mk>/g) || []).length <= 1, `${f} ${s.id} ${i + 1}장 형광펜 2곳 이상`)));
  }
});
ok("짤 자막은 짧게 (한 칸 28자 이내)", () => {
  const len = t => [...String(t).replace(/<[^>]+>/g, "")].length;
  for (const f of readdirSync(new URL("content/", import.meta.url)).filter(f => f.endsWith(".json"))) {
    const C = JSON.parse(readFileSync(new URL("content/" + f, import.meta.url), "utf8"));
    C.sets.forEach(s => s.cards.forEach((c, i) => [...(c.texts || []), c.top, c.bottom].filter(Boolean)
      .forEach(t => assert.ok(len(t) <= 28, `${f} ${s.id} ${i + 1}장 자막이 김(${len(t)}자): ${t}`))));
  }
});
ok("X 글자 수: 한글 2자 계산", () => { assert.equal(xText("가".repeat(150)).length, 140); assert.equal(xText("a".repeat(300)).length, 280) });
ok("OAuth 1.0a 서명 (트위터 문서 예시)", () => {
  const env = { X_API_KEY: "xvz1evFS4wEEPTGEFPHBog", X_API_SECRET: "kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw",
    X_ACCESS_TOKEN: "370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb", X_ACCESS_SECRET: "LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE",
    OAUTH_NONCE: "kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg", OAUTH_TS: "1318622958" };
  const h = oauth1("POST", "https://api.twitter.com/1.1/statuses/update.json", env, { include_entities: "true", status: "Hello Ladies + Gentlemen, a signed OAuth request!" });
  assert.ok(h.includes('oauth_signature="hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D"'), h);
});
console.log(`\n${n}개 통과`);
