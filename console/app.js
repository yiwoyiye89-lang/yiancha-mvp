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
    { key: "pricing", label: "双盲撮合", ico: "⚖", perm: "pricing:view", crumb: "双盲定价撮合(P2)" },
  ];

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

  // ---------- 登录 / 登出 ----------
  async function doLogin(e) {
    e.preventDefault();
    const btn = $("#login-btn");
    btn.disabled = true; $("#login-error").textContent = "";
    try {
      const res = await fetch(API + "/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: $("#username").value.trim(), password: $("#password").value }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "登录失败");
      }
      const data = await res.json();
      token = data.token; staff = data.staff;
      localStorage.setItem(LS_TOKEN, token);
      localStorage.setItem(LS_STAFF, JSON.stringify(staff));
      enterApp();
    } catch (err) {
      $("#login-error").textContent = err.message;
    } finally {
      btn.disabled = false;
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

  // ============ 双盲撮合(P2 占位) ============
  function renderPricing(root) {
    root.innerHTML = '<div class="card"><div class="card-title">双盲定价撮合 · P2 模块</div>' +
      '<p class="muted">该模块（双盲撮合列表 + 推荐逻辑配置台）已规划，按既定优先级排在 P2 阶段，本次未实现。</p>' +
      '<p>可用的接口权限点：<code>pricing:view</code>（查看撮合）、<code>pricing:config</code>（配置推荐逻辑）。后端 <code>pricing_requests</code> 表已就绪，P2 阶段可在此基础上搭建撮合榜单与权重配置台。</p></div>';
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
    else if (key === "intake") intakeState.page = p;
  }

  // ---------- 启动 ----------
  window.addEventListener("hashchange", () => { if (staff) navigate(location.hash.replace("#/", "")); });
  $("#login-form").addEventListener("submit", doLogin);
  $("#logout-btn").addEventListener("click", () => logout());
  $("#modal-layer").addEventListener("click", (e) => { if (e.target.id === "modal-layer") closeModal(); });

  if (token && staff) {
    enterApp();
  } else {
    $("#app-view").hidden = true;
    $("#login-view").hidden = false;
  }
})();
