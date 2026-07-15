/* ============================================================
   YC Console V14 — 全面对齐后端路由 + 真实数据渲染

   API 路由映射（已验证后端 main.py 注册）:
   Dashboard  → GET /admin/dashboard
   艺人管理   → GET /artists (公开API)
   风险事件   → GET /events (公开API)
   用户管理   → GET /admin/users (admin CRUD)
   员工管理   → GET /admin/staff
   商务线索   → GET /admin/leads
   入驻审核   → GET /admin/intakes
   邀请码     → GET /admin/invites + POST /admin/invites
   撮合配置   → GET /admin/pricing/config + /requests
   认证       → POST/GET /admin/auth/*
   ============================================================ */
(function () {
"use strict";

/* ===== CONFIG ===== */
var API = "https://yiancha-backend.onrender.com/api/v1";
var LS_TOKEN = "yc_token";
var LS_STAFF = "yc_staff";
var API_TIMEOUT = 15000; /* Render 免费版冷启动可能较慢，放宽到15s */
var PAGE_SIZE = 20;

/* ===== STATE ===== */
var token = localStorage.getItem(LS_TOKEN);
var staff = null;
try { staff = JSON.parse(localStorage.getItem(LS_STAFF) || "null"); } catch (e) { staff = null; }
var currentPage = "dashboard";

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
        if (err.name === "AbortError") throw new Error("请求超时（服务器响应较慢）");
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

/* ===== CANVAS BG (kills autofill white block) ===== */
var cv = $("bg");
function drawBg() {
  if (!cv) return;
  cv.width = window.innerWidth;
  cv.height = window.innerHeight;
  var ctx = cv.getContext("2d");
  var g = ctx.createLinearGradient(0, 0, cv.width, cv.height);
  g.addColorStop(0, "#0f172a");
  g.addColorStop(0.5, "#1e1b4b");
  g.addColorStop(1, "#0f172a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cv.width, cv.height);
}
drawBg();
window.addEventListener("resize", drawBg);

/* ===== LOGIN ===== */
var uEl = $("u");
var pEl = $("p");
var lb = $("lb");
var le = $("le");
var pwdRaw = "";

if (pEl) pEl.addEventListener("focus", function () {
  if (!pEl.dataset.init) { pEl.dataset.init = "1"; pwdRaw = pEl.textContent; renderPwd(); }
}, true);
if (pEl) pEl.addEventListener("input", function () {
  var d = pEl.textContent;
  if (d.length < pwdRaw.length) pwdRaw = pwdRaw.substring(0, d.length);
  else if (d.length > pwdRaw.length) pwdRaw += d.substring(pwdRaw.length);
  renderPwd();
});
if (pEl) pEl.addEventListener("paste", function (e) {
  e.preventDefault();
  var txt = (e.clipboardData || window.clipboardData).getData("text");
  if (txt) { pwdRaw += txt; renderPwd(); }
});

function renderPwd() {
  if (!pEl) return;
  var pos = window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).startOffset : pwdRaw.length;
  pEl.textContent = "\u25CF".repeat(pwdRaw.length);
  var range = document.createRange();
  var sel = window.getSelection();
  range.setStart(pEl.childNodes[0], Math.min(pos, pwdRaw.length));
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

async function doLogin() {
  if (!lb) return;
  lb.disabled = true;
  lb.textContent = "登录中...";
  if (le) le.textContent = "";
  try {
    var u = (uEl ? uEl.textContent.trim() : "");
    var p = pwdRaw;
    if (!u || !p) { if (le) le.textContent = "\u8bf7\u586b\u5199\u7528\u6237\u540d\u548c\u5bc6\u7801"; lb.disabled = false; lb.textContent = "\u767b \u5f55"; return; }

    var res = await fetch(API + "/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.detail || ("HTTP " + res.status));

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

/* ===== NAVIGATION ===== */
function navigate(page) {
  currentPage = page;

  // Update sidebar active state
  document.querySelectorAll(".nav-item").forEach(function (el) {
    el.classList.toggle("active", el.dataset.page === page);
  });

  // Update title bar
  var titles = {
    dashboard: "\u6570\u636e\u770b\u677f", artists: "\u827a\u4eba\u7ba1\u7406",
    events: "\u98ce\u9669\u4e8b\u4ef6", users: "\u7528\u6237\u7ba1\u7406",
    staff: "\u5458\u5de5\u7ba1\u7406", leads: "\u5546\u52a1\u7ebf\u7d22",
    intakes: "\u5165\u9a7b\u5ba1\u6838", invites: "\u9080\u8bf7\u7801",
    pricing: "\u64ae\u5408\u914d\u7f6e"
  };
  var t = $("topbar-title"); if (t) t.textContent = titles[page] || page;

  // Show/hide pages
  document.querySelectorAll(".page").forEach(function (el) { el.hidden = true; });
  var pg = $("page-" + page); if (pg) pg.hidden = false;

  // Render page content
  var renders = {
    dashboard: renderDashboard, artists: renderArtists,
    events: renderEvents, users: renderUsers,
    staff: renderStaff, leads: renderLeads,
    intakes: renderIntakes, invites: renderInvites,
    pricing: renderPricing
  };
  if (renders[page]) renders[page]();

  // Close mobile sidebar
  var sb = $("sidebar"); if (sb) sb.classList.remove("open");
}

// Sidebar click delegation
var nav = $("sidebar-nav");
if (nav) nav.addEventListener("click", function (e) {
  var item = e.target.closest(".nav-item");
  if (item && item.dataset.page) { e.preventDefault(); navigate(item.dataset.page); }
});

/* ===== ENTER APP ===== */
async function enterApp() {
  try {
    var av = $("app-view"), lv = $("login-view");
    /* TRIPLE-DEFENSE: hide login view */
    if (lv) {
      lv.classList.add("login-hidden");
      lv.style.display = "none";
      lv.hidden = true;
    }
    /* Show app view */
    if (av) av.hidden = false;
    if (cv) { cv.style.display = "none"; }

    /* Show staff info */
    if (staff) {
      var sn = $("staff-name"); if (sn) sn.textContent = staff.real_name || staff.username;
      var sr = $("staff-role"); if (sr) sr.textContent = staff.role_label || staff.role;
      var wn = $("welcome-name"); if (wn) wn.textContent = staff.real_name || staff.username;
    }

    // Welcome time
    var wt = $("welcome-time");
    if (wt) wt.textContent = new Date().toLocaleString("zh-CN", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

    navigate(currentPage || "dashboard");
  } catch (err) {
    console.error("enterApp error:", err);
  }
}

function logout(msg) {
  token = null;
  staff = null;
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_STAFF);
  var av = $("app-view"), lv = $("login-view");
  if (av) av.hidden = true;
  /* TRIPLE-DEFENSE: fully restore login view */
  if (lv) {
    lv.classList.remove("login-hidden");
    lv.style.display = "";
    lv.hidden = false;
    lv.style.visibility = "";
    lv.style.opacity = "";
    lv.style.pointerEvents = "";
  }
  if (uEl) uEl.textContent = "";
  if (pEl) pEl.textContent = "";
  pwdRaw = "";
  if (le) le.textContent = msg || "";
  if (lb) { lb.disabled = false; lb.textContent = "\u767b \u5f55"; }
  if (cv) { cv.style.display = ""; drawBg(); }
}
var lob = $("logout-btn");
if (lob) lob.addEventListener("click", function () { logout(); });

/* ===== HAMBURGER ===== */
var ham = $("hamburger");
var sb = $("sidebar");
if (ham && sb) ham.addEventListener("click", function () { sb.classList.toggle("open"); });

/* ===== TOAST ===== */
function toast(msg) {
  var el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  setTimeout(function () { el.hidden = true; }, 3000);
}

/* ===== MODAL ===== */
function showModal(title, bodyHtml, footerHtml) {
  var layer = $("modal-layer");
  var mt = $("modal-title");
  var mb = $("modal-body");
  var mf = $("modal-foot");
  if (!layer) return;
  if (mt) mt.textContent = title;
  if (mb) mb.innerHTML = bodyHtml || "";
  if (mf) mf.innerHTML = footerHtml || '<button type="button" onclick="document.getElementById(\'modal-layer\').hidden=true">关闭</button>';
  layer.hidden = false;
  layer.style.display = "";
}

/* ===== RENDER: DASHBOARD ===== */
function renderDashboard() {
  setStatValue("st-users", "..."); setStatNote("st-users", "\u6b63\u5728\u52a0\u8f7d...");
  setStatValue("st-leads", "..."); setStatNote("st-leads", "\u6b63\u5728\u52a0\u8f7d...");
  setStatValue("st-intakes", "..."); setStatNote("st-intakes", "\u6b63\u5728\u52a0\u8f7d...");
  setStatValue("st-pricing", "..."); setStatNote("st-pricing", "\u6b63\u5728\u52a0\u8f7d...");

  safeApi("GET", "/admin/dashboard").then(function (res) {
    if (!res.ok) {
      showDashError(res.error || "\u52a0\u8f7d\u5931\u8d25");
      return;
    }
    var d = res.data;
    var u = d.users || {};
    var ld = d.leads || {};
    var it = d.intakes || {};
    var inv = d.invites || {};
    var pr = d.pricing || {};

    setStatValue("st-users", u.total || 0);
    setStatNote("st-users", "\u4eca\u65e5\u65b0\u589e " + (u.today_new || 0));

    setStatValue("st-leads", ld.total || 0);
    setStatNote("st-leads", "\u672a\u5206\u914d " + (ld.unassigned || 0));

    setStatValue("st-intakes", it.total || 0);
    setStatNote("st-intakes", "\u5f85\u5ba1\u6838 " + ((it.dist || {})["pending_review"] || 0));

    setStatValue("st-pricing", pr.total || 0);
    setStatNote("st-pricing", "\u5f00\u653e\u4e2d " + ((pr.dist || {})["open"] || 0));

    // Today detail grid
    var td = $("dash-today");
    if (td) {
      td.innerHTML =
        "<div class='info-row'><span>\u6ce8\u518c\u7528\u6237</span><strong>" + (u.total || 0) + "</strong></div>" +
        "<div class='info-row'><span>\u4eca\u65e5\u65b0\u589e</span><strong style='color:#22c55e'>+" + (u.today_new || 0) + "</strong></div>" +
        "<div class='info-row'><span>\u5df2\u8ba4\u8bc1</span><strong>" + (u.verified || 0) + "</strong></div>" +
        "<div class='info-row'><span>\u5546\u52a1\u7ebf\u7d22</span><strong>" + (ld.total || 0) + "</strong></div>" +
        "<div class='info-row'><span>\u5165\u9a7b\u7533\u8bf7</span><strong>" + (it.total || 0) + "</strong></div>";
    }

    // Distribution grid
    var dd = $("dash-dist");
    if (dd) {
      var pd = u.plan_dist || {};
      var ldist = ld.dist || {};
      dd.innerHTML =
        "<h4 style='margin-bottom:8px'>\u7528\u6237\u5957\u9910\u5206\u5e03</h4>" +
        "<div class='tag-group'>" + tagItem("\u514d\u8d39\u7248", pd.free || 0) + tagItem("\u4e2a\u4eba\u7248", pd.personal || 0) + tagItem("\u4e13\u4e1a\u7248", pd.professional || 0) + tagItem("\u4f01\u4e1a\u7248", pd.enterprise || 0) + "</div>" +
        "<h4 style='margin:12px 0 8px'>\u7ebf\u7d22\u72b6\u6001</h4>" +
        "<div class='tag-group'>" + tagItem("\u5f85\u5904\u7406", ldist.pending || 0) + tagItem("\u5df2\u8054\u7cfb", ldist.contacted || 0) + tagItem("\u5df2\u8f6c\u5316", ldist.converted || 0) + tagItem("\u5df2\u62d2\u7edd", ldist.rejected || 0) + "</div>";
    }
  });

  function showDashError(msg) {
    ["users","leads","intakes","pricing"].forEach(function(k) {
      setStatValue("st-" + k, "--");
      setStatNote("nt-" + k, msg);
    });
    var td = $("dash-today"); if (td) td.innerHTML = "<p style='color:#e74c3c'>" + msg + "</p>";
    var dd = $("dash-dist"); if (dd) dd.innerHTML = "<p style='color:#e74c3c'>" + msg + "</p>";
  }
}

function tagItem(label, val) {
  return "<span class='tag'>" + label + " <strong>" + val + "</strong></span> ";
}

function setStatValue(id, val) {
  var el = $(id); if (el) el.textContent = String(val);
}
function setStatNote(id, note) {
  var el = $(id); if (el) el.textContent = note;
}

/* ===== RENDER: ARTISTS (public API) ===== */
var _artistPage = 1;
function renderArtists(p) {
  if (p) _artistPage = p;
  var tbody = $("artist-tbody");
  if (tbody) tbody.innerHTML = "<tr><td colspan='6' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  var q = ($("artist-search") ? $("artist-search").value.trim() : "");
  var lvl = ($("artist-level") ? $("artist-level").value : "");
  var params = "?limit=" + PAGE_SIZE + "&offset=" + ((_artistPage - 1) * PAGE_SIZE);
  if (q) params += "&name=" + encodeURIComponent(q);
  if (lvl) params += "&heat_level=" + encodeURIComponent(lvl);

  safeApi("GET", "/artists" + params).then(function (res) {
    if (!res.ok) { if (tbody) tbody.innerHTML = errorRow(res.error || "\u52a0\u8f7d\u5931\u8d25", 6); return; }
    var items = res.data.items || res.data || [];
    if (!Array.isArray(items)) items = [];
    renderTable(tbody, items, function (row) {
      return "<td>" + (row.id || "-") + "</td>" +
             "<td><strong>" + esc(row.name || "-") + "</strong></td>" +
             "<td><span class='badge badge-" + (row.heat_level || "C") + "'>" + (row.heat_level || "-") + "</span></td>" +
             "<td>" + (row.risk_score != null ? row.risk_score : "-") + "</td>" +
             "<td>" + esc(row.agency || "-") + "</td>" +
             "<td class='cell-truncate' title='" + escAttr(row.masterpieces || "") + "'>" + esc(truncate(row.masterpieces || "-", 20)) + "</td>";
    }, 6, "\u6682\u65e0\u827a\u4eba\u6570\u636e");

    renderPagination("artist-pagination", _artistPage, res.data.total || items.length, PAGE_SIZE, renderArtists);
  });
}

// Artist search button
var asb = $("artist-search-btn");
if (asb) asb.addEventListener("click", function () { _artistPage = 1; renderArtists(); });
var ase = $("artist-search");
if (ase) ase.addEventListener("keydown", function (e) { if (e.key === "Enter") { _artistPage = 1; renderArtists(); } });
var asl = $("artist-level");
if (asl) asl.addEventListener("change", function () { _artistPage = 1; renderArtists(); });

/* ===== RENDER: EVENTS (public API) ===== */
var _eventPage = 1;
function renderEvents(p) {
  if (p) _eventPage = p;
  var tbody = $("event-tbody");
  if (tbody) tbody.innerHTML = "<tr><td colspan='6' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  safeApi("GET", "/events?limit=" + PAGE_SIZE + "&offset=" + ((_eventPage - 1) * PAGE_SIZE)).then(function (res) {
    if (!res.ok) { if (tbody) tbody.innerHTML = errorRow(res.error || "\u52a0\u8f7d\u5931\u8d25", 6); return; }
    var items = res.data.items || res.data || [];
    if (!Array.isArray(items)) items = [];

    renderTable(tbody, items, function (row) {
      return "<td>" + (row.id || "-") + "</td>" +
             "<td><strong>" + esc(row.artist_name || "-") + "</strong></td>" +
             "<td>" + esc(row.event_type || row.category || "-") + "</td>" +
             "<td><span class='badge badge-" + (row.risk_level || row.heat_level || "C") + "'>" + (row.risk_level || row.heat_level || "-") + "</span></td>" +
             "<td>" + (row.event_date ? row.event_date.substring(0,10) : "-") + "</td>" +
             "<td class='cell-truncate' title='" + escAttr(row.summary || row.description || "") + "'>" + esc(truncate(row.summary || row.description || "-", 30)) + "</td>";
    }, 6, "\u6682\u65e0\u98ce\u9669\u4e8b\u4ef6");

    renderPagination("event-pagination", _eventPage, res.data.total || items.length, PAGE_SIZE, renderEvents);
  });
}

/* ===== RENDER: USERS (admin API) ===== */
var _userPage = 1;
function renderUsers(p) {
  if (p) _userPage = p;
  var tbody = $("user-tbody");
  if (tbody) tbody.innerHTML = "<tr><td colspan='8' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  var q = ($("user-search") ? $("user-search").value.trim() : "");
  var ut = ($("user-type-filter") ? $("user-type-filter").value : "");
  var us = ($("user-status-filter") ? $("user-status-filter").value : "");

  var params = "?page=" + _userPage + "&page_size=" + PAGE_SIZE;
  if (q) params += "&q=" + encodeURIComponent(q);
  if (ut) params += "&user_type=" + ut;
  if (us) params += "&is_active=" + us;

  safeApi("GET", "/admin/users" + params).then(function (res) {
    if (!res.ok) {
      if (tbody) tbody.innerHTML = errorRow((res.status === 401 || res.status === 403) ? "\u6743\u9650\u4e0d\u8db3\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55" : (res.error || "\u52a0\u8f7d\u5931\u8d25"), 8);
      return;
    }
    var d = res.data;
    var items = d.items || [];
    if (!Array.isArray(items)) items = [];

    renderTable(tbody, items, function (row) {
      return "<td>" + (row.id || "-") + "</td>" +
             "<td><strong>" + esc(row.nickname || row.real_name || "-") + "</strong></td>" +
             "<td>" + maskPhone(row.phone) + "</td>" +
             "<td class='cell-truncate'>" + esc(truncate(row.company || "-", 12)) + "</td>" +
             "<td><span class='badge badge-blue'>" + (row.user_type || "-") + "</span></td>" +
             "<td>" + (row.verified ? "\u2705" : "\u274C") + (row.verify_type ? " " + row.verify_type : "") + "</td>" +
             "<td><span class='badge " + (row.is_active !== false ? "badge-green" : "badge-red") + "'>" + (row.is_active !== false ? "\u542f\u7528" : "\u505c\u7528") + "</span></td>" +
             "<td>" + (row.created_at ? fmtDate(row.created_at) : "-") + "</td>";
    }, 8, "\u6682\u65e0\u7528\u6237\u6570\u636e");

    renderPagination("user-pagination", _userPage, d.total || 0, PAGE_SIZE, renderUsers);
  });
}

// User filters
var usb = $("user-search-btn");
if (usb) usb.addEventListener("click", function () { _userPage = 1; renderUsers(); });
var use = $("user-search");
if (use) use.addEventListener("keydown", function (e) { if (e.key === "Enter") { _userPage = 1; renderUsers(); } });
["user-type-filter", "user-status-filter"].forEach(function (fid) {
  var el = $(fid);
  if (el) el.addEventListener("change", function () { _userPage = 1; renderUsers(); });
});

/* ===== RENDER: STAFF ===== */
function renderStaff() {
  var tbody = $("staff-tbody");
  if (tbody) tbody.innerHTML = "<tr><td colspan='6' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  safeApi("GET", "/admin/staff").then(function (res) {
    if (!res.ok) { if (tbody) tbody.innerHTML = errorRow(res.error || "\u52a0\u8f7d\u5931\u8d25", 6); return; }
    var items = res.data.items || res.data || [];
    if (!Array.isArray(items)) items = [];

    renderTable(tbody, items, function (row) {
      return "<td>" + (row.id || "-") + "</td>" +
             "<td><strong>" + esc(row.username || "-") + "</strong></td>" +
             "<td>" + esc(row.real_name || "-") + "</td>" +
             "<td><span class='badge badge-purple'>" + (row.role || "-") + "</span></td>" +
             "<td><span class='badge " + (row.is_active !== false ? "badge-green" : "badge-red") + "'>" + (row.is_active !== false ? "\u542f\u7528" : "\u505c\u7528") + "</span></td>" +
             "<td>" + (row.last_login_at ? fmtDate(row.last_login_at) : "-") + "</td>";
    }, 6, "\u6682\u65e0\u5458\u5de5\u6570\u636e");
  });
}
var ssb = $("staff-search-btn");
if (ssb) ssb.addEventListener("click", renderStaff);
var sse = $("staff-search");
if (sse) sse.addEventListener("keydown", function (e) { if (e.key === "Enter") renderStaff(); });

/* ===== RENDER: LEADS ===== */
var _leadPage = 1;
function renderLeads(p) {
  if (p) _leadPage = p;
  var tbody = $("lead-tbody");
  if (tbody) tbody.innerHTML = "<tr><td colspan='7' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  safeApi("GET", "/admin/leads?page=" + _leadPage + "&page_size=" + PAGE_SIZE).then(function (res) {
    if (!res.ok) { if (tbody) tbody.innerHTML = errorRow(res.error || "\u52a0\u8f7d\u5931\u8d25", 7); return; }
    var d = res.data;
    var items = d.items || [];
    if (!Array.isArray(items)) items = [];

    renderTable(tbody, items, function (row) {
      return "<td>" + (row.id || "-") + "</td>" +
             "<td><strong>" + esc(row.company_name || row.contact_person || "-") + "</strong></td>" +
             "<td>" + esc(row.contact_phone || row.email || "-") + "</td>" +
             "<td class='cell-truncate' title='" + escAttr(row.requirements || "") + "'>" + esc(truncate(row.requirements || "-", 25)) + "</td>" +
             "<td><span class='badge status-" + (row.status || "pending") + "'>" + statusLabel(row.status) + "</span></td>" +
             "<td>" + esc(row.assignee_name || "-") + "</td>" +
             "<td>" + (row.created_at ? fmtDate(row.created_at) : "-") + "</td>";
    }, 7, "\u6682\u65e0\u5546\u52a1\u7ebf\u7d22");

    renderPagination("lead-pagination", _leadPage, d.total || 0, PAGE_SIZE, renderLeads);
  });
}
var lsb = $("lead-search-btn");
if (lsb) lsb.addEventListener("click", function () { _leadPage = 1; renderLeads(); });
["lead-status-filter"].forEach(function (fid) {
  var el = $(fid);
  if (el) el.addEventListener("change", function () { _leadPage = 1; renderLeads(); });
});

