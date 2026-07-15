/* ============================================================
   YC Console V13 — 根治空白（最终版）

   核心策略转变：
   1. index.html 中 #content 写死静态默认内容（欢迎面板+4张卡片）
   2. JS 只负责更新数值，不替换整个 innerHTML
   3. window.onerror 将所有错误显示在屏幕底部红条
   4. AbortController 超时 + safeApi 防挂起
   5. 即使 JS 完全崩溃，用户也能看到完整的默认面板
   ============================================================ */
(function () {
"use strict";

/* ===== CONFIG ===== */
var API = "https://yiancha-backend.onrender.com/api/v1";
var LS_TOKEN = "yc_token";
var LS_STAFF = "yc_staff";
var API_TIMEOUT = 12000;

/* ===== STATE ===== */
var token = localStorage.getItem(LS_TOKEN);
var staff = null;
try { staff = JSON.parse(localStorage.getItem(LS_STAFF) || "null"); } catch (e) { staff = null; }

/* ===== UTILS ===== */
var $ = function (id) { return document.getElementById(id); };

function api(method, path, body) {
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, API_TIMEOUT);

  var opts = {
    method: method,
    headers: { "Authorization": "Bearer " + token },
    signal: controller.signal
  };
  if (body) {
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
  }).catch(function (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") err = new Error("请求超时，后端可能正在启动");
    throw err;
  });
}

function safeApi(method, path, body) {
  return api(method, path, body)
    .then(function (data) { return { ok: true, data: data, error: null }; })
    .catch(function (err) { return { ok: false, data: null, error: err }; });
}

function showToast(msg, type) {
  var t = $("toast");
  if (!t) return;
  t.className = "toast-" + (type || "info");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._t);
  t._t = setTimeout(function () { t.hidden = true; }, 2800);
}

/* ===== CANVAS BACKGROUND ===== */
var cv = $("bg");
function drawBg() {
  if (!cv) return;
  cv.width = window.innerWidth;
  cv.height = window.innerHeight;
  var g = cv.getContext("2d").createLinearGradient(0, 0, cv.width * 0.3, cv.height);
  g.addColorStop(0, "#0f172a");
  g.addColorStop(0.5, "#1a2744");
  g.addColorStop(1, "#162544");
  var ctx = cv.getContext("2d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cv.width, cv.height);
}
drawBg();
window.addEventListener("resize", drawBg);

/* ===== LOGIN ===== */
var uEl = $("u");
var pEl = $("p");
var lb = $("lb");
var le = ("le");
var pwdRaw = "";

if (pEl) {
  pEl.addEventListener("focus", function () {
    if (!pEl.dataset.init) { pEl.dataset.init = "1"; pwdRaw = pEl.textContent; renderPwd(); }
  }, true);
  pEl.addEventListener("input", function () {
    var d = pEl.textContent;
    if (d.length < pwdRaw.length) pwdRaw = pwdRaw.substring(0, d.length);
    else if (d.length > pwdRaw.length) pwdRaw += d.substring(pwdRaw.length);
    renderPwd();
  });
  pEl.addEventListener("paste", function (e) {
    e.preventDefault();
    var txt = (e.clipboardData || window.clipboardData).getData("text");
    if (txt) { pwdRaw += txt; renderPwd(); }
  });
}

function renderPwd() {
  if (!pEl) return;
  pEl.textContent = "\u25CF".repeat(pwdRaw.length);
  var s = window.getSelection();
  var r = document.createRange();
  r.selectNodeContents(pEl);
  r.collapse(false);
  s.removeAllRanges();
  s.addRange(r);
}

async function doLogin() {
  var user = uEl ? uEl.textContent.trim() : "";
  var pass = pwdRaw;
  if (le) le.textContent = "";
  if (!user || !pass) { if (le) le.textContent = "请输入账号和密码"; return; }
  if (lb) { lb.disabled = true; lb.textContent = "登录中..."; }
  try {
    var res = await fetch(API + "/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.detail || "\u767b\u5f55\u5931\u8d25(" + res.status + ")");
    token = data.token;
    staff = data.staff;
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_STAFF, JSON.stringify(staff));
    enterApp();
  } catch (err) {
    if (le) le.textContent = err.message;
    if (lb) { lb.disabled = false; lb.textContent = "\u767b \u5f55"; }
  }
}
if (lb) lb.addEventListener("click", doLogin);
if (pEl) pEl.addEventListener("keydown", function (e) { if (e.key === "Enter") doLogin(); });
if (uEl) uEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { var p = $("p"); if (p) p.focus(); } });

