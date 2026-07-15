/* ============================================================
   YC Console V12 — 一次性根治版
   变更：
   1. 所有 API 调用加 AbortController 8s 超时，杜绝永久挂起
   2. Dashboard 渐进式渲染：先展示静态面板 → 再异步覆盖真实数据
   3. 全模块保证 #content 永远有可见内容（绝不空白）
   4. 统一错误处理，404/超时/网络错误均有美观降级 UI
   ============================================================ */
(function () {
"use strict";

/* ===== CONFIG ===== */
var API = "https://yiancha-backend.onrender.com/api/v1";
var LS_TOKEN = "yc_token";
var LS_STAFF = "yc_staff";
var API_TIMEOUT = 12000; /* 12s 超时（Render 冷启动可能较慢） */

/* ===== STATE ===== */
var token = localStorage.getItem(LS_TOKEN);
var staff = null;
try { staff = JSON.parse(localStorage.getItem(LS_STAFF) || "null"); } catch (e) { staff = null; }

/* ===== UTILS ===== */
var $ = function (id) { return document.getElementById(id); };

/**
 * API 请求——带超时控制
 * 超时或网络错误都会触发 reject，不会挂起
 */
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
      /* 尝试读取 error body */
      return r.json().then(function (e) {
        throw Object.assign(new Error(e.detail || ("HTTP " + r.status)), { status: r.status, code: r.status });
      }).catch(function (err) {
        if (err.name === "AbortError") throw new Error("请求超时（" + (API_TIMEOUT / 1000) + "s），请检查网络");
        throw err;
      });
    }
    return r.json();
  }).catch(function (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") err = new Error("请求超时（" + (API_TIMEOUT / 1000) + "s），后端可能正在启动");
    throw err;
  });
}

/** 安全的 API 调用——永不 reject 外抛（内部 catch），返回 {ok, data, error} */
function safeApi(method, path, body) {
  return api(method, path, body)
    .then(function (data) { return { ok: true, data: data, error: null }; })
    .catch(function (err) { return { ok: false, data: null, error: err }; });
}

function showToast(msg, type) {
  var t = $("toast");
  t.className = "toast-" + (type || "info");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._t);
  t._t = setTimeout(function () { t.hidden = true; }, 2800);
}