/* ===== RENDER: INTAKES ===== */
var _intakePage = 1;
function renderIntakes(p) {
  if (p) _intakePage = p;
  var tbody = $("intake-tbody");
  if (tbody) tbody.innerHTML = "<tr><td colspan='6' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  safeApi("GET", "/admin/intakes?page=" + _intakePage + "&page_size=" + PAGE_SIZE).then(function (res) {
    if (!res.ok) { if (tbody) tbody.innerHTML = errorRow(res.error || "\u52a0\u8f7d\u5931\u8d25", 6); return; }
    var d = res.data;
    var items = d.items || [];
    if (!Array.isArray(items)) items = [];

    renderTable(tbody, items, function (row) {
      return "<td>" + (row.id || "-") + "</td>" +
             "<td><strong>" + esc(row.artist_name || "-") + "</strong></td>" +
             "<td>" + esc(row.applicant_name || "-") + "</td>" +
             "<td>" + esc(row.intake_type || "-") + "</td>" +
             "<td><span class='badge status-" + (row.status || "pending_review") + "'>" + intakeStatusLabel(row.status) + "</span></td>" +
             "<td>" + (row.created_at ? fmtDate(row.created_at) : "-") + "</td>";
    }, 6, "\u6682\u65e0\u5165\u9a7b\u7533\u8bf7");

    renderPagination("intake-pagination", _intakePage, d.total || 0, PAGE_SIZE, renderIntakes);
  });
}

