import { makeReader, write, connectWallet, activeAccount, balanceOf, short, toGen, GEN, fmtErr }
  from "../shared/genlayer-lite.js";
import { icon as ic, setIcons } from "../shared/icons.js";

const CONTRACT = "0xF89767Ea6e2c880CB78d268D4d4881EE4e3b536E";
const { read } = makeReader(CONTRACT);

const PENDING = 0, APPROVED = 1, REJECTED = 2;
let account = null, proposals = [], charter = "", treasury = 0n, drawerMode = "propose";
const $ = (id) => document.getElementById(id);
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

$("contractFoot").innerHTML = `Contract <a href="https://studio.genlayer.com/" target="_blank" rel="noopener">${short(CONTRACT)}</a>`;
setIcons();
document.documentElement.classList.add("js");

function toast(msg, kind = "", title = "agora") {
  const el = document.createElement("div");
  el.className = "toast " + kind;
  el.innerHTML = `<span class="tt">${title}</span>`;
  el.appendChild(document.createTextNode(msg));
  $("log").appendChild(el);
  setTimeout(() => el.remove(), kind === "err" ? 16000 : 5200);
}

// Scroll reveals via IntersectionObserver. CSS keeps elements visible by
// default; we only add a one-time entrance transition when they scroll in.
const _io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add("in"); _io.unobserve(e.target); }
}), { threshold: 0.08 });
document.querySelectorAll(".reveal").forEach((el) => _io.observe(el));

async function refreshWallet() {
  account = await activeAccount();
  const slot = $("walletslot");
  if (account) {
    let bal = 0n; try { bal = await balanceOf(account); } catch (_) {}
    slot.innerHTML = `<span style="font-size:13px;color:var(--ink2)" class="mono">${short(account)} · ${toGen(bal)} GEN</span>`;
  } else {
    slot.innerHTML = `<button class="btn sm" id="connectBtn">Connect<span class="ic">${ic("arrowRight")}</span></button>`;
    $("connectBtn").onclick = doConnect;
  }
}
async function doConnect() {
  try { account = await connectWallet(); toast("Wallet connected on studionet.", "ok", "wallet"); await refreshWallet(); }
  catch (e) { toast(fmtErr(e), "err", "wallet"); }
}
async function ensureWallet() { if (!account) account = await connectWallet(); await refreshWallet(); }

async function load() {
  try {
    charter = await read("get_charter");
    treasury = BigInt(await read("get_treasury"));
    const count = Number(await read("get_proposal_count"));
    const out = [];
    for (let i = 0; i < count; i++) out.push({ id: i, ...(await read("get_proposal", [i])) });
    proposals = out;
    renderCharter(); renderBook(); renderStats();
  } catch (e) { $("bento").innerHTML = `<div class="empty">Could not open the book. ${fmtErr(e)}</div>`; }
}

function countUp(el, to, suffix = "") {
  if (!window.gsap) { el.textContent = to + suffix; return; }
  const obj = { v: 0 };
  gsap.to(obj, { v: to, duration: 1.1, ease: "power2.out", onUpdate: () => { el.textContent = (suffix ? obj.v.toFixed(obj.v % 1 ? 1 : 0) : Math.round(obj.v)) + suffix; } });
}
function renderStats() {
  const appr = proposals.filter((p) => Number(p.status) === APPROVED).length;
  const pend = proposals.filter((p) => Number(p.status) === PENDING).length;
  const rej = proposals.filter((p) => Number(p.status) === REJECTED).length;
  countUp($("tkTreasury"), Number(toGen(treasury.toString())), " GEN");
  countUp($("tkApproved"), appr); countUp($("tkPending"), pend); countUp($("tkRejected"), rej);
  $("floorMeta").textContent = proposals.length + (proposals.length === 1 ? " proposal" : " proposals");
}

function renderCharter() {
  const t = $("charterText"), a = $("charterAction");
  if (charter && charter.trim()) {
    t.innerHTML = esc(charter);
    a.innerHTML = `<button class="btn sage sm" id="donateBtn">Fund the treasury <span class="ic">${ic("plus")}</span></button>`;
    $("donateBtn").onclick = openDonate;
  } else {
    t.innerHTML = `<span class="muted">No charter set yet. The first steward writes the mandate that every proposal is judged against.</span>`;
    a.innerHTML = `<button class="btn sage sm" id="setCharterBtn">Set the charter <span class="ic">${ic("arrowRight")}</span></button>`;
    $("setCharterBtn").onclick = openCharter;
  }
}

