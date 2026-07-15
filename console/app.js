/* ============================================================
   YC Console V15 — 完整管理后台（全模块CRUD + 交互操作）

   API 路由映射:
   Dashboard    → GET /admin/dashboard
   艺人管理     → GET /artists (公开)
   风险事件     → GET /events (公开)
   用户管理     → GET/PUT /admin/users/{id}
   员工管理     → GET /admin/staff
   商务线索     → GET/PUT /admin/leads/{id}
   入驻审核     → PUT /admin/intakes/{id}
   邀请码       → GET/POST /admin/invites
   撮合配置     → GET/PUT /admin/pricing/config + /requests
   认证         → POST/GET /admin/auth/*
   ============================================================ */
(function () {
"use strict";

/* ===== CONFIG ===== */
var API = "https://yiancha-backend.onrender.com/api/v1";
var LS_TOKEN = "yc_token";
var LS_STAFF = "yc_staff";
var API_TIMEOUT = 15000;
var PAGE_SIZE = 20;

/* ===== STATE ===== */
var token = localStorage.getItem(LS_TOKEN);
var staff = null;
try { staff = JSON.parse(localStorage.getItem(LS_STAFF) || "null"); } catch (e) { staff = null; }
var currentPage = "dashboard";

/* ===== UTILS ===== */
var $ = function (id) { var el = document.getElementById(id); return el || null; };

function api(method, path, body) {
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, API_TIMEOUT);
  var opts = {
    method: method,
    headers: { "Authorization": "Bearer " + (token || "") },
    signal: controller.signal
  };
  if (body !== undefined && body !== null) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  return fetch(API + path, opts).then(function (r) {
    clearTimeout(timer);
    if (!r.ok) {
      return r.json().then(function (e) {
        throw Object.assign(new Error(e.detail || ("HTTP " + r.status)), { status: r.status });
      }).catch(function (err) {
        if (err.name === "AbortError") throw new Error("请求超时");
        throw err;
      });
    }
    return r.json();
  });
}

function safeApi(method, path, body) {
  return api(method, path, body).then(
    function (data) { return { ok: true, data: data }; },
    function (err) { return { ok: false, error: err.message, status: err.status || 0 }; }
  );
}

/* ===== CANVAS BG ===== */
var cv = $("bg");
function drawBg() {
  if (!cv) return;
  cv.width = window.innerWidth;
  cv.height = window.innerHeight;
  var ctx = cv.getContext("2d");
  var g = ctx.createLinearGradient(0, 0, cv.width, cv.height);
  g.addColorStop(0, "#0f172a"); g.addColorStop(0.5, "#1e1b4b"); g.addColorStop(1, "#0f172a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
}
drawBg(); window.addEventListener("resize", drawBg);

/* ===== LOGIN ===== */
var uEl = $("u"), pEl = $("p"), lb = $("lb"), le = $("le"), pwdRaw = "";
if (pEl) pEl.addEventListener("focus", function () { if (!pEl.dataset.init) { pEl.dataset.init = "1"; pwdRaw = pEl.textContent; renderPwd(); } }, true);
if (pEl) pEl.addEventListener("input", function () { var d = pEl.textContent; if (d.length < pwdRaw.length) pwdRaw = pwdRaw.substring(0, d.length); else if (d.length > pwdRaw.length) pwdRaw += d.substring(pwdRaw.length); renderPwd(); });
if (pEl) pEl.addEventListener("paste", function (e) { e.preventDefault(); var txt = (e.clipboardData || window.clipboardData).getData("text"); if (txt) { pwdRaw += txt; renderPwd(); } });

function renderPwd() {
  if (!pEl) return;
  var pos = window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).startOffset : pwdRaw.length;
  pEl.textContent = "\u25CF".repeat(pwdRaw.length);
  var range = document.createRange(); range.setStart(pEl.childNodes[0], Math.min(pos, pwdRaw.length)); range.collapse(true);
  var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
}

async function doLogin() {
  if (!lb) return; lb.disabled = true; lb.textContent = "\u767b\u5f55\u4e2d...";
  if (le) le.textContent = "";
  try {
    var uVal = uEl ? uEl.textContent.trim() : ""; var pVal = pwdRaw;
    if (!uVal || !pVal) { if (le) le.textContent = "\u8bf7\u586b\u5199\u7528\u6237\u540d\u548c\u5bc6\u7801"; lb.disabled = false; lb.textContent = "\u767b \u5f55"; return; }
    var res = await fetch(API + "/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: uVal, password: pVal }) });
    var data = await res.json(); if (!res.ok) throw new Error(data.detail || ("HTTP " + res.status));
    token = data.token; staff = data.staff;
    localStorage.setItem(LS_TOKEN, token); localStorage.setItem(LS_STAFF, JSON.stringify(staff));
    enterApp();
  } catch (err) { if (le) le.textContent = err.message; if (lb) { lb.disabled = false; lb.textContent = "\u767b \u5f55"; } }
}
if (lb) lb.addEventListener("click", doLogin);
if (pEl) pEl.addEventListener("keydown", function (e) { if (e.key === "Enter") doLogin(); });
if (uEl) uEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { var p2 = $("p"); if (p2) p2.focus(); } });

/* ===== NAVIGATION ===== */
function navigate(page) {
  currentPage = page;
  document.querySelectorAll(".nav-item").forEach(function (el) { el.classList.toggle("active", el.dataset.page === page); });
  var titles = { dashboard: "\u6570\u636e\u770b\u677f", artists: "\u827a\u4eba\u7ba1\u7406", events: "\u98ce\u9669\u4e8b\u4ef6", users: "\u7528\u6237\u7ba1\u7406", staff: "\u5458\u5de5\u7ba1\u7406", leads: "\u5546\u52a1\u7ebf\u7d22", intakes: "\u5165\u9a7b\u5ba1\u6838", invites: "\u9080\u8bf7\u7801", pricing: "\u64ae\u5408\u914d\u7f6e" };
  var t = $("topbar-title"); if (t) t.textContent = titles[page] || page;
  document.querySelectorAll(".page").forEach(function (el) { el.hidden = true; });
  var pg = $("page-" + page); if (pg) pg.hidden = false;
  var renders = { dashboard: renderDashboard, artists: renderArtists, events: renderEvents, users: renderUsers, staff: renderStaff, leads: renderLeads, intakes: renderIntakes, invites: renderInvites, pricing: renderPricing };
  if (renders[page]) renders[page]();
  var sb = $("sidebar"); if (sb) sb.classList.remove("open");
}
var nav = $("sidebar-nav");
if (nav) nav.addEventListener("click", function (e) { var item = e.target.closest(".nav-item"); if (item && item.dataset.page) { e.preventDefault(); navigate(item.dataset.page); } });