/* ===== RENDER: INVITES ===== */
function renderInvites() {
  var tbody = $("invite-tbody");
  if (tbody) tbody.innerHTML = "<tr><td colspan='6' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  safeApi("GET", "/admin/invites").then(function (res) {
    if (!res.ok) { if (tbody) tbody.innerHTML = errorRow(res.error || "\u52a0\u8f7d\u5931\u8d25", 6); return; }
    var d = res.data;
    var items = d.items || d.invites || [];
    if (!Array.isArray(items)) items = [];

    // Update stats
    var stats = $("invite-stats");
    if (stats) stats.innerHTML = "<span>\u603b\u6570: <strong>" + items.length + "</strong></span><span>\u6700\u6548: <strong>" + (items.filter(function(i){return i.is_active;}).length) + "</strong></span>";

    renderTable(tbody, items, function (row) {
      var expired = row.valid_until && new Date(row.valid_until) < new Date();
      return "<td>" + (row.id || "-") + "</td>" +
             "<td><code style='font-size:13px'>" + esc(row.code || "-") + "</code></td>" +
             "<td>" + (row.used_count || 0) + "</td>" +
             "<td>" + (row.max_uses || "-") + "</td>" +
             "<td>" + (row.valid_until ? row.valid_until.substring(0,16) : "-") + "</td>" +
             "<td><span class='badge " + (expired ? "badge-red" : (row.is_active ? "badge-green" : "badge-grey")) + "'>" + (expired ? "\u5df2\u8fc7\u671f" : (row.is_active ? "\u6709\u6548" : "\u505c\u7528")) + "</span></td>";
    }, 6, "\u6682\u65e0\u9080\u8bf7\u7801");
  });
}
var igb = $("invite-gen-btn");
if (igb) igb.addEventListener("click", function () {
  showModal("\u751f\u6210\u9080\u8bf7\u7801", "<p>\u786e\u8ba4\u751f\u6210\u65b0\u9080\u8bf7\u7801\uff1f</p>",
    "<button type='button' onclick=\"genInvite()\" class='btn btn-primary btn-sm'>\u786e\u8ba4\u751f\u6210</button> <button type='button' onclick=\"document.getElementById('modal-layer').hidden=true\" class='btn btn-ghost btn-sm'>\u53d6\u6d88</button>");
});