const ST = ["Pending review", "Approved", "Rejected"];
function renderBook() {
  const b = $("bento");
  if (!proposals.length) { b.innerHTML = `<div class="empty">No proposals yet. Submit the first one.</div>`; return; }
  b.innerHTML = "";
  [...proposals].reverse().forEach((p) => {
    const st = Number(p.status);
    const badge = st === PENDING ? ["bg-pend", "Pending"] : st === APPROVED ? ["bg-appr", "Approved"] : ["bg-rej", "Rejected"];
    const el = document.createElement("div");
    el.className = "lrow" + (st === REJECTED ? " is-rej" : "");
    el.innerHTML = `
      <div class="lnum">#${String(p.id).padStart(2, "0")}</div>
      <div class="lmain">
        <h3 class="disp">${esc(p.title)}</h3>
        <div class="ldesc">${esc(p.detail)}</div>
      </div>
      <div class="lscore">
        <div class="stat"><span class="badge ${badge[0]}">${badge[1]}</span><span class="ask disp">${toGen(p.amount)} GEN</span></div>
        ${st !== PENDING
          ? `<div class="bar"><i style="width:0%" data-w="${p.score}"></i></div><div class="barlab">${p.score}/100 alignment</div>`
          : `<div class="barlab">awaiting review</div>`}
      </div>`;
    el.onclick = () => openDetail(p.id);
    b.appendChild(el);
  });
  // animate alignment bars
  requestAnimationFrame(() => b.querySelectorAll(".bar i").forEach((i) => { i.style.width = (i.dataset.w || 0) + "%"; }));
}

// drawer modes
function openDrawer() { $("scrim").classList.add("on"); $("drawer").classList.add("on"); }
function closeDrawer() { $("scrim").classList.remove("on"); $("drawer").classList.remove("on"); }

function openCharter() {
  drawerMode = "charter";
  $("drawerTitle").textContent = "Set the charter";
  $("drawerBody").innerHTML = `
    <p style="color:var(--ink2);font-size:14.5px">Define the mandate every proposal is judged against. Optionally seed the treasury with GEN now. The charter can only be set once.</p>
    <label>Charter mandate</label>
    <textarea id="charterInput" placeholder="Fund open-source developer tooling that grows the GenLayer ecosystem. Reject proposals unrelated to GenLayer, or with no clear deliverable."></textarea>
    <label>Seed the treasury (GEN, optional)</label>
    <input id="seedInput" type="number" min="0" step="0.1" value="10" />
    <button class="btn block sage" id="saveCharter" style="margin-top:22px">Set charter & seed <span class="ic">→</span></button>`;
  $("saveCharter").onclick = doSetCharter;
  openDrawer();
}

function openDonate() {
  drawerMode = "donate";
  $("drawerTitle").textContent = "Fund the treasury";
  $("drawerBody").innerHTML = `
    <p style="color:var(--ink2);font-size:14.5px">Add GEN to the common pool. Approved grants are paid from here.</p>
    <label>Amount (GEN)</label>
    <input id="donateInput" type="number" min="0" step="0.1" value="5" />
    <button class="btn block sage" id="saveDonate" style="margin-top:22px">Donate <span class="ic">+</span></button>`;
  $("saveDonate").onclick = doDonate;
  openDrawer();
}

function openPropose() {
  drawerMode = "propose";
  $("drawerTitle").textContent = "Submit a proposal";
  $("drawerBody").innerHTML = `
    <p style="color:var(--ink2);font-size:14.5px">Make your case against the charter. The validator set scores alignment and decides.</p>
    <label>Title</label>
    <input id="pTitle" maxlength="80" placeholder="A CLI for scaffolding GenLayer contracts" />
    <label>Detail · what you'll build and why it fits the charter</label>
    <textarea id="pDetail" placeholder="Describe the deliverable, the timeline, and how it serves the charter."></textarea>
    <label>Amount requested (GEN)</label>
    <input id="pAmount" type="number" min="0" step="0.1" value="3" />
    <button class="btn block sage" id="savePropose" style="margin-top:22px">Submit proposal <span class="ic">↗</span></button>`;
  $("savePropose").onclick = doPropose;
  openDrawer();
}

