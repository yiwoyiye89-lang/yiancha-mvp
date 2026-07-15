/* ============================================================
   YC Console V11 - Modern Admin Panel
   Features: Canvas anti-autofill bg + reliable auth + modern UI
   ============================================================ */
(function () {
"use strict";

/* ===== CONFIG ===== */
var API = "https://yiancha-backend.onrender.com/api/v1";
var LS_TOKEN = "yc_token";
var LS_STAFF = "yc_staff";

/* ===== STATE ===== */
var token = localStorage.getItem(LS_TOKEN);
var staff = null;
try { staff = JSON.parse(localStorage.getItem(LS_STAFF) || "null"); } catch (e) { staff = null; }

/* ===== UTILS ===== */
var $ = function (id) { return document.getElementById(id); };

function api(method, path, body) {
  var opts = {
    method: method,
    headers: { "Authorization": "Bearer " + token }
  };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  return fetch(API + path, opts).then(function (r) {
    if (!r.ok) throw Object.assign(new Error("HTTP " + r), { status: r.status });
    return r.json();
  });
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
var le = $("le");
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

/* ===== MODAL (nuclear-safe) ===== */
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

  var c = $("content");
  c.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px">\u52a0\u8f7d\u4e2d...</p></div>';

  switch (pageId) {
    case "dashboard": renderDashboard(c); break;
    case "artists":   renderArtists(c); break;
    case "events":    renderEvents(c); break;
    case "commercial":renderCommercial(c); break;
    case "reports":   renderReports(c); break;
    case "monitor":   renderMonitor(c); break;
    case "users":     renderUsers(c); break;
    default:          c.innerHTML = '<div class="empty-state"><p>\u9875\u9762\u5f00\u53d1\u4e2d</p></div>';
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
/* Close sidebar on content click (mobile) */
$("content").addEventListener("click", function () {
  $("sidebar").classList.remove("open");
});
/* Close on escape */
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") $("sidebar").classList.remove("open");
});

/* ====================================================================
   PAGE RENDERS
   ==================================================================== */

/* ---- DASHBOARD ---- */
function renderDashboard(c) {
  api("GET", "/admin/dashboard/summary")
    .then(function (d) {
      var h = '';

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

      c.innerHTML = h || '<div class="empty-state"><p>\u6682\u65e0\u6570\u636e</p></div>';
    })
    .catch(function (err) {
      console.warn("Dashboard load error:", err);
      c.innerHTML = renderErrorCard("\u4eea\u8868\u76d8", err.message || "\u6570\u636e\u52a0\u8f7d\u5931\u8d25");
    });
}

/* ---- ARTISTS ---- */
function renderArtists(c) {
  c.innerHTML = '' +
    '<div class="toolbar">' +
    '<input placeholder="\u641c\u7d22\u827a\u4eba\u59d3\u540d..." id="artist-q">' +
    '<select id="artist-fl"><option value="">\u6240\u6709\u7ea7\u522b</option><option>S</option><option>A</option><option>B</option><option>C</option></select>' +
    '<button class="btn btn-primary" id="artist-search-btn">\u641c\u7d22</button>' +
    '</div><div id="artist-tb"></div>';

  $("artist-q").addEventListener("keydown", function (e) { if (e.key === "Enter") loadArtists(); });
  $("artist-fl").addEventListener("change", function () { loadArtists(); });
  $("artist-search-btn").addEventListener("click", loadArtists);
  loadArtists();
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
  tb.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  api("GET", "/admin/artists" + qs)
    .then(function (d) {
      var items = d.items || d || [];
      if (!items.length) {
        tb.innerHTML = '<div class="empty-state"><p>\u6682\u65e0\u6570\u636e</p></div>';
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
      if (d.total > (d.limit || 50)) {
        h += '<p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:12px">\u5171 ' + d.total + ' \u6761</p>';
      }
      tb.innerHTML = h;

      /* Bind detail buttons */
      tb.querySelectorAll("[data-aid]").forEach(function (btn) {
        btn.addEventListener("click", function () { viewArtist(+btn.dataset.aid); });
      });
    })
    .catch(function (err) {
      tb.innerHTML = renderErrorCard(null, err.message || "\u52a0\u8f7d\u5931\u8d25");
    });
}

function viewArtist(id) {
  api("GET", "/admin/artists/" + id)
    .then(function (a) {
      var h = '<h3>' + a.name + ' <small style="color:#94a3b8">#' + id + '</small></h3>';
      h += '<div class="info-grid">';
      var info = [
        ["\u70ed\u5ea6", a.heat_level], ["\u7efc\u5408\u8bc4\u5206", a.comprehensive_score],
        ["\u751f\u65e5", a.birthday || "-"], ["\u661f\u5ea7", a.constellation || "-"],
        ["\u6c11\u65cf", a.ethnicity || "-"], ["\u51fa\u751f\u5730", a.birthplace || "-"],
        ["\u7ecf\u7eaa\u516c\u53f8", a.agency || "-"], ["\u4ee3\u8868\u4f5c", a.masterpieces || "-"],
      ];
      info.forEach(function (row) {
        h += '<div class="info-item"><div class="info-label">' + row[0] + '</div><div class="info-val">' + (row[1] || '-') + '</div></div>';
      });
      h += '</div>';
      h += '<div style="margin-top:18px"><h4 style="font-size:14px;margin-bottom:10px">\u98ce\u9669\u8be6\u60c5</h4><div id="risk-det"><div class="loading"><div class="spinner"></div></div></div></div>';
      openModal("\u827a\u4eba\u8be6\u60c5", h);

      /* Load risk detail */
      api("GET", "/risk/explain/" + id)
        .then(function (r) {
          var rd = $("risk-det");
          if (!rd) return;
          if (!r.dimension_scores || !r.dimension_scores.length) {
            rd.innerHTML = '<p style="color:#94a3b8;padding:10px">\u6682\u65e0\u98ce\u9669\u6570\u636e</p>';
            return;
          }
          var rh = '<table style="margin-top:8px;width:100%"><tr><th>\u7ef4\u5ea6</th><th>\u5206\u6570</th><th>\u8bf4\u660e</th></tr>';
          r.dimension_scores.forEach(function (ds) {
            rh += '<tr><td>' + ds.dimension + '</td><td><strong>' + ds.score + '</strong></td><td>' + (ds.explanation || '-') + '</td></tr>';
          });
          rh += '</table>';
          rd.innerHTML = rh;
        })
        .catch(function () {
          var rd = $("risk-det");
          if (rd) rd.innerHTML = '<p style="color:#ef4444;padding:10px">\u98ce\u9669\u6570\u636e\u52a0\u8f7d\u5931\u8d25</p>';
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
    '</div><div id="event-tb"></div>';

  $("event-filter-btn").addEventListener("click", loadEvents);
  loadEvents();
}

function loadEvents() {
  var fl = ($("event-fl") && $("event-fl").value) || "";
  var qs = fl ? "?risk_filter=" + fl : "";
  var tb = $("event-tb");
  if (!tb) return;
  tb.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  api("GET", "/admin/events" + qs)
    .then(function (d) {
      var items = d.items || d || [];
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
    })
    .catch(function (err) {
      tb.innerHTML = renderErrorCard(null, err.message || "\u52a0\u8f7d\u5931\u8d25");
    });
}
window.__loadEvents = loadEvents;

/* ---- COMMERCIAL ---- */
function renderCommercial(c) {
  c.innerHTML = '<div class="section-header"><h3 class="section-title">\u5546\u4e1a\u4ef7\u503c</h3></div>' +
    '<div class="form-card">' +
    '<p style="color:#64748b;line-height:1.7">\u827a\u4eba\u5546\u4e1a\u4ef7\u503c\u6570\u636e\u53ef\u5728 <strong>\u827a\u4eba\u8be6\u60c5</strong> \u9875\u67e5\u770b\u3002' +
    '\u5305\u62ec\u7efc\u5408\u8bc4\u5206\u3001\u70ed\u5ea6\u7ea7\u522b\u3001\u4ee3\u8a00\u6218\u62a5\u7b49\u6570\u636e\u3002</p>' +
    '<div style="margin-top:16px"><button class="btn btn-primary" onclick="navigate(\'artists\')">\u53bb\u827a\u4eba\u7ba1\u7406 &rarr;</button></div>' +
    '</div>';
}

/* ---- REPORTS ---- */
function renderReports(c) {
  c.innerHTML = '' +
    '<div class="form-card">' +
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

  $("gen-rp-btn").addEventListener("click", genReport);
}

function genReport() {
  var id = ($("rp-id") && $("rp-id").value || "").trim();
  var fmt = ($("rp-fmt") && $("rp-fmt").value) || "word";
  var errEl = $("rp-err");
  if (errEl) errEl.textContent = "";
  if (!id) { if (errEl) errEl.textContent = "\u8bf7\u8f93\u5165\u827a\u4eba ID"; return; }

  api("POST", "/admin/reports/generate", { artist_id: Number(id), format: fmt })
    .then(function (d) {
      if (d.download_url || d.data) {
        if (fmt === "json") {
          openModal("\u62a5\u544a(JSON)",
            '<pre style="background:#f8fafc;padding:16px;border-radius:8px;font-size:12px;max-height:480px;overflow:auto;white-space:pre-wrap">' +
            JSON.stringify(d.data, null, 2) + '</pre>');
        } else {
          showToast("\u62a5\u544a\u5df2\u751f\u6210\uff0c\u6b63\u5728\u4e0b\u8f7d...", "ok");
          if (d.download_url) window.open(d.download_url, "_blank");
        }
      } else {
        if (errEl) errEl.textContent = d.detail || "\u751f\u6210\u5931\u8d25";
      }
    })
    .catch(function (e) {
      if (errEl) errEl.textContent = e.message || "\u8bf7\u6c42\u5931\u8d25";
    });
}
window.__genReport = genReport;

/* ---- MONITOR ---- */
function renderMonitor(c) {
  c.innerHTML = '<div class="section-header"><h3 class="section-title">\u76d1\u63a7\u544a\u8b66</h3></div>' +
    '<div id="mon-tb"><div class="loading"><div class="spinner"></div></div></div>';

  api("GET", "/monitor/alerts/latest?limit=30")
    .then(function (d) {
      var items = d.alerts || d || [];
      var tb = $("mon-tb");
      if (!tb) return;
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
    })
    .catch(function (err) {
      var tb = $("mon-tb");
      if (tb) tb.innerHTML = renderErrorCard(null, err.message);
    });
}

/* ---- USERS ---- */
function renderUsers(c) {
  c.innerHTML = '<div class="section-header"><h3 class="section-title">\u7528\u6237\u7ba1\u7406</h3></div>' +
    '<div id="user-tb"><div class="loading"><div class="spinner"></div></div></div>';

  api("GET", "/admin/users")
    .then(function (d) {
      var users = d.users || d || [];
      var tb = $("user-tb");
      if (!tb) return;
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
            '<span color="#94a3b8">\u505c\u7528</span>') + '</td>' +
          '<td><button class="btn btn-sm ' + (u.is_active ? "btn-warn" : "btn-primary") + '" ' +
          'data-uid="' + u.id + '" data-active="' + (!u.is_active) + '">' +
          (u.is_active ? "\u505c\u7528" : "\u6fc0\u6d3b") + '</button></td>' +
          '</tr>';
      });
      h += '</table>';
      tb.innerHTML = h;

      /* Bind toggle buttons */
      tb.querySelectorAll("[data-uid]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          toggleUser(+btn.dataset.uid, btn.dataset.active === "true");
        });
      });
    })
    .catch(function (err) {
      var tb = $("user-tb");
      if (tb) tb.innerHTML = renderErrorCard(null, err.message);
    });
}

function toggleUser(id, active) {
  api("PATCH", "/admin/users/" + id, { is_active: active })
    .then(function () {
      showToast(active ? "\u5df2\u6fc0\u6d3b" : "\u5df2\u505c\u7528", "ok");
      renderUsers($("content"));
    })
    .catch(function () { showToast("\u64cd\u4f5c\u5931\u8d25", "err"); });
}
window.__toggleUser = toggleUser;

/* ===== ERROR HELPER ===== */
function renderErrorCard(title, msg) {
  return '<div class="form-card" style="text-align:center;padding:36px 24px">' +
    '<div style="font-size:40px;margin-bottom:12px">\u2639</div>' +
    (title ? '<h3 style="margin-bottom:8px">' + title + '</h3>' : '') +
    '<p style="color:#94a3b8">' + (msg || "\u52a0\u8f7d\u5931\u8d25") + '</p>' +
    '<button class="btn btn-primary" style="margin-top:16px" onclick="location.reload()">\u91cd\u8bd5</button>' +
    '</div>';
}

/* ===== INIT ===== */
/* Logout button */
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
  /* Verify token before entering app */
  api("GET", "/admin/auth/me")
    .then(function (me) {
      /* Update staff with fresh data */
      if (me.staff) { staff = me.staff; localStorage.setItem(LS_STAFF, JSON.stringify(staff)); }
      enterApp();
    })
    .catch(function (err) {
      console.warn("Token invalid:", err);
      logout("\u767b\u5f55\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");
    });
} else {
  /* No token or no staff → show login */
  $("app-view").hidden = true;
  $("login-view").style.display = "";
  drawBg();
}

})();