window.genInvite = async function () {
  var count = prompt("\u8f93\u5165\u751f\u6210\u6570\u91cf:", "5");
  if (!count) return;
  var res = await safeApi("POST", "/admin/invites", { count: Number(count) || 5 });
  if (res.ok) { toast("\u9080\u8bf7\u7801\u751f\u6210\u6210\u529f"); renderInvites(); $("modal-layer").hidden = true; }
  else { toast("\u751f\u6210\u5931\u8d25: " + res.error); }
};

/* ===== RENDER: PRICING ===== */
function renderPricing() {
  var card = $("pricing-config-card");
  var tbody = $("pricing-tbody");
  if (card) card.innerHTML = "<p class='loading'>\u6b63\u5728\u52a0\u8f7d\u914d\u7f6e...</p>";
  if (tbody) tbody.innerHTML = "<tr><td colspan='6' class='loading-row'>\u6b63\u5728\u52a0\u8f7d...</td></tr>";

  safeApi("GET", "/admin/pricing/config").then(function (res) {
    if (card) {
      if (!res.ok) { card.innerHTML = "<p class='error-text'>" + (res.error || "\u52a0\u8f7d\u914d\u7f6e\u5931\u8d25") + "</p>"; return; }
      var cfg = res.data.config || res.data || {};
      card.innerHTML = buildConfigForm(cfg);
    }
  });

  safeApi("GET", "/admin/pricing/requests?page=1&page_size=15").then(function (res) {
    if (!res.ok) { if (tbody) tbody.innerHTML = errorRow(res.error, 6); return; }
    var d = res.data;
    var items = d.items || [];
    if (!Array.isArray(items)) items = [];

    renderTable(tbody, items, function (row) {
      return "<td>" + (row.id || "-") + "</td>" +
             "<td><strong>" + esc(row.brand_name || row.company || "-") + "</strong></td>" +
             "<td>" + (row.budget_min || "?") + " - " + (row.budget_max || "?") + "\u4e07</td>" +
             "<td>" + esc(row.industry || "-") + "</td>" +
             "<td><span class='badge status-" + (row.status || "open") + "'>" + (statusLabel(row.status) || row.status || "-") + "</span></td>" +
             "<td>" + (row.created_at ? fmtDate(row.created_at) : "-") + "</td>";
    }, 6, "\u6682\u65e0\u64ae\u5408\u8bf7\u6c42");
  });
}