function logout(msg) {
  token = null;
  staff = null;
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_STAFF);
  var av = $("app-view");
  var lv = $("login-view");
  if (av) av.hidden = true;
  if (lv) lv.style.display = "";
  if (uEl) uEl.textContent = "";
  if (pEl) pEl.textContent = "";
  pwdRaw = "";
  if (le) le.textContent = msg || "";
  if (lb) { lb.disabled = false; lb.textContent = "\u767b \u5f55"; }
  if (cv) { cv.style.display = ""; drawBg(); }
}

/* ===== MODAL ===== */
var modal = {
  layer: $("modal-layer"),
  title: $("modal-title"),
  body: $("modal-body"),
  foot: $("modal-foot")
};

function openModal(title, html) {
  if (!title && !html) return;
  if (modal.title) modal.title.textContent = title || "";
  if (modal.body) modal.body.innerHTML = html || "";
  if (modal.foot) modal.foot.innerHTML = '<button type="button" onclick="document.getElementById(\'modal-layer\').hidden=true">\u5173\u95ed</button>';
  if (modal.layer) { modal.layer.hidden = false; modal.layer.style.display = ""; }
}
window.openModal = openModal;

function closeModal() {
  if (modal.layer) modal.layer.hidden = true;
}
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (modal.layer && !modal.layer.hidden) closeModal();
    var sb = $("sidebar");
    if (sb) sb.classList.remove("open");
  }
});

/* ===== NAVIGATION ===== */
var navItems = [
  { id: "dashboard",  label: "\u4eea\u8868\u76d8", icon: "\uD83D\uDCCA", roles: ["super_admin","analyst","operator"] },
  { id: "artists",   label: "\u827a\u4eba\u7ba1\u7406", icon: "\u2604", roles: ["super_admin","analyst","operator"] },
  { id: "events",    label: "\u98ce\u9669\u4e8b\u4ef6", icon: "\u26A0", roles: ["super_admin","analyst"] },
  { id: "commercial",label: "\u5546\u4e1a\u4ef7\u503c", icon: "\u2699", roles: ["super_admin","analyst","operator"] },
  { id: "reports",   label: "\u62a5\u544a\u5bfc\u51fa", icon: "\uD83D\uDCC4", roles: ["super_admin","analyst","operator"] },
  { id: "monitor",   label: "\u76d1\u63a7\u544a\u8b66", icon: "\uD83D\uDD14", roles: ["super_admin","analyst"] },
  { id: "users",     label: "\u7528\u6237\u7ba1\u7406", icon: "\uD83D\uDC64", roles: ["super_admin"] },
];

/** Navigate to a page — for non-dashboard pages, replaces #content; for dashboard, updates in-place */
function navigate(pageId) {
  try {
    /* Update nav active state */
    var lis = document.querySelectorAll("#nav-list li");
    for (var i = 0; i < lis.length; i++) {
      lis[i].classList.toggle("active", lis[i].dataset.id === pageId);
    }
    /* Update title */
    var item = null;
    for (var j = 0; j < navItems.length; j++) {
      if (navItems[j].id === pageId) { item = navItems[j]; break; }
    }
    var pt = $("page-title");
    if (pt) pt.textContent = item ? item.label : "";

    var c = $("content");
    if (!c) return;

    switch (pageId) {
      case "dashboard":
        /* Dashboard: 不替换 innerHTML，只更新已有元素的数值 */
        loadDashboardData();
        break;
      case "artists":
        c.innerHTML = buildArtistsHTML();
        bindArtistControls();
        loadArtists();
        break;
      case "events":
        c.innerHTML = buildEventsHTML();
        bindEventControls();
        loadEvents();
        break;
      case "commercial":
        c.innerHTML = buildCommercialHTML();
        break;
      case "reports":
        c.innerHTML = buildReportsHTML();
        bindReportControls();
        break;
      case "monitor":
        c.innerHTML = buildMonitorHTML();
        loadMonitorData();
        break;
      case "users":
        c.innerHTML = buildUsersHTML();
        loadUsersData();
        break;
      default:
        c.innerHTML = '<div class="empty-state"><p>\u9875\u9762\u5f00\u53d1\u4e2d</p></div>';
    }
  } catch(e) {
    console.error("navigate error:", e);
    var c2 = $("content");
    if (c2) c2.innerHTML = renderErrorCard("\u5bfc\u822a\u9519\u8bef", e.message);
  }
}
window.navigate = navigate;