/* ===== CANVAS BACKGROUND ===== */
var cv = $("bg");
function drawBg() {
  cv.width = window.innerWidth;
  cv.height = window.innerHeight;
  var ctx = cv.getContext("2d");
  var g = ctx.createLinearGradient(0, 0, cv.width * 0.3, cv.height);
  g.addColorStop(0, "#0f172a");
  g.addColorStop(0.5, "#1a2744");
  g.addColorStop(1, "#162544");
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

pEl.addEventListener("focus", function () {
  if (!pEl.dataset.init) {
    pEl.dataset.init = "1";
    pwdRaw = pEl.textContent;
    renderPwd();
  }
}, true);

pEl.addEventListener("input", function () {
  var display = pEl.textContent;
  if (display.length < pwdRaw.length) {
    pwdRaw = pwdRaw.substring(0, display.length);
  } else if (display.length > pwdRaw.length) {
    pwdRaw += display.substring(pwdRaw.length);
  }
  renderPwd();
});

function renderPwd() {
  pEl.textContent = "\u25CF".repeat(pwdRaw.length);
  var sel = window.getSelection();
  var range = document.createRange();
  range.selectNodeContents(pEl);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

pEl.addEventListener("paste", function (e) {
  e.preventDefault();
  var txt = (e.clipboardData || window.clipboardData).getData("text");
  if (txt) { pwdRaw += txt; renderPwd(); }
});

async function doLogin() {
  var user = uEl.textContent.trim();
  var pass = pwdRaw;
  le.textContent = "";
  if (!user || !pass) { le.textContent = "请输入账号和密码"; return; }
  lb.disabled = true;
  lb.textContent = "登录中...";
  try {
    var res = await fetch(API + "/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.detail || ("\u767b\u5f55\u5931\u8d25(" + res.status + ")"));
    token = data.token;
    staff = data.staff;
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_STAFF, JSON.stringify(staff));
    enterApp();
  } catch (err) {
    le.textContent = err.message;
    lb.disabled = false;
    lb.textContent = "\u767b \u5f55";
  }
}

lb.addEventListener("click", doLogin);
pEl.addEventListener("keydown", function (e) { if (e.key === "Enter") doLogin(); });
uEl.addEventListener("keydown", function (e) { if (e.key === "Enter") pEl.focus(); });

function logout(msg) {
  token = null;
  staff = null;
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_STAFF);
  $("app-view").hidden = true;
  $("login-view").style.display = "";
  uEl.textContent = ""; pEl.textContent = ""; pwdRaw = "";
  le.textContent = msg || "";
  lb.disabled = false;
  lb.textContent = "\u767b \u5f55";
  cv.style.display = "";
  drawBg();
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
  modal.title.textContent = title || "";
  modal.body.innerHTML = html || "";
  modal.foot.innerHTML = '<button type="button" onclick="document.getElementById(\'modal-layer\').hidden=true">\u5173\u95ed</button>';
  modal.layer.hidden = false;
  modal.layer.style.display = "";
}

function closeModal() {
  modal.layer.hidden = true;
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !modal.layer.hidden) closeModal();
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

function navigate(pageId) {
  /* Update nav active state */
  document.querySelectorAll("#nav-list li").forEach(function (li) {
    li.classList.toggle("active", li.dataset.id === pageId);
  });
  /* Update title */
  var item = navItems.find(function (n) { return n.id === pageId; });
  $("page-title").textContent = item ? item.label : "";

  switch (pageId) {
    case "dashboard": renderDashboard($("content")); break;
    case "artists":   renderArtists($("content")); break;
    case "events":    renderEvents($("content")); break;
    case "commercial":renderCommercial($("content")); break;
    case "reports":   renderReports($("content")); break;
    case "monitor":   renderMonitor($("content")); break;
    case "users":     renderUsers($("content")); break;
    default:
      $("content").innerHTML = '<div class="empty-state"><p>\u9875\u9762\u5f00\u53d1\u4e2d</p></div>';
  }
}

/* ===== ENTER APP ===== */
function enterApp() {
  $("login-view").style.display = "none";
  $("app-view").hidden = false;

  /* Build nav */
  var ul = $("nav-list");
  ul.innerHTML = "";
  navItems.forEach(function (item) {
    if (item.roles.indexOf(staff.role) !== -1) {
      var li = document.createElement("li");
      li.dataset.id = item.id;
      li.innerHTML = '<span class="nav-icon">' + item.icon + '</span>' + item.label;
      li.addEventListener("click", function () { navigate(item.id); });
      ul.appendChild(li);
    }
  });

  /* User info */
  $("user-info").innerHTML =
    '<span style="color:#334155;font-weight:600">' + (staff.name || staff.username) + '</span>' +
    ' <span style="color:#94a3b8">|</span> ' +
    '<span class="badge badge-s">' + staff.role + '</span>';

  /* Hide canvas */
  cv.style.display = "none";

  /* Navigate to first available page */
  var first = navItems.find(function (i) { return i.roles.indexOf(staff.role) !== -1; });
  navigate(first ? first.id : "dashboard");

  showToast("\u6b22\u8fce\uff0c" + (staff.name || staff.username), "ok");
}

/* ===== MOBILE MENU ===== */
$("menu-toggle").addEventListener("click", function () {
  $("sidebar").classList.toggle("open");
});
$("content").addEventListener("click", function () {
  $("sidebar").classList.remove("open");
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") $("sidebar").classList.remove("open");
});

/* ====================================================================
   PAGE RENDERS — V12 核心改进：渐进式渲染 + 安全降级
   ==================================================================== */

/* ---- DASHBOARD — 渐进式渲染（静态内容先展示） ---- */
function renderDashboard(c) {
  /* 第一步：立即渲染静态欢迎面板（不依赖 API） */
  c.innerHTML = renderWelcomePanel();

  /* 第二步：异步尝试加载真实数据，成功则覆盖 */
  safeApi("GET", "/admin/dashboard/summary")
    .then(function (result) {
      if (result.ok && result.data) {
        c.innerHTML = buildDashboardHTML(result.data);
      }
      /* 如果 API 失败，保留静态欢迎面板 */
    });
}

/** 静态欢迎面板 —— 即使 API 全挂也能看到漂亮的内容 */
function renderWelcomePanel() {
  return '' +
    '<div class="welcome-banner">' +
    '  <div class="welcome-text">' +
    '    <h2>\u6b22\u8fce\u56de\u6765\uff0c' + (staff ? (staff.real_name || staff.username || '\u7ba1\u7406\u5458') : '\u7ba1\u7406\u5458') + '</h2>' +
    '    <p class="welcome-desc">\u827a\u5b89\u67e5\u63a7\u5236\u53f0 · SaaS \u827a\u4eba\u98ce\u9669\u8bc4\u4f30\u5e73\u53f0</p>' +
    '  </div>' +
    '  <div class="welcome-actions">' +
    '    <button class="btn btn-primary" onclick="navigate(\'artists\')">\u2604 \u827a\u4eba\u7ba1\u7406</button>' +
    '    <button class="btn btn-primary" onclick="navigate(\'events\')">\u26A0 \u98ce\u9669\u4e8b\u4ef6</button>' +
    '    <button class="btn btn-primary" onclick="navigate(\'reports\')">\uD83D\uDCC4 \u62a5\u544a\u5bfc\u51fa</button>' +
    '  </div>' +
    '</div>' +
    '<div class="dash-grid">' +
    '  <div class="stat-card">' +
    '    <span class="stat-icon icon-blue">\u2604</span>' +
    '    <div class="stat-value">--</div>' +
    '    <div class="stat-label">\u827a\u4eba\u603b\u6570</div>' +
    '    <div class="stat-note">\u6b63\u5728\u52a0\u8f7d...</div>' +
    '  </div>' +
    '  <div class="stat-card">' +
    '    <span class="stat-icon icon-yellow">\u26A0</span>' +
    '    <div class="stat-value">--</div>' +
    '    <div class="stat-label">\u98ce\u9669\u4e8b\u4ef6</div>' +
    '    <div class="stat-note">\u6b63\u5728\u52a0\u8f7d...</div>' +
    '  </div>' +
    '  <div class="stat-card">' +
    '    <span class="stat-icon icon-red">\u2622</span>' +
    '    <div class="stat-value">--</div>' +
    '    <div class="stat-label">\u9ad8\u98ce\u9669\u827a\u4eba</div>' +
    '    <div class="stat-note">\u6b63\u5728\u52a0\u8f7d...</div>' +
    '  </div>' +
    '  <div class="stat-card">' +
    '    <span class="stat-icon icon-green">+</span>' +
    '    <div class="stat-value">--</div>' +
    '    <div class="stat-label">\u4eca\u65e5\u65b0\u589e</div>' +
    '    <div class="stat-note">\u6b63\u5728\u52a0\u8f7d...</div>' +
    '  </div>' +
    '</div>' +
    '<div id="dash-recent"></div>';
}

/** 用真实数据构建仪表盘 HTML */
function buildDashboardHTML(d) {
  var h = '';
  h += '<div class="welcome-banner">' +
    '  <div class="welcome-text">' +
    '    <h2>\u4eea\u8868\u76d6</h2>' +
    '    <p class="welcome-desc">\u6570\u636e\u5b9e\u65f6\u66f4\u65b0\uff1a' + formatTime() + '</p>' +
    '  </div>' +
    '</div>';

  /* Stat cards */
  h += '<div class="stat-cards">';
  var stats = [
    { l: "\u827a\u4eba\u603b\u6570", v: d.total_artists || 0, cls: "icon-blue", ic: "\u2604" },
    { l: "\u98ce\u9669\u4e8b\u4ef6", v: d.total_events || 0, cls: "icon-yellow", ic: "\u26A0" },
    { l: "\u9ad8\u98ce\u9669", v: d.high_risk || 0, cls: "icon-red", ic: "\u2622" },
    { l: "\u4eca\u65e5\u65b0\u589e", v: d.today_new || 0, cls: "icon-green", ic: "+" },
  ];
  stats.forEach(function (s) {
    h += '<div class="stat-card">' +
      '<span class="stat-icon ' + s.cls + '">' + s.ic + '</span>' +
      '<div class="stat-value">' + s.v + '</div>' +
      '<div class="stat-label">' + s.l + '</div></div>';
  });
  h += '</div>';

  /* Recent events table */
  if (d.recent_events && d.recent_events.length) {
    h += '<div class="section-header"><h3 class="section-title">\u6700\u65b0\u98ce\u9669\u4e8b\u4ef6</h3></div>';
    h += '<table><tr><th>\u827a\u4eba</th><th>\u4e8b\u4ef6\u7c7b\u578b</th><th>\u7ea7\u522b</th><th>\u72b6\u6001</th><th>\u65f6\u95f4</th></tr>';
    d.recent_events.forEach(function (e) {
      var lvl = (e.risk_level || '').toUpperCase();
      var lvlCls = lvl === 'S' ? 's' : (lvl === 'A' ? 'a' : (lvl === 'B' ? 'b' : 'c'));
      h += '<tr>';
      h += '<td><strong>' + (e.artist_name || "-") + '</strong></td>';
      h += '<td>' + (e.event_type || "-") + '</td>';
      h += '<td><span class="badge badge-' + lvlCls + '">' + (lvl || '?') + '</span></td>';
      h += '<td>' + (e.status || "-") + '</td>';
      h += '<td style="color:#94a3b8;font-size:12px">' + (e.event_date || "-") + '</td>';
      h += '</tr>';
    });
    h += '</table>';
  }

  return h || '<div class="empty-state"><p>\u6682\u65e0\u6570\u636e</p></div>';
}

function formatTime() {
  var now = new Date();
  return now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');
}

/* ---- ARTISTS ---- */
function renderArtists(c) {
  /* 先渲染工具栏+空状态 */
  c.innerHTML = '' +
    '<div class="toolbar">' +
    '<input placeholder="\u641c\u7d22\u827a\u4eba\u59d3\u540d..." id="artist-q">' +
    '<select id="artist-fl"><option value="">\u6240\u6709\u7ea7\u522b</option><option>S</option><option>A</option><option>B</option><option>C</option></select>' +
    '<button class="btn btn-primary" id="artist-search-btn">\u641c\u7d22</button>' +
    '</div><div id="artist-tb"><div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d\u827a\u4eba\u5217\u8868...</p></div></div>';

  bindArtistControls();
  loadArtists();
}

function bindArtistControls() {
  var qEl = $("artist-q");
  var flEl = $("artist-fl");
  var btnEl = $("artist-search-btn");
  if (qEl) qEl.addEventListener("keydown", function (e) { if (e.key === "Enter") loadArtists(); });
  if (flEl) flEl.addEventListener("change", function () { loadArtists(); });
  if (btnEl) btnEl.addEventListener("click", loadArtists);
}

function loadArtists() {
  var q = ($("artist-q") && $("artist-q").value || "").trim();
  var fl = ($("artist-fl") && $("artist-fl").value) || "";
  var params = [];
  if (q) params.push("q=" + encodeURIComponent(q));
  if (fl) params.push("heat_level=" + fl);
  var qs = params.length ? "?" + params.join("&") : "";

  var tb = $("artist-tb");
  if (!tb) return;
  tb.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d...</p></div>';

  safeApi("GET", "/admin/artists" + qs)
    .then(function (result) {
      if (!result.ok || !result.data) {
        tb.innerHTML = renderErrorCard(null, result.error ? result.error.message : "\u52a0\u8f7d\u5931\u8d25", "artists");
        return;
      }
      var items = result.data.items || result.data || [];
      if (!Array.isArray(items)) items = [items];
      if (!items.length) {
        tb.innerHTML = '<div class="empty-state"><p>\u6682\u65e0\u827a\u4eba\u6570\u636e</p></div>';
        return;
      }
      var h = '<table><tr><th>ID</th><th>\u59d3\u540d</th><th>\u70ed\u5ea6</th><th>\u7efc\u5206</th><th>\u64cd\u4f5c</th></tr>';
      items.forEach(function (a) {
        var hl = a.heat_level || '-';
        var hlCls = hl === 'S' ? 's' : (hl === 'A' ? 'a' : (hl === 'B' ? 'b' : 'c'));
        h += '<tr>' +
          '<td>#' + a.id + '</td>' +
          '<td><strong>' + a.name + '</strong></td>' +
          '<td><span class="badge badge-' + hlCls + '">' + hl + '</span></td>' +
          '<td>' + (a.comprehensive_score != null ? a.comprehensive_score : '-') + '</td>' +
          '<td><button class="btn btn-sm btn-primary" data-aid="' + a.id + '">\u8be6\u60c5</button></td>' +
          '</tr>';
      });
      h += '</table>';
      tb.innerHTML = h;

      tb.querySelectorAll("[data-aid]").forEach(function (btn) {
        btn.addEventListener("click", function () { viewArtist(+btn.dataset.aid); });
      });
    });
}

function viewArtist(id) {
  safeApi("GET", "/admin/artists/" + id)
    .then(function (result) {
      if (!result.ok || !result.data) {
        showToast("\u827a\u4eba\u8be6\u60c5\u52a0\u8f7d\u5931\u8d25", "err"); return;
      }
      var a = result.data;
      var h = '<h3>' + a.name + ' <small style="color:#94a3b8">#' + id + '</small></h3>';
      h += '<div class="info-grid">';
      var info = [
        ["\u70ed\u5ea6", a.heat_level], ["\u7efc\u5408\u8bc4\u5206", a.comprehensive_score],
        ["\u751f\u65e5", a.birthday || "-"], ["\u661f\u5ea6", a.constellation || "-"],
        ["\u6c11\u65cf", a.ethnicity || "-"], ["\u51fa\u751f\u5730", a.birthplace || "-"],
        ["\u7ecf\u7eaa\u516c\u53f8", a.agency || "-"], ["\u4ee3\u8868\u4f5c", a.masterpieces || "-"],
      ];
      info.forEach(function (row) {
        h += '<div class="info-item"><div class="info-label">' + row[0] + '</div><div class="info-val">' + (row[1] || '-') + '</div></div>';
      });
      h += '</div>';
      h += '<div style="margin-top:18px"><h4 style="font-size:14px;margin-bottom:10px">\u98ce\u9669\u8be6\u60c5</h4><div id="risk-det"><div class="loading"><div class="spinner"></div></div></div></div>';
      openModal("\u827a\u4eba\u8be6\u60c5", h);

      safeApi("GET", "/risk/explain/" + id)
        .then(function (rr) {
          var rd = $("risk-det");
          if (!rd) return;
          if (rr.ok && rr.data && rr.data.dimension_scores && rr.data.dimension_scores.length) {
            var rh = '<table style="margin-top:8px;width:100%"><tr><th>\u7ef4\u5ea6</th><th>\u5206\u6570</th><th>\u8bf4\u660e</th></tr>';
            rr.data.dimension_scores.forEach(function (ds) {
              rh += '<tr><td>' + ds.dimension + '</td><td><strong>' + ds.score + '</strong></td><td>' + (ds.explanation || '-') + '</td></tr>';
            });
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
function renderEvents(c) {
  c.innerHTML = '' +
    '<div class="toolbar">' +
    '<select id="event-fl"><option value="">\u6240\u6709\u7ea7\u522b</option>' +
    '<option value="high">S/A \u9ad8\u98ce\u9669</option>' +
    '<option value="medium">B \u4e2d\u98ce\u9669</option>' +
    '<option value="low">C \u4f4e\u98ce\u9669</option></select>' +
    '<button class="btn btn-primary" id="event-filter-btn">\u7B5B\u9009</button>' +
    '</div><div id="event-tb"><div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d\u98ce\u9669\u4e8b\u4ef6...</p></div></div>';

  var eBtn = $("event-filter-btn");
  if (eBtn) eBtn.addEventListener("click", loadEvents);
  loadEvents();
}

function loadEvents() {
  var fl = ($("event-fl") && $("event-fl").value) || "";
  var qs = fl ? "?risk_filter=" + fl : "";
  var tb = $("event-tb");
  if (!tb) return;
  tb.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d...</p></div>';

  safeApi("GET", "/admin/events" + qs)
    .then(function (result) {
      if (!result.ok || !result.data) {
        tb.innerHTML = renderErrorCard(null, result.error ? result.error.message : "\u52a0\u8f7d\u5931\u8d25", "events");
        return;
      }
      var items = result.data.items || result.data || [];
      if (!Array.isArray(items)) items = [items];
      if (!items.length) {
        tb.innerHTML = '<div class="empty-state"><p>\u6682\u65e0\u98ce\u9669\u4e8b\u4ef6</p></div>';
        return;
      }
      var h = '<table><tr><th>ID</th><th>\u827a\u4eba</th><th>\u4e8b\u4ef6\u7c7b\u578b</th><th>\u7ea7\u522b</th><th>\u72b6\u6001</th><th>\u65f6\u95f4</th></tr>';
      items.forEach(function (e) {
        var rl = e.risk_level || '';
        var rlMap = { high: 's', S: 's', A: 'a', medium: 'b', B: 'b', low: 'c', C: 'c' };
        var rc = rlMap[rl] || 'c';
        h += '<tr>' +
          '<td>#' + e.id + '</td>' +
          '<td><strong>' + (e.artist_name || "-") + '</strong></td>' +
          '<td>' + (e.event_type || "-") + '</td>' +
          '<td><span class="badge badge-' + rc + '">' + (rl || "?").toUpperCase() + '</span></td>' +
          '<td>' + (e.status || "-") + '</td>' +
          '<td style="color:#94a3b8;font-size:12px">' + (e.event_date || "-") + '</td>' +
          '</tr>';
      });
      h += '</table>';
      tb.innerHTML = h;
    });
}
window.__loadEvents = loadEvents;

/* ---- COMMERCIAL ---- */
function renderCommercial(c) {
  c.innerHTML = '<div class="section-header"><h3 class="section-title">\u5546\u4e1a\u4ef7\u503c</h3></div>' +
    '<div class="form-card" style="max-width:680px">' +
    '<p style="color:#64748b;line-height:1.8;font-size:14px">\u827a\u4eba\u5546\u4e1a\u4ef7\u503c\u6570\u636e\u53ef\u5728 <strong>\u827a\u4eba\u8be6\u60c5</strong> \u9875\u67e5\u770b\u3002' +
    '\u5305\u62ec\u7efc\u5408\u8bc4\u5206\u3001\u70ed\u5ea6\u7ea7\u522b\u3001\u4ee3\u8a00\u6218\u62a5\u7b49\u6570\u636e\u3002</p>' +
    '<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap">' +
    '<button class="btn btn-primary" onclick="navigate(\'artists\')">\u53bb\u827a\u4eba\u7ba1\u7406 &rarr;</button>' +
    '<button class="btn btn-primary" onclick="window.open(\'https://yiwoyiye89-lang.github.io/yiancha-mvp/\',\'_blank\')">\u6253\u5f00\u524d\u7aef\u9996\u9875</button>' +
    '</div></div>';
}

/* ---- REPORTS ---- */
function renderReports(c) {
  c.innerHTML = '' +
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

  var genBtn = $("gen-rp-btn");
  if (genBtn) genBtn.addEventListener("click", genReport);
}

function genReport() {
  var id = ($("rp-id") && $("rp-id").value || "").trim();
  var fmt = ($("rp-fmt") && $("rp-fmt").value) || "word";
  var errEl = $("rp-err");
  if (errEl) errEl.textContent = "";
  if (!id) { if (errEl) errEl.textContent = "\u8bf7\u8f93\u5165\u827a\u4eba ID"; return; }

  safeApi("POST", "/admin/reports/generate", { artist_id: Number(id), format: fmt })
    .then(function (result) {
      if (result.ok && result.data) {
        var d = result.data;
        if (d.download_url || d.data) {
          if (fmt === "json") {
            openModal("\u62a5\u544a(JSON)",
              '<pre style="background:#f8fafc;padding:16px;border-radius:8px;font-size:12px;max-height:480px;overflow:auto;white-space:pre-wrap">' +
              JSON.stringify(d.data || d, null, 2) + '</pre>');
          } else {
            showToast("\u62a5\u544a\u5df2\u751f\u6210\uff0c\u6b63\u5728\u4e0b\u8f7d...", "ok");
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
function renderMonitor(c) {
  c.innerHTML = '<div class="section-header"><h3 class="section-title">\u76d1\u63a7\u544a\u8b66</h3></div>' +
    '<div id="mon-tb"><div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d\u544a\u8b66\u4fe1\u606f...</p></div></div>';

  safeApi("GET", "/monitor/alerts/latest?limit=30")
    .then(function (result) {
      var tb = $("mon-tb");
      if (!tb) return;
      if (!result.ok || !result.data) {
        tb.innerHTML = renderErrorCard(null, result.error ? result.error.message : "\u52a0\u8f7d\u5931\u8d25", "monitor");
        return;
      }
      var items = result.data.alerts || result.data || [];
      if (!Array.isArray(items)) items = [items];
      if (!items.length) {
        tb.innerHTML = '<div class="empty-state"><p>\u6682\u65e0\u544a\u8b66\u4fe1\u606f</p></div>';
        return;
      }
      var h = '<table><tr><th>ID</th><th>\u827a\u4eba</th><th>\u7c7b\u578b</th><th>\u4e25\u91cd\u7a0b\u5ea6</th><th>\u72b6\u6001</th><th>\u65f6\u95f4</th></tr>';
      items.forEach(function (a) {
        var sevCls = a.severity === 'high' ? 'c' : 'b';
        h += '<tr>' +
          '<td>#' + a.id + '</td>' +
          '<td><strong>' + (a.artist_name || "-") + '</strong></td>' +
          '<td>' + (a.alert_type || "-") + '</td>' +
          '<td><span class="badge badge-' + sevCls + '">' + (a.severity || '-').toUpperCase() + '</span></td>' +
          '<td>' + (a.status || "-") + '</td>' +
          '<td style="color:#94a3b8;font-size:12px">' + (a.created_at || "-") + '</td>' +
          '</tr>';
      });
      h += '</table>';
      tb.innerHTML = h;
    });
}

/* ---- USERS ---- */
function renderUsers(c) {
  c.innerHTML = '<div class="section-header"><h3 class="section-title">\u7528\u6237\u7ba1\u7406</h3></div>' +
    '<div id="user-tb"><div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u6b63\u5728\u52a0\u8f7d\u7528\u6237\u5217\u8868...</p></div></div>';

  safeApi("GET", "/admin/users")
    .then(function (result) {
      var tb = $("user-tb");
      if (!tb) return;
      if (!result.ok || !result.data) {
        tb.innerHTML = renderErrorCard(null, result.error ? result.error.message : "\u52a0\u8f7d\u5931\u8d25", "users");
        return;
      }
      var users = result.data.users || result.data || [];
      if (!Array.isArray(users)) users = [users];
      if (!users.length) {
        tb.innerHTML = '<div class="empty-state"><p>\u6682\u65e0\u7528\u6237</p></div>';
        return;
      }
      var h = '<table><tr><th>ID</th><th>\u7528\u6237\u540d</th><th>\u89d2\u8272</th><th>\u72b6\u6001</th><th>\u64cd\u4f5c</th></tr>';
      users.forEach(function (u) {
        h += '<tr>' +
          '<td>#' + u.id + '</td>' +
          '<td><strong>' + u.username + '</strong></td>' +
          '<td><span class="badge badge-s">' + u.role + '</span></td>' +
          '<td>' + (u.is_active ?
            '<span style="color:#22c55e;font-weight:600">\u6fc0\u6d3b</span>' :
            '<span style="color:#94a3b8">\u505c\u7528</span>') + '</td>' +
          '<td><button class="btn btn-sm ' + (u.is_active ? "btn-warn" : "btn-primary") + '" ' +
          'data-uid="' + u.id + '" data-active="' + (!u.is_active) + '">' +
          (u.is_active ? "\u505c\u7528" : "\u6fc0\u6d3b") + '</button></td>' +
          '</tr>';
      });
      h += '</table>';
      tb.innerHTML = h;

      tb.querySelectorAll("[data-uid]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          toggleUser(+btn.dataset.uid, btn.dataset.active === "true");
        });
      });
    });
}

function toggleUser(id, active) {
  safeApi("PATCH", "/admin/users/" + id, { is_active: active })
    .then(function (result) {
      if (result.ok) {
        showToast(active ? "\u5df2\u6fc0\u6d3b" : "\u5df2\u505c\u7528", "ok");
        renderUsers($("content"));
      } else {
        showToast("\u64cd\u4f5c\u5931\u8d25: " + (result.error && result.error.message), "err");
      }
    });
}
window.__toggleUser = toggleUser;

/* ===== ERROR HELPER —— 保证永远有可见内容 ===== */
function renderErrorCard(title, msg, ctx) {
  ctx = ctx || "";
  var is404 = msg && (msg.indexOf("404") !== -1 || msg.indexOf("Not Found") !== -1);
  var isTimeout = msg && (msg.indexOf("\u8d85\u65f6") !== -1 || msg.indexOf("abort") !== -1);

  var hint = "";
  if (is404) hint = '<p style="color:#94a3b8;font-size:13px;margin-top:8px">\u8be5\u529f\u80fd\u7aef\u70b9\u5c1a\u672a\u4e0a\u7ebf\uff0c\u540e\u7aef\u5f00\u53d1\u4e2d</p>';
  else if (isTimeout) hint = '<p style="color:#94a3b8;font-size:13px;margin-top:8px">\u540e\u7aef\u54cd\u5e94\u8f83\u6162\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5</p>';

  return '<div class="form-card" style="text-align:center;padding:48px 24px;max-width:520px;margin:40px auto">' +
    '<div style="font-size:48px;margin-bottom:16px">\u2639</div>' +
    (title ? '<h3 style="margin-bottom:8px;color:#1e293b">' + title + '</h3>' : '') +
    '<p style="color:#64748b;font-size:14px;line-height:1.6">' + (msg || "\u52a0\u8f7d\u5931\u8d25") + '</p>' +
    hint +
    '<div style="margin-top:24px;display:flex;gap:10px;justify-content:center">' +
    '<button class="btn btn-primary" onclick="location.reload()">\u91cd\u8bd5</button>' +
    (ctx ? '<button class="btn" onclick="navigate(\'' + ctx + '\')">\u5237\u65b0</button>' : '') +
    '</div></div>';
}

/* ===== WELCOME BANNER CSS-IN-JS (injected once) ===== */
(function injectDashStyles() {
  var s = document.createElement('style');
  s.textContent =
    '.welcome-banner{background:linear-gradient(135deg,#4f8cff,#7c5cfc);border-radius:14px;padding:32px 32px 28px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:24px;color:#fff}' +
    '.welcome-banner h2{font-size:24px;font-weight:800;margin-bottom:8px}' +
    '.welcome-desc{font-size:14px;opacity:.85}' +
    '.welcome-actions{display:flex;gap:10px;flex-shrink:0}' +
    '.welcome-actions .btn{background:rgba(255,255,255,.2);color:#fff;border-color:rgba(255,255,255,.3);font-weight:700}' +
    '.welcome-actions .btn:hover{background:rgba(255,255,255,.3)}' +
    '.stat-note{color:#94a3b8;font-size:11px;margin-top:6px;font-weight:400}' +
    '.dash-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}';
  document.head.appendChild(s);
})();

/* ===== INIT ===== */
$("logout-btn").addEventListener("click", function () { logout(); });

/* Hash navigation */
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
        console.warn("Token verify failed:", result.error);
        logout("\u767b\u5f55\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");
      }
    })
    .catch(function () {
      logout("\u8eab\u4efd\u9a8c\u8bc1\u5931\u8d25\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");
    });
} else {
  $("app-view").hidden = true;
  $("login-view").style.display = "";
  drawBg();
}

})();