function buildConfigForm(cfg) {
  var fields = "";
  var keys = Object.keys(cfg).sort();
  if (keys.length === 0) return "<p style='color:#888'>\u6682\u65e0\u914d\u7f6e\u9879\u3002</p>";

  keys.forEach(function (k) {
    var v = cfg[k];
    if (typeof v === "number") {
      fields += "<div class='form-row'><label>" + esc(k) + "</label><input type='number' value='" + v + "' step='0.01' data-key='" + escAttr(k) + "' /></div>";
    } else if (typeof v === "string") {
      fields += "<div class='form-row'><label>" + esc(k) + "</label><input type='text' value='" + escAttr(v) + "' data-key='" + escAttr(k) + "' /></div>";
    } else if (typeof v === "object" && v !== null) {
      fields += "<div class='form-row'><label><strong>" + esc(k) + "</strong></label><pre style='background:#f1f5f9;padding:8px;border-radius:6px;font-size:12px'>" + esc(JSON.stringify(v, null, 2)) + "</pre></div>";
    }
  });
  return "<form id='config-form' onsubmit='saveConfig(event)'>" + fields + "<div style='margin-top:16px'><button type='submit' class='btn btn-primary btn-sm'>\u4fdd\u5b58\u914d\u7f6e</button></div></form>";
}