/* ===== ENTER APP ===== */
function enterApp() {
  try {
    var lv = $("login-view");
    var av = $("app-view");
    if (lv) lv.style.display = "none";
    if (av) av.hidden = false;

    /* Build nav */
    var ul = $("nav-list");
    if (ul) {
      ul.innerHTML = "";
      for (var i = 0; i < navItems.length; i++) {
        var item = navItems[i];
        if (!staff || item.roles.indexOf(staff.role) === -1) continue;
        var li = document.createElement("li");
        li.dataset.id = item.id;
        li.innerHTML = '<span class="nav-icon">' + item.icon + '</span>' + item.label;
        (function(id){ li.addEventListener("click", function () { navigate(id); }); })(item.id);
        ul.appendChild(li);
      }
    }

    /* User info */
    var ui = $("user-info");
    if (ui && staff) {
      ui.innerHTML =
        '<span style="color:#334155;font-weight:600">' + (staff.real_name || staff.username || '') + '</span>' +
        ' <span style="color:#94a3b8">|</span> ' +
        '<span class="badge badge-s">' + (staff.role || '-') + '</span>';
    }

    /* Update welcome text with real name */
    var wh2 = $("welcome-h2");
    if (wh2 && staff) {
      wh2.textContent = "\u6b22\u8fce\u56de\u6765\uff0c" + (staff.real_name || staff.username || "\u7ba1\u7406\u5458");
    }

    /* Hide canvas */
    if (cv) cv.style.display = "none";

    /* Navigate to first available page */
    var first = null;
    if (staff) {
      for (var k = 0; k < navItems.length; k++) {
        if (navItems[k].roles.indexOf(staff.role) !== -1) { first = navItems[k]; break; }
      }
    }
    navigate(first ? first.id : "dashboard");

    showToast("\u6b22\u8fce\uff0c" + (staff ? (staff.real_name || staff.username || "") : ""), "ok");
  } catch(e) {
    console.error("enterApp error:", e);
  }
}

/* ===== MOBILE MENU ===== */
var mt = $("menu-toggle");
if (mt) mt.addEventListener("click", function () {
  var sb = $("sidebar");
  if (sb) sb.classList.toggle("open");
});

/* ====================================================================
   PAGE RENDERS — V13: Dashboard 更新已有DOM，其他页面生成HTML字符串
   ==================================================================== */

/* ---- DASHBOARD: 只更新数据，不替换 innerHTML ---- */
function loadDashboardData() {
  /* Update stat notes to show loading */
  setStatNote("st-artists", "\u6b63\u5728\u52a0\u8f7d...");
  setStatNote("st-events", "\u6b63\u5728\u52a0\u8f7d...");
  setStatNote("st-highrisk", "\u6b63\u5728\u52a0\u8f7d...");
  setStatNote("st-today", "\u6b63\u5728\u52a0\u8f7d...");

  safeApi("GET", "/admin/dashboard/summary")
    .then(function (result) {
      if (result.ok && result.data) {
        var d = result.data;
        setStatValue("st-artists", d.total_artists || 0);
        setStatValue("st-events", d.total_events || 0);
        setStatValue("st-highrisk", d.high_risk || 0);
        setStatValue("st-today", d.today_new || 0);
        setStatNote("st-artists", "\u6570\u636e\u5df2\u540c\u6b65");
        setStatNote("st-events", "\u6570\u636e\u5df2\u540c\u6b65");
        setStatNote("st-highrisk", "\u6570\u636e\u5df2\u540c\u6b65");
        setStatNote("st-today", "\u6570\u636e\u5df2\u540c\u6b65");

        /* Recent events table */
        if (d.recent_events && d.recent_events.length) {
          var dr = $("dash-recent");
          if (dr) dr.innerHTML = buildRecentEventsTable(d.recent_events);
        }
      } else {
        /* API failed - show error in stat notes */
        var errMsg = result.error ? result.error.message : "\u65e0\u6cd5\u8fde\u63a5\u670d\u52a1\u5668";
        setStatNote("st-artists", errMsg);
        setStatNote("st-events", errMsg);
        setStatNote("st-highrisk", errMsg);
        setStatNote("st-today", errMsg);
      }
    })
    .catch(function (err) {
      var errMsg = err.message || "\u7f51\u7edc\u9519\u8bef";
      setStatNote("st-artists", errMsg);
      setStatNote("st-events", errMsg);
      setStatNote("st-highrisk", errMsg);
      setStatNote("st-today", errMsg);
    });
}