/* ===== ENTER APP ===== */
async function enterApp() {
  try {
    var av = $("app-view"), lv = $("login-view");
    if (lv) { lv.classList.add("login-hidden"); lv.style.display = "none"; lv.hidden = true; }
    if (av) av.hidden = false;
    if (cv) cv.style.display = "none";
    if (staff) {
      var sn = $("staff-name"); if (sn) sn.textContent = staff.real_name || staff.username;
      var sr = $("staff-role"); if (sr) sr.textContent = staff.role_label || staff.role;
      var wn = $("welcome-name"); if (wn) wn.textContent = staff.real_name || staff.username;
    }
    var wt = $("welcome-time");
    if (wt) wt.textContent = new Date().toLocaleString("zh-CN", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
    navigate(currentPage || "dashboard");
  } catch (err) { console.error("enterApp:", err); }
}

function logout(msg) {
  token = null; staff = null;
  localStorage.removeItem(LS_TOKEN); localStorage.removeItem(LS_STAFF);
  var av = $("app-view"), lv = $("login-view");
  if (av) av.hidden = true;
  if (lv) { lv.classList.remove("login-hidden"); lv.style.display = ""; lv.hidden = false; lv.style.visibility = ""; lv.style.opacity = ""; lv.style.pointerEvents = ""; }
  if (uEl) uEl.textContent = "";
  if (pEl) pEl.textContent = ""; pwdRaw = "";
  if (le) le.textContent = msg || "";
  if (lb) { lb.disabled = false; lb.textContent = "\u767b \u5f55"; }
  if (cv) { cv.style.display = ""; drawBg(); }
}
var lob = $("logout-btn");
if (lob) lob.addEventListener("click", function () { logout(); });

var ham = $("hamburger"), sb = $("sidebar");
if (ham && sb) ham.addEventListener("click", function () { sb.classList.toggle("open"); });

/* ===== TOAST ===== */
function toast(msg) { var el = $("toast"); if (!el) return; el.textContent = msg; el.hidden = false; setTimeout(function () { el.hidden = true; }, 3000); }

/* ===== MODAL ===== */
function showModal(title, bodyHtml, footerHtml) {
  var layer = $("modal-layer"); var mt = $("modal-title"); var mb = $("modal-body"); var mf = $("modal-foot");
  if (!layer) return; if (mt) mt.textContent = title;
  if (mb) mb.innerHTML = bodyHtml || "";
  if (mf) mf.innerHTML = footerHtml || '<button type="button" onclick="document.getElementById(\'modal-layer\').hidden=true">\u5173\u95ed</button>';
  layer.hidden = false; layer.style.display = "";
}

/* ===== DETAIL MODAL HELPERS ===== */
function showDetailModal(title, fields) {
  var html = "<div class='info-grid' style='grid-template-columns:120px 1fr;gap:10px'>";
  fields.forEach(function (f) {
    html += "<div style='color:#64748b;font-weight:500'>" + esc(f.label) + "</div><div>" + (f.html || esc(String(f.value == null ? "-" : f.value))) + "</div>";
  });
  html += "</div>";
  showModal(title, html);
}

/* ===== STRING HELPERS ===== */
function esc(s) { if (s == null) return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function escAttr(s) { if (s == null) return ""; return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function truncate(s, maxLen) { s = String(s == null ? "" : s); return s.length > maxLen ? s.substring(0, maxLen) + "..." : s; }
function maskPhone(phone) { if (!phone) return "-"; var s = String(phone); if (s.length >= 7) return s.substring(0,3)+"****"+s.substring(s.length-4); return s; }
function fmtDate(ts) { if (!ts) return "-"; var d = new Date(ts * 1000); if (isNaN(d.getTime())) return String(ts); return d.toLocaleDateString("zh-CN")+" "+d.toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"}); }
function levelBadge(lvl) { var m = {"S":"badge-gold","A级":"badge-blue","B级":"badge-green","C级":"badge-grey"}; return "<span class='badge "+(m[lvl]||"badge-grey")+"'>"+esc(lvl||"-")+"</span>"; }
function riskBadge(score) { if (score == null) return "-"; if (score >= 80) return "<span style='color:#e74c3c;font-weight:bold'>"+score+"</span>"; if (score >= 50) return "<span style='color:#f59e0b;font-weight:bold'>"+score+"</span>"; return "<span style='color:#22c55e;font-weight:bold'>"+score+"</span>"; }
function statusBadge(st) { var m = {pending:"\u5f85\u5904\u7406",contacted:"\u5df2\u8054\u7cfb",converted:"\u5df2\u8f6c\u5316",rejected:"\u5df2\u62d2\u7edd",open:"\u5f00\u653e\u4e2d",matched:"\u5df2\u5339\u914d",closed:"\u5df2\u5173\u95ed"}; var c = {pending:"badge-yellow",contacted:"badge-blue",converted:"badge-green",rejected:"badge-red",open:"badge-purple",matched:"badge-gold",closed:"badge-grey"}; return "<span class='badge "+(c[st]||"badge-grey")+"'>"+(m[st]||st||"-")+"</span>"; }
function intakeStatusBadge(st) { var m = {pending_review:"\u5f85\u5ba1\u6838",approved:"\u5df2\u901a\u8fc7",rejected:"\u5df2\u9a73\u56de"}; var c = {pending_review:"badge-yellow",approved:"badge-green",rejected:"badge-red"}; return "<span class='badge "+(c[st]||"badge-grey")+"'>"+(m[st]||st||"-")+"</span>"; }

/* ===== TABLE HELPERS ===== */
function renderTable(tbody, items, rowRenderer, colCount, emptyMsg) {
  if (!tbody) return;
  if (!items.length) { tbody.innerHTML = "<tr><td colspan='"+colCount+"' class='empty-row'>"+esc(emptyMsg||"\u6682\u65e0\u6570\u636e")+"</td></tr>"; return; }
  tbody.innerHTML = items.map(function(item,i){return "<tr>"+rowRenderer(item,i)+"</tr>";}).join("");
}
function errorRow(msg,colSpan){return "<tr><td colspan='"+(colSpan||6)+"' class='error-row'>&#x26A0; "+esc(msg)+"</tr></tr>";}
function renderPagination(containerId, page, total, pageSize, fn) {
  var el = $(containerId); if (!el) return;
  var totalPages = Math.ceil(total/pageSize)||1; if (totalPages<=1){el.innerHTML="";return;}
  var fnName = typeof fn==="string"?fn:(fn.name||"renderPage");
  var html="<div class='pagination-inner'>";
  html+="<button class='btn btn-ghost btn-sm'"+(page<=1?" disabled":"")+" onclick='("+fnName+")("+(page-1)+")'>&laquo; \u4e0a\u9875</button>";
  html+="<span class='page-info'>"+page+" / "+totalPages+" (\u5171 "+total+" \u6761)</span>";
  html+="<button class='btn btn-ghost btn-sm'"+(page>=totalPages?" disabled":"")+" onclick='("+fnName+")("+(page+1)+")'>\u4e0b\u9875 &raquo;</button></div>";
  el.innerHTML=html;
}

/* ===== COPY TO CLIPBOARD ===== */
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text); return true; }
  var ta = document.createElement("textarea"); ta.value=text; ta.style.position="fixed";ta.style.left="-9999px"; document.body.appendChild(ta); ta.select(); try{document.execCommand("copy");}catch(e){return false;} document.body.removeChild(ta); return true;
}
window.YC_copy=function(text){if(copyToClipboard(text)){toast("\u590d\u5236\u6210\u529f");}else{"\u590d\u5231\u5931\u8d25\uff0c\u8bf7\u624b\u52a8\u9009\u62e9";}};
window.YC_navigate=navigate;

/* ============================================================
   RENDER: DASHBOARD (clickable cards)
   ============================================================ */
function renderDashboard() {
  /* Set initial loading state */
  setStatValue("st-users","..."); setStatNote("st-users","\u6b63\u5728\u52a0\u8f7d...");
  setStatValue("st-leads","..."); setStatNote("st-leads","\u6b63\u5728\u52a0\u8f7d...");
  setStatValue("st-intakes","..."); setStatNote("st-intakes","\u6b63\u5728\u52a0\u8f7d...");
  setStatValue("st-pricing","..."); setStatNote("st-pricing","\u6b63\u5728\u52a0\u8f7d...");

  safeApi("GET","/admin/dashboard").then(function(res){
    if(!res.ok){showDashError(res.error||"\u52a0\u8f7d\u5931\u8d25");return;}
    var d=res.data; var u=d.users||{}; var ld=d.leads||{}; var it=d.intakes||{}; var pr=d.pricing||{};
    setStatValue("st-users",u.total||0); setStatNote("st-users","\u4eca\u65e5\u65b0\u589e "+(u.today_new||0));
    setStatValue("st-leads",ld.total||0); setStatNote("st-leads","\u672a\u5206\u914d "+(ld.unassigned||0));
    setStatValue("st-intakes",it.total||0); setStatNote("st-intakes","\u5f85\u5ba1\u6838 "+((it.dist||{})["pending_review"]||0));
    setStatValue("st-pricing",pr.total||0); setStatNote("st-pricing","\u5f00\u653e\u4e2d "+((pr.dist||{})["open"]||0));

    /* Today grid */
    var td=$("dash-today"); if(td){
      td.innerHTML=
        "<div class='info-row'><span>\u6ce8\u518c\u7528\u6237</span><strong>"+(u.total||0)+"</strong></div>"+
        "<div class='info-row'><span>\u4eca\u65e5\u65b0\u589e</span><strong style='color:#22c55e'>+"+(u.today_new||0)+"</strong></div>"+
        "<div class='info-row'><span>\u5df2\u8ba4\u8bc1</span><strong>"+(u.verified||0)+"</strong></div>"+
        "<div class='info-row'><span>\u5546\u52a1\u7ebf\u7d22</span><strong>"+(ld.total||0)+"</strong></div>"+
        "<div class='info-row'><span>\u5165\u9a7b\u7533\u8bf7</span><strong>"+(it.total||0)+"</strong></div>";
    }

    /* Distribution grid */
    var dd=$("dash-dist"); if(dd){
      var pd=u.plan_dist||{}; var ldist=ld.dist||{};
      dd.innerHTML=
        "<h4 style='margin-bottom:8px'>\u7528\u6237\u5957\u9910\u5206\u5e03</h4>"+
        "<div class='tag-group'>"+tagItem("\u514d\u8d39\u7248",pd.free||0)+tagItem("\u4e2a\u4eba\u7248",pd.personal||0)+tagItem("\u4e13\u4e1a\u7248",pd.professional||0)+tagItem("\u4f01\u4e1a\u7248",pd.enterprise||0)+"</div>"+
        "<h4 style='margin:12px 0 8px'>\u7ebf\u7d22\u72b6\u6001</h4>"+
        "<div class='tag-group'>"+tagItem("\u5f85\u5904\u7406",ldist.pending||0)+tagItem("\u5df2\u8054\u7cfb",ldist.contacted||0)+tagItem("\u5df2\u8f6c\u5316",ldist.converted||0)+tagItem("\u5df2\u62d2\u7edd",ldist.rejected||0)+"</div>";
    }

    /* Make stat cards clickable */
    makeCardClickable("st-users","users");
    makeCardClickable("st-leads","leads");
    makeCardClickable("st-intakes","intakes");
    makeCardClickable("st-pricing","pricing");
  });
}

function setStatValue(id,val){var el=$(id);if(el)el.textContent=String(val);}
function setStatValue(id,val){var el=$(id);if(el&&typeof el==="object")el.textContent=String(val);}
function setStatNote(id,note){var el=$(id);if(el&&typeof el==="object")el.textContent=note;}

function showDashError(msg){
  ["users","leads","intakes","pricing"].forEach(function(k){
    setStatValue("st-"+k,"--"); setStatNote("nt-"+k,msg);
  });
  var td=$("dash-today");if(td)td.innerHTML="<p style='color:#e74c3c'>"+esc(msg)+"</p>";
  var dd=$("dash-dist");if(dd)dd.innerHTML="<p style='color:#e74c3c'>"+esc(msg)+"</p>";
}

function tagItem(label,val){return "<span class='tag'>"+label+" <strong>"+val+"</strong></span> ";}
function makeCardClickable(id,target){
  var card=null;
  var el=$(id);
  if(el)card=el.parentElement;
  if(card){card.style.cursor="pointer";card.onclick=function(){navigate(target);};}
}

/* ============================================================
   RENDER: ARTISTS (public API + detail modal)
   ============================================================ */
var _artistPage=1;
function renderArtists(p){
  if(p)_artistPage=p; var tbody=$("artist-tbody");
  if(tbody)tbody.innerHTML="<tr><td colspan='6' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  var q=$("artist-search")?$("artist-search").value.trim():"";
  var lvl=$("artist-level")?$("artist-level").value:"";
  var params="?limit="+PAGE_SIZE+"&offset="+((_artistPage-1)*PAGE_SIZE);
  if(q)params+="&name="+encodeURIComponent(q);
  if(lvl)params+="&heat_level="+encodeURIComponent(lvl);

  safeApi("GET","/artists"+params).then(function(res){
    if(!res.ok){if(tbody)tbody.innerHTML=errorRow(res.error||"\u52a0\u8f7d\u5931\u8d25",6);return;}
    var items=res.data.items||res.data||[]; if(!Array.isArray(items))items=[];

    renderTable(tbody,items,function(row){
      return "<td>"+(row.id||"-")+"</td>"+
             "<td><strong style='cursor:pointer;color:#3b82f6' onclick='YC_showArtistDetail("+row.id+")'>"+esc(row.name||"-")+"</strong></td>"+
             "<td>"+levelBadge(row.heat_level)+"</td>"+
             "<td>"+riskBadge(row.risk_score)+"</td>"+
             "<td class='cell-truncate'>"+esc(truncate(row.agency||"-",12))+"</td>"+
             "<td class='cell-truncate' title='"+escAttr(row.masterpieces||"")+"'>"+esc(truncate(row.masterpieces||"-",18))+"</td>"+
             "<td><button class='btn btn-primary btn-xs' onclick='YC_showArtistDetail("+row.id+")'>\u67e5\u770b</button></td>";
    },7,"\u6682\u65e0\u827a\u4eba\u6570\u636e");

    renderPagination("artist-pagination",_artistPage,res.data.total||items.length,PAGE_SIZE,"renderArtists");
  });
}

/* Expose artist detail globally */
window.YC_showArtistDetail=function(artistId){
  showModal("\u827a\u4eba\u8be6\u60c5","<p style='text-align:center;color:#888'>\u6b63\u5728\u52a0\u8f7d...</p>");
  safeApi("GET","/artists/"+artistId).then(function(res){
    if(!res.ok){$("modal-body").innerHTML="<p style='color:#e74c3c;text-align:center'>\u52a0\u8f7d\u5931\u8d25: "+esc(res.error)+"</p>";return;}
    var row=res.data;
    showDetailModal("\u827a\u4eba: "+(row.name||"?"),[
      {label:"ID",value:row.id},{label:"\u59d3\u540d",value:row.name},
      {label:"\u7b49\u7ea7",html:levelBadge(row.heat_level)},
      {label:"\u98ce\u9669\u8bc4\u5206",html:riskBadge(row.risk_score)},
      {label:\u7ecf\u7eaa\u516c\u53f8,value:row.agency},{label:\u4ee3\u8868\u4f5c,value:row.masterpieces},
      {label:"\u51fa\u751f\u65e5\u671f,value:row.birthday},{label:\u51fa\u7513\u5730,value:row.birthplace},
      {label:"\u6c11\u65cf,value:row.ethnicity},{label:"\u661f\u5ea7,value:row.constellation},
      {label:"\u7c89\u4e1f\u91cf",value:row.fan_count},{label:"\u70ed\u5ea6\u503c",value:row.heat_score}
    ]);
  });
};

var asb=$("artist-search-btn");if(asb)asb.addEventListener("click",function(){_artistPage=1;renderArtists();});
var ase=$("artist-search");if(ase)ase.addEventListener("keydown",function(e){if(e.key==="Enter"){_artistPage=1;renderArtists();}});
var asl=$("artist-level");if(asl)asl.addEventListener("change",function(){_artistPage=1;renderArtists();});

/* ============================================================
   RENDER: EVENTS (detail modal)
   ============================================================ */
var _eventPage=1;
function renderEvents(p){
  if(p)_eventPage=p; var tbody=$("event-tbody");
  if(tbody)tbody.innerHTML="<tr><td colspan='6' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  safeApi("GET","/events?limit="+PAGE_SIZE+"&offset="+((_eventPage-1)*PAGE_SIZE)).then(function(res){
    if(!res.ok){if(tbody)tbody.innerHTML=errorRow(res.error||"\u52a0\u8f7d\u5931\u8d25",6);return;}
    var items=res.data.items||res.data||[]; if(!Array.isArray(items))items=[];

    renderTable(tbody,items,function(row){
      var lvl=row.risk_level||row.heat_level||"C";
      return "<td>"+(row.id||"-")+"</td>"+
             "<td><strong>"+esc(row.artist_name||"-")+"</strong></td>"+
             "<td>"+esc(row.event_type||row.category||"-")+"</td>"+
             "<td><span class='badge badge-"+(lvl==="S"?"red":lvl==="A级"?"orange":lvl==="B"?"yellow":"grey")+"'>"+esc(lvl)+"</span></td>"+
             "<td>"+(row.event_date?row.event_date.substring(0,10):"-")+"</td>"+
             "<td class='cell-truncate' title='"+escAttr(row.summary||row.description||"")+"'>"+esc(truncate(row.summary||row.description||"-",30))+"</td>"+
             "<td><button class='btn btn-primary btn-xs' onclick='YC_showEventDetail("+(row.id||0)+")'>\u67e5\u770b</button></td>";
    },7,"\u6682\u65e0\u98ce\u9669\u4e8b\u4ef6");

    renderPagination("event-pagination",_eventPage,res.data.total||items.length,PAGE_SIZE,"renderEvents");
  });
}