window.saveConfig = async function (e) {
  e.preventDefault();
  var form = $("config-form");
  if (!form) return;
  var inputs = form.querySelectorAll("[data-key]");
  var cfg = {};
  inputs.forEach(function (input) { cfg[input.dataset.key] = input.type === "number" ? Number(input.value) : input.value; });
  var res = await safeApi("PUT", "/admin/pricing/config", config);
  if (res.ok) { toast("\u914d\u7f6e\u4fdd\u5b58\u6210\u529f"); }
  else { toast("\u4fdd\u5b58\u5931\u8d25: " + res.error); }
};

/* ===== TABLE HELPERS ===== */
function renderTable(tbody, items, rowRenderer, colCount, emptyMsg) {
  if (!tbody) return;
  if (!items.length) { tbody.innerHTML = "<tr><td colspan='" + colCount + "' class='empty-row'>" + (emptyMsg || "\u6682\u65e0\u6570\u636e") + "</td></tr>"; return; }
  tbody.innerHTML = items.map(function (item, i) { return "<tr>" + rowRenderer(item, i) + "</tr>"; }).join("");
}

function errorRow(msg, colSpan) {
  return "<tr><td colspan='" + (colSpan || 6) + "' class='error-row'>&#x26A0; " + esc(msg) + "</td></tr>";
}