function setStatValue(id, val) {
  var el = $(id);
  if (el) el.textContent = val;
}

function setStatNote(id, note) {
  var el = $(id);
  if (el) el.textContent = note;
}

function buildRecentEventsTable(events) {
  var h = '<div class="section-header"><h3 class="section-title">\u6700\u65b0\u98ce\u9669\u4e8b\u4ef6</h3></div>';
  h += '<table><tr><th>\u827a\u4eba</th><th>\u4e8b\u4ef6\u7c7b\u578b</th><th>\u7ea7\u522b</th><th>\u72b6\u6001</th><th>\u65f6\u95f4</th></tr>';
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    var lvl = (e.risk_level || '').toUpperCase();
    var lvlCls = lvl === 'S' ? 's' : (lvl === 'A' ? 'a' : (lvl === 'B' ? 'b' : 'c'));
    h += '<tr><td><strong>' + (e.artist_name || "-") + '</strong></td>';
    h += '<td>' + (e.event_type || "-") + '</td>';
    h += '<td><span class="badge badge-' + lvlCls + '">' + (lvl || '?') + '</span></td>';
    h += '<td>' + (e.status || "-") + '</td>';
    h += '<td style="color:#94a3b8;font-size:12px">' + (e.event_date || "-") + '</td></tr>';
  }
  h += '</table>';
  return h;
}

/* ---- ARTISTS: 返回完整 HTML 字符串 ---- */
function buildArtistsHTML() {
  return '' +
    '<div class="toolbar">' +
    '<input placeholder="\u641c\u7d22\u827a\u4eba\u59d3\u540d..." id="artist-q">' +
    '<select id="artist-fl"><option value="">\u6240\u6709\u7ea7\u522b</option><option>S</option><option>A</option><option>B</option><option>C</option></select>' +
    '<button class="btn btn-primary" id="artist-search-btn">\u641c\u7d22</button>' +
    '</div><div id="artist-tb"><div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d...</p></div></div>';
}

function bindArtistControls() {
  var qEl = $("artist-q");
  var flEl = $("artist-fl");
  var btnEl = $("artist-search-btn");
  if (qEl) qEl.addEventListener("keydown", function (e) { if (e.key === "Enter") loadArtists(); });
  if (flEl) flEl.addEventListener("change", loadArtists);
  if (btnEl) btnEl.addEventListener("click", loadArtists);
}

function loadArtists() {
  var q = ($("artist-q") ? $("artist-q").value : "").trim();
  var fl = ($("artist-fl") ? $("artist-fl").value : "");
  var params = [];
  if (q) params.push("q=" + encodeURIComponent(q));
  if (fl) params.push("heat_level=" + fl);
  var qs = params.length ? "?" + params.join("&") : "";

  var tb = $("artist-tb");
  if (!tb) return;
  tb.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d...</p></div>';

  safeApi("GET", "/admin/artists" + qs)
    .then(function (result) {
      if (!tb) tb = $("artist-tb");
      if (!tb) return;
      if (!result.ok || !result.data) {
        tb.innerHTML = renderErrorCard(null, result.error ? result.error.message : "\u52a0\u8f7d\u5931\u8d25");
        return;
      }
      var items = result.data.items || result.data || [];
      if (!Array.isArray(items)) items = [items];
      if (!items.length) {
        tb.innerHTML = '<div class="empty-state"><p>\u6682\u65e0\u827a\u4eba\u6570\u636e</p></div>';
        return;
      }
      var h = '<table><tr><th>ID</th><th>\u59d3\u540d</th><th>\u70ed\u5ea6</th><th>\u7efc\u5206</th><th>\u64cd\u4f5c</th></tr>';
      for (var i = 0; i < items.length; i++) {
        var a = items[i];
        var hl = a.heat_level || '-';
        var hlCls = hl === 'S' ? 's' : (hl === 'A' ? 'a' : (hl === 'B' ? 'b' : 'c'));
        h += '<tr><td>#' + a.id + '</td>';
        h += '<td><strong>' + a.name + '</strong></td>';
        h += '<td><span class="badge badge-' + hlCls + '">' + hl + '</span></td>';
        h += '<td>' + (a.comprehensive_score != null ? a.comprehensive_score : '-') + '</td>';
        h += '<td><button class="btn btn-sm btn-primary" data-aid="' + a.id + '">\u8be6\u60c5</button></td></tr>';
      }
      h += '</table>';
      tb.innerHTML = h;

      /* Bind detail buttons */
      var btns = tb.querySelectorAll("[data-aid]");
      for (var j = 0; j < btns.length; j++) {
        (function(btn){ btn.addEventListener("click", function () { viewArtist(+btn.dataset.aid); }); })(btns[j]);
      }
    });
}