window.YC_showEventDetail=function(eventId){
  showModal("\u4e8b\u4ef6\u8be6\u60c5","<p style='text-align:center;color:#888'>\u6b63\u5728\u52a0\u8f7d...</p>");
  safeApi("GET","/events/"+eventId).then(function(res){
    if(!res.ok){$("modal-body").innerHTML="<p style='color:#e74c3c'>\u52a0\u8f7d\u5931\u8d25: "+esc(res.error)+"</p>";return;}
    var row=res.data;
    showDetailModal("\u98ce\u9669\u4e8b\u4ef6 #"+(row.id||"?"),[
      {label:"ID",value:row.id},{label:"\u827a\u4eba",value:row.artist_name},
      {label:"\u4e8b\u4ef6\u7c7b\u578b",value:row.event_type||row.category},
      {label:"\u98ce\u9669\u7ea7\u522b",html:"<span class='badge badge-red'>"+esc(row.risk_level||row.heat_level||"-")+"</span>"},
      {label:"\u53d1\u751f\u65e5\u671f,value:row.event_date?row.event_date.substring(0,10):"-"},
      {label:"\u6458\u8981",value:row.summary||row.description,"html":true},
      {label:"\u6765\u6e90",value:row.source_url||"-"}
    ]);
  });
};

/* ============================================================
   RENDER: USERS (toggle active/inactive + detail)
   ============================================================ */
var _userPage=1;
function renderUsers(p){
  if(p)_userPage=p; var tbody=$("user-tbody");
  if(tbody)tbody.innerHTML="<tr><td colspan='9' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  var q=$("user-search")?$("user-search").value.trim():"";
  var ut=$("user-type-filter")?$("user-type-filter").value:"";
  var us=$("user-status-filter")?$("user-status-filter").value:"";

  var params="?page="+_userPage+"&page_size="+PAGE_SIZE;
  if(q)params+="&q="+encodeURIComponent(q);
  if(ut)params+="&user_type="+ut;
  if(us)params+="&is_active="+us;

  safeApi("GET","/admin/users"+params).then(function(res){
    if(!res.ok){if(tbody)tbody.innerHTML=errorRow((res.status===401||res.status===403)?"\u6743\u9650\u4e0d\u8db3\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55":(res.error||"\u52a0\u8f7d\u5931\u8d25"),9);return;}
    var d=res.data; var items=d.items||[]; if(!Array.isArray(items))items=[];

    renderTable(tbody,items,function(row){
      var isActive=row.is_active!==false;
      return "<td>"+(row.id||"-")+"</td>"+
             "<td><strong>"+esc(row.nickname||row.real_name||"-")+"</strong></td>"+
             "<td>"+maskPhone(row.phone)+"</td>"+
             "<td class='cell-truncate'>"+esc(truncate(row.company||"-",12))+"</td>"+
             "<td><span class='badge badge-blue'>"+esc(row.user_type||"-")+"</span></td>"+
             "<td>"+(row.verified?"&#x2705; ":"&#x274C; ")+(row.verify_type||"")+"</td>"+
             "<td id='user-status-"+row.id+"' data-uid='"+row.id+"'>"+statusToggleHtml(row.id,isActive)+"</td>"+
             "<td>"+fmtDate(row.created_at)+"</td>"+
             "<td><button class='btn btn-ghost btn-xs' onclick='YC_showUserDetail("+(row.id||0)+")'>\u8be6\u60c5</button></td>";
    },9,"\u6682\u65e0\u7528\u6237\u6570\u636e");

    renderPagination("user-pagination",_userPage,d.total||0,PAGE_SIZE,"renderUsers");
  });
}

function statusToggleHtml(uid,isActive){
  return "<button class='btn "+(isActive?"btn-danger":"btn-success")+" btn-xs' onclick='YC_toggleUserStatus("+(uid||0)+","+(isActive?"true":"false")+")'>"+(isActive?"\u505c\u7528":"\u542f\u7528")+"</button>";
}

window.YC_toggleUserStatus=async function(uid,currentActive){
  var newActive=!currentActive;
  var res=await safeApi("PUT","/admin/users/"+uid,{is_active:newActive});
  if(res.ok){
    toast(newActive?"\u5df2\u542f\u7528":"\u5df2\u505c\u7528"); renderUsers(_userPage);
  }else{
    toast("\u64cd\u4f5c\u5931\u8d25: "+(res.error||"\u672a\u77e5\u9519\u8bef"));
  }
};

window.YC_showUserDetail=async function(userId){
  showModal("\u7528\u6237\u8be6\u60c5","<p style='text-align:center;color:#888'>\u52a0\u8f7d\u4e2d...</p>");
  var res=await safeApi("GET","/admin/users/"+userId);
  if(!res.ok){$("modal-body").innerHTML="<p style='color:#e74c3c'>\u52a0\u8f7d\u5931\u8d25</p>";return;}
  var row=res.data;
  showDetailModal("\u7528\u6237: "+(row.nickname||row.real_name||"?"),[
    {label:"ID",value:row.id},{label:"\u6635\u79f0",value:row.nickname},{label:"\u771f\u5b9e\u59d3\u540d",value:row.real_name},
    {label:"\u624b\u673a\u53f7",value:maskPhone(row.phone)},{label:"\u516c\u53f8",value:row.company},
    {label:"\u5957\u9910",html:"<span class='badge badge-blue'>"+(row.user_type||"-")+"</span>"},
    {label:"\u8ba4\u8bc1",value:row.verified?\u5df2\u8ba4\u8bc1:"\u672a\u8ba4\u8bc1"},{label:"\u72b6\u6001",html:row.is_active!==false?"<span class='badge badge-green'>\u542f\u7528</span>":"<span class='badge badge-red'>\u505c\u7528</span>"},
    {label:"\u6ce8\u518c\u65f6\u95f4,value:fmtDate(row.created_at)}
  ]);
};

var usb=$("user-search-btn");if(usb)usb.addEventListener("click",function(){_userPage=1;renderUsers();});
var use=$("user-search");if(use)use.addEventListener("keydown",function(e){if(e.key==="Enter"){_userPage=1;renderUsers();}});
["user-type-filter","user-status-filter"].forEach(function(fid){var el=$(fid);if(el)el.addEventListener("change",function(){_userPage=1;renderUsers();});});

/* ============================================================
   RENDER: STAFF
   ============================================================ */
function renderStaff(){
  var tbody=$("staff-tbody");
  if(tbody)tbody.innerHTML="<tr><td colspan='6' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  var sq=$("staff-search")?$("staff-search").value.trim():"";

  safeApi("GET","/admin/staff?q="+encodeURIComponent(sq)).then(function(res){
    if(!res.ok){if(tbody)tbody.innerHTML=errorRow(res.error||"\u52a0\u8f7d\u5931\u8d25",6);return;}
    var items=res.data.items||res.data||[]; if(!Array.isArray(items))items=[];

    renderTable(tbody,items,function(row){
      var isActive=row.is_active!==false;
      var roleMap={"super_admin":"\u8d85\u7ba1\u7406\u5458","admin":"\u7ba1\u7406\u5458","operator":"\u8fd0\u8425\u5458","viewer":"\u89c2\u5bdf\u5458"};
      return "<td>"+(row.id||"-")+"</td>"+
             "<td><strong>"+esc(row.username||"-")+"</strong></td>"+
             "<td>"+esc(row.real_name||"-")+"</td>"+
             "<td><span class='badge badge-purple'>"+esc(roleMap[row.role]||row.role||"-")+"</span></td>"+
             "<td id='staff-status-"+row.id+"'>"+staffToggleHtml(row.id,isActive,row.role)+"</td>"+
             "<td>"+(row.last_login_at?fmtDate(row.last_login_at):"-")+"</td>";
    },6,"\u6682\u65e0\u5458\u5de5\u6570\u636e");
  });
}

function staffToggleHtml(sid,isActive,role){
  if(role==="super_admin") return "<span class='badge badge-purple'>\u8d85\u7ba1</span>";
  return "<button class='btn "+(isActive?"btn-danger":"btn-success")+" btn-xs' onclick='YC_toggleStaffStatus("+(sid||0)+","+(isActive?"true":"false")+")'>"+(isActive?"\u505c\u7528":"\u542f\u7528")+"</button>";
}

window.YC_toggleStaffStatus=async function(sid,currentActive){
  var res=await safeApi("PUT","/admin/staff/"+sid,{is_active:!currentActive});
  if(res.ok){toast(!currentActive?"\u5df2\u542f\u7528":"\u5df7\u505c\u7528");renderStaff();}
  else{toast("\u64cd\u4f5c\u5931\u8d25: "+(res.error||"-"));}
};
var ssb=$("staff-search-btn");if(ssb)ssb.addEventListener("click",renderStaff);
var sse=$("staff-search");if(sse)sse.addEventListener("keydown",function(e){if(e.key==="Enter")renderStaff();});

/* ============================================================
   RENDER: LEADS (status change + assign + detail)
   ============================================================ */
var _leadPage=1;
function renderLeads(p){
  if(p)_leadPage=p; var tbody=$("lead-tbody");
  if(tbody)tbody.innerHTML="<tr><td colspan='8' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  var sf=$("lead-status-filter")?$("lead-status-filter").value:"";

  safeApi("GET","/admin/leads?page="+_leadPage+"&page_size="+PAGE_SIZE+(sf?"&status="+sf:"")).then(function(res){
    if(!res.ok){if(tbody)tbody.innerHTML=errorRow(res.error||"\u52a0\u8f7d\u5931\u8d25",8);return;}
    var d=res.data; var items=d.items||[]; if(!Array.isArray(items))items=[];

    renderTable(tbody,items,function(row){
      return "<td>"+(row.id||"-")+"</td>"+
             "<td><strong>"+esc(row.company_name||row.contact_person||"-")+"</strong></td>"+
             "<td>"+esc(row.contact_phone||row.email||"-")+"</td>"+
             "<td class='cell-truncate' title='"+escAttr(row.requirements||"")+"'>"+esc(truncate(row.requirements||"-",20))+"</td>"+
             "<td id='lead-st-"+row.id+"'>"+statusChangeHtml(row)+"</td>"+
             "<td id='lead-asgn-"+row.id+"'>"+esc(row.assignee_name||"<span style='color:#888'>\u672a\u5206\u914d</span>")+"</td>"+
             "<td>"+fmtDate(row.created_at)+"</td>"+
             "<td><button class='btn btn-primary btn-xs' onclick='YC_showLeadDetail("+(row.id||0)+")'>\u8be6\u60c5</button> "+
             "<button class='btn btn-ghost btn-xs' onclick='YC_assignLead("+(row.id||0)+")'>\u5206\u914d</button></td>";
    },8,"\u6682\u65e0\u5546\u52a1\u7ebf\u7d22");

    renderPagination("lead-pagination",_leadPage,d.total||0,PAGE_SIZE,"renderLeads");
  });
}

function statusChangeHtml(row){
  var st=row.status||"pending";
  var options=["pending","contacted","converted","rejected"];
  var labels={pending:"\u5f85\u5904\u7406",contacted:"\u5df2\u8054\u7cfb",converted:"\u5df2\u8f6c\u5316",rejected:"\u5df2\u62d2\u7edd"};
  var opts=options.map(function(v){
    return "<option value='"+v+"'"+(v===st?" selected":"")+">"+labels[v]+"</option>";
  }).join("");
  return "<select class='select-xs' onchange='YC_changeLeadStatus("+(row.id||0)+",this.value)'>"+opts+"</select>";
}

window.YC_changeLeadStatus=async function(leadId,newStatus){
  var res=await safeApi("PUT","/admin/leads/"+leadId,{status:newStatus});
  if(res.ok){toast("\u72b6\u6001\u5df2\u66f4\u65b0"); renderLeads(_leadPage);}
  else{toast("\u66f4\u65b0\u5931\u8d25: "+(res.error||"-"));};
};

window.YC_assignLead=async function(leadId){
  showModal("\u5206\u914d\u7ebf\u7d22","<p>\u8bf7\u9009\u62e9\u8d1f\u8d23\u4eba:</p><select id='assign-staff-select' class='form-control' style='width:100%;padding:8px;margin:10px 0'><option value=''>\u52a0\u8f7d\u4e2d...</option></select>",
  "<button type='button' onclick='YC_doAssignLead("+(leadId||0)+")' class='btn btn-primary btn-sm'>\u786e\u8ba4\u5206\u914d</button> <button type='button' onclick=\"document.getElementById('modal-layer').hidden=true\" class='btn btn-ghost btn-sm'>\u53d6\u6d88</button>");

  var sr=await safeApi("GET","/admin/staff");
  var sel=$("assign-staff-select");
  if(sr.ok&&sel){
    var staffList=sr.data.items||sr.data||[];
    staffList.forEach(function(s){if(s.is_active!==false)sel.innerHTML+="<option value='"+s.id+"'>"+esc(s.real_name||s.username)+" ("+(s.role||"-")+")</option>";});
  }
};

window.YC_doAssignLead=async function(leadId){
  var sel=document.getElementById("assign-staff-select");
  var staffId=sel?sel.value:null;
  if(!staffId){toast("\u8bf7\u9009\u62e9\u8d1f\u8d4b\u4eba");return;}
  var res=await safeApi("PUT","/admin/leads/"+leadId,{assigned_to:Number(staffId)});
  if(res.ok){toast("\u5206\u914d\u6210\u529f"); $("modal-layer").hidden=true; renderLeads(_leadPage);}
  else{toast("\u5206\u914d\u5931\u8d25: "+(res.error||"-"));}
};

window.YC_showLeadDetail=async function(leadId){
  showModal("\u7ebf\u7d22\u8be6\u60c5","<p style='text-align:center;color:#888'>\u52a0\u8f7d\u4e2d...</p>");
  var res=await safeApi("GET","/admin/leads/"+leadId);
  if(!res.ok){$("modal-body").innerHTML="<p style='color:#e74c3c'>\u52a0\u8f7d\u5931\u8d25</p>";return;}
  var row=res.data;
  showDetailModal("\u5546\u52a1\u7ebf\u7d22 #"+(row.id||"?"),[
    {label:"\u516c\u53f8/\u8054\u7cfb\u4eba",value:row.company_name||row.contact_person},
    {label:"\u8054\u7cfb\u65b9\u5f0f",value:row.contact_phone||row.email},
    {label:"\u9700\u6c42\u63cf\u8ff0",value:row.requirements,"html":true},
    {label:"\u72b6\u6001",html:statusBadge(row.status)},
    {label:"\u8d1f\u8d23\u4eba",value:row.assignee_name||"\u672a\u5206\u914d"},
    {label:"\u521b\u5efa\u65f6\u95f4,value:fmtDate(row.created_at)}
  ]);
};

var lsb=$("lead-search-btn");if(lsb)lsb.addEventListener("click",function(){_leadPage=1;renderLeads();});
var lsf=$("lead-status-filter");if(lsf)lsf.addEventListener("change",function(){_leadPage=1;renderLeads();});

/* ============================================================
   RENDER: INTAKES (approve/reject buttons)
   ============================================================ */
var _intakePage=1;
function renderIntakes(p){
  if(p)_intakePage=p; var tbody=$("intake-tbody");
  if(tbody)tbody.innerHTML="<tr><td colspan='7' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  var sf=$("intake-status-filter")?$("intake-status-filter").value:"";

  safeApi("GET","/admin/intakes?page="+_intakePage+"&page_size="+PAGE_SIZE+(sf?"&status="+sf:"")).then(function(res){
    if(!res.ok){if(tbody)tbody.innerHTML=errorRow(res.error||"\u52a0\u8f7d\u5931\u8d25",7);return;}
    var d=res.data; var items=d.items||[]; if(!Array.isArray(items))items=[];

    renderTable(tbody,items,function(row){
      var isPending=(row.status==="pending_review"||row.status==="pending");
      var actionBtns="";
      if(isPending){
        actionBtns="<button class='btn btn-success btn-xs' onclick='YC_approveIntake("+(row.id||0)+")'>&#x2705; \u901A\u8FC7</button> "+
                    "<button class='btn btn-danger btn-xs' onclick='YC_rejectIntake("+(row.id||0)+")'>&#x274C; \u9A73\u56DE</button>";
      }else{
        actionBtns=intakeStatusLabel(row.status);
      }
      return "<td>"+(row.id||"-")+"</td>"+
             "<td><strong>"+esc(row.artist_name||"-")+"</strong></td>"+
             "<td>"+esc(row.applicant_name||"-")+"</td>"+
             "<td>"+esc(row.intake_type||"-")+"</td>"+
             "<td>"+intakeStatusBadge(row.status)+"</td>"+
             "<td>"+fmtDate(row.created_at)+"</td>"+
             "<td style='white-space:nowrap'>"+actionBtns+"</td>";
    },7,"\u6682\u65e0\u5165\u9a7b\u7533\u8bf7");

    renderPagination("intake-pagination",_intakePage,d.total||0,PAGE_SIZE,"renderIntakes");
  });
}

window.YC_approveIntake=async function(intakeId){
  showModal("\u786e\u8ba4\u5ba1\u6838","\u<p style='padding:16px;text-align:center;'>\u786e\u8ba4<b>\u901A\u8fc7</b>\u6b64\u5165\u9a7b\u7533\u8bf7\uff1f</p>",
  "<button type='button' onclick='YC_doApproveIntake("+(intakeId||0)+")' class='btn btn-success btn-sm'>\u786e\u8ba4\u901a\u8fc7</button> "+
  "<button type='button' onclick=\"document.getElementById('modal-layer').hidden=true\" class='btn btn-ghost btn-sm'>\u53d6\u6d88</button>");
};

window.YC_rejectIntake=async function(intakeId){
  showModal("\u786e\u8ba4\u9a73\u56de","\p style='padding:16px;text-align:center;'><label>\u9a73\u56de\u539f\u56e0:</label><textarea id='reject-reason' rows='3' style='width:100%;margin-top:8px;padding:8px;border:1px solid #ddd;border-radius:6px'></textarea></p>",
  "<button type='button' onclick='YC_doRejectIntake("+(intakeId||0)+")' class='btn btn-danger btn-sm'>\u786e\u8ba4\u9a73\u56de</button> "+
  "<button type='button' onclick=\"document.getElementById('modal-layer').hidden=true\" class='btn btn-ghost btn-sm'>\u53d6\u6d88</button>");
};

window.YC_doApproveIntake=async function(intakeId){
  var res=await safeApi("PUT","/admin/intakes/"+intakeId,{status:"approved"});
  if(res.ok){toast("\u5df2\u901a\u8fc7"); $("modal-layer").hidden=true; renderIntakes(_intakePage);}
  else{toast("\u64cd\u4f5c\u5931\u8d25: "+(res.error||"-"));}
};

window.YC_doRejectIntake=async function(intakeId){
  var reasonEl=document.getElementById("reject-reason");
  var res=await safeApi("PUT","/admin/intakes/"+intakeId,{status:"rejected",reject_reason:reasonEl?reasonEl.value:""});
  if(res.ok){toast("\u5df2\u9a73\u56de"); $("modal-layer").hidden=true; renderIntakes(_intakePage);}
  else{toast("\u64cd\u4f5c\u5931\u8d25: "+(res.error||"-"));}
};

var isn=$("intake-search-btn");if(isn)isn.addEventListener("click",function(){_intakePage=1;renderIntakes();});
var isf=$("intake-status-filter");if(isf)isf.addEventListener("change",function(){_intakePage=1;renderIntakes();});

/* ============================================================
   RENDER: INVITES (generate + copy + list)
   ============================================================ */
function renderInvites(){
  var tbody=$("invite-tbody");
  if(tbody)tbody.innerHTML="<tr><td colspan='7' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  safeApi("GET","/admin/invites").then(function(res){
    if(!res.ok){if(tbody)tbody.innerHTML=errorRow(res.error||"\u52a0\u8f7d\u5931\u8d25",7);return;}
    var d=res.data; var items=d.items||d.invites||[]; if(!Array.isArray(items))items=[];

    var stats=$("invite-stats");
    if(stats)stats.innerHTML="\u603b\u6570: <strong>"+items.length+"</strong> &nbsp;|&nbsp; \u6709\u6548: <strong>"+items.filter(function(i){return i.is_active&&(i.valid_until==null||new Date(i.valid_until)>new Date());}).length+"</strong>";

    renderTable(tbody,items,function(row){
      var expired=row.valid_until&&new Date(row.valid_until)<new Date();
      var isActive=!expired&&row.is_active;
      var codeEsc=esc(row.code||"-");
      return "<td>"+(row.id||"-")+"</td>"+
             "<td><code style='font-size:13px;background:#f1f5f9;padding:2px 6px;border-radius:4px'>"+codeEsc+
             "</code> <button class='btn btn-ghost btn-xs' style='margin-left:4px' onclick='YC_copy(\""+(row.code||"")+"\")' title='\u590D\u5236'>&#x2398;</button></td>"+
             "<td>"+(row.used_count||0)+"</td><td>"+(row.max_uses||"\u65e0\u9650")+"</td>"+
             "<td>"+(row.valid_until?row.valid_until.replace("T"," ").substring(0,16):"\u6c38\u4e45\u6709\u6548")+"</td>"+
             "<td><span class='badge "+(expired?"badge-red":isActive?"badge-green":"badge-grey")+"'>"+(expired?"\u5df2\u8fc7\u671f":isActive?"\u6709\u6548":"\u505c\u7528")+"</span></td>"+
             "<td>"+(isActive?"<button class='btn btn-danger btn-xs' onclick='YC_disableInvite("+(row.id||0)+")'>\u505c\u7528</button>":"-")+"</td>";
    },7,"\u6682\u65e0\u9080\u8bf7\u7801");
  });
}

window.YC_genInvite=async function(){
  var countStr=prompt("\u8f93\u5165\u751f\u6210\u6570\u91cf:","5");
  if(!countStr)return; var n=Number(countStr)||5;
  showModal("\u6b63\u5728\u751f\u6210...","<p style='text-align:center;padding:20px'>\u6b63\u5728\u751f\u6210 <strong>"+n+"</strong> \u4e2a\u9080\u8bf7\u7801...</p>","");
  var res=await safeApi("POST","/admin/invites",{count:n});
  if(res.ok){
    var codes=res.data.codes||res.data.invites||[];
    var html="<div style='max-height:400px;overflow-y:auto'><p class='success-text'>\u6210\u529f\u751f\u6210 <strong>"+codes.length+"</strong> \u4e2a\u9080\u8bf7\u7801:</p>";
    codes.forEach(function(c){
      var code=c.code||c;
      html+="<div style='display:flex;justify-content:space-between;align-items:center;padding:8px;margin:6px 0;background:#f8fafc;border-radius:6px'>";
      html+="<code style='font-size:15px;letter-spacing:2px;font-weight:bold;color:#3b82f6'>"+esc(code)+"</code>";
      html+="<button class='btn btn-primary btn-xs' onclick='YC_copy(\""+esc(code)+"\")'>\u590D\u5236</button></div>";
    });
    html+="</div><p style='font-size:12px;color:#64748b;margin-top:10px'>\u70b9\u51fb\u590d\u5236\u6309\u94ae\u590d\u5236\u5230\u526a\u8d34\u677f</p>";
    $("modal-title").textContent="\u9080\u8bf7\u7801\u5df2\u751f\u6210";
    $("modal-body").innerHTML=html;
    $("modal-foot").innerHTML="<button type='button' onclick='renderInvites();document.getElementById(\"modal-layer\").hidden=true' class='btn btn-primary btn-sm'>\u5b8c\u6210</button>";
  }else{
    $("modal-body").innerHTML="<p style='color:#e74c3c;text-align:center'>\u751f\u6210\u5931\u8d25: "+esc(res.error||"\u672a\u77e5\u9519\u8bef")+"</p>";
  }
};

window.YC_disableInvite=async function(inviteId){
  var res=await safeApi("PUT","/admin/invites/"+inviteId,{is_active:false});
  if(res.ok){toast("\u5df2\u505c\u7528"); renderInvites();}
  else{toast("\u64cd\u4f5c\u5931\u8d25: "+(res.error||"-"));}
};

var igb=$("invite-gen-btn");
if(igb)igb.addEventListener("click",function(){
  showModal("\u751f\u6210\u9080\u8bf7\u7801","<p>\u8f93\u5165\u8981\u751f\u6210\u7684\u9080\u8bf7\u7801\u6570\u91cf\uff0c\u751f\u6210\u540e\u53ef\u76f4\u63a5\u590d\u5236\u3002</p>",
  "<button type='button' onclick='YC_genInvite()' class='btn btn-primary btn-sm'>&#x2795; \u5F00\u59CB\u751F\u6210</button> <button type='button' onclick=\"document.getElementById('modal-layer').hidden=true\" class='btn btn-ghost btn-sm'>\u53D6\u6D88</button>");
});

/* ============================================================
   RENDER: PRICING (editable config + save + request list)
   ============================================================ */
function renderPricing(){
  var card=$("pricing-config-card"); var tbody=$("pricing-tbody");
  if(card)card.innerHTML="<p class='loading'>\u6b63\u5728\u52a0\u8f7d\u914d\u7f6e...</p>";
  if(tbody)tbody.innerHTML="<tr><td colspan='6' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  safeApi("GET","/admin/pricing/config").then(function(res){
    if(card){
      if(!res.ok){card.innerHTML="<p class='error-text'>"+esc(res.error||"\u52a0\u8f7d\u914d\u7f6e\u5931\u8d25")+"</p>";return;}
      var cfg=res.data.config||res.data||{}; if(typeof cfg!=="object"||cfg==null)cfg={};
      card.innerHTML=buildConfigForm(cfg);
    }
  });

  safeApi("GET","/admin/pricing/requests?page=1&page_size=15").then(function(res){
    if(!res.ok){if(tbody)tbody.innerHTML=errorRow(res.error,6);return;}
    var d=res.data; var items=d.items||[]; if(!Array.isArray(items))items=[];
    renderTable(tbody,items,function(row){
      return "<td>"+(row.id||"-")+"</td>"+
             "<td><strong>"+esc(row.brand_name||row.company||"-")+"</strong></td>"+
             "<td>"+(row.budget_min||"?")+" - "+(row.budget_max||"?")+"\u4e07</td>"+
             "<td>"+esc(row.industry||"-")+"</td>"+
             "<td>"+statusBadge(row.status)+"</td>"+
             "<td>"+fmtDate(row.created_at)+"</td>";
    },6,"\u6682\u65e0\u64ae\u5408\u8bf7\u6c42");
  });
}