function openDetail(id) {
  const p = proposals.find((x) => x.id === id); if (!p) return;
  const st = Number(p.status);
  $("drawerTitle").textContent = "Proposal #" + id;
  let verdict = "";
  if (st === APPROVED) verdict = `<div class="verdict-card vc-appr"><div class="vc-h"><span class="vc-score disp">${p.score}/100</span><b style="color:var(--sage-d)">Approved & funded</b></div><div style="color:var(--ink2);font-size:14px">${p.rationale ? esc(p.rationale) : "Aligned with the charter; grant disbursed from treasury."}</div></div>`;
  if (st === REJECTED) verdict = `<div class="verdict-card vc-rej"><div class="vc-h"><span class="vc-score disp">${p.score}/100</span><b style="color:var(--clay)">Rejected</b></div><div style="color:var(--ink2);font-size:14px">${p.rationale ? esc(p.rationale) : "Not aligned with the charter, or treasury could not cover it."}</div></div>`;
  $("drawerBody").innerHTML = `
    <div style="font-family:'Clash Display';font-weight:600;font-size:24px;line-height:1.1;letter-spacing:-.01em">${esc(p.title)}</div>
    <div class="detail-amt disp">${toGen(p.amount)} <small>GEN requested</small></div>
    ${verdict}
    <div class="kvs">
      <div class="kv"><span class="k">Proposer</span><span class="v mono">${short(p.proposer)}</span></div>
      <div class="kv"><span class="k">Status</span><span class="v">${ST[st]}</span></div>
      <div class="kv"><span class="k">Full detail</span><span class="v">${esc(p.detail)}</span></div>
    </div>
    ${st === PENDING ? `<button class="btn block" id="reviewBtn" style="margin-top:8px">Run AI review against charter <span class="ic">→</span></button><div class="hint" style="text-align:center">The validator set reads it against the charter and must agree. Calls a real LLM.</div>` : ""}`;
  if (st === PENDING) $("reviewBtn").onclick = () => doReview(id);
  openDrawer();
}