function renderPagination(containerId, page, total, pageSize, fn) {
  var el = $(containerId);
  if (!el) return;
  var totalPages = Math.ceil(total / pageSize) || 1;
  if (totalPages <= 1) { el.innerHTML = ""; return; }

  var html = "<div class='pagination-inner'>";
  html += "<button class='btn btn-ghost btn-sm' " + (page <= 1 ? "disabled" : "") + " onclick='" + fn.name + "(" + (page - 1) + ")'>&laquo; \u4e0a\u9875</button>";
  html += "<span class='page-info'>" + page + " / " + totalPages + " (\u5171 " + total + " \u6761)</span>";
  html += "<button class='btn btn-ghost btn-sm' " + (page >= totalPages ? "disabled" : "") + " onclick='" + fn.name + "(" + (page + 1) + ")'>\u4e0b\u9875 &raquo;</button>";
  html += "</div>";
  el.innerHTML = html;
}

/* ===== STRING HELPERS ===== */
function esc(s) {
  if (s == null) return "";
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function escAttr(s) {
  if (s == null) return "";
  return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function truncate(s, maxLen) {
  s = String(s == null ? "" : s);
  return s.length > maxLen ? s.substring(0, maxLen) + "..." : s;
}
function maskPhone(phone) {
  if (!phone) return "-";
  var s = String(phone);
  if (s.length >= 7) return s.substring(0, 3) + "****" + s.substring(s.length - 4);
  return s;
}
function fmtDate(ts) {
  if (!ts) return "-";
  var d = new Date(ts * 1000);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString("zh-CN") + " " + d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}
function statusLabel(s) {
  var map = { pending: "\u5f85\u5904\u7406", contacted: "\u5df2\u8054\u7cfb", converted: "\u5df2\u8f6c\u5316", rejected: "\u5df2\u62d2\u7edd", open: "\u5f00\u653e\u4e2d", matched: "\u5df2\u5339\u914d", closed: "\u5df2\u5173\u95ed" };
  return map[s] || s || "-";
}
function intakeStatusLabel(s) {
  var map = { pending_review: "\u5f85\u5ba1\u6838", approved: "\u5df2\u901a\u8fc7", rejected: "\u5df2\u9a73\u56de" };
  return map[s] || s || "-";
}

/* ===== INIT ===== */
/* Safety: force correct initial state — ONLY one view visible */
var av0 = $("app-view"), lv0 = $("login-view");
if (av0) av0.hidden = true;
if (lv0) { lv0.classList.remove("login-hidden"); lv0.style.display = ""; lv0.hidden = false; }

if (token) {
  safeApi("GET", "/admin/auth/me").then(function (res) {
    if (res.ok && res.data) {
      staff = res.data;
      enterApp();
    } else {
      logout("\u767b\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");
    }
  }).catch(function () {
    /* auth/me failed completely — stay at login */
    logout("\u670d\u52a1\u5668\u8fde\u63a5\u5931\u8d25\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");
  });
} else {
  /* Not logged in, stay at login view */
}

/* ===== JS ERROR DISPLAY (V13 feature) ===== */
window.onerror = function (msg, src, line, col, err) {
  var bar = $("js-error-bar");
  var sp = $("js-error-msg");
  if (bar && sp) {
    sp.textContent = String(msg) + " at " + (src || "") + ":" + (line || "?") + ":" + (col || "?");
    bar.style.display = "";
  }
  return false;
};

})();