function viewArtist(id) {
  safeApi("GET", "/admin/artists/" + id)
    .then(function (result) {
      if (!result.ok || !result.data) { showToast("\u827a\u4eba\u8be6\u60c5\u52a0\u8f7d\u5931\u8d25", "err"); return; }
      var a = result.data;
      var h = '<h3>' + a.name + ' <small style="color:#94a3b8">#' + id + '</small></h3>';
      h += '<div class="info-grid">';
      var info = [
        ["\u70ed\u5ea6",a.heat_level],["\u7efc\u5206",a.comprehensive_score],
        ["\u751f\u65e5",a.birthday||"-"],["\u661f\u5ea6",a.constellation||"-"],
        ["\u6c11\u65cf",a.ethnicity||"-"],["\u51fa\u751f\u5730",a.birthplace||"-"],
        ["\u7ecf\u7eaa\u516c\u53f8",a.agency||"-"],["\u4ee3\u8868\u4f5c",a.masterpieces||"-"]
      ];
      for (var i = 0; i < info.length; i++) {
        h += '<div class="info-item"><div class="info-label">' + info[i][0] + '</div><div class="info-val">' + (info[i][1]||'-') + '</div></div>';
      }
      h += '</div>';
      h += '<div style="margin-top:18px"><h4 style="font-size:14px;margin-bottom:10px">\u98ce\u9669\u8be6\u60c5</h4><div id="risk-det"><div class="loading"><div class="spinner"></div></div></div></div>';
      openModal("\u827a\u4eba\u8be6\u60c5", h);

      safeApi("GET", "/risk/explain/" + id)
        .then(function (rr) {
          var rd = $("risk-det");
          if (!rd) return;
          if (rr.ok && rr.data && rr.data.dimension_scores && rr.data.dimension_scores.length) {
            var rh = '<table style="margin-top:8px;width:100%"><tr><th>\u7ef4\u5ea6</th><th>\u5206\u6570</th><th>\u8bf4\u660e</th></tr>';
            for (var k = 0; k < rr.data.dimension_scores.length; k++) {
              var ds = rr.data.dimension_scores[k];
              rh += '<tr><td>' + ds.dimension + '</td><td><strong>' + ds.score + '</strong></td><td>' + (ds.explanation||'-') + '</td></tr>';
            }
            rh += '</table>';
            rd.innerHTML = rh;
          } else {
            rd.innerHTML = '<p style="color:#94a3b8;padding:10px">\u6682\u65e0\u98ce\u9669\u6570\u636e</p>';
          }
        });
    })
    .catch(function () { showToast("\u827a\u4eba\u8be6\u60c5\u52a0\u8f7d\u5931\u8d25", "err"); });
}
window.__viewArtist = viewArtist;

/* ---- EVENTS ---- */
function buildEventsHTML() {
  return '' +
    '<div class="toolbar">' +
    '<select id="event-fl"><option value="">\u6240\u6709\u7ea7\u522b</option>' +
    '<option value="high">S/A \u9ad8\u98ce\u9669</option>' +
    '<option value="medium">B \u4e2d\u98ce\u9669</option>' +
    '<option value="low">C \u4f4e\u98ce\u9669</option></select>' +
    '<button class="btn btn-primary" id="event-filter-btn">\u7B5B\u9009</button>' +
    '</div><div id="event-tb"><div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d...</p></div></div>';
}