function buildConfigForm(cfg){
  var keys=Object.keys(cfg).sort(); if(keys.length===0)return "<p style='color:#888;padding:16px'>\u6682\u65e0\u914d\u7f6e\u9879\u3002\u70b9\u51fb\u4fdd\u5b58\u53ef\u521d\u59cb\u5316\u914d\u7f6e\u3002</p>";
  var fields=""; keys.forEach(function(k){
    var v=cfg[k];
    if(typeof v==="number")fields+="<div class='form-row'><label>"+esc(k)+"</label><input type='number' value='"+v+"' step='0.01' data-key='"+escAttr(k)+"' /></div>";
    else if(typeof v==="string")fields+="<div class='form-row'><label>"+esc(k)+"</label><input type='text' value='"+escAttr(v)+"' data-key='"+escAttr(k)+"' /></div>";
    else if(typeof v==="object"&&v!==null)fields+="<div class='form-row'><label><strong>"+esc(k)+"</strong></label><pre style='background:#f1f5f9;padding:8px;border-radius:6px;font-size:11px;max-height:150px;overflow:auto'>"+esc(JSON.stringify(v,null,2))+"</pre></div>";
  });
  return "<form id='config-form' onsubmit='YC_saveConfig(event)'>"+fields+"<div style='margin-top:16px'><button type='submit' class='btn btn-primary btn-sm'>&#x1F4BE; \u4FDD\u5B58\u914D\u7F6E</button> <span id='config-save-status' style='margin-left:8px'></span></div></form>";
}