async function doSetCharter() {
  const text = $("charterInput").value.trim(), seed = parseFloat($("seedInput").value) || 0;
  if (!text) return toast("Write the charter mandate.", "err", "charter");
  const btn = $("saveCharter"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> setting';
  try {
    await ensureWallet();
    await write(CONTRACT, "set_charter", [text], GEN(seed));
    toast("Charter set. Treasury seeded.", "ok", "on-chain");
    closeDrawer(); await load();
  } catch (e) { toast(fmtErr(e), "err", "failed"); btn.disabled = false; btn.innerHTML = "Set charter & seed →"; }
}
async function doDonate() {
  const amt = parseFloat($("donateInput").value);
  if (!(amt > 0)) return toast("Enter an amount above zero.", "err", "donate");
  const btn = $("saveDonate"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> sending';
  try { await ensureWallet(); await write(CONTRACT, "donate", [], GEN(amt)); toast(`Added ${amt} GEN to the treasury.`, "ok", "on-chain"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err", "failed"); btn.disabled = false; btn.innerHTML = "Donate +"; }
}
async function doPropose() {
  const title = $("pTitle").value.trim(), detail = $("pDetail").value.trim(), amount = parseFloat($("pAmount").value);
  if (!title) return toast("Give your proposal a title.", "err", "propose");
  if (!detail) return toast("Add the proposal detail.", "err", "propose");
  if (!(amount > 0)) return toast("Requested amount must be above zero.", "err", "propose");
  const btn = $("savePropose"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> submitting';
  try { await ensureWallet(); await write(CONTRACT, "propose", [title, detail, GEN(amount).toString()]); toast("Proposal submitted on-chain.", "ok", "on-chain"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err", "failed"); btn.disabled = false; btn.innerHTML = "Submit proposal ↗"; }
}
async function doReview(id) {
  if (!confirm("Run the review now? The contract reads this proposal against the charter and validators must agree. Calls a real LLM and can take a moment.")) return;
  const btn = $("reviewBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> validators reviewing';
  try { await ensureWallet(); toast("Validators are reading the proposal against the charter…", "", "review"); await write(CONTRACT, "review", [id]); toast("Review complete on-chain.", "ok", "decided"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err", "failed"); if (btn) { btn.disabled = false; btn.innerHTML = "Run AI review against charter →"; } }
}

$("connectBtn").onclick = doConnect;
$("refreshBtn").onclick = load;
$("proposeBtn").onclick = openPropose;
$("closeDrawer").onclick = closeDrawer;
$("scrim").onclick = closeDrawer;
if (window.ethereum) window.ethereum.on?.("accountsChanged", refreshWallet);

// ---- intro stage: real Three.js — a treasury of golden coins orbiting a GEN core
function treasury3d() {
  const host = $("treasury3d"); if (!host || !window.THREE) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 1.8, 11);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  function resize() { const w = host.clientWidth, h = host.clientHeight || 400; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  resize(); addEventListener("resize", resize);

  const GOLD = 0xb89534, SAGE = 0x5c7860, CLAY = 0xbd6a4a, INK = 0x2a2722;
  const coinGeo = new THREE.CylinderGeometry(1, 1, 0.18, 48);
  const goldMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.85, roughness: 0.28 });

  // central GEN core — a faceted token
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 0),
    new THREE.MeshStandardMaterial({ color: INK, metalness: 0.5, roughness: 0.35, flatShading: true }));
  scene.add(core);
  const coreRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.06, 16, 60),
    new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.9, roughness: 0.25 }));
  coreRing.rotation.x = Math.PI / 2; scene.add(coreRing);

  // orbiting coins
  const coins = [];
  const N = 9;
  for (let i = 0; i < N; i++) {
    const m = new THREE.Mesh(coinGeo, goldMat.clone());
    const a = (i / N) * Math.PI * 2;
    coins.push({ mesh: m, a, r: 3, yph: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.5 });
    scene.add(m);
  }
  // two accent coins (sage/clay = approved/rejected verdicts)
  const accentS = new THREE.Mesh(coinGeo, new THREE.MeshStandardMaterial({ color: SAGE, metalness: 0.6, roughness: 0.4 }));
  const accentC = new THREE.Mesh(coinGeo, new THREE.MeshStandardMaterial({ color: CLAY, metalness: 0.6, roughness: 0.4 }));
  scene.add(accentS, accentC);

  scene.add(new THREE.AmbientLight(0xfff4e0, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(4, 6, 5); scene.add(key);
  const warm = new THREE.PointLight(0xffcf80, 1.1, 30); warm.position.set(-4, 2, 3); scene.add(warm);
  const rim = new THREE.DirectionalLight(0x9fb0a0, 0.5); rim.position.set(-3, -2, -4); scene.add(rim);

  const mouse = { x: 0, y: 0 };
  addEventListener("mousemove", (e) => { mouse.x = (e.clientX / innerWidth - 0.5) * 2; mouse.y = (e.clientY / innerHeight - 0.5) * 2; });

  let t = 0, running = true;
  const vis = new IntersectionObserver((es) => { running = es[0].isIntersecting; if (running) loop(); }, { threshold: 0 });
  vis.observe(host);
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    t += 0.01;
    core.rotation.y += 0.006; core.rotation.x = -0.2;
    coreRing.rotation.z += 0.004;
    coins.forEach((c, i) => {
      const a = c.a + t * 0.5;
      c.mesh.position.set(Math.cos(a) * c.r, Math.sin(t * c.sp + c.yph) * 0.5, Math.sin(a) * c.r);
      c.mesh.rotation.x = t + i; c.mesh.rotation.z = t * 0.7;
    });
    const sa = t * 0.5 + 0.4, ca = t * 0.5 + 3.5;
    accentS.position.set(Math.cos(sa) * 2.1, Math.sin(t) * 0.4 + 0.6, Math.sin(sa) * 2.1);
    accentC.position.set(Math.cos(ca) * 2.1, Math.sin(t + 2) * 0.4 - 0.6, Math.sin(ca) * 2.1);
    accentS.rotation.x = t; accentC.rotation.x = -t;
    camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.04;
    camera.position.y += (1.8 - mouse.y * 1 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  loop();
}
treasury3d();

refreshWallet();
load();