function bindEventControls() {
  var eb = $("event-filter-btn");
  if (eb) eb.addEventListener("click", loadEvents);
}

function loadEvents() {
  var fl = ($("event-fl") ? $("event-fl").value : "");
  var qs = fl ? "?risk_filter=" + fl : "";
  var tb = $("event-tb");
  if (!tb) return;
  tb.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d...</p></div>';

  safeApi("GET", "/admin/events" + qs)
    .then(function (result) {
      if (!tb) tb = $("event-tb");
      if (!tb) return;
      if (!result.ok || !result.data) {
        tb.innerHTML = renderErrorCard(null, result.error ? result.error.message : "\u52a0\u8f7d\u5931\u8d25");
        return;
      }
      var items = result.data.items || result.data || [];
      if (!Array.isArray(items)) items = [items];
      if (!items.length) {
        tb.innerHTML = '<div class="empty-state"><p>\u6682\u65e0\u98ce\u9669\u4e8b\u4ef6</p></div>';
        return;
      }
      var h = '<table><tr><th>ID</th><th>\u827a\u4eba</th><th>\u4e8b\u4ef6\u7c7b\u578b</th><th>\u7ea7\u522b</th><th>\u72b6\u6001</th><th>\u65f6\u95f4</th></tr>';
      for (var i = 0; i < items.length; i++) {
        var e = items[i];
        var rl = e.risk_level || '';
        var rlMap = {high:'s',S:'s',A:'a',medium:'b',B:'b',low:'c',C:'c'};
        var rc = rlMap[rl] || 'c';
        h += '<tr><td>#' + e.id + '</td>';
        h += '<td><strong>' + (e.artist_name||"-") + '</strong></td>';
        h += '<td>' + (e.event_type||"-") + '</td>';
        h += '<td><span class="badge badge-' + rc + '">' + (rl||"?").toUpperCase() + '</span></td>';
        h += '<td>' + (e.status||"-") + '</td>';
        h += '<td style="color:#94a3b8;font-size:12px">' + (e.event_date||"-") + '</td></tr>';
      }
      h += '</table>';
      tb.innerHTML = h;
    });
}
window.__loadEvents = loadEvents;

/* ---- COMMERCIAL ---- */
function buildCommercialHTML() {
  return '' +
    '<div class="section-header"><h3 class="section-title">\u5546\u4e1a\u4ef7\u503c</h3></div>' +
    '<div class="form-card" style="max-width:680px">' +
    '<p style="color:#64748b;line-height:1.8;font-size:14px">\u827a\u4eba\u5546\u4e1a\u4ef7\u503c\u6570\u636e\u53ef\u5728 <strong>\u827a\u4eba\u8be6\u60c5</strong> \u9875\u67e5\u770b\u3002' +
    '\u5305\u62ec\u7efc\u5408\u8bc4\u5206\u3001\u70ed\u5ea6\u7ea7\u522b\u3001\u4ee3\u8a00\u6218\u62a5\u7b49\u3002</p>' +
    '<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn btn-primary" onclick="if(window.navigate)navigate(\'artists\')">去艺人管理 &rarr;</button>' +
    '<button class="btn btn-primary" onclick="window.open(\'https://yiwoyiye89-lang.github.io/yiancha-mvp/\',\'_blank\')">打开前端首页</button>' +
    '</div></div>';
}

/* ---- REPORTS ---- */
function buildReportsHTML() {
  return '' +
    '<div class="form-card" style="max-width:560px">' +
    '<h3 style="margin-bottom:20px;font-size:17px">\u62a5\u544a\u5bfc\u51fa</h3>' +
    '<div class="form-group"><label>\u827a\u4eba ID</label>' +
    '<input id="rp-id" placeholder="\u8f93\u5165\u827a\u4eba ID"></div>' +
    '<div class="form-group"><label>\u5bfc\u51fa\u683c\u5f0f</label>' +
    '<select id="rp-fmt">' +
    '<option value="word">Word (.docx)</option>' +
    '<option value="ppt">PPT (.pptx)</option>' +
    '<option value="pdf">PDF</option>' +
    '<option value="json">JSON (\u539f\u59cb\u6570\u636e)</option>' +
    '</select></div>' +
    '<button class="btn btn-primary" id="gen-rp-btn" style="width:100%;padding:12px;margin-top:8px">\u751f\u6210\u62a5\u544a</button>' +
    '<div id="rp-err" class="err" style="margin-top:12px"></div>' +
    '</div>';
}

