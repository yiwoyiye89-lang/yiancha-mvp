/* 艺安查管理后台 · V9b Canvas 登录（精简稳定版）
 * Canvas 绘制 = 零 DOM 文本入口 = 浏览器 autofill 无法注入白条
 */
(function () {
  "use strict";

  var API = "https://yiancha-backend.onrender.com/api/v1";
  var LS_TOKEN = "yc_token";
  var LS_STAFF = "yc_staff";

  /* ═══ Canvas 登录 ═══ */

  var cv = document.getElementById("lc");
  var ctx = cv.getContext("2d");
  var CW = 360, CH = 440;

  // 固定尺寸，不依赖 DPR
  cv.width = CW;
  cv.height = CH;
  cv.style.width = CW + "px";
  cv.style.height = CH + "px";

  var S = 0; // 0=按钮 1=用户名 2=密码 3=提交中 4=错误
  var uname = "";
  var pwdChars = [];
  var errMsg = "";
  var cursorOn = true;
  var cursorTimer = null;

  function fillRound(x, y, w, h, r, color) {
    if (r > h / 2) r = h / 2;
    if (r > w / 2) r = w / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function strokeRound(x, y, w, h, r) {
    if (r > h / 2) r = h / 2;
    if (r > w / 2) r = w / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.stroke();
  }

  function render() {
    ctx.clearRect(0, 0, CW, CH);

    // 背景
    var bg = ctx.createLinearGradient(0, 0, 0, CH);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#1d3a6b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);

    // 卡片
    var cx = 20, cy = 40, cw = 320, ch = 360;
    fillRound(cx, cy, cw, ch, 16, "#ffffff");

    // Logo
    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = "#2563eb";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("YC", CW / 2, cy + 46);

    // 副标题
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.textBaseline = "top";
    ctx.fillText("\u63a7\u5236\u53f0", CW / 2, cy + 78);

    if (S === 0 || S === 4) {
      // 按钮
      var bx = (CW - 280) / 2, by = cy + 140, bw = 280, bh = 44;
      fillRound(bx, by, bw, bh, 10, "#3b82f6");
      ctx.fillStyle = "#ffffff";
      ctx.font = "15px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(S === 4 ? "\u91cd \u8bd5" : "\u8fdb \u5165", CW / 2, by + bh / 2);

      // 错误信息
      if (S === 4 && errMsg) {
        ctx.font = "12.5px sans-serif";
        ctx.fillStyle = "#dc2626";
        ctx.textBaseline = "top";
        ctx.fillText(errMsg, CW / 2, by + bh + 14);
      }

      // 底部文字
      ctx.font = "10.5px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("YC Console \u00b7 Internal Only", CW / 2, cy + ch - 36);

    } else if (S === 1) {
      // 用户名字段
      var fy = cy + 130;
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("\u8d26\u53f7", cx + 20, fy - 6);

      var fx = cx + 20, fw = cw - 40, fh = 42;
      fillRound(fx, fy, fw, fh, 8, "#f8fafc");
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      strokeRound(fx + 1, fy + 1, fw - 2, fh - 2, 7);

      ctx.font = "14px sans-serif";
      ctx.fillStyle = uname ? "#1e293b" : "#94a3b8";
      ctx.textBaseline = "middle";
      var showUname = uname || "\u70b9\u51fb\u8f93\u5165...";
      ctx.fillText(showUname, fx + 14, fy + fh / 2);

      // 光标
      if (cursorOn) {
        var tw = ctx.measureText(uname).width;
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(fx + 16 + tw, fy + 10, 2, fh - 20);
      }

      // 底部提示
      ctx.font = "10.5px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.fillText("Enter \u786e\u8ba4 / Esc \u8fd4\u56de", CW / 2, fy + fh + 18);

    } else if (S === 2) {
      // 密码字段
      var fy2 = cy + 130;
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#1e293b";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("\u51ed\u8bc1", cx + 20, fy2 - 6);

      var fx2 = cx + 20, fw2 = cw - 40, fh2 = 42;
      fillRound(fx2, fy2, fw2, fh2, 8, "#f8fafc");
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      strokeRound(fx2 + 1, fy2 + 1, fw2 - 2, fh2 - 2, 7);

      ctx.font = "14px monospace";
      ctx.fillStyle = pwdChars.length ? "#1e293b" : "#94a3b8";
      ctx.textBaseline = "middle";
      var dots = "\u25cf".repeat(pwdChars.length);
      ctx.fillText(dots || "\u2022\u2022\u2022\u2022\u2022\u2022", fx2 + 14, fy2 + fh2 / 2);

      // 光标
      if (cursorOn) {
        var tw2 = ctx.measureText(dots).width;
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(fx2 + 16 + tw2, fy2 + 10, 2, fh2 - 20);
      }

      // 底部提示
      ctx.font = "10.5px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.fillText("Enter \u767b\u5f55 / Esc \u8fd4\u56de", CW / 2, fy2 + fh2 + 18);

    } else if (S === 3) {
      // 提交中 spinner
      var spCx = CW / 2, spCy = cy + 162, spR = 12;
      var t = Date.now() / 400;
      ctx.save();
      ctx.translate(spCx, spCy);
      ctx.rotate(t);
      for (var i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(spR - 5, 0);
        ctx.lineTo(spR, 0);
        ctx.strokeStyle = "rgba(59,130,246," + (0.3 + 0.7 * i / 8) + ")";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();

      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("\u9a8c\u8bc1\u4e2d...", spCy + 35);
    }
  }

  function startCursor() {
    stopCursor();
    cursorTimer = setInterval(function () {
      cursorOn = !cursorOn;
      render();
    }, 520);
  }

  function stopCursor() {
    if (cursorTimer) { clearInterval(cursorTimer); cursorTimer = null; }
    cursorOn = true;
  }

  // 点击检测辅助函数
  function hitBtn(mx, my) {
    var bx = (CW - 280) / 2, by = 80 + 140; // cy=80 in render... wait cy=40
    by = 40 + 140;
    return mx >= bx && mx <= bx + 280 && my >= by && my <= by + 44;
  }

  cv.addEventListener("click", function (e) {
    var r = cv.getBoundingClientRect();
    var mx = (e.clientX - r.left) * (CW / r.width);
    var my = (e.clientY - r.top) * (CH / r.height);

    if (S === 0 || S === 4) {
      var bx = (CW - 280) / 2, by = 40 + 140;
      if (mx >= bx && mx <= bx + 280 && my >= by && my <= by + 44) {
        S = 1; uname = ""; errMsg = ""; startCursor(); render(); cv.focus();
      }
    }
  });

  cv.addEventListener("touchend", function (e) {
    e.preventDefault();
    var t = e.changedTouches[0];
    var r = cv.getBoundingClientRect();
    var mx = (t.clientX - r.left) * (CW / r.width);
    var my = (t.clientY - r.top) * (CH / r.height);
    var bx = (CW - 280) / 2, by = 40 + 140;
    if ((S === 0 || S === 4) && mx >= bx && mx <= bx + 280 && my >= by && my <= by + 44) {
      S = 1; uname = ""; errMsg = ""; startCursor(); render(); cv.focus();
    }
  }, { passive: false });

  cv.addEventListener("keydown", function (e) {
    if (S === 1) {
      if (e.key === "Enter") { e.preventDefault(); if (uname.trim()) { S = 2; pwdChars = []; stopCursor(); startCursor(); render(); } return; }
      if (e.key === "Escape") { e.preventDefault(); S = 0; stopCursor(); render(); return; }
      if (e.key === "Backspace") { e.preventDefault(); uname = uname.slice(0, -1); render(); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing) {
        if (/[\w.@\-]/.test(e.key)) { e.preventDefault(); uname += e.key; render(); }
      }
    } else if (S === 2) {
      if (e.key === "Enter") { e.preventDefault(); doLogin(uname.trim(), pwdChars.join("")); return; }
      if (e.key === "Escape") { e.preventDefault(); S = 1; stopCursor(); startCursor(); render(); return; }
      if (e.key === "Backspace") { e.preventDefault(); pwdChars.pop(); render(); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing) {
        e.preventDefault(); pwdChars.push(e.key); render();
      }
    }
  });

  // IME 支持
  var composing = false;
  cv.addEventListener("compositionstart", function () { composing = true; });
  cv.addEventListener("compositionend", function (e) {
    composing = false;
    if (S === 1 && e.data) { uname += e.data; render(); }
    else if (S === 2 && e.data) { pwdChars.push.apply(pwdChars, e.data.split("")); render(); }
  });

  cv.setAttribute("tabindex", "0");

  async function doLogin(user, pass) {
    if (!user || !pass) { errMsg = "\u8bf7\u586b\u5199\u5b8c\u6574"; S = 4; stopCursor(); render(); return; }
    S = 3; stopCursor(); render();
    try {
      var res = await fetch(API + "/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.detail || "\u767b\u5931\u5931\u8d25(" + res.status + ")");
      token = data.token;
      staff = data.staff;
      localStorage.setItem(LS_TOKEN, token);
      localStorage.setItem(LS_STAFF, JSON.stringify(staff));
      enterAppDOM();
    } catch (err) {
      errMsg = err.message; S = 4; render();
    }
  }

  function enterAppDOM() {
    cv.style.display = "none";
    buildDOMApp();
  }

  /* ═══ DOM 应用（登录成功后） ═══ */

  let token = localStorage.getItem(LS_TOKEN);
  let staff = null;
  try { staff = JSON.parse(localStorage.getItem(LS_STAFF) || "null"); } catch (e) {}

  var NAV = [
    { key: "dashboard", label: "\u8fd0\u8425\u770c\u677f", ico: "\u25A6", perm: "dashboard:view", crumb: "\u8fd0\u8425\u770c\u677f" },
    { key: "users", label: "\u7528\u6237\u7ba1\u7406", ico: "\uD83D\uDC64", perm: "user:view", crumb: "\u7528\u6237\u7ba1\u7406" },
    { key: "invites", label: "\u9080\u8bf7\u7801", ico: "\u2709", perm: "invite:view", crumb: "\u9080\u8bf7\u7801\u7ba1\u7406" },
    { key: "leads", label: "\u5546\u52a1\u7ebf\u7d22", ico: "\uD83D\uDCBC", perm: "lead:view", crumb: "\u5546\u52a1\u7ebf\u7d22" },
    { key: "intake", label: "\u5165\u9a7b\u5ba1\u6838", ico: "\uD83D\uDCDD", perm: "intake:view", crumb: "\u827a\u4eba\u5165\u9a7b\u5ba1\u6838" },
    { key: "pricing", label: "\u53cc\u76f2\u64cb\u5408", ico: "\u2696", perm: "pricing:view", crumb: "\u53cc\u76f2\u5b9a\u4ef7\u64cb\u5408" },
    { key: "staff", label: "\u5458\u5de5\u7ba1\u7406", ico: "\u26DF", perm: "staff:view", crumb: "\u5458\u5de5\u7ba1\u7406" },
  ];

  var ROLE_LABELS = { super_admin: "\u8d85\u7ea7\u7ba1\u7406\u5458", operations: "\u8fd0\u8425", business: "\u5546\u52a1", risk: "\u98ce\u63a7", finance: "\u8d22\u52a1", viewer: "\u53ea\u8bfb\u8bbf\u5ba2" };
  var ROLE_KEYS = Object.keys(ROLE_LABELS);

  function $(sel, root) { return (root || document).querySelector(sel); }
  function hasPerm(p) { return staff && Array.isArray(staff.perms) && staff.perms.indexOf(p) >= 0; }
  function fmtTime(ts) {
    if (!ts) return "\u2014";
    var d = new Date(ts * 1000), p = function(n){return n<10?"0"+n:""+n};
    return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes());
  }
  function toast(msg, type) {
    var t = $("#toast"); if(!t)return;
    t.textContent = msg; t.className = "toast"+(type?" "+type:""); t.hidden=false;
    clearTimeout(t._t); t._t=setTimeout(function(){t.hidden=true},2600);
  }
  async function api(path, opts) {
    opts=opts||{}; var headers={"Content-Type":"application/json"};
    if(token) headers["Authorization"]="Bearer "+token;
    var res=await fetch(API+path,{method:opts.method||"GET",headers,body:opts.body?JSON.stringify(opts.body):undefined});
    if(res.status===401){doDOMLogout("\u51ed\u8bc1\u5df2\u5931\u6548");throw new Error("\u51ed\u8bc1\u5931\u6548");}
    if(res.status===403){var e=await res.json().catch(function(){return{}});throw new Error(e.detail||"\u6743\u9650\u4e0d\u8db3");}
    if(!res.ok){var e=await res.json().catch(function(){return{}});throw new Error(e.detail||"\u8bf7\u6c42\u5931\u8d25("+res.status+")");}
    return res.json();
  }
  function openModal(html){$("#modal-card").innerHTML=html;$("#modal-layer").hidden=false;}
  function closeModal(){$("#modal-layer").hidden=true;$("#modal-card").innerHTML="";}
  function badge(text,cls){return '<span class="badge '+(cls||'')+'">'+(text==null?'\u2014':text)+'</span>';}
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]);});}
  function kv(k,v){return "<div class='k'>"+k+"</div><div class='v'>"+v+"</div>";"}
  function field(label,html){return "<div class='field'><label>"+label+"</label>"+html+"</div>";}

  function sideLabel(s){return s==="brand"? "\u54c1\u724c\u65b9":(s==="artist"? "\u827a\u4eba\u65b9":(s||"\u2014"));}
  function statusLabel(s){return s==="open"? "\u5f00\u653e":(s==="matched"? "\u5df2\u5339\u914d":(s==="closed"? "\u5df2\u5173\u95ed":(s||"\u2014")));}

  function pager(total,page,size){
    var p=Math.ceil(total/size)||1;
    return '<div class="pager"><span>共 '+total+' 条</span><span>第 '+page+'/'+p+' 页</span>'+
      "<button class='btn btn-sm' data-pg='prev'"+(page<=1?" disabled":"")+">\u4e0a\u4e00\u9875</button>"+
      "<button class='btn btn-sm' data-pg='next'"+(page>=p?" disabled":"")+">\u4e0b\u4e00\u9875</button></div>";
  }
  function bindPager(d,reload){
    var box=$("#page");
    box.querySelectorAll("[data-pg]").forEach(function(b){
      b.onclick=function(){if(b.disabled)return;if(b.dataset.pg==="prev")pageStateDec(d);else pageStateInc(d);reload();};
    });
  }
  function pageStateDec(d){setPage(Math.max(1,d.page-1));}
  function pageStateInc(d){setPage(d.page+1);}
  function setPage(p){
    var key=location.hash.replace("#/","");
    if(key==="users") usersState.page=p;
    else if(key==="leads") leadsState.page=p;
    else if(key==="intake") intakeState.page=p;
    else if(key==="pricing") pricingState.page=p;
  }
  function metric(val,label,r1,r2){
    var rows='<div class="m-row">';if(r1)rows+="<span>"+r1+"</span>";if(r2)rows+="<span>"+r2+"</span>";rows+="</div>";
    return '<div class="metric"><div class="m-val">'+val+'</div><div class="m-label">'+label+"</div>"+rows+"</div>";
  }
  function distCard(title,dist){
    var rows="";
    Object.keys(dist).forEach(function(k){rows+="<div style='display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9'><span>"+k+"</span><b>"+dist[k]+"</b></div>";});
    return '<div class="card"><div class="card-title">'+title+"</div>"+(rows||"<div class='muted'>\u2014</div>")+"</div>";
  }

  function buildDOMApp() {
    document.body.innerHTML =
      '<aside class="sidebar">'+
        '<div class="brand"><span class="brand-mark">YC</span><span class="brand-sub">Console</span></div>'+
        '<nav id="side-nav" class="side-nav"></nav>'+
        '<div class="side-foot"><div class="staff-info"><div class="staff-name" id="staff-name">\u2014</div><div class="staff-role" id="staff-role">\u2014</div></div>'+
        '<button id="logout-btn" class="logout-btn">\u9000\u51fa</button></div></aside>'+
      '<main class="content"><header class="topbar"><div class="crumb" id="crumb">\u8fd0\u8425\u770c\u677f</div>'+
        '<div class="top-actions"><span class="env-tag">Production</span></div></header>'+
        '<section id="page" class="page"></section></main>'+
      '<div id="modal-layer" class="modal-layer" hidden><div class="modal-card" id="modal-card"></div></div>'+
      '<div id="toast" class="toast" hidden></div>';
    loadDOMStyles();
    initDOMApp();
  }

  function loadDOMStyles() {
    var css = document.createElement("style");
    css.textContent = (
      "*{margin:0;padding:0;box-sizing:border-box}"+
      "body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;color:#1e293b;display:flex;height:100vh}"+
      ".sidebar{width:230px;background:#111c34;color:#e2e8f0;display:flex;flex-direction:column;flex-shrink:0}"+
      ".brand{padding:20px;border-bottom:1px solid rgba(255,255,255,.08)}"+
      ".brand-mark{font-size:18px;font-weight:800;color:#3b82f6;letter-spacing:1px}"+
      ".brand-sub{font-size:11px;color:#64748b;margin-top:2px}"+
      ".side-nav{flex:1;padding:12px 0;overflow-y:auto}"+
      ".nav-item{padding:10px 20px;cursor:pointer;font-size:13.5px;color:#94a3b8;display:flex;align-items:center;gap:8px;transition:.15s}"+
      ".nav-item:hover,.nav-item.active{color:#fff;background:rgba(59,130,246,.12)}"+
      ".nav-ico{font-size:16px;width:22px;text-align:center}"+
      ".side-foot{padding:16px 20px;border-top:1px solid rgba(255,255,255,.08)}"+
      ".staff-info{margin-bottom:10px}"+
      ".staff-name{font-size:13px;font-weight:600}"+
      ".staff-role{font-size:11px;color:#64748b}"+
      ".logout-btn{width:100%;padding:8px;background:rgba(220,38,38,.12);color:#f87171;border:1px solid rgba(220,38,38,.2);border-radius:6px;font-size:12px;cursor:pointer}"+
      ".logout-btn:hover{background:rgba(220,38,38,.2)}"+
      ".content{flex:1;overflow-y:auto;display:flex;flex-direction:column}"+
      ".topbar{height:56px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;flex-shrink:0}"+
      ".crumb{font-size:15px;font-weight:600}"+
      ".env-tag{font-size:11px;background:#dbeafe;color:#2563eb;padding:3px 10px;border-radius:99px;font-weight:600}"+
      ".page{flex:1;padding:24px}"+
      ".card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:16px}"+
      ".card-title{font-size:14.5px;font-weight:700;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}"+
      ".sub{font-size:12px;color:#94a3b8;font-weight:400}"+
      ".metrics{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:16px}"+
      ".metric{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:18px;text-align:center}"+
      ".m-val{font-size:28px;font-weight:800;color:#1e293b}"+
      ".m-label{font-size:12px;color:#64748b;margin-top:4px}"+
      ".m-row{display:flex;justify-content:center;gap:12px;margin-top:8px;font-size:11.5px;color:#64748b}"+
      ".section-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}"+
      ".table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}"+
      "table{width:100%;border-collapse:collapse}"+
      "th{background:#f8fafc;font-weight:600;color:#475569;font-size:12.5px;text-align:left;padding:10px 14px;white-space:nowrap;border-bottom:1px solid #e2e8f0}"+
      "td{font-size:13px;padding:9px 14px;border-bottom:1px solid #f1f5f9;color:#334155}"+
      "tr:hover td{background:#f8fafc}"+
      ".badge{display:inline-block;font-size:11.5px;padding:2px 8px;border-radius:99px;font-weight:600}"+
      ".b-yes{background:#dcfce7;color:#166534}.b-no{background:#fee2e2;color:#991b1b}"+
      ".b-active{background:#dbeafe;color:#1d4ed8}.b-inactive{background:#f1f5f9;color:#64748b}"+
      ".b-free{background:#f0fdf4;color:#166534}.b-personal{background:#eff6ff;color:#1d4ed8}"+
      ".b-professional{background:#fefce8;color:#854d0e}.b-enterprise{background:#fdf4ff;color:#86198f}"+
      ".b-pending{background:#fef3c7;color:#92400e}.b-contacted{background:#dbeafe;color:#1e40af}"+
      ".b-converted{background:#dcfce7;color:#166534}.b-rejected{background:#fee2e2;color:#991b1b}"+
      ".b-open{background:#dbeafe;color:#1d4ed8}.b-matched{background:#dcfce7;color:#166534}.b-closed{background:#f1f5f9;color:#64748b}"+
      ".b-low{background:#dcfce7;color:#166534}.b-medium{background:#fef3c7;color:#92400e}.b-high{background:#fee2e2;color:#991b1b}"+
      ".kv{display:grid;grid-template-columns:120px 1fr;gap:6px 12px;padding:4px 0;font-size:13px}"+
      ".k{color:#64748b}.v{color:#1e293b}"+
      ".toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center}"+
      ".toolbar input,.toolbar select{padding:8px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:#fff}"+
      ".btn{padding:8px 16px;border:1px solid #e2e8f0;background:#fff;border-radius:6px;font-size:13px;cursor:pointer}"+
      ".btn-primary{background:#3b82f6;color:#fff;border-color:#3b82f6}"+
      ".btn-ok{background:#22c55e;color:#fff;border-color:#22c55e}"+
      ".btn-danger{background:#fff;color:#ef4444;border-color:#ef4444}"+
      ".btn:hover{opacity:.88}"+
      ".btn:disabled{opacity:.5;cursor:default}"+
      ".btn-sm{padding:5px 10px;font-size:11.5px}"+
      ".empty{text-align:center;color:#94a3b8;padding:28px;font-size:13.5px}"+
      ".muted{color:#94a3b8;font-size:12px}"+
      ".modal-layer{position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;z-index:50}"+
      ".modal-card{background:#fff;border-radius:14px;width:560px;max-width:92vw;max-height:88vh;overflow-y:auto;padding:24px}"+
      ".modal-actions{display:flex;gap:8px;margin-top:18px;flex-wrap:wrap}"+
      ".field{margin-bottom:12px}.field>label{display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:4px}"+
      ".field input,.field select{width:100%;padding:9px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:13.5px}"+
      ".toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#111c34;color:#fff;padding:11px 20px;border-radius:10px;font-size:13px;z-index:99;box-shadow:0 8px 24px rgba(0,0,0,.3)}"+
      ".pager{display:flex;gap:10px;align-items:center;justify-content:center;margin-top:14px;font-size:12.5px;color:#64748b}"+
      ".nowrap{white-space:nowrap}"
    );
    document.head.appendChild(css);
  }

  function initDOMApp() {
    $("#logout-btn").addEventListener("click", function(){doDOMLogout();});
    $("#modal-layer").addEventListener("click",function(e){if(e.target.id==="modal-layer")closeModal();});
    renderNav();
    var hash = location.hash.replace("#/","") || "dashboard";
    navigate(hash);
    window.addEventListener("hashchange", function(){
      if(staff) navigate(location.hash.replace("#/",""));
    });
  }

  function doDOMLogout(msg){
    token=null;staff=null;
    localStorage.removeItem(LS_TOKEN);localStorage.removeItem(LS_STAFF);
    location.reload();
  }

  function renderNav(){
    var nav=$("#side-nav");
    nav.innerHTML="";
    NAV.forEach(function(n){
      if(!hasPerm(n.perm)) return;
      var a=document.createElement("div");
      a.className="nav-item";a.dataset.key=n.key;
      a.innerHTML='<span class="nav-ico">'+n.ico+'</span>'+n.label;
      a.onclick=function(){location.hash="#/"+n.key;};
      nav.appendChild(a);
    });
  }

  function navigate(key){
    var nav=NAV.find(function(n){return n.key===key;});
    if(!nav||!hasPerm(nav.perm)){key="dashboard";}
    document.querySelectorAll(".nav-item").forEach(function(el){
      el.classList.toggle("active",el.dataset.key===key);
    });
    var item=NAV.find(function(n){return n.key===key;});
    $("#crumb").textContent=item?item.crumb:key;
    var page=$("#page");
    page.innerHTML="";
    if(key==="dashboard") return renderDashboard(page);
    if(key==="users") return renderUsers(page);
    if(key==="invites") return renderInvites(page);
    if(key==="leads") return renderLeads(page);
    if(key==="intake") return renderIntake(page);
    if(key==="pricing") return renderPricing(page);
    if(key==="staff") return renderStaff(page);
  }

  // ============ Dashboard ============
  async function renderDashboard(root){
    root.innerHTML='<div class="empty">\u52a0\u8f7d\u4e2d...</div>';
    try{
      var d=await api("/admin/dashboard");
      var u=d.users,l=d.leads,it=d.intakes,iv=d.invites,pr=d.pricing;
      root.innerHTML=
        '<div class="metrics">'+
          metric(u.total,"\u6ce8\u518c\u7528\u6237","\u4eca\u65e0\u65b0 <b>"+u.today_new+"</b>","\u5df2\u8ba4\u8bc1 <b>"+u.verified+"</b>")+
          metric(l.total,"\u5546\u52a1\u7ebf\u7d22","\u5f85\u5904\u7406 <b>"+(l.dist.pending||0)+"</b>","\u672a\u5206\u914d <b>"+l.unassigned+"</b>")+
          metric(it.total,"\u5165\u9a7b\u7533\u8bf7","\u5f85\u5ba1 <b>"+(it.dist.pending_review||0)+"</b>","\u5df2\u901a\u8fc7 <b>"+(it.dist.approved||0)+"</b>")+
          metric(iv.total,"\u9080\u8bf7\u7801","\u6d3b\u8dc3 <b>"+iv.active+"</b>")+
          metric(pr.total,"\u53cc\u76f2\u64cb\u5408","\u5f00\u653e <b>"+(pr.dist.open||0)+"</b>","\u5df2\u5339\u914d <b>"+(pr.dist.matched||0)+"</b>")+
        '</div>'+
        '<div class="section-grid" style="margin-top:18px">'+
          distCard("\u7528\u6237\u5957\u9910\u5206\u5e03",u.plan_dist)+
          distCard("\u7ebf\u7d22\u72b6\u6001\u5206\u5e03",l.dist)+
          distCard("\u5165\u9a7b\u5ba1\u6838\u5206\u5e03",it.dist)+
          distCard("\u53cc\u76f2\u72b6\u6001\u5206\u5e03",pr.dist)+
        '</div>'+
        '<div class="card" style="margin-top:18px"><div class="card-title">\u6700\u8fd1\u5ba1\u8ba1\u65e5\u5fd7 <span class="sub">\u64cd\u4f5c\u7559\u75d5</span></div>'+
          '<div id="audit-box"><div class="empty">\u52a0\u8f7d\u4e2d...</div></div></div>';
      loadAudit($("#audit-box"));
    }catch(e){root.innerHTML='<div class="empty">\u52a0\u8f7d\u5931\u8d25\uff1a'+esc(e.message)+'</div>';}
  }
  async function loadAudit(box){
    try{
      var a=await api("/admin/dashboard/audit?limit=30");
      if(!a.items.length){box.innerHTML='<div class="empty">\u6682\u65e0\u8bb0\u5f55</div>';return;}
      var rows=a.items.map(function(r){
        return "<tr><td>"+fmtTime(r.created_at)+"</td><td>"+esc(r.staff_name)+"</td><td>"+esc(r.action)+
        "</td><td>"+esc(r.target_type)+(r.target_id?"#"+esc(r.target_id):"")+"</td><td class='muted'>"+(r.ip||"\u2014")+"</td></tr>";
      }).join("");
      box.innerHTML='<div class="table-wrap"><table><thead><tr><th>\u65f6\u95f4</th><th>\u64cd\u4f5c\u4eba</th><th>\u52a8\u4f5c</th><th>\u5bf9\u8c61</th><th>IP</th></tr></thead><tbody>'+rows+"</tbody></table></div>";
    }catch(e){box.innerHTML='<div class="empty">\u5ba1\u8ba1\u52a0\u8f7d\u5931\u8d25</div>';}
  }

  // ============ Users ============
  var usersState={page:1,q:"",plan:"",verified:"",active:""};
  async function renderUsers(root){
    root.innerHTML=
      '<div class="toolbar">'+
        '<input id="u-q" placeholder="\u624b\u673a\u53f7/\u6635\u79f0/\u516c\u53f8/\u59d3\u540d" style="width:240px">'+
        '<select id="u-plan"><option value="">\u5168\u90e8\u5957\u9910</option><option>free</option><option>personal</option><option>professional</option><option>enterprise</option></select>'+
        '<select id="u-verified"><option value="">\u8ba4\u8bc1\u4e0d\u9650</option><option value="1">\u5df2\u8ba4\u8bc1</option><option value="0">\u672a\u8ba4\u8bc1</option></select>'+
        '<select id="u-active"><option value="">\u72b6\u6001\u4e0d\u9650</option><option value="1">\u542f\u7528</option><option value="0">\u0501\u7528</option></select>'+
        '<button class="btn-primary btn" id="u-search">\u67e5\u8be2</button>'+
      '</div>'+
      '<div id="u-box"><div class="empty">\u52a0\u8f7d\u4e2d...</div></div>';
    $("#u-q").value=usersState.q;$("#u-plan").value=usersState.plan;
    $("#u-verified").value=usersState.verified;$("#u-active").value=usersState.active;
    $("#u-search").onclick=function(){
      usersState.q=$("#u-q").value.trim();usersState.plan=$("#u-plan").value;
      usersState.verified=$("#u-verified").value;usersState.active=$("#u-active").value;
      usersState.page=1;loadUsers();
    };loadUsers();

    async function loadUsers(){
      var box=$("#u-box");
      box.innerHTML='<div class="empty">\u52a0\u8f7d\u4e2d...</div>';
      try{
        var qs="?page="+usersState.page+"&page_size=20";
        if(usersState.q)qs+="&q="+encodeURIComponent(usersState.q);
        if(usersState.plan)qs+="&user_type="+usersState.plan;
        if(usersState.verified)qs+="&verified="+usersState.verified;
        if(usersState.active)qs+="&is_active="+usersState.active;
        var d=await api("/admin/users"+qs);
        if(!d.items.length){box.innerHTML='<div class="empty">\u65e0\u5339\u914d\u7528\u6237</div>';return;}
        var rows=d.items.map(function(u){
          return "<tr data-id='"+u.id+"' style='cursor:pointer'>"+
          "<td>"+u.id+"</td><td>"+esc(u.phone||"\u2014")+"</td><td>"+esc(u.nickname||"\u2014")+"</td>"+
          "<td>"+esc(u.company||"\u2014")+"</td><td>"+badge(u.user_type,"b-"+u.user_type)+"</td>"+
          "<td>"+(u.verified?badge("\u5df2\u8ba4\u8bc1","b-yes"):badge("\u672a\u8ba4\u8bc1","b-no"))+"</td>"+
          "<td>"+(u.is_active?badge("\u542f\u7528","b-active"):badge("\u0501\u7528","b-inactive"))+"</td>"+
          "<td class='muted'>"+fmtTime(u.created_at)+"</td></tr>";
        }).join("");
        box.innerHTML='<div class="table-wrap"><table><thead><tr><th>ID</th><th>\u624b\u673a\u53f7</th><th>\u6635\u79f0</th><th>\u516c\u53f8</th><th>\u5957\u9910</th><th>\u8ba4\u8bc1</th><th>\u72b6\u6001</th><th>\u6ce8\u518c\u65f6\u95f4</th></tr></thead><tbody>'+rows+"</tbody></table></div>"+pager(d.total,d.page,d.page_size);
        box.querySelectorAll("tbody tr").forEach(function(tr){tr.onclick=function(){openUserDetail(tr.dataset.id);};});
        bindPager(d,loadUsers);
      }catch(e){box.innerHTML='<div class="empty">\u52a0\u8f7d\u5931\u8d25\uff1a'+esc(e.message)+'</div>';}
    }
  }
  async function openUserDetail(id){
    var d=await api("/admin/users/"+id);
    var canEdit=hasPerm("user:edit");
    var html='<h3>\u7528\u6237\u8be6\u60c5 #'+d.id+"</h3><div class='kv'>"+
      kv("\u624b\u673a\u53f7",esc(d.phone))+kv("\u6635\u79f0",esc(d.nickname))+kv("\u516c\u53f8",esc(d.company))+
      kv("\u89d2\u8272",esc(d.role))+kv("\u595套\u9910",badge(d.user_type,"b-"+d.user_type))+
      kv("\u5b9e\u540d",(d.verified?badge("\u5df2\u8ba4\u8bc1","b-yes"):badge("\u672a\u8ba4\u8bc1","b-no"))+(d.verify_type?" ("+esc(d.verify_type)+")":""))+
      kv("\u771f\u5b9e\u59d3\u540d",esc(d.real_name))+kv("\u72b6\u6001",d.is_active?"\u542f\u7528":"\u0501\u7528")+
      kv("\u9080\u8bf7\u6765\u6e90",esc(d.invited_by||"\u2014"))+kv("\u6ce8\u518c",fmtTime(d.created_at))+kv("\u6700\u8fd1\u767b\u5f55",fmtTime(d.last_login_at))+
      "</div>";
    if(canEdit){
      html+='<div class="modal-actions"><button class="btn" id="u-plan-btn">\u6539\u595套\u9910</button>'+
        '<button class="btn" id="u-status-btn">'+(d.is_active?"\u0501\u7528\u8d26\u53f7":"\u542f\u7528\u8d26\u53f7")+"</button>"+
        '<button class="btn" id="u-verify-btn">'+(d.verified?"\u53d6\u6d88\u8ba4\u8bc1":"\u6807\u8bb0\u8ba4\u8bc1")+"</button></div>";
    }
    html+='<div class="modal-actions"><button class="btn" id="u-close">\u5173\u95ed</button></div>';
    openModal(html);
    $("#u-close").onclick=closeModal;
    if(canEdit){
      $("#u-plan-btn").onclick=async function(){
        var t=prompt("\u6539\u4e3a\u595套\u9910(free/personal/professional/enterprise)\uff1a",d.user_type);
        if(!t)return;
        try{await api("/admin/users/"+id+"/plan",{method:"POST",body:{user_type:t.trim()}});toast("\u5df2\u66f4\u65b0\u595套\u9910","ok");closeModal();renderUsers($("#page"));}catch(e){toast(e.message,"err");}
      };
      $("#u-status-btn").onclick=async function(){
        try{await api("/admin/users/"+id+"/status",{method:"POST",body:{is_active:!d.is_active}});toast("\u5df2\u66f4\u65b0\u72b6\u6001","ok");closeModal();renderUsers($("#page"));}catch(e){toast(e.message,"err");}
      };
      $("#u-verify-btn").onclick=async function(){
        try{await api("/admin/users/"+id+"/verify",{method:"POST",body:{verified:!d.verified,verify_type:"company"});toast("\u5df2\u66f4\u65b0\u8ba4\u8bc1","ok");closeModal();renderUsers($("#page"));}catch(e){toast(e.message,"err");}
      };
    }
  }

  // ============ Invites ============
  async function renderInvites(root){
    var canCreate=hasPerm("invite:create");
    root.innerHTML=
      (canCreate?'<div class="toolbar"><button class="btn-primary btn" id="i-gen">+ \u751f\u6210\u9080\u8bf7\u7801</button></div':"")+
      '<div id="i-box"><div class="empty">\u52a0\u8f7d\u4e2d...</div></div>';
    if(canCreate)$("#i-gen").onclick=openGenInvite;
    loadInvites();

    async function loadInvites(){
      var box=$("#i-box");
      box.innerHTML='<div class="empty">\u52a0\u8f7d\u4e2d...</div>';
      try{
        var d=await api("/admin/invites");
        var s=d.stats;
        var info='<div class="metrics" style="margin-bottom:16px"><div class="metric"><div class="m-val">'+s.total+'</div><div class="m-label">\u603b\u6570</div></div>'+
          '<div class="metric"><div class="m-val">'+s.active+'</div><div class="m-label">\u6d3b\u8dc3</div></div>'+
          '<div class="metric"><div class="m-val">'+s.used_total+'</div><div class="m-label">\u7d2f\u8ba1\u4f7f\u7528</div></div>'+
          '<div class="metric"><div class="m-val">'+s.expired+'</div><div class="m-label">\u5df2\u8fc7\u671f</div></div></div>';
        if(!d.items.length){box.innerHTML=info+'<div class="empty">\u6682\u65e0\u9080\u8bf7\u7801</div>';return;}
        var canRevoke=hasPerm("invite:revoke");
        var rows=d.items.map(function(i){
          return "<tr data-id='"+i.id+"'>"+
          "<td><code>"+esc(i.code)+"</code></td><td>"+esc(i.note||"\u2014")+"</td>"+
          "<td>"+(i.is_active?badge("\u542f\u7528","b-active"):badge("\u0501\u7528","b-inactive"))+"</td>"+
          "<td>"+i.used_count+" / "+i.max_uses+"</td>"+
          "<td class='muted'>"+fmtTime(i.valid_until)+"</td>"+
          (canRevoke?"<td><button class='btn btn-sm' data-toggle='"+i.id+"'>"+(i.is_active?"\u0501\u7528":"\u542f\u7528")+"</button></td>":"<td></td>")+
          "</tr>";
        }).join("");
        box.innerHTML=info+'<div class="table-wrap"><table><thead><tr><th>\u9080\u8bf7\u7801</th><th>\u5907\u6ce8</th><th>\u72b6\u6001</th><th>\u4f7f\u7528</th><th>\u6709\u6548\u671f</th><th>\u64cd\u4f5c</th></tr></thead><tbody>'+rows+"</tbody></table></div>";
        if(canRevoke)box.querySelectorAll("[data-toggle]").forEach(function(b){
          b.onclick=async function(){
            try{await api("/admin/invites/"+b.dataset.toggle+"/toggle",{method:"POST",body:{is_active:b.textContent.trim()==="\u542f\u7528"}});toast("\u5df2\u5207\u6362\u72b6\u6001","ok");loadInvites();}catch(e){toast(e.message,"err");}
          };
        });
      }catch(e){box.innerHTML='<div class="empty">\u52a0\u8f7d\u5931\u8d25\uff1a'+esc(e.message)+'</div>';}
    }
  }
  function openGenInvite(){
    openModal("<h3>\u751f\u6210\u9080\u8bf7\u7801</h3>"+
      field("\u6570\u91cf","<input id='g-count' type='number' min='1' max='100' value='1'>")+
      field("\u5907\u6ce8","<input id='g-note' placeholder='\u5982\uff1a\u5c0f\u7ea2\u4e66KOL\u5185\u6d4b'>")+
      field("\u5355\u4e2a\u7801\u6700\u5927\u4f7f\u7528\u6b21\u6570","<input id='g-max' type='number' min='1' value='1'>")+
      field("\u6709\u6548\u5929\u6570","<input id='g-days' type='number' min='1' value='30'>")+
      "<div class='modal-actions'><button class='btn' id='g-cancel'>\u53d6\u6d88</button><button class='btn-primary btn' id='g-ok'>\u751f\u6210</button></div>");
    $("#g-cancel").onclick=closeModal;
    $("#g-ok").onclick=async function(){
      var body={count:+$("#g-count").value,note:$("#g-note").value.trim(),max_uses:+$("#g-max").value,valid_days:+$("#g-days").value};
      try{var r=await api("/admin/invites",{method:"POST",body});toast("\u5df2\u751f\u6210 "+r.created.length+" \u4e2a","ok");closeModal();renderInvites($("#page"));}catch(e){toast(e.message,"err");}
    };
  }

  // ============ Leads ============
  var leadsState={page:1,status:"",role:"",assignee:""};
  async function renderLeads(root){
    root.innerHTML=
      '<div class="toolbar">'+
        '<select id="l-status"><option value="">\u5168\u90e8\u72b6\u6001</option><option value="pending">\u5f85\u5904\u7406</option><option value="contacted">\u5df2\u8054\u7cfb</option><option value="converted">\u5df2\u8f6c\u5316</option><option value="rejected">\u5df2\u9a73\u56de</option></select>'+
        '<input id="l-role" placeholder="\u89d2\u8272(brand/mcn/agency\u2026)" style="width:180px">'+
        '<input id="l-assignee" placeholder="\u8d1f\u8d23\u4eba(\u7559\u7a7a=\u672a\u5206\u914d)" style="width:180px">'+
        '<button class="btn-primary btn" id="l-search">\u67e5\u8be2</button>'+
      "</div><div id='l-box'><div class='empty'>\u52a0\u8f7d\u4e2d...</div></div>";
    $("#l-search").onclick=function(){leadsState.status=$("#l-status").value;leadsState.role=$("#l-role").value.trim();leadsState.assignee=$("#l-assignee").value.trim();leadsState.page=1;loadLeads();};
    loadLeads();

    async function loadLeads(){
      var box=$("#l-box");
      box.innerHTML='<div class="empty">\u52a0\u8f7d\u4e2d...</div>';
      try{
        var qs="?page="+leadsState.page+"&page_size=20";
        if(leadsState.status)qs+="&status="+leadsState.status;
        if(leadsState.role)qs+="&role="+encodeURIComponent(leadsState.role);
        if(leadsState.assignee)qs+="&assignee="+encodeURIComponent(leadsState.assignee);
        var d=await api("/admin/leads"+qs);
        if(!d.items.length){box.innerHTML='<div class="empty">\u65e0\u5339\u914d\u7ebf\u7d22</div>';return;}
        var rows=d.items.map(function(l){
          return "<tr data-id='"+l.id+"' style='cursor:pointer'><td>"+l.id+"</td><td>"+esc(l.company||"\u2014")+"</td><td>"+esc(l.contact_name)+"</td>"+
          "<td>"+esc(l.role||"\u2014")+"</td><td>"+badge(l.status,"b-"+l.status)+"</td><td>"+(l.assignee?esc(l.assignate):"<span class='muted'>\u672a\u5206\u914d</span>")+"</td>"+
          "<td class='muted'>"+fmtTime(l.created_at)+"</td></tr>";
        }).join("");
        box.innerHTML='<div class="table-wrap"><table><thead><tr><th>ID</th><th>\u516c\u53f8</th><th>\u8054\u7cfb\u4eba</th><th>\u89d2\u8272</th><th>\u72b6\u6001</th><th>\u8d1d\u8d23\u4eba</th><th>\u63d0\u4ea4\u65f6\u95f4</th></tr></thead><tbody>'+rows+"</tbody></table></div>"+pager(d.total,d.page,d.page_size);
        box.querySelectorAll("tbody tr").forEach(function(tr){tr.onclick=function(){openLeadDetail(tr.dataset.id);};});
        bindPager(d,loadLeads);
      }catch(e){box.innerHTML='<div class="empty">\u52a0\u8f7d\u5931\u8d25\uff1a'+esc(e.message)+'</div>';}
    }
  }
  async function openLeadDetail(id){
    var d=await api("/admin/leads/"+id);
    var canAssign=hasPerm("lead:assign"),canEdit=hasPerm("lead:edit"),canConvert=hasPerm("lead:convert");
    var html="<h3>\u7ebf\u7d22\u8be6\u60c5 #"+d.id+"</h3><div class='kv'>"+
      kv("\u516c\u53f8",esc(d.company))+kv("\u8054\u7cfb\u4eba",esc(d.contact_name))+kv("\u89d2\u8272",esc(d.role))+
      kv("\u7535\u8bdd",esc(d.contact_phone||"\u2014"))+kv("\u90ae\u7bb1",esc(d.contact_email||"\u2014"))+kv("\u5fae\u4fe1",esc(d.contact_wechat||"\u2014"))+
      kv("\u610f\u5411\u595套\u9910",badge(d.plan_interest,"b-"+d.plan_interest))+kv("\u4f7c\u7528\u573a\u666f",esc(d.use_case||"\u2014"))+
      kv("\u7559\u8a00",esc(d.message||"\u2014"))+kv("\u72b6\u6001",badge(d.status,"b-"+d.status))+
      kv("\u8d1d\u8d23\u4eba",esc(d.assignee)||"\u672a\u5206\u914d")+kv("\u5907\u6ce8",esc(d.admin_note||"\u2014"))+kv("\u63d0\u4ea4",fmtTime(d.created_at))+
      (d.user?kv("\u5173\u8054\u7528\u6237","#"+d.user.id+" "+esc(d.phone)+" ("+badge(d.user.user_type,"b-"+d.user.user_type)+")"):"")+
      "</div>";
    var acts='<div class="modal-actions">';
    if(canAssign) acts+='<button class="btn" id="ld-assign">\u5206\u914d/\u8ba4\u9886</button>';
    if(canEdit) acts+='<button class="btn" id="ld-note">\u7f16\u8f91\u5907\u6ce8</button><button class="btn" id="ld-status">\u6539\u72b6\u6001</button>';
    if(canConvert) acts+='<button class="btn-ok btn" id="ld-convert">\u8f6c\u5316\u4e3a\u5f00\u901a\u595套\u9910</button>';
    acts+='<button class="btn" id="ld-close">\u5173\u95ed</button></div>';
    openModal(html+acts);
    $("#ld-close").onclick=closeModal;
    if(canAssign)$("#ld-assign").onclick=async function(){
      var a=prompt("\u5206\u914d\u8d1d\u8d23\u4eba\u7528\u6237\u540d(\u7559\u7a7a=\u53d6\u6d88\u5206\u914d)\uff1a",d.assignee||"");
      if(a===null)return;
      try{await api("/admin/leads/"+id+"/assign",{method:"POST",body:{assignee:a.trim()}});toast("\u5df2\u5206\u914d","ok");closeModal();renderLeads($("#page"));}catch(e){toast(e.message,"err");}
    };
    if(canEdit){
      $("#ld-note").onclick=async function(){
        var n=prompt("\u5907\u6ce8\uff1a",d.admin_note||"");
        if(n===null)return;
        try{await api("/admin/leads/"+id+"/note",{method:"POST",body:{admin_note:n}});toast("\u5df2\u4fdd\u5b58","ok");closeModal();renderLeads($("#page"));}catch(e){toast(e.message,"err");}
      };
      $("#ld-status").onclick=async function(){
        var s=prompt("\u72b6\u6001(pending/contacted/converted/rejected)\uff1a",d.status);
        if(!s)return;
        try{await api("/admin/leads/"+id+"/status",{method:"POST",body:{status:s.trim()}});toast("\u5df2\u66f4\u65b0\u72b6\u6001","ok");closeModal();renderLeads($("#page"));}catch(e){toast(e.message,"err");}
      };
    }
    if(canConvert)$("#ld-convert").onclick=async function(){
      if(confirm("\u786e\u8ba4\u8f6c\u5316\uff1f\u5c06\u628a\u5173\u8054\u7528\u6237\u8f6c\u4e3b "+(d.plan_interest||"professional")+" \u595套\u9910\u3002"))return;
      try{await api("/admin/leads/"+id+"/convert",{method:"POST",body:{}});toast("\u5df2\u8f6c\u5316","ok");closeModal();renderLeads($("#page"));}catch(e){toast(e.message,"err");}
    };
  }

  // ============ Intake ============
  var intakeState={page:1,status:""};
  async function renderIntake(root){
    root.innerHTML=
      '<div class="toolbar"><select id="in-status"><option value="">\u5168\u90e8\u72b6\u6001</option><option value="pending_review">\u5f85\u5ba1\u6838</option><option value="approved">\u5df2\u901a\u8fc7</option><option value="rejected">\u5df2\u9a73\u56de</option></select>'+
      '<button class="btn-primary btn" id="in-search">\u67e5\u8be2</button></div><div id="in-box"><div class="empty">\u52a0\u8f7d\u4e2d...</div></div>';
    $("#in-search").onclick=function(){intakeState.status=$("#in-status").value;intakeState.page=1;loadIntake();};loadIntake();

    async function loadIntake(){
      var box=$("#in-box");
      box.innerHTML='<div class="empty">\u52a0\u8f7d\u4e2d...</div>';
      try{
        var qs="?page="+intakeState.page+"&page_size=20";
        if(intakeState.status)qs+="&status="+intakeState.status;
        var d=await api("/admin/intakes"+qs);
        if(!d.items.length){box.innerHTML='<div class="empty">\u65e0\u7533\u8bf7</div>';return;}
        var rows=d.items.map(function(r){
          return "<tr data-id='"+r.id+"' style='cursor:pointer'><td>"+r.id+"</td><td>"+esc(r.name)+"</td><td>"+esc(r.agency||"\u2014")+"</td><td>"+esc(r.category||"\u2014")+"</td>"+
          "<td>"+badge(r.status,"b-"+r.status)+"</td><td class='muted'>"+fmtTime(r.created_at)+"</td></tr>";
        }).join("");
        box.innerHTML='<div class="table-wrap"><table><thead><tr><th>ID</th><th>\u827a\u4eba</th><th>\u7ecf\u7eaa\u516c\u53f8</th><th>\u8d5b\u9053</th><th>\u72b6\u6001</th><th>\u63d0\u4ea4\u65f6\u95f4</th></tr></thead><tbody>'+rows+"</tbody></table></div>"+pager(d.total,d.page,d.page_size);
        box.querySelectorAll("tbody tr").forEach(function(tr){tr.onclick=function(){openIntakeDetail(tr.dataset.id);};});
        bindPager(d,loadIntake);
      }catch(e){box.innerHTML='<div class="empty">\u52a0\u8f7d\u5931\u8d25\uff1a'+esc(e.message)+'</div>';}
    }
  }
  async function openIntakeDetail(id){
    var d=await api("/admin/intakes/"+id);
    var canReview=hasPerm("intake:review");
    var html="<h3>\u5165\u9a7b\u7533\u8bf7 #"+d.id+(d.status!=="pending_review?" \u00b7 "+badge(d.status,"b-"+d.status):"")+"</h3><div class='kv'>"+
      kv("\u827a\u4eba\u540d",esc(d.name))+kv("\u6027\u522b",esc(d.gender||"\u2014"))+kv("\u5e74\u9f84",d.age||"\u2014")+kv("\u751f\u65e5",esc(d.birthday||"\u2014"))+
      kv("\u7ecf\u7eaa\u516c\u53f8",esc(d.agency||"\u2014"))+kv("\u8d5b\u9053",esc(d.category||"\u2014"))+kv("\u5fae\u535a\u7c89\u4e1d",esc(d.weibo_fans||"\u2014"))+
      kv("\u6296\u97f3\u7c89\u4e1d",esc(d.douyin_fans||"\u2014"))+kv("\u4eba\u8bbe\u6807\u7b7e",esc(d.persona_tags||"\u2014"))+kv("\u8054\u7cfb\u65b9\u5f0f",esc(d.contact||"\u2014"))+
      kv("\u793e\u5a92",esc(d.social_links||"\u2014"))+kv("\u63d0\u4ea4\u65f6\u95f4",fmtTime(d.created_at))+kv("\u5ba1\u6838\u5907\u6ce8",esc(d.review_note||"\u2014"))+
      "</div>";
    var acts='<div class="modal-actions">';
    if(canReview&&d.status==="pending_review") acts+='<button class="btn-ok btn" id="in-approve">\u901a\u8fc7</button><button class="btn-danger btn" id="in-reject">\u9a73\u56de</button>';
    acts+='<button class="btn" id="in-close">\u5173\u95ed</button></div>';
    openModal(html+acts);
    $("#in-close").onclick=closeModal;
    if(canReview&&d.status==="pending_review"){
      var doReview=async function(decision){
        var note=prompt(decision==="approved?"\u901a\u8fc7\u5907\u6ce8(\u9009\u586b)\uff1a":"\u9a73\u56de\u7406\u7531\uff1a","");
        if(note===null)return;
        try{await api("/admin/intakes/"+id+"/review",{method:"POST",body:{decision,review_note:note}});toast("\u5df2"+(decision==="approved?"\u901a\u8fc7":"\u9a73\u56de"),"ok");closeModal();renderIntake($("#page"));}catch(e){toast(e.message,"err");}
      };
      $("#in-approve").onclick=function(){doReview("approved");};
      $("#in-reject").onclick=function(){doReview("rejected");};
    }
  }

  // ============ Staff & Pricing ============
  var pricingState={page:1,side:"",status:""};

  async function renderStaff(root){
    var canManage=hasPerm("staff:manage"),canPwd=hasPerm("self:password");
    root.innerHTML=
      '<div class="toolbar">'+
        (canManage?'<button class="btn-primary btn" id="s-new">+ \u65b0\u5efa\u5458\u5de5</button':"")+
        (canPwd?'<button class="btn" id="s-pwd">\u4fee\u6539\u6211\u7684\u5bc6\u7801</button':"")+
      '</div><div id="s-box"><div class="empty">\u52a0\u8f7d\u4e2d...</div></div>';
    if(canManage)$("#s-new").onclick=openNewStaff;
    if(canPwd)$("#s-pwd").onclick=openChangePwd;
    loadStaff();

    async function loadStaff(){
      var box=$("#s-box");
      box.innerHTML='<div class="empty">\u52a0\u8f7d\u4e2d...</div>';
      try{
        var d=await api("/admin/staff");
        if(!d.items.length){box.innerHTML='<div class="empty">\u6682\u65e0\u5458\u5de5\u8d26\u53f7</div>';return;}
        var me=staff.id;
        var rows=d.items.map(function(u){
          var isMe=u.id===me,acts="";
          if(canManage){
            acts="<button class='btn btn-sm' data-role='"+u.id+"'"+(isMe?' disabled title='\u4e0d\u80fd\u4fee\u6539\u81ea\u5df1\u89d2\u8272'':"")+">\u6539\u89d2\u8272</button> "+
              "<button class='btn btn-sm' data-status='"+u.id+"'"+(isMe?' disabled title='\u4e0d\u80fd\u0501\u7528\u81ea\u5df1'':"")+">"+(u.is_active?"\u0501\u7528":"\u542f\u7528")+"</button> "+
              "<button class='btn btn-sm' data-reset='"+u.id+"'>\u91cd\u7f6e\u5bc6\u7801</button>";
          }
          return "<tr data-id='"+u.id+"'>"+
            "<td>"+u.id+"</td><td>"+esc(u.username)+"</td><td>"+esc(u.real_name)+"</td>"+
            "<td>"+badge(u.role_label)+"</td>"+
            "<td>"+(u.is_active?badge("\u542f\u7528","b-active"):badge("\u0501\u7528","b-inactive"))+"</td>"+
            "<td class='muted'>"+fmtTime(u.created_at)+"</td><td class='muted'>"+fmtTime(u.last_login_at)+"</td>"+
            "<td class='nowrap'>"+(acts||"<span class='muted'>\u2014</span>")+"</td></tr>";
        }).join("");
        box.innerHTML='<div class="table-wrap"><table><thead><tr><th>ID</th><th>\u8d26\u53f7</th><th>\u59d3\u540d</th><th>\u89d2\u8272</th><th>\u72b6\u6001</th><th>\u521b\u5efa</th><th>\u6700\u8fd1\u767b\u5f55</th><th>\u64cd\u4f5c</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
        if(canManage){
          box.querySelectorAll("[data-role]").forEach(function(b){b.onclick=function(){openEditRole(b.dataset.role);};});
          box.querySelectorAll("[data-status]").forEach(function(b){var deact=b.textContent.trim()==="\u0501\u7528";if(confirm("\u786e\u8ba4"+(deact?"\u0501\u7528":"\u542f\u7528")+"\u8be5\u5458\u5de5\u8d26\u53f7\uff1f"))toggleStatus(b.dataset.id,deact);};});
          box.querySelectorAll("[data-reset]").forEach(function(b){b.onclick=function(){openResetPwd(b.dataset.reset);};});
        }
      }catch(e){box.innerHTML='<div class="empty">\u52a0\u8f7d\u5931\u8d25\uff1a'+esc(e.message)+'</div>';}
    }

    function openNewStaff(){
      var roleOpts=ROLE_KEYS.map(function(k){return "<option value='"+k+"'>"+ROLE_LABELS[k]+"</option>";}).join("");
      openModal(
        "<h3>\u65b0\u5efa\u5458\u5de5\u8d26\u53f7</h3>"+
        field("\u767b\u5f55\u7528\u6237\u540d(\u22653)",'<input id="n-user" placeholder="\u5982\uff1ali_ming">')+
        field("\u521d\u59cb\u5bc6\u7801(\u22658\u4f4d)",'<input id="n-pwd" type="password" placeholder="\u81f3\u5c1184\u4f4d">')+
        field("\u771f\u5b9e\u59d3\u540d",'<input id="n-name" placeholder="\u5982\uff1a\u676e\u660e">')+
        field("\u89d2\u8272",'<select id="n-role">'+roleOpts+"</select>")+
        "<div class='modal-actions'><button class='btn' id='n-cancel'>\u53d6\u6d88</button><button class='btn-primary btn' id='n-ok'>\u521b\u5efa</button></div>"
      );
      $("#n-cancel").onclick=closeModal;
      $("#n-ok").onclick=async function(){
        var body={username:$("#n-user").value.trim(),password:$("#n-pwd").value,real_name:$("#n-name").value.trim(),role:$("#n-role").value};
        try{await api("/admin/staff",{method:"POST",body});toast("\u5458\u5de5\u5df2\u521b\u5efa","ok");closeModal();loadStaff();}
        catch(e){toast(e.message,"err");}
      };
    }

    function openEditRole(id){
      var roleOpts=ROLE_KEYS.map(function(k){return "<option value='"+k+"'>"+ROLE_LABELS[k]+"</option>";}).join("");
      openModal(
        "<h3>\u4fee\u6539\u5458\u5de5\u89d2\u8272 #"+id+"</h3>"+
        field("\u65b0\u89d2\u8272",'<select id="r-role">'+roleOpts+"</select>")+
        "<div class='modal-actions'><button class='btn' id='r-cancel'>\u53d6\u6d88</button><button class='btn-primary btn' id='r-ok'>\u4fdd\u5b58</button></div>"
      );
      $("#r-cancel").onclick=closeModal;
      $("#r-ok").onclick=async function(){
        try{await api("/admin/staff/"+id,{method:"PUT",body:{role:$("#r-role").value}});toast("\u89d2\u8272\u5df2\u66f4\u65b0","ok");closeModal();loadStaff();}
        catch(e){toast(e.message,"err");}
      };
    }

    function toggleStatus(id,deactivate){
      api("/admin/staff/"+id,{method:"PUT",body:{is_active:!deactivate}})
        .then(function(){toast("\u5df2"+(deactivate?"\u0501\u7528":"\u542f\u7528"),"ok");loadStaff();})
        .catch(function(e){toast(e.message,"err");loadStaff();});
    }

    function openResetPwd(id){
      openModal(
        "<h3>\u91cd\u7f6e\u5bc6\u7801 #"+id+"</h3>"+
        field("\u65b0\u5bc6\u7801(\u22658\u4f4d)",'<input id="rp-pwd" type="password" placeholder="\u81f3\u5c1184\u4f4d">')+
        "<div class='modal-actions'><button class='btn' id='rp-cancel'>\u53d6\u6d88</button><button class='btn-primary btn' id='rp-ok'>\u91cd\u7f6e</button></div>"
      );
      $("#rp-cancel").onclick=closeModal;
      $("#rp-ok").onclick=async function(){
        try{await api("/admin/staff/"+id+"/reset-password",{method:"POST",body:{new_password:$("#rp-pwd").value}});toast("\u5bc6\u7801\u5df2\u91cd\u7f6e","ok");closeModal();loadStaff();}
        catch(e){toast(e.message,"err");}
      };
    }
  }

  function openChangePwd(){
    openModal(
      "<h3>\u4fee\u6539\u6211\u7684\u5bc6\u7801</h3>"+
      field("\u539f\u5bc6\u7801",'<input id="cp-old" type="password">')+
      field("\u65b0\u5bc6\u7801(\u22658\u4f4d)",'<input id="cp-new" type="password">')+
      "<div class='modal-actions'><button class='btn' id='cp-cancel'>\u53d6\u6d88</button><button class='btn-primary btn' id='cp-ok'>\u4fdd\u5b58</button></div>"
    );
    $("#cp-cancel").onclick=closeModal;
    $("#cp-ok").onclick=async function(){
      try{await api("/admin/auth/change-password",{method:"POST",body:{old_password:$("#cp-old").value,new_password:$("#cp-new").value}});toast("\u5bc6\u7801\u5df2\u4fee\u6539\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55","ok");closeModal();doDOMLogout();}
      catch(e){toast(e.message,"err");}
    };
  }

  // ============ Pricing ============
  async function renderPricing(root){
    var canConfig=hasPerm("pricing:config");
    root.innerHTML=
      '<div class="card"><div class="card-title">\u53cc\u76f2\u64cb\u5408 \u00b7 \u63a8\u8350\u903b\u8f91\u914d\u7f6e'+
        (canConfig?'<button class="btn-sm btn btn-primary" id="p-cfg-edit">\u7f16\u8f91\u6743\u91cd/\u9608\u503c</button>':'<span class="sub">\u53ea\u8bfb(\u9700 pricing:config \u6743\u9650)</span>')+
      '</div><div id="p-cfg-box"><div class="empty">\u52a0\u8f7d\u4e2d...</div></div></div>'+
      '<div class="toolbar">'+
        '<select id="p-side"><option value="">\u5168\u90e8\u65b9\u5411</option><option value="brand">\u54c1\u724c\u65b9</option><option value="artist">\u827a\u4eba\u65b9</option></select>'+
        '<select id="p-status"><option value="">\u5168\u90e8\u72b6\u6001</option><option value="open">\u5f00\u653e</option><option value="matched">\u5df2\u5339\u914d</option><option value="closed">\u5df2\u5173\u95ed</option></select>'+
        '<button class="btn-primary btn" id="p-search">\u67e5\u8be2</button>'+
      '</div><div id="p-box"><div class="empty">\u52a0\u8f7d\u4e2d...</div></div>';
    if(canConfig)$("#p-cfg-edit").onclick=openConfigEditor;
    $("#p-search").onclick=function(){pricingState.side=$("#p-side").value;pricingState.status=$("#p-status").value;pricingState.page=1;loadRequests();};
    loadConfig();loadRequests();

    async function loadConfig(){
      try{var c=await api("/admin/pricing/config");$("#p-cfg-box").innerHTML=renderConfigSummary(c);}
      catch(e){$("#p-cfg-box").innerHTML='<div class="empty">\u914d\u7f6e\u52a0\u8f7d\u5931\u8d25\uff1a'+esc(e.message)+'</div>';}
    }
    async function loadRequests(){
      var box=$("#p-box");
      box.innerHTML='<div class="empty">\u52a0\u8f7d\u4e2d...</div>';
      try{
        var qs="?page="+pricingState.page+"&page_size=20";
        if(pricingState.side)qs+="&side="+pricingState.side;
        if(pricingState.status)qs+="&status="+pricingState.status;
        var d=await api("/admin/pricing/requests"+qs);
        if(!d.items.length){box.innerHTML='<div class="empty">\u6682\u65e0\u64cb\u5408\u8bf7\u6c42</div>';return;}
        var rows=d.items.map(function(r){
          return "<tr data-id='"+r.id+"' style='cursor:pointer'>"+
          "<td>"+r.id+"</td><td>"+badge(sideLabel(r.side))+"</td><td>"+esc(r.category||"\u2014")+"</td>"+
          "<td>"+esc(r.scenario||"\u2014")+"</td><td>"+badge(statusLabel(r.status),"b-"+r.status)+"</td>"+
          "<td>"+esc(r.artist_name_hint||"\u2014")+"</td>"+
          "<td>"+(r.budget_min_wan!=null?("\u9884\u7b97 "+Math.round(r.budget_min_wan)+"~"+Math.round(r.budget_max_wan)+"\u4e07"):(r.quote_min_wan!=null?("\u62a5\u4ef7 "+Math.round(r.quote_min_wan)+"~"+Math.round(r.quote_max_wan)+"\u4e07"):"\u2014"))+"</td>"+
          "<td class='muted'>"+fmtTime(r.created_at)+"</td></tr>";
        }).join("");
        box.innerHTML='<div class="table-wrap"><table><thead><tr><th>ID</th><th>\u65b9\u5411</th><th>\u54c1\u7c7b</th><th>\u573a\u666f</th><th>\u72b6\u6001</th><th>\u533f\u540d\u827a\u4eba</th><th>\u91d1\u989d\u533a\u95f4</th><th>\u63d0\u4ea4\u65f6\u95f4</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+pager(d.total,d.page,d.page_size);
        box.querySelectorAll("tbody tr").forEach(function(tr){tr.onclick=function(){openRequestDetail(tr.dataset.id);};});
        bindPager(d,loadRequests);
      }catch(e){box.innerHTML='<div class="empty">\u52a0\u8f7d\u5931\u8d25\uff1a'+esc(e.message)+'</div>';}
    }
  }

  function renderConfigSummary(c){
    var c=c||{},w=c.weights||{},th=c.thresholds||{};
    var pct=function(x){return Math.round((x||0)*100)+"%";};
    return '<div class="kv">'+
      kv("\u9884\u7b97\u5951\u5408\u6743\u91cd",pct(w.budget_fit))+
      kv("\u54c1\u7c7b\u5951\u5408\u6743\u91cd",pct(w.category_fit))+
      kv("\u98ce\u9669\u5951\u5408\u6743\u91cd",pct(w.risk_fit))+
      kv("\u5546\u4e1a\u5951\u5408\u6743\u91cd",pct(w.commercial_fit))+
      kv("\u6700\u4f4e\u5339\u914d\u9608\u503c",(th.min_match_pct!=null?th.min_match_pct:"\u2014")+"%")+
      kv("\u6700\u9ad8\u53ef\u63a5\u53d7\u98ce\u9669",th.max_risk_level||"\u4e0d\u9650\u5236")+
      kv("\u5f3a\u5236\u540c\u54c1\u7c7b",th.require_category?"\u662f":"\u5426")+
      kv("\u6700\u8fd1\u66f4\u65b0",(c.updated_by?esc(c.updated_name)+" \u00b7 ":"")+fmtTime(c.updated_at))+
      "</div>";
  }

  function openConfigEditor(){
    api("/admin/pricing/config").then(function(c){
      var c=c||{},w=c.weights||{},th=c.thresholds||{};
      var riskOpts=["","\u4f4e\u98ce\u9669","\u4e2d\u98ce\u9669","\u9ad8\u98ce\u9669"].map(function(r){
        return "<option value='"+r+"'"+((th.max_risk_level||"")===r?" selected":"")+">"+(r||"\u4e0d\u9650\u5236")+"</option>";
      }).join("");
      openModal(
        "<h3>\u7f16\u8f91\u63a8\u8350\u903b\u8f91\u914d\u7f6e</h3>"+
        "<p class='muted' style='margin-top:0'>\u6743\u91cd\u4f1a\u81ea\u52a8\u5f52\u4e00\u5316\u4e3a\u5408\u8ba1 100%\uff08\u586b\u5165 0~1 \u6216\u4efb\u610f\u6b63\u6570\uff09\u3002</p>"+
        field("\u9884\u7b97\u5951\u5408 (budget_fit)","<input id='cfg-budget' type='number' step='0.05' min='0' value='"+(w.budget_fit!=null?w.budget_fit:0)+"'>")+
        field("\u54c1\u7c7b\u5951\u5408 (category_fit)","<input id='cfg-cat' type='number' step='0.05' min='0' value='"+(w.category_fit!=null?w.category_fit:0)+"'>")+
        field("\u98ce\u9669\u5951\u5408 (risk_fit)","<input id='cfg-risk' type='number' step='0.05' min='0' value='"+(w.risk_fit!=null?w.risk_fit:0)+"'>")+
        field("\u5546\u4e1a\u5951\u5408 (commercial_fit)","<input id='cfg-com' type='number' step='0.05' min='0' value '"+(w.commercial_fit!=null?w.commercial_fit:0)+"'>")+
        "<hr style='border:none;border-top:1px solid #e2e8f0;margin:16px 0'>"+
        field("\u6700\u4f4e\u5339\u914d\u9608\u503c (%)","<input id='cfg-min' type='number' step='1' min='0' max='100' value='"+(th.min_match_pct!=null?th.min_match_pct:20)+"'>")+
        field("\u6700\u9ad8\u53ef\u63a5\u53d7\u98ce\u9669\u6863","<select id='cfg-maxrisk'>"+riskOpts+"</select>")+
        field("\u5f3a\u5236\u540c\u54c1\u7c7b","<label style='display:inline-flex;gap:6px;align-items:center'><input id='cfg-catreq' type='checkbox'"+(th.require_category?" checked":"")+"> \u4ec5\u63a8\u8350\u540c\u54c1\u7c7b\u64cb\u5408</label>")+
        "<div class='modal-actions'><button class='btn' id='cfg-cancel'>\u53d6\u6d88</button><button class='btn-primary btn' id='cfg-save'>\u4fdd\u5b58</button></div>"
      );
      $("#cfg-cancel").onclick=closeModal;
      $("#cfg-save").onclick=async function(){
        var body={
          weights:{budget_fit:parseFloat($("#cfg-budget").value)||0,category_fit:parseFloat($("#cfg-cat").value)||0,risk_fit:parseFloat($("#cfg-risk").value)||0,commercial_fit:parseFloat($("#cfg-com").value)||0},
          thresholds:{min_match_pct:parseInt($("#cfg-min").value)||0,max_risk_level:$("#cfg-maxrisk").value||null,require_category:$("#cfg-catreq").checked}
        };
        try{await api("/admin/pricing/config",{method:"PUT",body});toast("\u914d\u7f6e\u5df2\u4fdd\u5b58","ok");closeModal();renderPricing($("#page"));}
        catch(e){toast(e.message,"err");}
      };
    }).catch(function(e){toast(e.message,"err");});
  }

  async function openRequestDetail(id){
    var d=await api("/admin/pricing/requests/"+id);
    var recHtml;
    if(!d.recommendations.length){
      recHtml='<div class="empty">\u5f53\u524d\u914d\u7f6e\u4e0b\u65e0\u63a8\u8350\u5339\u914d</div>';
    }else{
      var rows=d.recommendations.map(function(r,i){
        return "<tr>"+
        "<td>"+(i+1)+"</td><td>"+badge(sideLabel(r.side))+"</td><td>"+esc(r.artist_name)+"</td>"+
        "<td>"+esc(r.category||"\u2014")+"</td><td>"+esc(r.scenario||"\u2014")+"</td>"+
        "<td>"+(r.match_pct!=null?r.match_pct+"%":"\u2014")+"</td><td><b>"+(r.recommend_score!=null?r.recommend_score:"\u2014")+"</b></td>"+
        "<td>"+(r.risk_level?badge(r.risk_level,"b-"+r.risk_level):"\u2014")+"</td>"+
        "<td>"+(r.heat_level?badge(r.heat_level,"b-"+r.heat_level):"\u2014")+"</td></tr>";
      }).join("");
      recHtml='<div class="table-wrap"><table><thead><tr><th>#</th><th>\u65b9\u5411</th><th>\u533f\u540d\u827a\u4eba</th><th>\u54c1\u7c7b</th><th>\u573a\u666f</th><th>\u533a\u95f4\u91cd\u53e0</th><th>\u63a8\u8350\u5206</th><th>\u98ce\u9669\u6863</th><th>\u70ed\u5ea6</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
    }
    var rangeTxt=(d.budget_min_wan!=null)?("\u9884\u7b97 "+Math.round(d.budget_min_wan)+"~"+Math.round(d.budget_max_wan)+"\u4e07"):((d.quote_min_wan!=null)?("\u62a5\u4ef7 "+Math.round(d.quote_min_wan)+"~"+Math.round(d.quote_max_wan)+"\u4e07"):"\u2014");
    var html="<h3>\u64cb\u5408\u8bf7\u6c42 #"+d.id+" "+badge(statusLabel(d.status),"b-"+d.status)+"</h3>"+
      "<div class='kv'>"+kv("\u65b9\u5411",sideLabel(d.side))+kv("\u54c1\u7c7b",esc(d.category||"\u2014"))+kv("\u573a\u666f",esc(d.scenario||"\u2014"))+
      kv("\u91d1\u989d\u533a\u95f4",rangeTxt)+kv("\u533f\u540d\u827a\u4eba\u63d0\u793a",esc(d.artist_name_hint||"\u2014"))+
      kv("\u5907\u6ce8",esc(d.note||"\u2014"))+kv("\u5173\u8054\u827a\u4ebaID",d.artist_id!=null?"#"+d.artist_id:"\u2014")+
      kv("\u63d0\u4ea4",fmtTime(d.created_at))+"</div>"+
      "<div class='card-title' style='margin-top:18px'>\u63a8\u8350\u5339\u914d \u00b7 \u57fa\u4e8e\u5f53\u524d\u914d\u7f6e\u5b9e\u65f6\u8ba1\u7b97\uff0c\u5171 "+d.recommend_count+" \u6761</div>"+
      recHtml+"<div class='modal-actions'><button class='btn' id='rd-close'>\u5173\u95ed</button></div>";
    openModal(html);$("#rd-close").onclick=closeModal;
  }

  /* ═══ 启动 ═══ */
  render();

  if (token && staff) {
    enterAppDOM();
  }
})();
