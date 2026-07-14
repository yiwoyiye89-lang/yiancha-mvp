/* YC Console V10 - Canvas background + DOM overlay
 * Canvas draws background only (kills autofill white bar)
 * All UI uses standard DOM (reliable rendering) */
(function () {
  "use strict";

  var API = "https://yiancha-backend.onrender.com/api/v1";
  var LS_TOKEN = "yc_token";
  var LS_STAFF = "yc_staff";
  var token = localStorage.getItem(LS_TOKEN);
  var staff = null;
  try { staff = JSON.parse(localStorage.getItem(LS_STAFF) || "null"); } catch (e) { staff = null; }

  /* ---- Canvas Background (prevents autofill injection) ---- */
  var cv = document.getElementById("bg");
  function drawBg() {
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    var ctx = cv.getContext("2d");
    var g = ctx.createLinearGradient(0, 0, cv.width, cv.height);
    g.addColorStop(0, "#0f172a");
    g.addColorStop(1, "#1d3a6b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cv.width, cv.height);
  }
  drawBg();
  window.addEventListener("resize", drawBg);

  /* ---- Login ---- */
  var $ = function (id) { return document.getElementById(id); };
  var uEl = $("u");
  var pEl = $("p");
  var lb = $("lb");
  var le = $("le");

  /* Password mask for contenteditable */
  var pwdRaw = "";
  pEl.addEventListener("focus", function () {
    if (!pEl.dataset.init) {
      pEl.dataset.init = "1";
      /* Store existing text as raw if any */
      var t = pEl.textContent;
      pwdRaw = t;
      renderPwd();
    }
  }, true);
  pEl.addEventListener("input", function () {
    /* Get latest character difference */
    var display = pEl.textContent;
    /* If user deleted chars */
    if (display.length < pwdRaw.length) {
      pwdRaw = pwdRaw.substring(0, display.length);
    } else if (display.length > pwdRaw.length) {
      /* User typed new chars */
      pwdRaw += display.substring(pwdRaw.length);
    }
    renderPwd();
  });
  function renderPwd() {
    /* Save cursor position - approximate by always appending at end */
    var dots = "\u25CF".repeat(pwdRaw.length);
    pEl.textContent = dots;
    /* Place cursor at end */
    var sel = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(pEl);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  /* Prevent paste from showing plain text in password field */
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
    lb.disabled = true; lb.textContent = "登录中...";
    try {
      var res = await fetch(API + "/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.detail || ("登录失败(" + res.status + ")"));
      token = data.token;
      staff = data.staff;
      localStorage.setItem(LS_TOKEN, token);
      localStorage.setItem(LS_STAFF, JSON.stringify(staff));
      enterApp();
    } catch (err) {
      le.textContent = err.message;
      lb.disabled = false; lb.textContent = "登 录";
    }
  }

  lb.addEventListener("click", doLogin);
  /* Enter key to submit */
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
    lb.disabled = false; lb.textContent = "登 录";
    drawBg();
  }

  /* ---- App View (post-login) ---- */
  var navItems = [
    { id: "dashboard", label: "\u4eea\u8868\u76d8", roles: ["super_admin","analyst","operator"] },
    { id: "artists",   label: "\u827a\u4eba\u7ba1\u7406", roles: ["super_admin","analyst","operator"] },
    { id: "events",    label: "\u98ce\u9669\u4e8b\u4ef6", roles: ["super_admin","analyst"] },
    { id: "commercial",label: "\u5546\u4e1a\u4ef7\u503c", roles: ["super_admin","analyst","operator"] },
    { id: "reports",   label: "\u62a5\u544a\u5bfc\u51fa", roles: ["super_admin","analyst","operator"] },
    { id: "monitor",   label: "\u76d1\u63a7\u544a\u8b66", roles: ["super_admin","analyst"] },
    { id: "users",     label: "\u7528\u6237\u7ba1\u7406", roles: ["super_admin"] },
  ];
  var permsMap = {};
  function hasPerm(p) { return !token ? false : (staff.role === "super_admin" || (permsMap[p]||[]).length > 0); }

  function api(method, path, body) {
    var opts = { method: method, headers: { "Authorization": "Bearer " + token } };
    if (body) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    return fetch(API + path, opts).then(function(r){ if(!r.ok)throw Object.assign(new Error("HTTP "+r),{status:r.status}); return r.json(); });
  }

  function showToast(msg, type) {
    var t = $("toast"); t.className = "toast-" + (type||"info"); t.textContent = msg; t.hidden = false;
    clearTimeout(t._t); t._t = setTimeout(function(){ t.hidden=true; },2500);
  }

  var modal = { layer:$("modal-layer"),title:$("modal-title"),body:$("modal-body"),foot:$("modal-foot") };
  function openModal(title, html) {
    modal.title.textContent = title; modal.body.innerHTML = html||""; modal.foot.innerHTML='<button id="modal-close">\u5173\u95ed</button>';
    modal.layer.hidden=false; $("modal-close").onclick=closeModal;
  }
  function closeModal() { modal.layer.hidden=true; }
  modal.layer.addEventListener("click",function(e){if(e.target.id==="modal-layer")closeModal();});

  function navigate(pageId) {
    document.querySelectorAll("#nav-list li").forEach(function(li){li.classList.toggle("active",li.dataset.id===pageId);});
    var c=$("content");c.innerHTML='<div style="padding:40px;text-align:center;color:#94a3b8">\u52a0\u8f7d\u4e2d...</div>';
    switch(pageId){
      case "dashboard":renderDashboard(c);break;
      case "artists":renderArtists(c);break;
      case "events":renderEvents(c);break;
      case "commercial":renderCommercial(c);break;
      case "reports":renderReports(c);break;
      case "monitor":renderMonitor(c);break;
      case "users":renderUsers(c);break;
      default:c.innerHTML='<div style="padding:40px;text-align:center;color:#94a3b8\">\u9875\u9762\u5f00\u53d1\u4e2d';break;
    }
  }

  function enterApp() {
    $("login-view").style.display = "none";
    $("app-view").hidden = false;
    $("top-bar").innerHTML = '<span>\u6b22\u8fce\uff0c'+(staff.name||staff.username)+'</span>'
      +'<span style="color:#94a3b8;font-size:12px">'+(staff.role||"")+'</span>';
    var ul=$("nav-list");ul.innerHTML="";
    navItems.forEach(function(item){
      if(item.roles.indexOf(staff.role)!==-1){
        var li=document.createElement("li");li.dataset.id=item.id;li.textContent=item.label;
        li.addEventListener("click",function(){navigate(item.id);});ul.appendChild(li);
      }
    });
    if(ul.children[0])ul.children[0].classList.add("active");
    var firstVisible=navItems.find(function(i){return i.roles.indexOf(staff.role)!==-1});
    navigate(firstVisible?firstVisible.id:"dashboard");
    /* Hide canvas to free resources */
    cv.style.display="none";
  }

  /* ===== Page Renders ===== */

  function renderDashboard(c){
    api("GET","/admin/dashboard/summary").then(function(d){
      var h='<h2 style="margin-bottom:16px">\u4eea\u8868\u76d8</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px">';
      var cards=[
        {l:"\u827a\u4eba\u603b\u6570",v:d.total_artists||0,c:"badge-s"},
        {l:"\u98ce\u9669\u4e8b\u4ef6",v:d.total_events||0,c:"badge-a"},
        {l:"\u9ad8\u98ce\u9669",v:d.high_risk||0,c:"badge-c"},
        {l:"\u4eca\u65e5\u65b0\u589e",v:d.today_new||0,c:"badge-b"},
      ];
      cards.forEach(function(x){h+='<div style="background:#fff;border-radius:10px;padding:18px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08)"><div style="font-size:22px;font-weight:700;color:#334155">'+x.v+'</div><div style="font-size:12px;color:#94a3b8;margin-top:4px">'+x.l+'</div></div>';});
      h+='</div>';
      if(d.recent_events&&d.recent_events.length){
        h+='<h3 style="margin:16px 0 10px">\u6700\u65b0\u98ce\u9669</h3><table><tr><th>\u827a\u4eba</th><th>\u4e8b\u4ef6</th><th>\u7ea7\u522b</th><th>\u65f6\u95f4</th></tr>';
        d.recent_events.forEach(function(e){
          h+='<tr><td>'+(e.artist_name||"-")+'</td><td>'+(e.event_type||"-")+'</td><td><span class="badge badge-'+(e.risk_level||'c')+'">'+(e.risk_level||'?').toUpperCase()+'</span></td><td>'+(e.event_date||"-")+'</td></tr>';
        });h+='</table>';
      }
      c.innerHTML=h||'<p style="color:#94a3b8">\u6682\u65e0\u6570\u636e</p>';
    }).catch(function(){c.innerHTML='<p style="color:#ef4444">\u52a0\u8f7d\u5931\u8d25</p>';});
  }

  function renderArtists(c){
    c.innerHTML='<h2 style="margin-bottom:16px">\u827a\u4eba\u7ba1\u7406</h2>'
      +'<div style="display:flex;gap:8px;margin-bottom:14px">'
      +'<input placeholder="\u641c\u7d22\u827a\u4eba..." id="artist-q" style="flex:1;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px">'
      +'<select id="artist-fl" style="padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px"><option value="">\u6240\u6709\u7ea7\u522b</option><option>S</option><option>A</option><option>B</option><option>C</option></select>'
      +'<button class="btn btn-primary" onclick="window.__searchArtists()">\u641c\u7d22</button>'
      +'</div><div id="artist-tb"></div>';
    loadArtists();
    window.__searchArtists=function(){loadArtists();};
    $("artist-q").addEventListener("keydown",function(e){if(e.key==="Enter")loadArtists();});
  }
  function loadArtists(){
    var q=$("artist-q").value.trim();
    var fl=$("artist-fl").value;
    var params=[];
    if(q)params.push("q="+encodeURIComponent(q));
    if(fl)params.push("heat_level="+fl);
    api("GET","/admin/artists"+(params.length?"?"+params.join("&"):"")).then(function(d){
      var items=d.items||d||[];
      var tb=$("artist-tb");
      if(!items.length){tb.innerHTML='<p style="color:#94a3b8;padding:20px 0">\u6682\u65e0\u6570\u636e</p>';return;}
      var h='<table><tr><th>ID</th><th>\u59d3\u540d</th><th>\u70ed\u5ea6</th><th>\u7ecd\u5206</th><th>\u64cd\u4f5c</th></tr>';
      items.forEach(function(a){
        h+='<tr><td>'+a.id+'</td><td>'+a.name+'</td><td><span class="badge badge-'+(a.heat_level||'c')+'">'+(a.heat_level||'-')+'</span></td><td>'+(a.comprehensive_score!=null?a.comprehensive_score:"-")+'</td>'
          +'<td><button class="btn btn-sm btn-primary" onclick="window.__viewArtist('+a.id+')">\u8be6\u60c5</button></td></tr>';
      });h+='</table>';
      if(d.total>params.limit)h+='<div style="text-align:center;color:#94a3b8;font-size:12px;margin-top:10px">\u5171 '+d.total+' \u6761';
      tb.innerHTML=h;
    }).catch(function(){$("artist-tb").innerHTML='<p style="color:#ef4444">\u52a0\u8f7d\u5931\u8d25</p>';});
  }
  window.__viewArtist=function(id){
    api("GET","/admin/artists/"+id).then(function(a){
      var h='<h3>'+a.name+' <small style="color:#94a3b8">#'+id+'</small></h3>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">';
      var info=[
        ["\u70ed\u5ea6\u7ea7\u522b",a.heat_level],["\u7efc\u5408\u8bc4\u5206",a.comprehensive_score],
        ["\u751f\u65e5",a.birthday||"-"],["\u661f\u5ea7",a.constellation||"-"],
        ["\u7c4d\u8d21",a.ethnicity||"-"],["\u51fa\u751f\u5730",a.birthplace||"-"],
        ["\u7ecf\u7eaa\u516c\u53f8",a.agency||"-"],
        ["\u4ee3\u8868\u4f5c",a.masterpieces||"-"],
      ];
      info.forEach(function(row){h+='<div style="background:#f8fafc;padding:10px 14px;border-radius:8px"><div style="font-size:11px;color:#94a3b8">'+row[0]+'</div><div style="font-weight:600;margin-top:2px">'+(row[1]||"-")+'</div></div>';});
      h+='</div>';
      h+='<div style="margin-top:16px"><h4>\u98ce\u9669\u8be6\u60c5</h4><div id="risk-det"></div></div>';
      h+='<div style="margin-top:12px;text-align:right"><button class="btn" onclick="closeModal()">\u5173\u95ed</button></div>';
      openModal("\u827a\u4eba\u8be6\u60c5",h);
      /* Load risk detail */
      api("GET","/risk/explain/"+id).then(function(r){
        var rd=$("risk-det");
        if(!rd)return;/* modal closed */
        var rh='<table style="margin-top:8px"><tr><th>\u7ef4\u5ea6</th><th>\u5206\u6570</th><th>\u8bf4\u660e</th></tr>';
        (r.dimension_scores||[]).forEach(function(ds){
          rh+='<tr><td>'+ds.dimension+'</td><td>'+ds.score+'</td><td>'+(ds.explanation||'-')+'</td></tr>';
        });rh+='</div>';
        rd.innerHTML=rh;
      }).catch(function(){});
    }).catch(function(){showToast("\u52a0\u8f7d\u5931\u8d25","err");});
  };

  function renderEvents(c){
    c.innerHTML='<h2 style="margin-bottom:16px">\u98ce\u9669\u4e8b\u4ef6</h2>'
      +'<div style="display:flex;gap:8px;margin-bottom:14px">'
      +'<select id="event-fl" style="padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px"><option value="">\u6240\u6709\u7ea7\u522b</option><option value="high">S/A</option><option value="medium">B</option><option value="low">C</option></select>'
      +'<button class="btn btn-primary" onclick="window.__loadEvents()">&#x7B5E;&#x9009;</button>'
      +'</div><div id="event-tb"></div>';
    window.__loadEvents=function(){loadEvents();};loadEvents();
  }
  function loadEvents(){
    var fl=$("event-fl").value;
    api("GET","/admin/events"+(fl?"?risk_filter="+fl:"")).then(function(d){
      var items=d.items||d||[];
      var tb=$("event-tb");
      if(!items.length){tb.innerHTML='<p style="color:#94a3b8;padding:20px 0">\u6682\u65e0\u6570\u636e</p>';return;}
      var h='<table><tr><th>ID</th><th>\u827a\u4eba</th><th>\u4e8b\u4ef6\u7c7b\u578b</th><th>\u7ea7\u522b</th><th>\u72b6\u6001</th><th>\u65f6\u95f4</th></tr>';
      items.forEach(function(e){
        h+='<tr><td>'+e.id+'</td><td>'+(e.artist_name||"-")+'</td><td>'+(e.event_type||"-")+'</td>'
          +'<td><span class="badge badge-'+((e.risk_level==='high'||e.risk_level==='S'||e.risk_level==='A')?'s':(e.risk_level==='medium'||e.risk_level==='B'?'b':'c'))+'">'+(e.risk_level||'?')+'</span></td>'
          +'<td>'+(e.status||"-")+'</td><td>'+(e.event_date||"-")+'</td></tr>';
      });h+='</table>';
      tb.innerHTML=h;
    }).catch(function(){$("event-tb").innerHTML='<p style="color:#ef4444">\u52a0\u8f7d\u5931\u8d25</p>';});
  }

  function renderCommercial(c){
    c.innerHTML='<h2 style="margin-bottom:16px">\u5546\u4e1a\u4ef7\u503c</h2><div id="comm-tb"><p style="color:#94a3b8;padding:20px 0">\u8bf7\u4ece\u827a\u4eba\u8be6\u60c5\u9875\u67e5\u770b</p></div>';
  }

  function renderReports(c){
    c.innerHTML='<h2 style="margin-bottom:16px">\u62a5\u544a\u5bfc\u51fa</h2>'
      +'<div style="background:#fff;border-radius:10px;padding:20px;max-width:480px">'
      +'<div style="margin-bottom:14px"><label style="font-size:13px;color:#64748b;display:block;margin-bottom:6px">\u827a\u4eba ID</label>'
      +'<input id="rp-id" placeholder="\u8f93\u5165\u827a\u4eba ID" style="width:100%;padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px"></div>'
      +'<div style="margin-bottom:14px"><label style="font-size:13px;color:#64748b;display:block;margin-bottom:6px">\u683c\u5f0f</label>'
      +'<select id="rp-fmt" style="width:100%;padding:9px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px"><option value="word">Word (.docx)</option><option value="ppt">PPT (.pptx)</option><option value="pdf">PDF</option><option value="json">JSON</option></select></div>'
      +'<button class="btn btn-primary" style="width:100%;padding:10px" onclick="window.__genReport()">\u751f\u6210\u62a5\u544a</button>'
      +'<div id="rp-err" class="err" style="margin-top:10px"></div>'
      +'</div>';
    window.__genReport=function(){
      var id=$("rp-id").value.trim();
      var fmt=$("rp-fmt").value;
      $("rp-err").textContent="";
      if(!id){$("rp-err").textContent="\u8bf7\u8f93\u5165\u827a\u4eba ID";return;}
      api("POST","/admin/reports/generate",{artist_id:Number(id),format:fmt}).then(function(d){
        if(d.download_url||d.data){
          if(fmt==="json"){openModal("\u62a5\u544a(JSON)",'<pre style="background:#f8fafc;padding:14px;border-radius:8px;font-size:12px;max-height:400px;overflow:auto">'+JSON.stringify(d.data,null,2)+'</pre>');}
          else{showToast("\u62a5\u544a\u5df2\u751f\u6210","ok");if(d.download_url)window.open(d.download_url,"_blank");}
        }else{$("rp-err").textContent=d.detail||"\u751f\u6210\u5931\u8d25";}
      }).catch(function(e){$("rp-err").textContent=e.message||"\u8bf7\u6c42\u5931\u8d25";});
    };
  }

  function renderMonitor(c){
    c.innerHTML='<h2 style="margin-bottom:16px">\u76d1\u63a7\u544a\u8b66</h2><div id="mon-tb"></div>';
    api("GET","/monitor/alerts/latest?limit=20").then(function(d){
      var items=d.alerts||d||[];
      var tb=$("mon-tb");
      if(!items.length){tb.innerHTML='<p style="color:#94a3b8;padding:20px 0">\u6682\u65e0\u544a\u8b66</p>';return;}
      var h='<table><tr><th>ID</th><th>\u827a\u4eba</th><th>\u7c7b\u578b</th><th>\u7ea7\u522b</th><th>\u72b6\u6001</th><th>\u521b\u5efa\u65f6\u95f4</th></tr>';
      items.forEach(function(a){
        h+='<tr><td>'+a.id+'</td><td>'+(a.artist_name||"-")+'</td><td>'+(a.alert_type||"-")+'</td>'
          +'<td><span class="badge badge-'+(a.severity==='high'?'c':'b')+'">'+(a.severity||'-')+'</span></td>'
          +'<td>'+(a.status||"-")+'</td><td>'+(a.created_at||"-")+'</td></tr>';
      });h+='</table>';
      tb.innerHTML=h;
    }).catch(function(){$("mon-tb").innerHTML='<p style="color:#ef4444">\u52a0\u8f7d\u5931\u8d25</p>';});
  }

  function renderUsers(c){
    c.innerHTML='<h2 style="margin-bottom:16px">\u7528\u6237\u7ba1\u7406</h2><div id="user-tb"></div>';
    api("GET","/admin/users").then(function(d){
      var items=d.users||d||[];
      var tb=$("user-tb");
      if(!items.length){tb.innerHTML='<p style="color:#94a3b8;padding:20px 0">\u6682\u65e0\u7528\u6237</p>';return;}
      var h='<table><tr><th>ID</th><th>\u7528\u6237\u540d</th><th>\u89d2\u8272</th><th>\u72b6\u6001</th><th>\u64cd\u4f5c</th></tr>';
      items.forEach(function(u){
        h+='<tr><td>'+u.id+'</td><td>'+u.username+'</td><td><span class="badge badge-s">'+u.role+'</span></td>'
          +'<td>'+(u.is_active?"\u6fc0\u6d3b":"\u505c\u7528")+'</td>'
          +'<td><button class="btn btn-sm '+(u.is_active?"btn-warn":"btn-primary")+'" onclick="window.__toggleUser('+u.id+','+!u.is_active+')">'+(u.is_active?"\u505c\u7528":"\u6fc0\u6d3b")+'</button></td></tr>';
      });h+='</table>';
      tb.innerHTML=h;
    }).catch(function(){$("user-tb").innerHTML='<p style="color:#ef4444">\u52a0\u8f7d\u5931\u8d25</p>';});
  }
  window.__toggleUser=function(id,active){
    api("PATCH","/admin/users/"+id,{is_active:active}).then(function(){
      showToast(active?"\u5df2\u6fc0\u6d3b":"\u5df2\u505c\u7528","ok");renderUsers($("content"));
    }).catch(function(){showToast("\u64cd\u4f5c\u5931\u8d25","err");});
  };

  /* ---- Init ---- */
  /* Ensure modal starts hidden */
  $("modal-layer").hidden = true;
  $("logout-btn").addEventListener("click", function(){ logout(); });
  window.addEventListener("hashchange", function () {
    if (staff) { navigate(location.hash.replace("#/", "")); }
  });

  /* Auto-verify token validity; fall back to login on failure */
  if (token && staff) {
    /* Verify token is still valid before entering app */
    api("GET","/admin/auth/me").then(function(){
      enterApp();
    }).catch(function(){
      /* Token expired/invalid → clear and show login */
      logout("\u767b\u5f55\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");
    });
  } else {
    $("app-view").hidden = true;
    $("login-view").style.display = "";
    drawBg();
  }

})();