function bindReportControls() {
  var gb = $("gen-rp-btn");
  if (gb) gb.addEventListener("click", genReport);
}

function genReport() {
  var id = ($("rp-id") ? $("rp-id").value : "").trim();
  var fmt = ($("rp-fmt") ? $("rp-fmt").value : "word");
  var errEl = $("rp-err");
  if (errEl) errEl.textContent = "";
  if (!id) { if (errEl) errEl.textContent = "\u8bf7\u8f93\u5165\u827a\u4eba ID"; return; }

  safeApi("POST", "/admin/reports/generate", { artist_id: Number(id), format: fmt })
    .then(function (result) {
      if (result.ok && result.data) {
        var d = result.data;
        if (d.download_url || d.data) {
          if (fmt === "json") {
            openModal("\u62a5\u544a(JSON)", '<pre style="background:#f8fafc;padding:16px;border-radius:8px;font-size:12px;max-height:480px;overflow:auto;white-space:pre-wrap">' + JSON.stringify(d.data || d, null, 2) + '</pre>');
          } else {
            showToast("\u62a5\u544a\u5df2\u751f\u6210...", "ok");
            if (d.download_url) window.open(d.download_url, "_blank");
          }
        } else {
          if (errEl) errEl.textContent = d.detail || "\u751f\u6210\u5931\u8d25";
        }
      } else {
        if (errEl) errEl.textContent = (result.error && result.error.message) || "\u8bf7\u6c42\u5931\u8d25";
      }
    });
}
window.__genReport = genReport;

/* ---- MONITOR ---- */
function buildMonitorHTML() {
  return '' +
    '<div class="section-header"><h3 class="section-title">\u76d1\u63a7\u544a\u8b66</h3></div>' +
    '<div id="mon-tb"><div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d...</p></div></div>';
}

function loadMonitorData() {
  safeApi("GET", "/monitor/alerts/latest?limit=30")
    .then(function (result) {
      var tb = $("mon-tb");
      if (!tb) return;
      if (!result.ok || !result.data) {
        tb.innerHTML = renderErrorCard(null, result.error ? result.error.message : "\u52a0\u8f7d\u5931\u8d25");
        return;
      }
      var items = result.data.alerts || result.data || [];
      if (!Array.isArray(items)) items = [items];
      if (!items.length) {
        tb.innerHTML = '<div class="empty-state"><p>\u6682\u65e0\u544a\u8b66\u4fe1\u606f</p></div>';
        return;
      }
      var h = '<table><tr><th>ID</th><th>\u827a\u4eba</th><th>\u7c7b\u578b</th><th>\u4e25\u91cd\u7a0b\u5ea6</th><th>\u72b6\u6001</th><th>\u65f6\u95f4</th></tr>';
      for (var i = 0; i < items.length; i++) {
        var a = items[i];
        var sc = a.severity === 'high' ? 'c' : 'b';
        h += '<tr><td>#' + a.id + '</td>';
        h += '<td><strong>' + (a.artist_name||"-") + '</strong></td>';
        h += '<td>' + (a.alert_type||"-") + '</td>';
        h += '<td><span class="badge badge-' + sc + '">' + (a.severity||'-').toUpperCase() + '</span></td>';
        h += '<td>' + (a.status||"-") + '</td>';
        h += '<td style="color:#94a3b8;font-size:12px">' + (a.created_at||"-") + '</td></tr>';
      }
      h += '</table>';
      tb.innerHTML = h;
    });
}

/* ---- USERS ---- */
function buildUsersHTML() {
  return '' +
    '<div class="section-header"><h3 class="section-title">\u7528\u6237\u7ba1\u7406</h3></div>' +
    '<div id="user-tb"><div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d...</p></div></div>';
}

