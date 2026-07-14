/* 艺安查管理后台 · 前端控制台（无构建，纯静态）
 * 仅依赖后端 /api/v1 的 admin 系列接口。
 */
(function () {
  "use strict";

  const API = "https://yiancha-backend.onrender.com/api/v1";
  const LS_TOKEN = "yc_token";
  const LS_STAFF = "yc_staff";

  // 导航项定义：perm 控制可见性
  const NAV = [
    { key: "dashboard", label: "运营看板", ico: "▦", perm: "dashboard:view", crumb: "运营看板" },
    { key: "users", label: "用户管理", ico: "👤", perm: "user:view", crumb: "用户管理" },
    { key: "invites", label: "邀请码", ico: "✉", perm: "invite:view", crumb: "邀请码管理" },
    { key: "leads", label: "商务线索", ico: "💼", perm: "lead:view", crumb: "商务线索" },
    { key: "intake", label: "入驻审核", ico: "📝", perm: "intake:view", crumb: "艺人入驻审核" },
    { key: "pricing", label: "双盲撮合", ico: "⚖", perm: "pricing:view", crumb: "双盲定价撮合" },
    { key: "staff", label: "员工管理", ico: "🛡", perm: "staff:view", crumb: "员工管理" },
  ];

  // 角色中文标签（与后端 DEFAULT_ROLES 保持一致）
  const ROLE_LABELS = {
    super_admin: "超级管理员",
    operations: "运营",
    business: "商务",
    risk: "风控",
    finance: "财务",
    viewer: "只读访客",
  };
  const ROLE_KEYS = Object.keys(ROLE_LABELS);
  function sideLabel(s) { return s === "brand" ? "品牌方" : (s === "artist" ? "艺人方" : (s || "—")); }
  function statusLabel(s) { return s === "open" ? "开放" : (s === "matched" ? "已匹配" : (s === "closed" ? "已关闭" : (s || "—"))); }

  let token = localStorage.getItem(LS_TOKEN);
  let staff = null;
  try { staff = JSON.parse(localStorage.getItem(LS_STAFF) || "null"); } catch (e) {}

  // ---------- 工具 ----------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function hasPerm(p) { return staff && Array.isArray(staff.perms) && staff.perms.indexOf(p) >= 0; }

  function fmtTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts * 1000);
    const p = (n) => (n < 10 ? "0" + n : "" + n);
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function toast(msg, type) {
    const t = $("#toast");
    t.textContent = msg;
    t.className = "toast" + (type ? " " + type : "");
    t.hidden = false;
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.hidden = true; }, 2600);
  }

  async function api(path, opts) {
    opts = opts || {};
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(API + path, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (res.status === 401) { logout("凭证已失效，请重新登录"); throw new Error("凭证失效"); }
    if (res.status === 403) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.detail || "无权限");
    }
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.detail || ("请求失败(" + res.status + ")"));
    }
    return res.json();
  }

  function openModal(html) {
    $("#modal-card").innerHTML = html;
    $("#modal-layer").hidden = false;
  }
  function closeModal() { $("#modal-layer").hidden = true; $("#modal-card").innerHTML = ""; }

  function badge(text, cls) {
    return '<span class="badge ' + (cls || "") + '">' + (text == null ? "—" : text) + "</span>";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- 登录 / 登出（contenteditable div，零 input 零 form） ----------
  async function doLogin() {
    const btn = $("#login-btn");
    if (btn.disabled) return;
    btn.disabled = true; btn.textContent = "登录中…";
    $("#login-error").textContent = "";
    try {
      const userEl = document.getElementById("ci-user");
      const passEl = document.getElementById("ci-pass");
      const user = (userEl ? (userEl.textContent || "").trim() : "");
      const pass = (passEl ? (passEl.textContent || "") : "");
      if (!user || !pass) { throw new Error("请输入账号和密码"); }
      const res = await fetch(API + "/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || ("登录失败(" + res.status + ")"));
      }
      token = data.token; staff = data.staff;
      localStorage.setItem(LS_TOKEN, token);
      localStorage.setItem(LS_STAFF, JSON.stringify(staff));
      enterApp();
    } catch (err) {
      $("#login-error").textContent = "❌ " + err.message;
    } finally {
      btn.disabled = false; btn.textContent = "登 录";
    }
  }

  function logout(msg) {
    token = null; staff = null;
    localStorage.removeItem(LS_TOKEN); localStorage.removeItem(LS_STAFF);
    $("#app-view").hidden = true;
    $("#login-view").hidden = false;
    if (msg) $("#login-error").textContent = msg;
  }

  // ---------- 进入主应用 ----------
  function enterApp() {
    $("#login-view").hidden = true;
    $("#app-view").hidden = false;
    $("#staff-name").textContent = staff.real_name || staff.username;
    $("#staff-role").textContent = staff.role_label + "（" + staff.username + "）";
    renderNav();
    const hash = location.hash.replace("#/", "") || "dashboard";
    navigate(hash);
  }

  function renderNav() {
    const nav = $("#side-nav");
    nav.innerHTML = "";
    NAV.forEach((n) => {
      if (!hasPerm(n.perm)) return;
      const a = document.createElement("div");
      a.className = "nav-item";
      a.dataset.key = n.key;
      a.innerHTML = '<span class="nav-ico">' + n.ico + "</span>" + n.label;
      a.onclick = () => { location.hash = "#/" + n.key; };
      nav.appendChild(a);
    });
  }

  function navigate(key) {
    const nav = NAV.find((n) => n.key === key);
    if (!nav || !hasPerm(nav.perm)) { key = "dashboard"; }
    document.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.key === key);
    });
    const item = NAV.find((n) => n.key === key);
    $("#crumb").textContent = item ? item.crumb : key;
    const page = $("#page");
    page.innerHTML = "";
    if (key === "dashboard") return renderDashboard(page);
    if (key === "users") return renderUsers(page);
    if (key === "invites") return renderInvites(page);
    if (key === "leads") return renderLeads(page);
    if (key === "intake") return renderIntake(page);
    if (key === "pricing") return renderPricing(page);
    if (key === "staff") return renderStaff(page);
  }

  // ============ 看板 ============
  async function renderDashboard(root) {
    root.innerHTML = '<div class="empty">加载中…</div>';
    try {
      const d = await api("/admin/dashboard");
      const u = d.users, l = d.leads, it = d.intakes, iv = d.invites, pr = d.pricing;
      root.innerHTML =
        '<div class="metrics">' +
          metric(u.total, "注册用户", "今日新增 <b>" + u.today_new + "</b>", "已认证 <b>" + u.verified + "</b>") +
          metric(l.total, "商务线索", "待处理 <b>" + (l.dist.pending || 0) + "</b>", "未分配 <b>" + l.unassigned + "</b>") +
          metric(it.total, "入驻申请", "待审 <b>" + (it.dist.pending_review || 0) + "</b>", "已通过 <b>" + (it.dist.approved || 0) + "</b>") +
          metric(iv.total, "邀请码", "活跃 <b>" + iv.active + "</b>") +
          metric(pr.total, "双盲撮合", "开放 <b>" + (pr.dist.open || 0) + "</b>", "已匹配 <b>" + (pr.dist.matched || 0) + "</b>") +
        "</div>" +
        '<div class="section-grid" style="margin-top:18px">' +
          distCard("用户套餐分布", u.plan_dist) +
          distCard("线索状态分布", l.dist) +
          distCard("入驻审核分布", it.dist) +
          distCard("双盲状态分布", pr.dist) +
        "</div>" +
        '<div class="card" style="margin-top:18px"><div class="card-title">最近审计日志 <span class="sub">操作留痕</span></div>' +
          '<div id="audit-box"><div class="empty">加载中…</div></div></div>';
      loadAudit($("#audit-box"));
    } catch (e) {
      root.innerHTML = '<div class="empty">加载失败：' + esc(e.message) + "</div>";
    }
  }
  function metric(val, label, r1, r2) {
    let rows = '<div class="m-row">';
    if (r1) rows += "<span>" + r1 + "</span>";
    if (r2) rows += "<span>" + r2 + "</span>";
    rows += "</div>";
    return '<div class="metric"><div class="m-val">' + val + '</div><div class="m-label">' + label + "</div>" + rows + "</div>";
  }
  function distCard(title, dist) {
    let rows = "";
    Object.keys(dist).forEach((k) => { rows += "<div style='display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9'><span>" + k + "</span><b>" + dist[k] + "</b></div>"; });
    return '<div class="card"><div class="card-title">' + title + "</div>" + (rows || "<div class='muted'>—</div>") + "</div>";
  }
  async function loadAudit(box) {
    try {
      const a = await api("/admin/dashboard/audit?limit=30");
      if (!a.items.length) { box.innerHTML = '<div class="empty">暂无记录</div>'; return; }
      let rows = a.items.map((r) =>
        "<tr><td>" + fmtTime(r.created_at) + "</td><td>" + esc(r.staff_name) + "</td><td>" + esc(r.action) +
        "</td><td>" + esc(r.target_type) + (r.target_id ? "#" + esc(r.target_id) : "") + "</td><td class='muted'>" + (r.ip || "—") + "</td></tr>"
      ).join("");
      box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>时间</th><th>操作人</th><th>动作</th><th>对象</th><th>IP</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
    } catch (e) { box.innerHTML = '<div class="empty">审计加载失败</div>'; }
  }

  // ============ 用户管理 ============
  let usersState = { page: 1, q: "", plan: "", verified: "", active: "" };
  async function renderUsers(root) {
    root.innerHTML =
      '<div class="toolbar">' +
        '<input id="u-q" placeholder="手机号/昵称/公司/姓名" style="width:240px">' +
        '<select id="u-plan"><option value="">全部套餐</option><option>free</option><option>personal</option><option>professional</option><option>enterprise</option></select>' +
        '<select id="u-verified"><option value="">认证不限</option><option value="1">已认证</option><option value="0">未认证</option></select>' +
        '<select id="u-active"><option value="">状态不限</option><option value="1">启用</option><option value="0">停用</option></select>' +
        '<button class="btn-primary btn" id="u-search">查询</button>' +
      "</div>" +
      '<div id="u-box"><div class="empty">加载中…</div></div>';
    $("#u-q").value = usersState.q; $("#u-plan").value = usersState.plan;
    $("#u-verified").value = usersState.verified; $("#u-active").value = usersState.active;
    $("#u-search").onclick = () => {
      usersState.q = $("#u-q").value.trim();
      usersState.plan = $("#u-plan").value;
      usersState.verified = $("#u-verified").value;
      usersState.active = $("#u-active").value;
      usersState.page = 1;
      loadUsers();
    };
    loadUsers();

    async function loadUsers() {
      const box = $("#u-box");
      box.innerHTML = '<div class="empty">加载中…</div>';
      try {
        let qs = "?page=" + usersState.page + "&page_size=20";
        if (usersState.q) qs += "&q=" + encodeURIComponent(usersState.q);
        if (usersState.plan) qs += "&user_type=" + usersState.plan;
        if (usersState.verified) qs += "&verified=" + usersState.verified;
        if (usersState.active) qs += "&is_active=" + usersState.active;
        const d = await api("/admin/users" + qs);
        if (!d.items.length) { box.innerHTML = '<div class="empty">无匹配用户</div>'; return; }
        let rows = d.items.map((u) =>
          "<tr data-id='" + u.id + "' style='cursor:pointer'>" +
          "<td>" + u.id + "</td><td>" + esc(u.phone || "—") + "</td><td>" + esc(u.nickname || "—") + "</td>" +
          "<td>" + esc(u.company || "—") + "</td><td>" + badge(u.user_type, "b-" + u.user_type) + "</td>" +
          "<td>" + (u.verified ? badge("已认证", "b-yes") : badge("未认证", "b-no")) + "</td>" +
          "<td>" + (u.is_active ? badge("启用", "b-active") : badge("停用", "b-inactive")) + "</td>" +
          "<td class='muted'>" + fmtTime(u.created_at) + "</td></tr>"
        ).join("");
        box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>手机号</th><th>昵称</th><th>公司</th><th>套餐</th><th>认证</th><th>状态</th><th>注册时间</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
          pager(d.total, d.page, d.page_size);
        box.querySelectorAll("tbody tr").forEach((tr) => { tr.onclick = () => openUserDetail(tr.dataset.id); });
        bindPager(d, loadUsers);
      } catch (e) { box.innerHTML = '<div class="empty">加载失败：' + esc(e.message) + "</div>"; }
    }
  }

  async function openUserDetail(id) {
    const d = await api("/admin/users/" + id);
    const canEdit = hasPerm("user:edit");
    let html = '<h3>用户详情 #' + d.id + "</h3><div class='kv'>" +
      kv("手机号", esc(d.phone)) + kv("昵称", esc(d.nickname)) + kv("公司", esc(d.company)) +
      kv("角色", esc(d.role)) + kv("套餐", badge(d.user_type, "b-" + d.user_type)) +
      kv("实名", (d.verified ? badge("已认证", "b-yes") : badge("未认证", "b-no")) + (d.verify_type ? " (" + esc(d.verify_type) + ")" : "")) +
      kv("真实姓名", esc(d.real_name)) + kv("状态", d.is_active ? "启用" : "停用") +
      kv("邀请来源", esc(d.invited_by || "—")) + kv("注册", fmtTime(d.created_at)) + kv("最近登录", fmtTime(d.last_login_at)) +
      "</div>";
    if (canEdit) {
      html += '<div class="modal-actions"><button class="btn" id="u-plan-btn">改套餐</button>' +
        '<button class="btn" id="u-status-btn">' + (d.is_active ? "停用账号" : "启用账号") + "</button>" +
        '<button class="btn" id="u-verify-btn">' + (d.verified ? "取消认证" : "标记认证") + "</button></div>";
    }
    html += '<div class="modal-actions"><button class="btn" id="u-close">关闭</button></div>';
    openModal(html);
    $("#u-close").onclick = closeModal;
    if (canEdit) {
      $("#u-plan-btn").onclick = async () => {
        const t = prompt("改为套餐(free/personal/professional/enterprise)：", d.user_type);
        if (!t) return;
        try { await api("/admin/users/" + id + "/plan", { method: "POST", body: { user_type: t.trim() } }); toast("已更新套餐", "ok"); closeModal(); renderUsers($("#page")); } catch (e) { toast(e.message, "err"); }
      };
      $("#u-status-btn").onclick = async () => {
        try { await api("/admin/users/" + id + "/status", { method: "POST", body: { is_active: !d.is_active } }); toast("已更新状态", "ok"); closeModal(); renderUsers($("#page")); } catch (e) { toast(e.message, "err"); }
      };
      $("#u-verify-btn").onclick = async () => {
        try { await api("/admin/users/" + id + "/verify", { method: "POST", body: { verified: !d.verified, verify_type: "company" } }); toast("已更新认证", "ok"); closeModal(); renderUsers($("#page")); } catch (e) { toast(e.message, "err"); }
      };
    }
  }

  // ============ 邀请码 ============
  async function renderInvites(root) {
    const canCreate = hasPerm("invite:create");
    root.innerHTML =
      (canCreate ? '<div class="toolbar"><button class="btn-primary btn" id="i-gen">+ 生成邀请码</button></div>' : "") +
      '<div id="i-box"><div class="empty">加载中…</div></div>';
    if (canCreate) $("#i-gen").onclick = openGenInvite;
    loadInvites();

    async function loadInvites() {
      const box = $("#i-box");
      box.innerHTML = '<div class="empty">加载中…</div>';
      try {
        const d = await api("/admin/invites");
        const s = d.stats;
        let info = '<div class="metrics" style="margin-bottom:16px"><div class="metric"><div class="m-val">' + s.total + '</div><div class="m-label">总数</div></div>' +
          '<div class="metric"><div class="m-val">' + s.active + '</div><div class="m-label">活跃</div></div>' +
          '<div class="metric"><div class="m-val">' + s.used_total + '</div><div class="m-label">累计使用</div></div>' +
          '<div class="metric"><div class="m-val">' + s.expired + '</div><div class="m-label">已过期</div></div></div>';
        if (!d.items.length) { box.innerHTML = info + '<div class="empty">暂无邀请码</div>'; return; }
        const canRevoke = hasPerm("invite:revoke");
        let rows = d.items.map((i) =>
          "<tr data-id='" + i.id + "'>" +
          "<td><code>" + esc(i.code) + "</code></td><td>" + esc(i.note || "—") + "</td>" +
          "<td>" + (i.is_active ? badge("启用", "b-active") : badge("停用", "b-inactive")) + "</td>" +
          "<td>" + i.used_count + " / " + i.max_uses + "</td>" +
          "<td class='muted'>" + fmtTime(i.valid_until) + "</td>" +
          (canRevoke ? "<td><button class='btn btn-sm' data-toggle='" + i.id + "'>" + (i.is_active ? "停用" : "启用") + "</button></td>" : "<td></td>") +
          "</tr>"
        ).join("");
        box.innerHTML = info + '<div class="table-wrap"><table><thead><tr><th>邀请码</th><th>备注</th><th>状态</th><th>使用</th><th>有效期至</th><th>操作</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
        if (canRevoke) box.querySelectorAll("[data-toggle]").forEach((b) => {
          b.onclick = async () => {
            try { await api("/admin/invites/" + b.dataset.toggle + "/toggle", { method: "POST", body: { is_active: b.textContent.trim() === "启用" } }); toast("已切换状态", "ok"); loadInvites(); } catch (e) { toast(e.message, "err"); }
          };
        });
      } catch (e) { box.innerHTML = '<div class="empty">加载失败：' + esc(e.message) + "</div>"; }
    }
  }
  function openGenInvite() {
    openModal("<h3>生成邀请码</h3>" +
      '<div class="field"><label>数量</label><input id="g-count" type="number" min="1" max="100" value="1"></div>' +
      '<div class="field"><label>备注</label><input id="g-note" placeholder="如：小红书KOL内测"></div>' +
      '<div class="field"><label>每个码最大使用次数</label><input id="g-max" type="number" min="1" value="1"></div>' +
      '<div class="field"><label>有效天数</label><input id="g-days" type="number" min="1" value="30"></div>' +
      '<div class="modal-actions"><button class="btn" id="g-cancel">取消</button><button class="btn-primary btn" id="g-ok">生成</button></div>');
    $("#g-cancel").onclick = closeModal;
    $("#g-ok").onclick = async () => {
      const body = { count: +$("#g-count").value, note: $("#g-note").value.trim(), max_uses: +$("#g-max").value, valid_days: +$("#g-days").value };
      try { const r = await api("/admin/invites", { method: "POST", body }); toast("已生成 " + r.created.length + " 个", "ok"); closeModal(); renderInvites($("#page")); } catch (e) { toast(e.message, "err"); }
    };
  }

  // ============ 商务线索 ============
  let leadsState = { page: 1, status: "", role: "", assignee: "" };
  async function renderLeads(root) {
    root.innerHTML =
      '<div class="toolbar">' +
        '<select id="l-status"><option value="">全部状态</option><option value="pending">待处理</option><option value="contacted">已联系</option><option value="converted">已转化</option><option value="rejected">已驳回</option></select>' +
        '<input id="l-role" placeholder="角色(brand/mcn/agency…)" style="width:180px">' +
        '<input id="l-assignee" placeholder="负责人(留空=未分配)" style="width:180px">' +
        '<button class="btn-primary btn" id="l-search">查询</button>' +
      "</div><div id='l-box'><div class='empty'>加载中…</div></div>";
    $("#l-search").onclick = () => { leadsState.status = $("#l-status").value; leadsState.role = $("#l-role").value.trim(); leadsState.assignee = $("#l-assignee").value.trim(); leadsState.page = 1; loadLeads(); };
    loadLeads();

    async function loadLeads() {
      const box = $("#l-box");
      box.innerHTML = '<div class="empty">加载中…</div>';
      try {
        let qs = "?page=" + leadsState.page + "&page_size=20";
        if (leadsState.status) qs += "&status=" + leadsState.status;
        if (leadsState.role) qs += "&role=" + encodeURIComponent(leadsState.role);
        if (leadsState.assignee) qs += "&assignee=" + encodeURIComponent(leadsState.assignee);
        const d = await api("/admin/leads" + qs);
        if (!d.items.length) { box.innerHTML = '<div class="empty">无匹配线索</div>'; return; }
        let rows = d.items.map((l) =>
          "<tr data-id='" + l.id + "' style='cursor:pointer'><td>" + l.id + "</td><td>" + esc(l.company || "—") + "</td><td>" + esc(l.contact_name) + "</td>" +
          "<td>" + esc(l.role || "—") + "</td><td>" + badge(l.status, "b-" + l.status) + "</td><td>" + (l.assignee ? esc(l.assignee) : "<span class='muted'>未分配</span>") + "</td>" +
          "<td class='muted'>" + fmtTime(l.created_at) + "</td></tr>"
        ).join("");
        box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>公司</th><th>联系人</th><th>角色</th><th>状态</th><th>负责人</th><th>提交时间</th></tr></thead><tbody>' + rows + "</tbody></table></div>" + pager(d.total, d.page, d.page_size);
        box.querySelectorAll("tbody tr").forEach((tr) => { tr.onclick = () => openLeadDetail(tr.dataset.id); });
        bindPager(d, loadLeads);
      } catch (e) { box.innerHTML = '<div class="empty">加载失败：' + esc(e.message) + "</div>"; }
    }
  }

  async function openLeadDetail(id) {
    const d = await api("/admin/leads/" + id);
    const canAssign = hasPerm("lead:assign"), canEdit = hasPerm("lead:edit"), canConvert = hasPerm("lead:convert");
    let html = "<h3>线索详情 #" + d.id + "</h3><div class='kv'>" +
      kv("公司", esc(d.company)) + kv("联系人", esc(d.contact_name)) + kv("角色", esc(d.role)) +
      kv("电话", esc(d.contact_phone || "—")) + kv("邮箱", esc(d.contact_email || "—")) + kv("微信", esc(d.contact_wechat || "—")) +
      kv("意向套餐", badge(d.plan_interest, "b-" + d.plan_interest)) + kv("使用场景", esc(d.use_case || "—")) +
      kv("留言", esc(d.message || "—")) + kv("状态", badge(d.status, "b-" + d.status)) +
      kv("负责人", esc(d.assignee || "未分配")) + kv("备注", esc(d.admin_note || "—")) + kv("提交", fmtTime(d.created_at)) +
      (d.user ? kv("关联用户", "#" + d.user.id + " " + esc(d.user.phone) + " (" + badge(d.user.user_type, "b-" + d.user.user_type) + ")") : "") +
      "</div>";
    let acts = '<div class="modal-actions">';
    if (canAssign) acts += '<button class="btn" id="ld-assign">分配/认领</button>';
    if (canEdit) acts += '<button class="btn" id="ld-note">编辑备注</button><button class="btn" id="ld-status">改状态</button>';
    if (canConvert) acts += '<button class="btn-ok btn" id="ld-convert">转化为开通套餐</button>';
    acts += '<button class="btn" id="ld-close">关闭</button></div>';
    openModal(html + acts);
    $("#ld-close").onclick = closeModal;
    if (canAssign) $("#ld-assign").onclick = async () => {
      const a = prompt("分配负责人用户名(留空=取消分配)：", d.assignee || "");
      if (a === null) return;
      try { await api("/admin/leads/" + id + "/assign", { method: "POST", body: { assignee: a.trim() } }); toast("已分配", "ok"); closeModal(); renderLeads($("#page")); } catch (e) { toast(e.message, "err"); }
    };
    if (canEdit) {
      $("#ld-note").onclick = async () => {
        const n = prompt("备注：", d.admin_note || "");
        if (n === null) return;
        try { await api("/admin/leads/" + id + "/note", { method: "POST", body: { admin_note: n } }); toast("已保存", "ok"); closeModal(); renderLeads($("#page")); } catch (e) { toast(e.message, "err"); }
      };
      $("#ld-status").onclick = async () => {
        const s = prompt("状态(pending/contacted/converted/rejected)：", d.status);
        if (!s) return;
        try { await api("/admin/leads/" + id + "/status", { method: "POST", body: { status: s.trim() } }); toast("已更新", "ok"); closeModal(); renderLeads($("#page")); } catch (e) { toast(e.message, "err"); }
      };
    }
    if (canConvert) $("#ld-convert").onclick = async () => {
      if (!confirm("确认转化？将把关联用户软转为 " + (d.plan_interest || "professional") + " 套餐。")) return;
      try { await api("/admin/leads/" + id + "/convert", { method: "POST", body: {} }); toast("已转化", "ok"); closeModal(); renderLeads($("#page")); } catch (e) { toast(e.message, "err"); }
    };
  }

  // ============ 入驻审核 ============
  let intakeState = { page: 1, status: "" };
  async function renderIntake(root) {
    root.innerHTML =
      '<div class="toolbar"><select id="in-status"><option value="">全部状态</option><option value="pending_review">待审核</option><option value="approved">已通过</option><option value="rejected">已驳回</option></select>' +
      '<button class="btn-primary btn" id="in-search">查询</button></div><div id="in-box"><div class="empty">加载中…</div></div>';
    $("#in-search").onclick = () => { intakeState.status = $("#in-status").value; intakeState.page = 1; loadIntake(); };
    loadIntake();

    async function loadIntake() {
      const box = $("#in-box");
      box.innerHTML = '<div class="empty">加载中…</div>';
      try {
        let qs = "?page=" + intakeState.page + "&page_size=20";
        if (intakeState.status) qs += "&status=" + intakeState.status;
        const d = await api("/admin/intakes" + qs);
        if (!d.items.length) { box.innerHTML = '<div class="empty">无申请</div>'; return; }
        let rows = d.items.map((r) =>
          "<tr data-id='" + r.id + "' style='cursor:pointer'><td>" + r.id + "</td><td>" + esc(r.name) + "</td><td>" + esc(r.agency || "—") + "</td><td>" + esc(r.category || "—") + "</td>" +
          "<td>" + badge(r.status, "b-" + r.status) + "</td><td class='muted'>" + fmtTime(r.created_at) + "</td></tr>"
        ).join("");
        box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>艺人</th><th>经纪公司</th><th>赛道</th><th>状态</th><th>提交时间</th></tr></thead><tbody>' + rows + "</tbody></table></div>" + pager(d.total, d.page, d.page_size);
        box.querySelectorAll("tbody tr").forEach((tr) => { tr.onclick = () => openIntakeDetail(tr.dataset.id); });
        bindPager(d, loadIntake);
      } catch (e) { box.innerHTML = '<div class="empty">加载失败：' + esc(e.message) + "</div>"; }
    }
  }
  async function openIntakeDetail(id) {
    const d = await api("/admin/intakes/" + id);
    const canReview = hasPerm("intake:review");
    let html = "<h3>入驻申请 #" + d.id + (d.status !== "pending_review" ? " · " + badge(d.status, "b-" + d.status) : "") + "</h3><div class='kv'>" +
      kv("艺人名", esc(d.name)) + kv("性别", esc(d.gender || "—")) + kv("年龄", d.age || "—") + kv("生日", esc(d.birthday || "—")) +
      kv("经纪公司", esc(d.agency || "—")) + kv("赛道", esc(d.category || "—")) + kv("微博粉丝", esc(d.weibo_fans || "—")) +
      kv("抖音粉丝", esc(d.douyin_fans || "—")) + kv("人设标签", esc(d.persona_tags || "—")) + kv("联系方式", esc(d.contact || "—")) +
      kv("社媒", esc(d.social_links || "—")) + kv("提交时间", fmtTime(d.created_at)) + kv("审核备注", esc(d.review_note || "—")) +
      "</div>";
    let acts = '<div class="modal-actions">';
    if (canReview && d.status === "pending_review") acts += '<button class="btn-ok btn" id="in-approve">通过</button><button class="btn-danger btn" id="in-reject">驳回</button>';
    acts += '<button class="btn" id="in-close">关闭</button></div>';
    openModal(html + acts);
    $("#in-close").onclick = closeModal;
    if (canReview && d.status === "pending_review") {
      const doReview = async (decision) => {
        const note = prompt(decision === "approved" ? "通过备注(可选)：" : "驳回理由：", "");
        if (note === null) return;
        try { await api("/admin/intakes/" + id + "/review", { method: "POST", body: { decision, review_note: note } }); toast("已" + (decision === "approved" ? "通过" : "驳回"), "ok"); closeModal(); renderIntake($("#page")); } catch (e) { toast(e.message, "err"); }
      };
      $("#in-approve").onclick = () => doReview("approved");
      $("#in-reject").onclick = () => doReview("rejected");
    }
  }

  // ============ 双盲撮合配置台 + 员工管理 (P2) ============
  let pricingState = { page: 1, side: "", status: "" };

  // ---------- 通用表单字段 ----------
  function field(label, html) { return "<div class='field'><label>" + label + "</label>" + html + "</div>"; }

  // ---------- 员工管理 ----------
  async function renderStaff(root) {
    const canManage = hasPerm("staff:manage");
    const canPwd = hasPerm("self:password");
    root.innerHTML =
      '<div class="toolbar">' +
        (canManage ? '<button class="btn-primary btn" id="s-new">+ 新建员工</button>' : "") +
        (canPwd ? '<button class="btn" id="s-pwd">修改我的密码</button>' : "") +
      '</div>' +
      '<div id="s-box"><div class="empty">加载中…</div></div>';
    if (canManage) $("#s-new").onclick = openNewStaff;
    if (canPwd) $("#s-pwd").onclick = openChangePwd;
    loadStaff();

    async function loadStaff() {
      const box = $("#s-box");
      box.innerHTML = '<div class="empty">加载中…</div>';
      try {
        const d = await api("/admin/staff");
        if (!d.items.length) { box.innerHTML = '<div class="empty">暂无员工账号</div>'; return; }
        const me = staff.id;
        let rows = d.items.map((u) => {
          const isMe = u.id === me;
          let acts = "";
          if (canManage) {
            acts =
              "<button class='btn btn-sm' data-role='" + u.id + "'" + (isMe ? " disabled title='不能修改自己角色'" : "") + ">改角色</button> " +
              "<button class='btn btn-sm' data-status='" + u.id + "'" + (isMe ? " disabled title='不能停用自己'" : "") + ">" + (u.is_active ? "停用" : "启用") + "</button> " +
              "<button class='btn btn-sm' data-reset='" + u.id + "'>重置密码</button>";
          }
          return "<tr data-id='" + u.id + "'>" +
            "<td>" + u.id + "</td>" +
            "<td>" + esc(u.username) + "</td>" +
            "<td>" + esc(u.real_name) + "</td>" +
            "<td>" + badge(u.role_label) + "</td>" +
            "<td>" + (u.is_active ? badge("启用", "b-active") : badge("停用", "b-inactive")) + "</td>" +
            "<td class='muted'>" + fmtTime(u.created_at) + "</td>" +
            "<td class='muted'>" + fmtTime(u.last_login_at) + "</td>" +
            "<td class='nowrap'>" + (acts || "<span class='muted'>—</span>") + "</td>" +
            "</tr>";
        }).join("");
        box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>账号</th><th>姓名</th><th>角色</th><th>状态</th><th>创建</th><th>最近登录</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
        if (canManage) {
          box.querySelectorAll("[data-role]").forEach((b) => { b.onclick = () => openEditRole(b.dataset.role); });
          box.querySelectorAll("[data-status]").forEach((b) => { b.onclick = () => { const deact = b.textContent.trim() === "停用"; if (confirm("确认" + (deact ? "停用" : "启用") + "该员工账号？")) toggleStatus(b.dataset.status, deact); }; });
          box.querySelectorAll("[data-reset]").forEach((b) => { b.onclick = () => openResetPwd(b.dataset.reset); });
        }
      } catch (e) {
        box.innerHTML = '<div class="empty">加载失败：' + esc(e.message) + '</div>';
      }
    }

    function openNewStaff() {
      const roleOpts = ROLE_KEYS.map((k) => "<option value='" + k + "'>" + ROLE_LABELS[k] + "</option>").join("");
      openModal(
        "<h3>新建员工账号</h3>" +
        field("登录用户名（≥3位）", "<input id='n-user' placeholder='如：li_ming'>") +
        field("初始密码（≥8位）", "<input id='n-pwd' type='password' placeholder='至少8位'>") +
        field("真实姓名", "<input id='n-name' placeholder='如：李明'>") +
        field("角色", "<select id='n-role'>" + roleOpts + "</select>") +
        "<div class='modal-actions'><button class='btn' id='n-cancel'>取消</button><button class='btn-primary btn' id='n-ok'>创建</button></div>"
      );
      $("#n-cancel").onclick = closeModal;
      $("#n-ok").onclick = async () => {
        const body = { username: $("#n-user").value.trim(), password: $("#n-pwd").value, real_name: $("#n-name").value.trim(), role: $("#n-role").value };
        try { await api("/admin/staff", { method: "POST", body }); toast("员工已创建", "ok"); closeModal(); loadStaff(); }
        catch (e) { toast(e.message, "err"); }
      };
    }

    function openEditRole(id) {
      const roleOpts = ROLE_KEYS.map((k) => "<option value='" + k + "'>" + ROLE_LABELS[k] + "</option>").join("");
      openModal(
        "<h3>修改员工角色 #" + id + "</h3>" +
        field("新角色", "<select id='r-role'>" + roleOpts + "</select>") +
        "<div class='modal-actions'><button class='btn' id='r-cancel'>取消</button><button class='btn-primary btn' id='r-ok'>保存</button></div>"
      );
      $("#r-cancel").onclick = closeModal;
      $("#r-ok").onclick = async () => {
        try { await api("/admin/staff/" + id, { method: "PUT", body: { role: $("#r-role").value } }); toast("角色已更新", "ok"); closeModal(); loadStaff(); }
        catch (e) { toast(e.message, "err"); }
      };
    }

    function toggleStatus(id, deactivate) {
      api("/admin/staff/" + id, { method: "PUT", body: { is_active: !deactivate } })
        .then(() => { toast("已" + (deactivate ? "停用" : "启用"), "ok"); loadStaff(); })
        .catch((e) => { toast(e.message, "err"); loadStaff(); });
    }

    function openResetPwd(id) {
      openModal(
        "<h3>重置密码 #" + id + "</h3>" +
        field("新密码（≥8位）", "<input id='rp-pwd' type='password' placeholder='至少8位'>") +
        "<div class='modal-actions'><button class='btn' id='rp-cancel'>取消</button><button class='btn-primary btn' id='rp-ok'>重置</button></div>"
      );
      $("#rp-cancel").onclick = closeModal;
      $("#rp-ok").onclick = async () => {
        try { await api("/admin/staff/" + id + "/reset-password", { method: "POST", body: { new_password: $("#rp-pwd").value } }); toast("密码已重置", "ok"); closeModal(); loadStaff(); }
        catch (e) { toast(e.message, "err"); }
      };
    }
  }

  function openChangePwd() {
    openModal(
      "<h3>修改我的密码</h3>" +
      field("原密码", "<input id='cp-old' type='password'>") +
      field("新密码（≥8位）", "<input id='cp-new' type='password'>") +
      "<div class='modal-actions'><button class='btn' id='cp-cancel'>取消</button><button class='btn-primary btn' id='cp-ok'>保存</button></div>"
    );
    $("#cp-cancel").onclick = closeModal;
    $("#cp-ok").onclick = async () => {
      try {
        await api("/admin/auth/change-password", { method: "POST", body: { old_password: $("#cp-old").value, new_password: $("#cp-new").value } });
        toast("密码已修改，请重新登录", "ok"); closeModal(); logout("密码已修改，请重新登录");
      } catch (e) { toast(e.message, "err"); }
    };
  }

  // ---------- 双盲撮合配置台 ----------
  async function renderPricing(root) {
    const canConfig = hasPerm("pricing:config");
    root.innerHTML =
      '<div class="card"><div class="card-title">双盲撮合 · 推荐逻辑配置' +
        (canConfig ? '<button class="btn-sm btn btn-primary" id="p-cfg-edit">编辑权重/阈值</button>' : '<span class="sub">只读（需 pricing:config 权限）</span>') +
      '</div><div id="p-cfg-box"><div class="empty">加载中…</div></div></div>' +
      '<div class="toolbar">' +
        '<select id="p-side"><option value="">全部方向</option><option value="brand">品牌方</option><option value="artist">艺人方</option></select>' +
        '<select id="p-status"><option value="">全部状态</option><option value="open">开放</option><option value="matched">已匹配</option><option value="closed">已关闭</option></select>' +
        '<button class="btn-primary btn" id="p-search">查询</button>' +
      '</div>' +
      '<div id="p-box"><div class="empty">加载中…</div></div>';
    if (canConfig) $("#p-cfg-edit").onclick = openConfigEditor;
    $("#p-search").onclick = () => { pricingState.side = $("#p-side").value; pricingState.status = $("#p-status").value; pricingState.page = 1; loadRequests(); };
    loadConfig();
    loadRequests();

    async function loadConfig() {
      try { const c = await api("/admin/pricing/config"); $("#p-cfg-box").innerHTML = renderConfigSummary(c); }
      catch (e) { $("#p-cfg-box").innerHTML = '<div class="empty">配置加载失败：' + esc(e.message) + '</div>'; }
    }
    async function loadRequests() {
      const box = $("#p-box");
      box.innerHTML = '<div class="empty">加载中…</div>';
      try {
        let qs = "?page=" + pricingState.page + "&page_size=20";
        if (pricingState.side) qs += "&side=" + pricingState.side;
        if (pricingState.status) qs += "&status=" + pricingState.status;
        const d = await api("/admin/pricing/requests" + qs);
        if (!d.items.length) { box.innerHTML = '<div class="empty">暂无撮合请求</div>'; return; }
        let rows = d.items.map((r) =>
          "<tr data-id='" + r.id + "' style='cursor:pointer'>" +
          "<td>" + r.id + "</td>" +
          "<td>" + badge(sideLabel(r.side)) + "</td>" +
          "<td>" + esc(r.category || "—") + "</td>" +
          "<td>" + esc(r.scenario || "—") + "</td>" +
          "<td>" + badge(statusLabel(r.status), "b-" + r.status) + "</td>" +
          "<td>" + esc(r.artist_name_hint || "—") + "</td>" +
          "<td>" + (r.budget_range ? ("预算 " + esc(r.budget_range)) : (r.quote_range ? ("报价 " + esc(r.quote_range)) : "—")) + "</td>" +
          "<td class='muted'>" + fmtTime(r.created_at) + "</td>" +
          "</tr>"
        ).join("");
        box.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>方向</th><th>品类</th><th>场景</th><th>状态</th><th>匿名艺人</th><th>金额区间</th><th>提交时间</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + pager(d.total, d.page, d.page_size);
        box.querySelectorAll("tbody tr").forEach((tr) => { tr.onclick = () => openRequestDetail(tr.dataset.id); });
        bindPager(d, loadRequests);
      } catch (e) { box.innerHTML = '<div class="empty">加载失败：' + esc(e.message) + '</div>'; }
    }
  }

  function renderConfigSummary(c) {
    const w = c.weights || {}, th = c.thresholds || {};
    const pct = (x) => Math.round((x || 0) * 100) + "%";
    return '<div class="kv">' +
      kv("预算契合权重", pct(w.budget_fit)) +
      kv("品类契合权重", pct(w.category_fit)) +
      kv("风险契合权重", pct(w.risk_fit)) +
      kv("商业契合权重", pct(w.commercial_fit)) +
      kv("最低匹配阈值", (th.min_match_pct != null ? th.min_match_pct : "—") + "%") +
      kv("最高可接受风险", th.max_risk_level || "不限制") +
      kv("强制同品类", th.require_category ? "是" : "否") +
      kv("最近更新", (c.updated_by ? esc(c.updated_by) + " · " : "") + fmtTime(c.updated_at)) +
      "</div>";
  }

  function openConfigEditor() {
    api("/admin/pricing/config").then((c) => {
      const w = c.weights || {}, th = c.thresholds || {};
      const riskOpts = ["", "低风险", "中风险", "高风险"].map((r) =>
        "<option value='" + r + "'" + ((th.max_risk_level || "") === r ? " selected" : "") + ">" + (r || "不限制") + "</option>").join("");
      openModal(
        "<h3>编辑推荐逻辑配置</h3>" +
        "<p class='muted' style='margin-top:0'>权重会自动归一化为合计 100%（填入 0~1 或任意正数）。</p>" +
        field("预算契合权重 (budget_fit)", "<input id='cfg-budget' type='number' step='0.05' min='0' value='" + (w.budget_fit != null ? w.budget_fit : 0) + "'>") +
        field("品类契合权重 (category_fit)", "<input id='cfg-cat' type='number' step='0.05' min='0' value='" + (w.category_fit != null ? w.category_fit : 0) + "'>") +
        field("风险契合权重 (risk_fit)", "<input id='cfg-risk' type='number' step='0.05' min='0' value='" + (w.risk_fit != null ? w.risk_fit : 0) + "'>") +
        field("商业契合权重 (commercial_fit)", "<input id='cfg-com' type='number' step='0.05' min='0' value='" + (w.commercial_fit != null ? w.commercial_fit : 0) + "'>") +
        "<hr style='border:none;border-top:1px solid var(--line);margin:16px 0'>" +
        field("最低匹配阈值 (%)", "<input id='cfg-min' type='number' step='1' min='0' max='100' value='" + (th.min_match_pct != null ? th.min_match_pct : 20) + "'>") +
        field("最高可接受风险档", "<select id='cfg-maxrisk'>" + riskOpts + "</select>") +
        field("强制同品类", "<label style='display:inline-flex;gap:6px;align-items:center'><input id='cfg-catreq' type='checkbox'" + (th.require_category ? " checked" : "") + "> 仅推荐同品类撮合</label>") +
        "<div class='modal-actions'><button class='btn' id='cfg-cancel'>取消</button><button class='btn-primary btn' id='cfg-save'>保存</button></div>"
      );
      $("#cfg-cancel").onclick = closeModal;
      $("#cfg-save").onclick = async () => {
        const body = {
          weights: {
            budget_fit: parseFloat($("#cfg-budget").value) || 0,
            category_fit: parseFloat($("#cfg-cat").value) || 0,
            risk_fit: parseFloat($("#cfg-risk").value) || 0,
            commercial_fit: parseFloat($("#cfg-com").value) || 0,
          },
          thresholds: {
            min_match_pct: parseInt($("#cfg-min").value) || 0,
            max_risk_level: $("#cfg-maxrisk").value || null,
            require_category: $("#cfg-catreq").checked,
          },
        };
        try { await api("/admin/pricing/config", { method: "PUT", body }); toast("配置已保存", "ok"); closeModal(); renderPricing($("#page")); }
        catch (e) { toast(e.message, "err"); }
      };
    }).catch((e) => toast(e.message, "err"));
  }

  async function openRequestDetail(id) {
    const d = await api("/admin/pricing/requests/" + id);
    let recHtml;
    if (!d.recommendations.length) {
      recHtml = '<div class="empty">当前配置下无推荐匹配</div>';
    } else {
      let rows = d.recommendations.map((r, i) =>
        "<tr>" +
        "<td>" + (i + 1) + "</td>" +
        "<td>" + badge(sideLabel(r.side)) + "</td>" +
        "<td>" + esc(r.artist_name) + "</td>" +
        "<td>" + esc(r.category || "—") + "</td>" +
        "<td>" + esc(r.scenario || "—") + "</td>" +
        "<td>" + (r.match_pct != null ? r.match_pct + "%" : "—") + "</td>" +
        "<td><b>" + (r.recommend_score != null ? r.recommend_score : "—") + "</b></td>" +
        "<td>" + (r.risk_level ? badge(r.risk_level, "b-" + r.risk_level) : "—") + "</td>" +
        "<td>" + (r.heat_level ? badge(r.heat_level, "b-" + r.heat_level) : "—") + "</td>" +
        "</tr>"
      ).join("");
      recHtml = '<div class="table-wrap"><table><thead><tr><th>#</th><th>方向</th><th>匿名艺人</th><th>品类</th><th>场景</th><th>区间重叠</th><th>推荐分</th><th>风险档</th><th>热度</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    }
    const rangeTxt = (d.budget_min_wan != null)
      ? ("预算 " + Math.round(d.budget_min_wan) + "~" + Math.round(d.budget_max_wan) + "万")
      : ((d.quote_min_wan != null) ? ("报价 " + Math.round(d.quote_min_wan) + "~" + Math.round(d.quote_max_wan) + "万") : "—");
    let html = "<h3>撮合请求 #" + d.id + " " + badge(statusLabel(d.status), "b-" + d.status) + "</h3>" +
      "<div class='kv'>" +
      kv("方向", sideLabel(d.side)) +
      kv("品类", esc(d.category || "—")) +
      kv("场景", esc(d.scenario || "—")) +
      kv("金额区间", rangeTxt) +
      kv("匿名艺人提示", esc(d.artist_name_hint || "—")) +
      kv("备注", esc(d.note || "—")) +
      kv("关联艺人ID", d.artist_id != null ? ("#" + d.artist_id) : "—") +
      kv("提交时间", fmtTime(d.created_at)) +
      "</div>" +
      "<div class='card-title' style='margin-top:18px'>推荐匹配 · 基于当前配置实时计算，共 " + d.recommend_count + " 条</div>" +
      recHtml +
      "<div class='modal-actions'><button class='btn' id='rd-close'>关闭</button></div>";
    openModal(html);
    $("#rd-close").onclick = closeModal;
  }

  // ---------- 通用 ----------
  function kv(k, v) { return "<div class='k'>" + k + "</div><div class='v'>" + v + "</div>"; }
  function pager(total, page, size) {
    const pages = Math.ceil(total / size) || 1;
    return '<div class="pager"><span>共 ' + total + " 条</span><span>第 " + page + "/" + pages + " 页</span>" +
      "<button class='btn btn-sm' data-pg='prev'" + (page <= 1 ? " disabled" : "") + ">上一页</button>" +
      "<button class='btn btn-sm' data-pg='next'" + (page >= pages ? " disabled" : "") + ">下一页</button></div>";
  }
  function bindPager(d, reload) {
    const box = $("#page");
    box.querySelectorAll("[data-pg]").forEach((b) => {
      b.onclick = () => {
        if (b.disabled) return;
        if (b.dataset.pg === "prev") pageStateDec(d);
        else pageStateInc(d);
        reload();
      };
    });
  }
  // 通过当前路由状态维护翻页
  function pageStateDec(d) { setPage(Math.max(1, d.page - 1)); }
  function pageStateInc(d) { setPage(d.page + 1); }
  function setPage(p) {
    // 写入对应 state
    const key = location.hash.replace("#/", "");
    if (key === "users") usersState.page = p;
    else if (key === "leads") leadsState.page = p;
    else     if (key === "intake") intakeState.page = p;
    else if (key === "pricing") pricingState.page = p;
  }

  // ---------- 启动 ----------
  window.addEventListener("hashchange", () => { if (staff) navigate(location.hash.replace("#/", "")); });
  $("#login-btn").addEventListener("click", doLogin);
  $("#logout-btn").addEventListener("click", () => logout());
  $("#modal-layer").addEventListener("click", (e) => { if (e.target.id === "modal-layer") closeModal(); });

  // 回车键触发登录（contenteditable div 内）
  [document.getElementById("ci-user"), document.getElementById("ci-pass")].forEach(function(el) {
    if (!el) return;
    el.addEventListener("keydown", function(e) {
      if (e.key === "Enter") { e.preventDefault(); doLogin(); }
    });
  });

  // ================================================================
  // v5 核弹级：主动猎杀浏览器/扩展注入的 autofill 白条
  // 经过 v1~v4 验证：该白条不是普通 autofill 弹窗（不受 autocomplete/type/contenteditable 影响）
  // 推测为 Chrome ML 启发式检测 / 密码管理器扩展注入的 shadow DOM 或独立元素
  // ================================================================

  /* 我们自己创建的合法元素 ID 白名单 */
  var LEGACY_IDS = ["login-view","login-card","ci-user","ci-pass","login-btn",
                    "login-error","app-view","side-nav","staff-name","staff-role",
                    "logout-btn","crumb","page","modal-layer","modal-card","toast"];

  function isOurElement(el) {
    if (!el || el === document || el === document.documentElement || el === document.body) return true;
    if (LEGACY_IDS.indexOf(el.id) >= 0) return true;
    if (el.className && typeof el.className === "string") {
      var cls = el.className.split(" ");
      var known = ["login-view","login-card","login-logo","login-sub","lb",
                   "ci-input","ci-pass","login-btn","login-error","login-foot",
                   "app-view","sidebar","brand","brand-mark","brand-sub",
                   "side-nav","side-foot","staff-info","logout-btn",
                   "content","topbar","crumb","env-tag","page",
                   "modal-layer","modal-card","toast","nav-item","nav-ico"];
      for (var i = 0; i < cls.length; i++) { if (known.indexOf(cls[i]) >= 0) return true; }
    }
    return false;
  }

  /* 扫描并杀掉可疑元素 — 返回被杀数量 */
  function killInjectedElements() {
    var killed = [];
    var all = document.querySelectorAll("*");
    var card = document.getElementById("login-card");
    if (!card) return killed;

    var cardRect = card.getBoundingClientRect();
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (isOurElement(el)) continue;

      /* 检查是否是可疑的覆盖元素 */
      var style = window.getComputedStyle(el);
      var pos = style.position;
      var bg = style.backgroundColor;
      var rect = el.getBoundingClientRect();

      /* 条件：fixed/absolute 定位 + 白/浅色背景 + 与 login-card 区域重叠 + 不是我们的元素 */
      var isOverlay = ((pos === "fixed" || pos === "absolute") &&
                       rect.width > 50 && rect.height > 10 &&
                       bg && bg !== "rgba(0, 0, 0, 0)" && bg.indexOf("rgba(0, 0, 0, 0)") !== 0);

      /* 条件：在 login-card 区域内或附近，且看起来像弹窗 */
      var overlapsCard = !(rect.right < cardRect.left || rect.left > cardRect.right ||
                           rect.bottom < cardRect.top - 30 || rect.top > cardRect.bottom + 30);

      if (isOverlay && overlapsCard) {
        /* 记录诊断信息 */
        var info = { tag: el.tagName, id: el.id, cls: el.className,
                     pos: pos, bg: bg, w: Math.round(rect.width), h: Math.round(rect.height),
                     html: el.outerHTML.substring(0, 200) };
        console.warn("[AUTOFILL-KILL] Removing injected element:", info);
        killed.push(info);
        el.style.display = "none";
        el.remove();
      }
    }
    return killed;
  }

  /* 立即执行一次 + 延迟再执行（等浏览器完成注入） */
  killInjectedElements();
  setTimeout(killInjectedElements, 300);
  setTimeout(killInjectedElements, 1000);
  setTimeout(killInjectedElements, 3000);

  /* MutationObserver：持续监听 DOM 变化，发现新注入立即清除 */
  var injectObserver = new MutationObserver(function(mutations) {
    var hasNewNode = false;
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.addedNodes && m.addedNodes.length > 0) {
        for (var j = 0; j < m.addedNodes.length; j++) {
          if (m.addedNodes[j].nodeType === 1) { hasNewNode = true; break; }
        }
      }
    }
    if (hasNewNode) killInjectedElements();
  });

  /* 观察整个 body 的子树变化 */
  injectObserver.observe(document.body, { childList: true, subtree: true, attributes: true });

  /* 尝试穿透 shadow root 清理 */
  try {
    document.querySelectorAll("*").forEach(function(el) {
      if (el.shadowRoot) {
        var shadow = el.shadowRoot;
        var inner = shadow.querySelectorAll("*");
        inner.forEach(function(se) {
          var sStyle = window.getComputedStyle(se);
          if ((sStyle.position === "fixed" || sStyle.position === "absolute") &&
              se.offsetWidth > 40 && se.offsetHeight > 8) {
            console.warn("[SHADOW-KILL] Removing from shadow root:", se.tagName, se.className);
            se.remove();
          }
        });
      }
    });
  } catch(e) {}

  if (token && staff) {
    enterApp();
  } else {
    $("#app-view").hidden = true;
    $("#login-view").hidden = false;
  }
})();