window.YC_saveConfig=async function(e){
  e.preventDefault();
  var form=$("config-form"); if(!form)return;
  var inputs=form.querySelectorAll("[data-key]");
  var payload={}; inputs.forEach(function(inp){payload[inp.dataset.key]=inp.type==="number"?Number(inp.value):inp.value;});
  var st=$("config-save-status"); if(st)st.textContent="\u4fdd\u5b58\u4e2d...";
  var res=await safeApi("PUT","/admin/pricing/config",payload);
  if(res.ok){toast("\u914d\u7f6e\u4fdd\u5b58\u6210\u529f"); if(st)st.textContent="\u2705 \u5df2\u4fdd\u5b58";}
  else{toast("\u4fdd\u5b58\u5931\u8d25: "+(res.error||"-")); if(st)st.textContent="\u274C \u4fdd\u5b58\u5931\u8d25";}
};

/* ===== INIT ===== */
var av0=$("app-view"),lv0=$("login-view");
if(av0)av0.hidden=true;
if(lv0){lv0.classList.remove("login-hidden");lv0.style.display="";lv0.hidden=false;}

if(token){
  safeApi("GET","/admin/auth/me").then(function(res){
    if(res.ok&&res.data){staff=res.data;enterApp();}
    else{logout("\u767b\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");}
  }).catch(function(){logout("\u670d\u52a1\u5668\u8fde\u63a5\u5931\u8d25\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");});
}

/* ===== JS ERROR DISPLAY ===== */
window.onerror=function(msg,src,line,col,err){
  var bar=$("js-error-bar"); var sp=$("js-error-msg");
  if(bar&&sp){sp.textContent=String(msg)+" at "+(src||"")+":"+(line||"?")+":"+(col||"?");bar.style.display="";}
  return false;
};

})();