function loadUsersData() {
  safeApi("GET", "/admin/users")
    .then(function (result) {
      var tb = $("user-tb");
      if (!tb) return;
      if (!result.ok || !result.data) {
        tb.innerHTML = renderErrorCard(null, result.error ? result.error.message : "\u52a0\u8f7d\u5931\u8d25");
        return;
      }
      var users = result.data.users || result.data || [];
      if (!Array.isArray(users)) users = [users];
      if (!users.length) {
        tb.innerHTML = '<div class="empty-state"><p>\u6682\u65e0\u7528\u6237</p></div>';
        return;
      }
      var h = '<table><tr><th>ID</th><th>\u7528\u6237\u540d</th><th>\u89d2\u8272</th><th>\u72b6\u6001</th><th>\u64cd\u4f5c</th></tr>';
      for (var i = 0; i < users.length; i++) {
        var u = users[i];
        h += '<tr><td>#' + u.id + '</td>';
        h += '<td><strong>' + u.username + '</strong></td>';
        h += '<td><span class="badge badge-s">' + u.role + '</span></td>';
        h += '<td>' + (u.is_active ? '<span style="color:#22c55e;font-weight:600">激活</span>' : '<span style="color:#94a3b8">停用</span>') + '</td>';
        h += '<td><button class="btn btn-sm ' + (u.is_active ? "btn-warn" : "btn-primary") + '" data-uid="' + u.id + '" data-active="' + (!u.is_active) + '">' + (u.is_active ? "停用" : "激活") + '</button></td></tr>';
      }
      h += '</table>';
      tb.innerHTML = h;

      var ubtns = tb.querySelectorAll("[data-uid]");
      for (var j = 0; j < ubtns.length; j++) {
        (function(btn){
          btn.addEventListener("click", function () {
            toggleUser(+btn.dataset.uid, btn.dataset.active === "true");
          });
        })(ubtns[j]);
      }
    });
}

function toggleUser(id, active) {
  safeApi("PATCH", "/admin/users/" + id, { is_active: active })
    .then(function (result) {
      if (result.ok) { showToast(active ? "已激活" : "已停用", "ok"); loadUsersData(); }
      else { showToast("操作失败", "err"); }
    });
}
window.__toggleUser = toggleUser;

/* ===== ERROR HELPER ===== */
function renderErrorCard(title, msg) {
  var is404 = msg && (msg.indexOf("404") > -1 || msg.indexOf("Not Found") > -1);
  var isTimeout = msg && (msg.indexOf("\u8d85\u65f6") > -1 || msg.indexOf("abort") > -1);
  var hint = "";
  if (is404) hint = '<p style="color:#94a3b8;font-size:13px;margin-top:8px">该功能端点尚未上线，后端开发中</p>';
  else if (isTimeout) hint = '<p style="color:#94a3b8;font-size:13px;margin-top:8px">后端响应较慢，请稍后重试</p>';

  return '<div class="form-card" style="text-align:center;padding:48px 24px;max-width:520px;margin:40px auto">' +
    '<div style="font-size:48px;margin-bottom:16px">:(</div>' +
    (title ? '<h3 style="margin-bottom:8px;color:#1e293b">' + title + '</h3>' : '') +
    '<p style="color:#64748b;font-size:14px;line-height:1.6">' + (msg || "\u52a0\u8f7d\u5931\u8d25") + '</p>' +
    hint +
    '<div style="margin-top:24px;display:flex;gap:10px;justify-content:center">' +
    '<button class="btn btn-primary" onclick="location.reload()">重试</button>' +
    '</div></div>';
}

/* ===== INIT ===== */
var lob = $("logout-btn");
if (lob) lob.addEventListener("click", function () { logout(); });

window.addEventListener("hashchange", function () {
  if (staff) {
    var hash = location.hash.replace("#/", "");
    if (hash) navigate(hash);
  }
});

/* Token validation flow */
if (token && staff) {
  safeApi("GET", "/admin/auth/me")
    .then(function (result) {
      if (result.ok && result.data) {
        if (result.data.staff) { staff = result.data.staff; localStorage.setItem(LS_STAFF, JSON.stringify(staff)); }
        enterApp();
      } else {
        logout("\u767b\u5f55\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");
      }
    })
    .catch(function () { logout("\u8eab\u4efd\u9a8c\u8bc1\u5931\u8d25"); });
} else {
  var av2 = $("app-view");
  var lv2 = $("login-view");
  if (av2) av2.hidden = true;
  if (lv2) lv2.style.display = "";
  drawBg();
}

})();
