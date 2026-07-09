/* ============================================
   艺安查 MVP v2.1 — app.js (优化版 + 离线兜底)
   ============================================ */

// === 内置10人示例数据（离线兜底，API不可用时即时体验） ===
const OFFLINE_DEMO_DATA = [
  {"name":"赵丽颖","gender":"女","age":35,"constellation":"天秤座","heat_level":"S","fan_name":"颖火虫","weibo_fans":8625,"douyin_fans":2356,"risk_level":"低风险","risk_total_score":18,"political_risk":5,"legal_risk":3,"moral_risk":7,"commercial_risk":3,"risk_summary":"无重大负面记录，公众形象良好。","agency":"和颂传媒","personality_tags":"实力派演员,勤奋努力,国民度高","representative_works":"《花千骨》《楚乔传》《知否》","historical_endorsements":"巴黎欧莱雅,佳洁士,蒙牛","commercial_quote":1200,"fan_purchasing_power":"S","black_nicknames":"赵小刀","style_tone":"优雅,气质,实力"},
  {"name":"肖战","gender":"男","age":32,"constellation":"天蝎座","heat_level":"S","fan_name":"小飞侠","weibo_fans":3200,"douyin_fans":1800,"risk_level":"中风险","risk_total_score":45,"political_risk":10,"legal_risk":15,"moral_risk":12,"commercial_risk":8,"risk_summary":"227事件影响持续，部分品牌谨慎合作。","agency":"哇唧唧哇","personality_tags":"颜值担当,流量担当,争议较大","representative_works":"《陈情令》《斗罗大陆》","historical_endorsements":"OPPO,真果粒,百事可乐","commercial_quote":1500,"fan_purchasing_power":"S+","black_nicknames":"战战","style_tone":"颜值,流量,争议"},
  {"name":"赵露思","gender":"女","age":25,"constellation":"天蝎座","heat_level":"S","fan_name":"可露丽","weibo_fans":2800,"douyin_fans":3200,"risk_level":"低风险","risk_total_score":15,"political_risk":3,"legal_risk":2,"moral_risk":7,"commercial_risk":3,"risk_summary":"95后顶流小花，甜美路线，无明显负面。","agency":"银河酷娱","personality_tags":"甜美可爱,95后顶流,带货强","representative_works":"《传闻中的陈芊芊》《星汉灿烂》","historical_endorsements":"舒适达,高露洁,安踏","commercial_quote":800,"fan_purchasing_power":"S","black_nicknames":"露思","style_tone":"甜美,可爱,活力"},
  {"name":"刘亦菲","gender":"女","age":36,"constellation":"处女座","heat_level":"S","fan_name":"亦家人","weibo_fans":6800,"douyin_fans":1200,"risk_level":"低风险","risk_total_score":12,"political_risk":3,"legal_risk":2,"moral_risk":5,"commercial_risk":2,"risk_summary":"国际知名度高，公众形象完美。","agency":"独立","personality_tags":"神仙姐姐,国际范,高端品牌宠儿","representative_works":"《花木兰》《梦华录》","historical_endorsements":"Prada,Longines,海蓝之谜","commercial_quote":2000,"fan_purchasing_power":"S+","black_nicknames":"天仙","style_tone":"高端,气质,国际"},
  {"name":"王一博","gender":"男","age":26,"constellation":"狮子座","heat_level":"S","fan_name":"摩托姐姐","weibo_fans":4100,"douyin_fans":2800,"risk_level":"低风险","risk_total_score":20,"political_risk":5,"legal_risk":5,"moral_risk":7,"commercial_risk":3,"risk_summary":"顶流偶像，商业价值极高。","agency":"乐华娱乐","personality_tags":"全能偶像,时尚宠儿,顶流","representative_works":"《陈情令》《无名》","historical_endorsements":"奥迪,香奈儿,麦当劳","commercial_quote":1800,"fan_purchasing_power":"S+","black_nicknames":"一博","style_tone":"潮流,时尚,活力"},
  {"name":"杨紫","gender":"女","age":31,"constellation":"天蝎座","heat_level":"S","fan_name":"小樱桃","weibo_fans":7500,"douyin_fans":2100,"risk_level":"低风险","risk_total_score":16,"political_risk":4,"legal_risk":3,"moral_risk":6,"commercial_risk":3,"risk_summary":"童星出道，演技派，国民度高。","agency":"东阳紫骏","personality_tags":"演技派,国民度高,童星出道","representative_works":"《家有儿女》《香蜜》《长相思》","historical_endorsements":"雀巢咖啡,高姿","commercial_quote":900,"fan_purchasing_power":"S","black_nicknames":"紫紫","style_tone":"亲和,国民,实力"},
  {"name":"邓紫棋","gender":"女","age":32,"constellation":"狮子座","heat_level":"S","fan_name":"棋士","weibo_fans":5200,"douyin_fans":4500,"risk_level":"低风险","risk_total_score":14,"political_risk":3,"legal_risk":2,"moral_risk":6,"commercial_risk":3,"risk_summary":"创作型歌手，实力派。","agency":"索尼音乐","personality_tags":"创作才女,实力派歌手","representative_works":"《泡沫》《光年之外》","historical_endorsements":"Fender,Adidas,华为","commercial_quote":1000,"fan_purchasing_power":"S","black_nicknames":"G.E.M.","style_tone":"创作,实力,活力"},
  {"name":"白鹿","gender":"女","age":28,"constellation":"白羊座","heat_level":"A","fan_name":"鹿茸","weibo_fans":3200,"douyin_fans":3800,"risk_level":"低风险","risk_total_score":10,"political_risk":2,"legal_risk":1,"moral_risk":5,"commercial_risk":2,"risk_summary":"90后新生代，上升期。","agency":"欢娱影视","personality_tags":"90后新生代,甜美可爱","representative_works":"《周生如故》《长月烬明》","historical_endorsements":"欧诗漫,藤野造型","commercial_quote":600,"fan_purchasing_power":"A+","black_nicknames":"白露","style_tone":"甜美,亲民,上升"},
  {"name":"周冬雨","gender":"女","age":31,"constellation":"摩羯座","heat_level":"S","fan_name":"雨滴","weibo_fans":4200,"douyin_fans":800,"risk_level":"低风险","risk_total_score":13,"political_risk":3,"legal_risk":2,"moral_risk":5,"commercial_risk":3,"risk_summary":"谋女郎，金马影后，演技受认可。","agency":"泰洋川禾","personality_tags":"谋女郎,金马影后","representative_works":"《山楂树之恋》《少年的你》","historical_endorsements":"RALPH LAUREN,欧米茄,SK-II","commercial_quote":1500,"fan_purchasing_power":"S","black_nicknames":"冬雨","style_tone":"高端,演技,独立"},
  {"name":"刘诗诗","gender":"女","age":34,"constellation":"双鱼座","heat_level":"S","fan_name":"小狮子","weibo_fans":5800,"douyin_fans":600,"risk_level":"低风险","risk_total_score":11,"political_risk":2,"legal_risk":2,"moral_risk":4,"commercial_risk":3,"risk_summary":"气质女神，公众形象完美。","agency":"唐人影视","personality_tags":"气质女神,优雅大方","representative_works":"《仙剑三》《步步惊心》《一念关山》","historical_endorsements":"周大福,娇兰","commercial_quote":1000,"fan_purchasing_power":"S","black_nicknames":"诗诗","style_tone":"优雅,气质,高端"}
];

// === 代言推荐关键词匹配表（从v0.4版本合并，更精准的品类映射） ===
const ENDORSE_CATEGORIES = {
  '美妆护肤': ['美','精致','时尚','颜值','护肤','优雅','高端','气质','女神','仙女'],
  '食品饮料': ['亲民','国民','美食','活力','阳光','家庭','健康','温暖','甜蜜'],
  '3C数码': ['科技','潮流','年轻','极客','活力','时尚','酷','未来','智能'],
  '服饰鞋包': ['时尚','潮流','穿搭','街拍','精致','优雅','品味','个性'],
  '汽车': ['成熟','商务','高端','稳重','男性','大气','成功','尊贵'],
  '母婴亲子': ['亲和','家庭','温情','妈妈','国民','治愈','温柔','关怀'],
  '游戏二次元': ['二次元','年轻','潮流','游戏','活力','动漫','酷','热血'],
  '运动户外': ['运动','阳光','健康','活力','户外','正能量','挑战','冒险'],
  '高端奢侈': ['高端','气质','国际','优雅','尊贵','奢华','经典','品味'],
  '国潮文化': ['国潮','传统','文化','中国风','古典','民族','底蕴','传承']
};

// === 全局Chart.js配置优化 — 更顺滑的动画和更好的视觉效果 ===
(function initChartDefaults() {
  // 等待Chart.js加载完成
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded yet');
    return;
  }

  // 动画配置 - 更顺滑
  Chart.defaults.animation = {
    duration: 1400,
    easing: 'easeOutQuart',
    delay: (context) => context.dataIndex * 80
  };

  // 字体配置 - 只设置安全字段（Chart.js 4.x 中 font 对象本身不可整体替换，否则内部 FontSpec 解析会丢失）
  try {
    if (Chart.defaults && Chart.defaults.font) {
      Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif";
      Chart.defaults.font.size = 13;
    }
  } catch (e) { console.warn('Font defaults update failed:', e); }

  // 工具提示优化 - 仅修改字段；titleFont/bodyFont 必须保留原对象再合并
  try {
    if (Chart.defaults && Chart.defaults.plugins && Chart.defaults.plugins.tooltip) {
      const tt = Chart.defaults.plugins.tooltip;
      tt.backgroundColor = 'rgba(15, 23, 42, 0.92)';
      if (tt.titleFont) Object.assign(tt.titleFont, { weight: 'bold', size: 14, family: "'Inter', sans-serif" });
      else tt.titleFont = { weight: 'bold', size: 14, family: "'Inter', sans-serif" };
      if (tt.bodyFont) Object.assign(tt.bodyFont, { weight: 'normal', size: 13, family: "'Inter', sans-serif" });
      else tt.bodyFont = { weight: 'normal', size: 13, family: "'Inter', sans-serif" };
      tt.padding = 14;
      tt.cornerRadius = 10;
      tt.displayColors = true;
      tt.boxPadding = 6;
      tt.borderColor = 'rgba(99, 102, 241, 0.3)';
      tt.borderWidth = 1;
      tt.caretSize = 8;
      tt.caretPadding = 8;
      tt.titleMarginBottom = 8;
      tt.bodySpacing = 6;
    }
  } catch (e) { console.warn('Tooltip defaults update failed:', e); }

  // 图例优化 - 仅修改字段
  try {
    if (Chart.defaults && Chart.defaults.plugins && Chart.defaults.plugins.legend) {
      const legend = Chart.defaults.plugins.legend;
      legend.display = true;
      legend.position = 'bottom';
      if (!legend.labels) legend.labels = {};
      legend.labels.usePointStyle = true;
      legend.labels.pointStyle = 'circle';
      legend.labels.padding = 20;
      if (legend.labels.font) Object.assign(legend.labels.font, { size: 13, weight: 'normal', family: "'Inter', sans-serif" });
      else legend.labels.font = { size: 13, weight: 'normal', family: "'Inter', sans-serif" };
      legend.labels.color = '#475569';
    }
  } catch (e) { console.warn('Legend defaults update failed:', e); }

  // 响应式优化
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
  if (Chart.defaults && Chart.defaults.plugins) {
    Chart.defaults.plugins.decimation = {
      enabled: true,
      algorithm: 'lttb'
    };
  }

  // 颜色配置 - 匹配新设计系统
  Chart.defaults.color = '#64748B';
  Chart.defaults.borderColor = 'rgba(226, 232, 240, 0.6)';

  console.log('✅ Chart.js 全局配置已优化');
})();

const App = {
  API_BASE: 'https://yiancha-backend.onrender.com/api/v1',
  state: {
    user: null,
    token: localStorage.getItem('yc_token') || null,
    dailyViews: parseInt(localStorage.getItem('yc_daily_views') || '0'),
    dailyDate: localStorage.getItem('yc_daily_date') || '',
    filters: { risk_level: '', heat_level: '', gender: '', name: '' },
    searchResults: [],
    currentPage: 1,
    pageSize: 20,
    totalResults: 0,
    radarChart: null,
    commercialRadarChart: null,
    fanGenderChart: null,
    fanAgeChart: null,
    compareChart: null,
    compareDefaultNames: '',
    offlineMode: false,
    offlineArtists: [],
    quota: null, // 服务端配额快照 { limit, remaining }，详情接口通过 X-Quota-* 头回填
    riskWeights: { political: 0.4, legal: 0.3, moral: 0.2, commercial: 0.1 }, // 风险模型四维权重（由 /risk/weights 动态覆盖）
    myInvite: null, // 登录用户的专属邀请码快照（由 /auth/my-invite 获取）
    commercialScores: {}, // 艺人商业价值评分缓存 { artistId: scoreData }，商业 tab 懒加载
  },

  // ---- Init ----
  init() {
    window.addEventListener('hashchange', () => this.route());
    // 离线兜底：Excel 文件导入监听
    const fileInput = document.getElementById('offlineFileInput');
    if (fileInput) fileInput.addEventListener('change', (e) => this.handleOfflineFile(e));
    this.restoreUser();
    this.loadRiskWeights();
    this.route();
  },

  // 拉取风险模型权重配置（驱动详情页「权重X%」动态展示，与后端一致）
  loadRiskWeights() {
    this.api('/risk/weights').then((d) => {
      if (d && d.weights) this.state.riskWeights = d.weights;
    }).catch(() => { /* 失败则用默认权重，不影响功能 */ });
  },

  // 维度权重百分比文案
  weightLabel(dim) {
    const w = this.state.riskWeights[dim];
    if (typeof w !== 'number') return '';
    return `权重${Math.round(w * 100)}%`;
  },

  // ---- Navigation ----
  navigate(page, params) {
    if (params) {
      window.location.hash = `${page}/${params}`;
    } else {
      window.location.hash = page;
    }
  },

  route() {
    const hash = window.location.hash.slice(1) || 'home';
    const container = document.getElementById('pageContainer');
    if (hash.startsWith('artist/')) {
      const id = hash.replace('artist/', '');
      this.renderDetailPage(container, id);
    } else if (hash === 'monitoring') {
      this.renderMonitoringPage(container);
    } else {
      this.renderHomePage(container);
    }
    window.scrollTo(0, 0);
  },

  // ---- API ----
  async api(path, options = {}) {
    const url = path.startsWith('http') ? path : `${this.API_BASE}${path}`;
    const isAuth = path.startsWith('/auth/'); // 登录/注册类接口不做 401 拦截，避免死循环

    const doFetch = async (retried) => {
      const headers = { 'Content-Type': 'application/json' };
      if (this.state.token) {
        headers['Authorization'] = `Bearer ${this.state.token}`;
      }
      // 15s 超时：避免 Render 免费版冷启动(30-60s)时 UI 长时间干等
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const resp = await fetch(url, { ...options, headers, signal: controller.signal });

        // 回填配额头（详情接口返回 X-Quota-Limit / X-Quota-Remaining）
        const qLimit = resp.headers.get('X-Quota-Limit');
        const qRemain = resp.headers.get('X-Quota-Remaining');
        if (qLimit !== null && qRemain !== null) {
          this.state.quota = { limit: parseInt(qLimit, 10), remaining: parseInt(qRemain, 10) };
        }

        // 401 未登录：弹出登录框，登录成功后自动重放原请求（仅重试一次，防死循环）
        if (resp.status === 401 && !isAuth && !retried) {
          const ok = await this.promptLogin();
          if (ok) return doFetch(true);
          const body = await resp.json().catch(() => ({ detail: '请先登录后查看' }));
          const err = new Error(body.detail || '请先登录后查看');
          err.status = 401;
          throw err;
        }

        // 402 免费用户配额超限：提示并弹出升级框
        if (resp.status === 402) {
          const body = await resp.json().catch(() => ({ detail: '今日免费查看次数已用完，升级专业版可无限查看' }));
          const msg = body.detail || '今日免费查看次数已用完，升级专业版可无限查看';
          this.showQuotaExceeded(msg);
          const err = new Error(msg);
          err.status = 402;
          throw err;
        }

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({ detail: resp.statusText }));
          const err = new Error(body.detail || `HTTP ${resp.status}`);
          err.status = resp.status;
          throw err;
        }
        return resp.json();
      } catch (e) {
        if (e.name === 'AbortError') {
          const err = new Error('请求超时，请稍后重试');
          err.status = 0;
          throw err;
        }
        console.error('API Error:', e);
        throw e;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    return doFetch(false);
  },

  // ---- Toast ----
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // ---- Offline Mode (离线兜底) ----
  // 将内置/导入的离线数据归一化为 renderArtistCard 期望的字段形状
  normalizeOfflineArtist(a) {
    return {
      id: a.name,
      name: a.name,
      gender: a.gender,
      age: a.age,
      agency: a.agency || '-',
      heat_level: a.heat_level || '-',
      risk_level: a.risk_level || '-',
      risk_score: a.risk_total_score != null ? a.risk_total_score : (a.risk_score != null ? a.risk_score : '-'),
      weibo_fans: a.weibo_fans,
      douyin_fans: a.douyin_fans,
      _raw: a, // 保留原始数据供详情页使用
    };
  },

  // 获取当前过滤后的离线艺人列表
  getOfflineArtists() {
    let list = this.state.offlineArtists.length
      ? this.state.offlineArtists  // 已归一化
      : OFFLINE_DEMO_DATA.map(a => this.normalizeOfflineArtist(a));
    const f = this.state.filters;
    if (f.name) list = list.filter(a => a.name.includes(f.name));
    if (f.risk_level) list = list.filter(a => a.risk_level === f.risk_level);
    if (f.heat_level) list = list.filter(a => a.heat_level === f.heat_level);
    if (f.gender) list = list.filter(a => a.gender === f.gender);
    return list;
  },

  // 将 artists.json（中文字段 + 安全分反向）归一化为应用内部形状
  // 注意：源数据「风险总分/政治风险...」实为安全分（越高越安全），需反转成风险分
  normalizeArtistsJson(a) {
    const toNum = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };
    const safeTotal = toNum(a['风险总分(100)']);
    const safeP = toNum(a['政治风险(40%)']);
    const safeL = toNum(a['法律风险(30%)']);
    const safeM = toNum(a['道德风险(20%)']);
    const safeC = toNum(a['商业风险(10%)']);
    const name = a['姓名'] || '';
    // 「待评估」或全 0 视为无风险数据，risk_score 置空（UI 显示 -，不误报极端风险）
    const pending = (a['风险等级'] === '待评估') || (safeTotal === 0 && safeP === 0 && safeL === 0 && safeM === 0 && safeC === 0);
    return {
      id: name,
      name,
      gender: a['性别'] || '',
      age: a['年龄'] || '',
      agency: a['经纪公司'] || '-',
      heat_level: a['热度评级'] || '-',
      risk_level: a['风险等级'] || '-',
      risk_score: pending ? null : (100 - safeTotal),  // 反转：越高越危险；待评估→空
      weibo_fans: a['微博粉丝(万)'],
      douyin_fans: a['抖音粉丝(万)'],
      political_risk: pending ? null : (100 - safeP),
      legal_risk: pending ? null : (100 - safeL),
      moral_risk: pending ? null : (100 - safeM),
      commercial_risk: pending ? null : (100 - safeC),
      risk_summary: pending ? '该艺人风险数据待评估' : ([a['个人风险摘要'], a['家庭团队风险摘要']].filter(Boolean).join('；') || '暂无风险概述'),
      fan_name: a['粉丝名'] || '-',
      fan_purchasing_power: a['粉丝购买力评级'] || '-',
      personality_tags: a['人设标签'] || '-',
      representative_works: a['代表作(影视/音乐)'] || '-',
      historical_endorsements: a['历史代言品牌'] || '-',
      commercial_quote: a['商务报价(万/年)'],
      style_tone: a['调性/风格'] || '-',
      black_nicknames: a['主要黑称'] || '-',
    };
  },

  // 载入完整数据集 artists.json（916人，需通过 http 服务器访问）
  async loadFullDataset() {
    try {
      this.showToast('正在载入完整数据集(916人)...', 'info');
      const resp = await fetch('./artists.json');
      if (!resp.ok) throw new Error('数据集文件未找到');
      const arr = await resp.json();
      const norm = arr.map(a => this.normalizeArtistsJson(a)).filter(a => a.name);
      this.state.offlineMode = true;
      this.state.offlineArtists = norm;
      this.showToast(`已载入 ${norm.length} 位艺人（离线模式）`, 'success');
      this.route();
    } catch (err) {
      this.showToast(`载入失败：${err.message}（需通过本地/线上服务器访问，不支持 file:// 直接打开）`, 'error');
    }
  },

  // 载入内置 10 人示例数据，进入离线模式
  loadDemoData() {
    this.state.offlineMode = true;
    this.state.offlineArtists = []; // 空数组 => 使用 OFFLINE_DEMO_DATA
    this.showToast('已载入示例数据（离线模式）', 'info');
    this.route(); // 重新渲染首页
  },

  // 处理 Excel 文件导入（SheetJS）
  async handleOfflineFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      this.showToast('正在解析 Excel 文件...', 'info');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!rows.length) {
        this.showToast('Excel 中未找到数据', 'error');
        return;
      }
      // 字段兼容：支持 name/艺人名、risk_total_score/风险评分 等多种列名
      const norm = rows.map(r => this.normalizeOfflineArtist({
        name: r.name || r.艺人名 || r.姓名 || '',
        gender: r.gender || r.性别 || '',
        age: r.age || r.年龄 || '',
        agency: r.agency || r.经纪公司 || '',
        heat_level: r.heat_level || r.热度 || '',
        risk_level: r.risk_level || r.风险等级 || '',
        risk_total_score: r.risk_total_score || r.风险评分 || r.risk_score || '',
        weibo_fans: r.weibo_fans || r.微博粉丝 || '',
        douyin_fans: r.douyin_fans || r.抖音粉丝 || '',
      }));
      this.state.offlineMode = true;
      this.state.offlineArtists = norm;
      this.showToast(`已导入 ${norm.length} 位艺人（离线模式）`, 'success');
      this.route();
    } catch (err) {
      this.showToast(`Excel 解析失败：${err.message}`, 'error');
    } finally {
      e.target.value = '';
    }
  },

  // 退出离线模式（重新走 API）
  exitOfflineMode() {
    this.state.offlineMode = false;
    this.state.offlineArtists = [];
    this.showToast('已切换回在线模式', 'info');
    this.route();
  },

  // 离线代言推荐：基于 ENDORSE_CATEGORIES 关键词匹配
  recommendOffline(tone, gender) {
    const src = (this.state.offlineArtists.length ? this.state.offlineArtists : OFFLINE_DEMO_DATA);
    const keywords = ENDORSE_CATEGORIES[tone] || [];
    const scored = src.map(a => {
      const haystack = [a.style_tone, a.personality_tags, a.risk_level].join(' ');
      let score = 0;
      keywords.forEach(kw => { if (haystack.includes(kw)) score += 20; });
      // 风险惩罚：高风险艺人降权
      if (a.risk_level === '高风险') score -= 30;
      else if (a.risk_level === '中风险') score -= 10;
      // 热度加成
      if (a.heat_level === 'S') score += 15;
      else if (a.heat_level === 'A') score += 8;
      return { artist_name: a.name, artist_id: a.name, match_reason: `风格调性「${a.style_tone || '-'}」匹配「${tone}」品牌`, total_recommend_score: Math.max(0, score) };
    }).filter(r => r.total_recommend_score > 0);
    scored.sort((x, y) => y.total_recommend_score - x.total_recommend_score);
    return { recommendations: scored.slice(0, 5), total_candidates: src.length };
  },

  // 离线详情页渲染（使用本地数据）
  renderOfflineDetail(container, name) {
    const src = (this.state.offlineArtists.length ? this.state.offlineArtists : OFFLINE_DEMO_DATA);
    const a = src.find(x => x.name === name);
    if (!a) {
      container.innerHTML = '<div class="text-center text-secondary" style="padding:60px;">未找到该艺人的离线数据</div>';
      return;
    }
    const score = a.risk_total_score != null ? a.risk_total_score : (a.risk_score != null ? a.risk_score : null);
    const scoreColor = typeof score === 'number' ? this.getScoreColor(score) : '';
    const heatTag = this.getHeatTagClass(a.heat_level);
    const riskTag = this.getRiskTagClass(a.risk_level);
    const char = this.avatarChar(a.name);
    const grad = this.getHeatAvatarGradient(a.heat_level);
    const avatarStyle = grad ? `background:${grad}` : '';
    const subtitle = [a.agency, a.gender, a.age ? a.age + '岁' : '', a.constellation].filter(Boolean).join(' · ');
    const dims = [
      { k: '政治风险', v: a.political_risk },
      { k: '法律风险', v: a.legal_risk },
      { k: '道德风险', v: a.moral_risk },
      { k: '商业风险', v: a.commercial_risk },
    ];
    const maxDim = Math.max(...dims.map(d => d.v || 0), 1);
    const dimBars = dims.map(d => `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
          <span>${d.k}</span><span style="font-weight:600;">${d.v ?? '-'}</span>
        </div>
        <div style="height:8px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${(d.v || 0) / maxDim * 100}%;background:${d.v > 10 ? 'var(--risk-high)' : d.v > 5 ? 'var(--risk-mid)' : 'var(--risk-safe)'};border-radius:4px;"></div>
        </div>
      </div>`).join('');

    container.innerHTML = `
      <div style="padding:16px 0;">
        <button class="btn btn-ghost btn-sm" onclick="App.navigate('home')">← 返回列表</button>
        <div class="detail-header" style="margin-top:16px;">
          <div class="detail-header-inner">
            <div class="detail-avatar" style="${avatarStyle || 'background:linear-gradient(135deg,var(--primary-100),var(--primary-200));color:var(--primary);'}">${char}</div>
            <div class="detail-meta">
              <div class="detail-title-row">
                <h1>${a.name}</h1>
                ${a.heat_level ? `<span class="tag ${heatTag}" style="font-size:14px;padding:4px 12px;">${a.heat_level}级</span>` : ''}
                ${a.risk_level ? `<span class="tag ${riskTag}" style="font-size:14px;padding:4px 12px;">${a.risk_level}</span>` : ''}
              </div>
              <p class="detail-subtitle">${subtitle || '暂无详细信息'}</p>
              <div class="detail-stats">
                <span>微博粉丝：<strong>${this.formatFans(a.weibo_fans)}</strong></span>
                <span>抖音粉丝：<strong>${this.formatFans(a.douyin_fans)}</strong></span>
                <span>粉丝名：<strong>${a.fan_name || '-'}</strong></span>
                <span>购买力：<strong style="color:var(--primary);">${a.fan_purchasing_power || '-'}</strong></span>
              </div>
            </div>
            <div class="detail-score-area">
              <div class="detail-score-big ${scoreColor}">${score ?? '-'}</div>
              <div class="detail-score-label">综合风险评分</div>
            </div>
          </div>
        </div>

        <div class="page-content" style="margin-top:20px;">
          <div class="card mb-6">
            <div class="card-header">四维风险评估（离线示例）</div>
            <div class="card-body">${dimBars}</div>
          </div>
          <div class="card mb-6">
            <div class="card-header">风险概述</div>
            <div class="card-body">${a.risk_summary || '暂无风险概述'}</div>
          </div>
          <div class="grid-2 mb-6">
            <div class="card"><div class="card-header">基础信息</div><div class="card-body" style="font-size:13px;line-height:2;">
              经纪公司：${a.agency || '-'}<br>
              粉丝名：${a.fan_name || '-'}<br>
              粉丝购买力：${a.fan_purchasing_power || '-'}<br>
              性格标签：${a.personality_tags || '-'}<br>
              风格调性：${a.style_tone || '-'}<br>
              黑称：${a.black_nicknames || '-'}
            </div></div>
            <div class="card"><div class="card-header">商业价值</div><div class="card-body" style="font-size:13px;line-height:2;">
              参考报价：${a.commercial_quote ? a.commercial_quote + '万/年' : '-'}<br>
              代表作：${a.representative_works || '-'}<br>
              历史代言：${a.historical_endorsements || '-'}
            </div></div>
          </div>
          <div class="text-center text-secondary" style="font-size:12px;padding:12px;">⚠️ 当前为离线示例数据，完整风险事件、粉丝画像与深度洞察请切换至在线模式查看</div>
        </div>
      </div>`;
  },

  // ---- User System ----
  restoreUser() {
    const saved = localStorage.getItem('yc_user');
    if (saved) {
      try { this.state.user = JSON.parse(saved); } catch {}
    }
    if (this.state.token && !this.state.user) {
      this.verifyToken();
    }
    this.resetDailyViews();
    this.renderUserArea();
  },

  resetDailyViews() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.state.dailyDate !== today) {
      this.state.dailyViews = 0;
      this.state.dailyDate = today;
      localStorage.setItem('yc_daily_views', '0');
      localStorage.setItem('yc_daily_date', today);
    }
  },

  async renderUserArea() {
    const area = document.getElementById('userArea');
    if (!area) return;
    if (this.state.user && this.state.token) {
      const phone = this.state.user.phone || '用户';
      const masked = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      const planName = this.state.user.plan_name || '免费版';

      // 注册来源（内测转化归因展示）
      const srcHtml = this.state.user.invited_by
        ? `<div class="invite-src">通过邀请码 <b>${this.state.user.invited_by}</b> 注册</div>`
        : '';

      // 我的邀请码（促内测裂变）：拉取专属码并缓存
      let inviteHtml = '';
      try {
        if (!this.state.myInvite) this.state.myInvite = await this.api('/auth/my-invite');
        const mi = this.state.myInvite;
        inviteHtml = `
          <div class="my-invite">
            <span class="my-invite-label">我的邀请码</span>
            <code class="my-invite-code">${mi.code}</code>
            <button class="btn btn-ghost btn-xs" type="button" onclick="App.copyText('${mi.code}')">复制</button>
            <span class="my-invite-used">已邀请 ${mi.used_count}/${mi.max_uses} 人</span>
          </div>`;
      } catch (e) {
        inviteHtml = '';
      }

      area.innerHTML = `
        <div class="user-area" title="已登录">
          <span>${masked}</span>
          <span class="plan-tag">${planName}</span>
          <button class="btn btn-ghost btn-sm" type="button" onclick="App.logout()">退出</button>
        </div>
        ${srcHtml}
        ${inviteHtml}`;
    } else {
      this.state.myInvite = null;
      area.innerHTML = `<button class="btn btn-primary btn-sm" type="button" onclick="App.openAuth()">登录</button>`;
    }
  },

  openAuth() { document.getElementById('authModal').classList.add('show'); },
  // 关闭登录框：若是由 401 拦截自动弹出的，用户主动关闭视为「取消登录」
  closeAuth() {
    document.getElementById('authModal').classList.remove('show');
    if (this._loginResolve) {
      const resolveLogin = this._loginResolve;
      this._loginResolve = null;
      resolveLogin(false);
    }
  },
  // 401 拦截时调用：返回 Promise，登录成功 resolve(true)，用户关闭/取消 resolve(false)
  promptLogin() {
    return new Promise((resolve) => {
      this._loginResolve = resolve;
      this.openAuth();
    });
  },

  // 配额超限提示：Toast 告知 + 弹出升级会员框
  showQuotaExceeded(msg) {
    this.showToast(msg, 'error');
    this.loadPlans(); // 弹出真实套餐，引导升级
  },

  async loadPlans() {
    try {
      const data = await this.api('/auth/plans');
      const plans = data.plans || [];
      const list = document.getElementById('upgradePlanList');
      if (list) {
        list.innerHTML = plans.map(p => `
          <div class="plan-card ${p.id === 'pro' ? 'plan-highlight' : ''}">
            <div class="plan-head">
              <span class="plan-name">${p.name}</span>
              ${p.price ? `<span class="plan-price">¥${p.price}<small>/${p.price_unit || '月'}</small></span>` : '<span class="plan-price">免费</span>'}
            </div>
            <ul class="plan-features">
              ${(p.features || []).map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>`).join('');
      }
      const m = document.getElementById('upgradeModal');
      if (m) m.classList.add('show');
    } catch (err) {
      this.showToast(`加载套餐失败：${err.message}`, 'error');
    }
  },

  copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => this.showToast('已复制邀请码', 'success'))
        .catch(() => this.showToast('复制失败，请手动复制', 'error'));
    } else {
      this.showToast('当前环境不支持自动复制', 'info');
    }
  },

  switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('loginForm').style.display = tab === 'login' ? '' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? '' : 'none';
  },

  async handleLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    try {
      const data = await this.api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password })
      });
      this.onLoginSuccess(data);
    } catch (err) {
      this.showToast(`登录失败：${err.message}`, 'error');
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const phone = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    const inviteCode = document.getElementById('regInviteCode').value.trim();
    
    if (password !== password2) {
      this.showToast('两次密码不一致', 'error');
      return;
    }
    if (!inviteCode) {
      this.showToast('内测阶段需要邀请码才能注册', 'error');
      return;
    }
    
    try {
      const data = await this.api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ phone, password, invite_code: inviteCode })
      });
      this.onLoginSuccess(data);
      this.showToast('注册成功！', 'success');
    } catch (err) {
      this.showToast(`注册失败：${err.message}`, 'error');
    }
  },

  async verifyInviteCode() {
    // 验证邀请码
    const code = document.getElementById('regInviteCode').value.trim();
    const msgEl = document.getElementById('inviteVerifyMsg');
    
    if (!code) {
      msgEl.innerHTML = '<span style="color:var(--danger);">请输入邀请码</span>';
      return;
    }
    
    try {
      const data = await this.api('/auth/verify-invite', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
      if (data.valid) {
        msgEl.innerHTML = `<span style="color:var(--success);">✓ 邀请码有效${data.invite.note ? '（' + data.invite.note + '）' : ''}</span>`;
        document.getElementById('registerBtn').disabled = false;
      } else {
        msgEl.innerHTML = `<span style="color:var(--danger);">${data.message}</span>`;
        document.getElementById('registerBtn').disabled = true;
      }
    } catch (err) {
      msgEl.innerHTML = `<span style="color:var(--danger);">验证失败：${err.message}</span>`;
      document.getElementById('registerBtn').disabled = true;
    }
  },

  async demoLogin() {
    try {
      const data = await this.api('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ demo_code: 'DEMO2026' })
      });
      this.onLoginSuccess(data);
      this.showToast('演示登录成功！', 'success');
    } catch (err) {
      this.showToast(`演示登录失败：${err.message}`, 'error');
    }
  },

  onLoginSuccess(data) {
    this.state.token = data.access_token || data.token;
    this.state.user = data.user || { phone: data.phone || 'demo', plan_name: data.plan_name || '免费版' };
    localStorage.setItem('yc_token', this.state.token);
    localStorage.setItem('yc_user', JSON.stringify(this.state.user));
    // 若是由 401 拦截触发的登录，唤醒等待中的原请求
    if (this._loginResolve) {
      const resolveLogin = this._loginResolve;
      this._loginResolve = null;
      resolveLogin(true);
    }
    this.closeAuth();
    this.renderUserArea();
  },

  logout() {
    this.state.token = null;
    this.state.user = null;
    localStorage.removeItem('yc_token');
    localStorage.removeItem('yc_user');
    this.renderUserArea();
    this.showToast('已退出登录', 'info');
  },

  async verifyToken() {
    try {
      const data = await this.api('/auth/me');
      this.state.user = {
        phone: data.phone || this.state.user?.phone || '用户',
        plan_name: data.plan_name || '免费版',
        plan: data.plan,
        nickname: data.nickname,
      };
      localStorage.setItem('yc_user', JSON.stringify(this.state.user));
      this.renderUserArea();
    } catch {
      this.state.token = null;
      localStorage.removeItem('yc_token');
      localStorage.removeItem('yc_user');
      this.renderUserArea();
    }
  },

  // ---- 商务合作 / 申请开通（P2 内测转化入口）----
  openBusinessModal() { document.getElementById('businessModal').classList.add('show'); },
  closeBusinessModal() { document.getElementById('businessModal').classList.remove('show'); },

  async submitBusiness(e) {
    e.preventDefault();
    const name = (document.getElementById('bizName').value || '').trim();
    const phone = (document.getElementById('bizPhone').value || '').trim();
    if (!name) { this.showToast('请填写联系人姓名', 'warning'); return; }
    if (!phone) { this.showToast('请至少留下联系电话', 'warning'); return; }
    const plan = (document.querySelector('input[name="bizPlan"]:checked') || {}).value || 'professional';
    const payload = {
      contact_name: name,
      company: (document.getElementById('bizCompany').value || '').trim() || null,
      role: document.getElementById('bizRole').value,
      contact_phone: phone,
      contact_email: (document.getElementById('bizEmail').value || '').trim() || null,
      contact_wechat: (document.getElementById('bizWechat').value || '').trim() || null,
      plan_interest: plan,
      use_case: (document.getElementById('bizUseCase').value || '').trim() || null,
      message: (document.getElementById('bizMessage').value || '').trim() || null,
    };
    try {
      const d = await this.api('/business/apply', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      this.showToast(d.message || '申请已提交', 'success');
      this.closeBusinessModal();
      document.getElementById('businessForm').reset();
    } catch (err) {
      this.showToast(err.message || '提交失败', 'error');
    }
  },

  // ---- 管理后台（商务线索）----
  openAdminLogin() {
    document.getElementById('adminModal').classList.add('show');
    document.getElementById('adminLoginBox').style.display = '';
    document.getElementById('adminLeadsBox').style.display = 'none';
    document.getElementById('adminLoginMsg').innerHTML = '';
    document.getElementById('adminCode').value = '';
  },
  closeAdminModal() { document.getElementById('adminModal').classList.remove('show'); },

  async submitAdminLogin() {
    const code = (document.getElementById('adminCode').value || '').trim();
    if (!code) { document.getElementById('adminLoginMsg').innerHTML = '<span style="color:var(--danger);">请输入引导密钥</span>'; return; }
    try {
      const d = await this.api('/auth/admin-token', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      localStorage.setItem('yc_admin_token', d.token || d.access_token);
      document.getElementById('adminLoginBox').style.display = 'none';
      document.getElementById('adminLeadsBox').style.display = '';
      this.showToast('已进入管理后台', 'success');
      await this.renderAdminLeads();
      await this.renderAdminDQ();
    } catch (err) {
      document.getElementById('adminLoginMsg').innerHTML = `<span style="color:var(--danger);">${err.message || '密钥错误'}</span>`;
    }
  },

  async adminApi(path, options = {}) {
    const token = localStorage.getItem('yc_admin_token');
    const url = `${this.API_BASE}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const resp = await fetch(url, { ...options, headers, signal: controller.signal });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ detail: resp.statusText }));
        const err = new Error(body.detail || `HTTP ${resp.status}`);
        err.status = resp.status;
        throw err;
      }
      return resp.json();
    } catch (e) {
      if (e.name === 'AbortError') { const err = new Error('请求超时'); err.status = 0; throw err; }
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async renderAdminLeads() {
    const box = document.getElementById('adminLeadsList');
    const meta = document.getElementById('adminLeadsMeta');
    if (!box) return;
    try {
      const d = await this.adminApi('/business/leads?limit=100');
      const leads = d.leads || [];
      meta.textContent = `共 ${d.total} 条线索`;
      if (!leads.length) {
        box.innerHTML = '<div class="text-secondary text-sm" style="padding:12px;">暂无商务线索。</div>';
        return;
      }
      const statusCN = { pending: '待联系', contacted: '已联系', converted: '已转化', rejected: '已拒绝' };
      box.innerHTML = leads.map(l => `
        <div class="lead-item">
          <div class="lead-head">
            <span class="lead-name">${l.contact_name}${l.company ? '（' + l.company + '）' : ''}</span>
            <span class="tag tag-status-${l.status}">${statusCN[l.status] || l.status}</span>
          </div>
          <div class="lead-meta">提交时间：${l.created_at ? l.created_at.replace('T', ' ').slice(0, 19) : '-'} ｜ 意向：${l.plan_interest === 'enterprise' ? '企业版' : '专业版'}${l.role ? ' ｜ 角色：' + l.role : ''}</div>
          <div class="lead-contact">📞 ${l.contact_phone || '-'} ｜ ✉️ ${l.contact_email || '-'} ｜ 💬 ${l.contact_wechat || '-'}</div>
          ${l.use_case ? `<div class="lead-contact">使用场景：${l.use_case}</div>` : ''}
          ${l.message ? `<div class="lead-contact">留言：${l.message}</div>` : ''}
          ${l.user_id ? `<div class="lead-meta">关联用户ID：${l.user_id}</div>` : '<div class="lead-meta">匿名申请（无关联账号）</div>'}
          <div class="lead-actions">
            <button class="btn btn-ghost btn-xs" onclick="App.adminUpdateLead(${l.id},'contacted')">标记已联系</button>
            <button class="btn btn-primary btn-xs" onclick="App.adminUpdateLead(${l.id},'converted')">转化开通</button>
            <button class="btn btn-ghost btn-xs" onclick="App.adminUpdateLead(${l.id},'rejected')">拒绝</button>
          </div>
        </div>`).join('');
    } catch (err) {
      box.innerHTML = `<div class="text-danger text-sm">加载失败：${err.message}</div>`;
    }
  },

  async adminUpdateLead(id, status) {
    if (!confirm(`确认将线索 #${id} 状态改为「${status}」？`)) return;
    try {
      const d = await this.adminApi(`/business/leads/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      this.showToast(d.message || '已更新', 'success');
      await this.renderAdminLeads();
    } catch (err) {
      this.showToast(err.message || '更新失败', 'error');
    }
  },

  switchAdminTab(tab) {
    document.getElementById('tabLeads').classList.toggle('active', tab === 'leads');
    document.getElementById('tabDQ').classList.toggle('active', tab === 'dq');
    document.getElementById('adminLeadsPanel').style.display = tab === 'leads' ? '' : 'none';
    document.getElementById('adminDQPanel').style.display = tab === 'dq' ? '' : 'none';
    if (tab === 'dq') this.renderAdminDQ();
  },

  async renderAdminDQ() {
    const summary = document.getElementById('adminDQSummary');
    const fill = document.getElementById('adminDQFill');
    const meta = document.getElementById('adminDQEmptyMeta');
    const list = document.getElementById('adminDQEmptyList');
    if (!summary) return;
    try {
      const c = await this.adminApi('/coverage');
      const cov = c.coverage_pct;
      const covColor = cov >= 30 ? 'var(--success)' : cov >= 15 ? 'var(--warning)' : 'var(--danger)';
      summary.innerHTML = `
        <div class="dq-card"><div class="num">${c.total}</div><div class="lbl">艺人总数</div></div>
        <div class="dq-card"><div class="num" style="color:${covColor}">${cov}%</div><div class="lbl">已评估覆盖率</div></div>
        <div class="dq-card"><div class="num" style="color:var(--danger)">${c.empty_count}</div><div class="lbl">空艺人(无评分/事件)</div></div>
        <div class="dq-card"><div class="num">${c.overall_quality_pct}</div><div class="lbl">平均完整度</div></div>`;
      // 字段填充率（仅显示对风险评估有意义的字段）
      const showFields = [
        ['agency', '经纪公司'], ['persona_tags', '人设标签'], ['brand_history', '品牌史'],
        ['commercial_quote', '商务报价'], ['deep_insight', '深度洞察'], ['risk_summary', '风险摘要'],
        ['weibo_fans', '微博粉丝'], ['risk_score', '风险评分'],
      ];
      fill.innerHTML = showFields.map(([k, label]) => {
        const f = c.field_fill[k] || { pct: 0 };
        return `<div class="fill-row"><div class="fill-name">${label}</div><div class="fill-bar"><span style="width:${f.pct}%"></span></div><div class="fill-pct">${f.pct}%</div></div>`;
      }).join('');
      // 空艺人列表（首批）
      const e = await this.adminApi('/coverage/empty?limit=30&offset=0');
      meta.innerHTML = `空艺人共 <strong>${e.total}</strong> 位（按 已申请&gt;热度&gt;完整度 排序，每周自动补全 S/A 级）。点击「补全」加入队列。`;
      if (!e.items.length) {
        list.innerHTML = '<div class="text-secondary text-sm" style="padding:8px;">暂无空艺人 🎉</div>';
        return;
      }
      list.innerHTML = e.items.map(it => `
        <div class="empty-item">
          <div class="ei-head">
            <span class="ei-name">${it.name} <span class="text-tertiary text-sm">${it.heat_level || ''}</span></span>
            <span class="tag tag-status-${it.quality_score > 70 ? 'converted' : it.quality_score > 40 ? 'contacted' : 'pending'}">完整度 ${it.quality_score}</span>
          </div>
          <div class="ei-meta">经纪公司：${it.agency || '—'} ｜ 代表作：${(it.masterpieces || '').slice(0, 20) || '—'}${it.enrich_requested ? ' ｜ <span style="color:var(--success)">已加入补全队列</span>' : ''}</div>
          <div class="ei-actions">
            <button class="btn btn-ghost btn-xs" onclick="App.adminRequestEnrich(${it.id})">${it.enrich_requested ? '已在队列' : '补全'}</button>
          </div>
        </div>`).join('');
    } catch (err) {
      summary.innerHTML = `<div class="text-danger text-sm">加载质检数据失败：${err.message}</div>`;
    }
  },

  async adminRequestEnrich(id) {
    try {
      const d = await this.adminApi(`/coverage/artists/${id}/enrich-request`, { method: 'POST' });
      this.showToast(d.message || '已加入补全队列', 'success');
      await this.renderAdminDQ();
    } catch (err) {
      this.showToast(err.message || '操作失败', 'error');
    }
  },

  canViewDetail() {
    this.resetDailyViews();
    if (this.state.user && this.state.user.plan_name && this.state.user.plan_name !== '免费版') return true;
    if (this.state.dailyViews >= 5) return false;
    return true;
  },

  recordView() {
    this.resetDailyViews();
    if (this.state.user && this.state.user.plan_name && this.state.user.plan_name !== '免费版') return;
    this.state.dailyViews++;
    localStorage.setItem('yc_daily_views', String(this.state.dailyViews));
  },

  // ---- Utility ----
  getScoreColor(score) {
    if (score === null || score === undefined) return 'score-pending';
    if (score >= 80) return 'score-safe';
    if (score >= 60) return 'score-mid';
    return 'score-high';
  },

  getRiskTagClass(level) {
    if (!level) return 'tag-risk-mid';
    if (level.includes('低风险')) return 'tag-risk-safe';
    if (level.includes('中风险') || level.includes('中低') || level.includes('中高')) return 'tag-risk-mid';
    if (level.includes('高风险')) return 'tag-risk-high';
    return 'tag-risk-mid';
  },

  getHeatTagClass(level) {
    if (!level) return 'tag-heat-c';
    const l = level.toUpperCase();
    if (l === 'S') return 'tag-heat-s';
    if (l === 'A') return 'tag-heat-a';
    if (l === 'B') return 'tag-heat-b';
    return 'tag-heat-c';
  },

  // ---- P4 风险评分可解释性辅助 ----
  escHtml(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  getRiskDimColor(level) {
    // 维度等级：极低/低/中/较高/高
    if (!level) return '#34D399';
    if (level === '极低') return '#10B981';
    if (level === '低') return '#34D399';
    if (level === '中') return '#F59E0B';
    if (level === '较高') return '#F97316';
    return '#EF4444';
  },

  getSevColor(sev) {
    return ({ critical: '#DC2626', high: '#EF4444', medium: '#F59E0B', low: '#10B981' })[sev] || '#6B7280';
  },

  getHeatAvatarGradient(name) {
    const colors = {
      'S': 'linear-gradient(135deg, #FEF3C7, #FDE68A);color:#92400E',
      'A': 'linear-gradient(135deg, #FCE7F3, #FBCFE8);color:#BE185D',
      'B': 'linear-gradient(135deg, #E0E7FF, #C7D2FE);color:#4338CA',
      'C': 'linear-gradient(135deg, #F3F4F6, #D1D5DB);color:#4B5563',
      'D': 'linear-gradient(135deg, #FEE2E2, #FECACA);color:#991B1B',
    };
    return colors[name?.toUpperCase()] || '';
  },

  formatFans(n) {
    if (!n) return '-';
    if (n >= 10000) return (n / 10000).toFixed(n >= 100000 ? 0 : 1) + '万';
    return String(n);
  },

  avatarChar(name) {
    if (!name) return '?';
    const clean = name.replace(/·/g, '');
    return clean.charAt(0);
  },

  debounce(fn, ms) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  },

  // ---- Search ----
  doSearch() {
    const name = document.getElementById('heroSearch')?.value || '';
    this.state.filters.name = name;
    this.state.currentPage = 1;
    const searchSection = document.getElementById('searchSection');
    if (searchSection) searchSection.style.display = '';
    this.loadSearchResults();
  },

  setFilter(key, value) {
    this.state.filters[key] = value;
    this.state.currentPage = 1;
    // Update filter tag UI
    const group = event.target.closest('.filter-group');
    if (group) {
      group.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
    }
    const searchSection = document.getElementById('searchSection');
    if (searchSection) searchSection.style.display = '';
    this.loadSearchResults();
  },

  resetFilters() {
    this.state.filters = { risk_level: '', heat_level: '', gender: '', name: '' };
    this.state.currentPage = 1;
    const heroSearch = document.getElementById('heroSearch');
    if (heroSearch) heroSearch.value = '';
    // Reset filter tags
    document.querySelectorAll('.filter-tag').forEach(t => {
      t.classList.toggle('active', t.textContent === '全部');
    });
    const searchSection = document.getElementById('searchSection');
    if (searchSection) searchSection.style.display = '';
    this.loadSearchResults();
  },

  async loadSearchResults() {
    const resultsDiv = document.getElementById('searchResults');
    const countSpan = document.getElementById('searchCount');
    if (!resultsDiv) return;

    // 离线模式：直接渲染本地数据
    if (this.state.offlineMode) {
      const artists = this.getOfflineArtists();
      this.state.searchResults = artists;
      this.state.totalResults = artists.length;
      if (countSpan) countSpan.innerHTML = `共找到 <strong>${artists.length}</strong> 位艺人（离线示例）`;
      resultsDiv.innerHTML = artists.length
        ? '<div class="flex flex-col gap-4">' + artists.map(a => this.renderArtistCard(a)).join('') + '</div>'
        : '<div class="text-center text-secondary" style="padding:40px;">暂无匹配的艺人数据</div>';
      return;
    }

    resultsDiv.innerHTML = '<div class="loading-overlay"><div class="spinner"></div><span>搜索中...</span></div>';

    try {
      const params = new URLSearchParams();
      const f = this.state.filters;
      if (f.name) params.set('name', f.name);
      if (f.risk_level) params.set('risk_level', f.risk_level);
      if (f.heat_level) params.set('heat_level', f.heat_level);
      if (f.gender) params.set('gender', f.gender);
      params.set('skip', String((this.state.currentPage - 1) * this.state.pageSize));
      params.set('limit', String(this.state.pageSize));

      const data = await this.api(`/artists?${params}`);
      let artists = data.items || data.artists || data || [];
      const total = data.total || artists.length;

      this.state.searchResults = artists;
      this.state.totalResults = total;

      if (countSpan) countSpan.innerHTML = `共找到 <strong>${total}</strong> 位艺人`;

      if (artists.length === 0) {
        resultsDiv.innerHTML = '<div class="text-center text-secondary" style="padding:40px;">暂无匹配的艺人数据</div>';
        return;
      }

      resultsDiv.innerHTML = '<div class="flex flex-col gap-4">' + artists.map(a => this.renderArtistCard(a)).join('') + '</div>';
      this.renderPagination(resultsDiv);
    } catch (err) {
      // API 不可用时自动回退到离线示例数据
      this.state.offlineMode = true;
      const artists = this.getOfflineArtists();
      this.state.searchResults = artists;
      this.state.totalResults = artists.length;
      if (countSpan) countSpan.innerHTML = `共找到 <strong>${artists.length}</strong> 位艺人（离线示例）`;
      resultsDiv.innerHTML = artists.length
        ? '<div class="text-center text-secondary" style="padding:8px 0;">⚠️ 在线服务暂不可用，已切换至离线示例数据</div><div class="flex flex-col gap-4">' + artists.map(a => this.renderArtistCard(a)).join('') + '</div>'
        : '<div class="text-center text-secondary" style="padding:40px;">加载失败：${err.message}</div>';
    }
  },

  renderArtistCard(a) {
    const score = a.risk_score;
    const scoreClass = this.getScoreColor(score);
    const riskTag = this.getRiskTagClass(a.risk_level);
    const heatTag = this.getHeatTagClass(a.heat_level);
    const char = this.avatarChar(a.name);
    const gradStyle = this.getHeatAvatarGradient(a.heat_level);
    const avatarStyle = gradStyle ? `background:${gradStyle}` : '';
    const meta = [a.agency, a.gender === '男' ? '男' : a.gender === '女' ? '女' : '', a.age ? a.age + '岁' : ''].filter(Boolean).join(' · ') || '-';
    const tags = [];
    if (a.heat_level) tags.push(`<span class="tag ${heatTag}" style="font-size:11px;padding:2px 8px;">${a.heat_level}级</span>`);
    if (a.risk_level) tags.push(`<span class="tag ${riskTag}" style="font-size:11px;padding:2px 8px;">${a.risk_level}</span>`);

    return `
    <div class="artist-card" onclick="App.viewArtist('${a.id}')">
      <div class="artist-avatar" style="${avatarStyle}">${char}</div>
      <div class="artist-info">
        <div class="artist-name">${a.name} ${tags.join('')}</div>
        <div class="artist-meta">${meta}</div>
      </div>
      <div class="artist-right">
        <div class="artist-score ${scoreClass}">${score ?? '-'}</div>
        <div class="artist-score-label">风险评分</div>
      </div>
    </div>`;
  },

  renderPagination(container) {
    const total = this.state.totalResults;
    const pages = Math.ceil(total / this.state.pageSize);
    if (pages <= 1) return;
    const cur = this.state.currentPage;
    let html = '<div class="pagination">';
    html += `<button class="page-btn" ${cur <= 1 ? 'disabled' : ''} onclick="App.goPage(${cur - 1})">上一页</button>`;
    const start = Math.max(1, cur - 2);
    const end = Math.min(pages, cur + 2);
    for (let i = start; i <= end; i++) {
      html += `<button class="page-btn ${i === cur ? 'active' : ''}" onclick="App.goPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" ${cur >= pages ? 'disabled' : ''} onclick="App.goPage(${cur + 1})">下一页</button>`;
    html += '</div>';
    container.insertAdjacentHTML('beforeend', html);
  },

  goPage(p) {
    this.state.currentPage = p;
    this.loadSearchResults();
    document.getElementById('searchResults')?.scrollIntoView({ behavior: 'smooth' });
  },

  viewArtist(id) {
    this.navigate('artist', id);
  },

  // ---- Hot Artists ----
  async loadHotArtists() {
    const container = document.getElementById('hotArtists');
    if (!container) return;
    container.innerHTML = '<div class="flex gap-4"><div class="skeleton skeleton-card flex-1"></div><div class="skeleton skeleton-card flex-1"></div><div class="skeleton skeleton-card flex-1"></div></div>';

    try {
      const data = await this.api('/artists/hot?limit=12');
      let artists = data.items || data.artists || data || [];
      if (artists.length === 0) {
        container.innerHTML = '<div class="text-center text-secondary">暂无热门艺人数据</div>';
        return;
      }
      container.innerHTML = '<div class="grid-3">' + artists.map(a => this.renderArtistCard(a)).join('') + '</div>';
    } catch (err) {
      // 离线回退：展示示例数据前 6 位
      const demo = OFFLINE_DEMO_DATA.slice(0, 6).map(a => this.normalizeOfflineArtist(a));
      container.innerHTML = '<div class="text-center text-secondary" style="font-size:12px;margin-bottom:8px;">⚠️ 离线示例数据</div><div class="grid-3">' + demo.map(a => this.renderArtistCard(a)).join('') + '</div>';
    }
  },

  // ---- Stats ----
  async loadStats() {
    const container = document.getElementById('statsGrid');
    if (!container) return;
    try {
      const data = await this.api('/artists/stats/overview');
      const total = data.total_artists || data.total_count || data.total || 915;
      const lowRisk = data.low_risk_count || data.safe_count || '-';
      const sCount = data.heat_s_count || data.s_level_count || '-';
      container.innerHTML = `
        <div class="stat-card"><div class="stat-number">${total}</div><div class="stat-label">收录艺人</div></div>
        <div class="stat-card"><div class="stat-number" style="color:var(--risk-safe);">${lowRisk}</div><div class="stat-label">低风险艺人</div></div>
        <div class="stat-card"><div class="stat-number" style="color:var(--heat-s);">${sCount}</div><div class="stat-label">S级热度</div></div>
        <div class="stat-card"><div class="stat-number" style="color:var(--primary);">${data.total_endorsements || data.endorsements || '-'}</div><div class="stat-label">可查代言</div></div>`;
    } catch (err) {
      // 离线回退：展示示例统计
      const demo = OFFLINE_DEMO_DATA;
      const low = demo.filter(a => a.risk_level === '低风险').length;
      const s = demo.filter(a => a.heat_level === 'S').length;
      container.innerHTML = `
        <div class="stat-card"><div class="stat-number">${demo.length}</div><div class="stat-label">示例艺人</div></div>
        <div class="stat-card"><div class="stat-number" style="color:var(--risk-safe);">${low}</div><div class="stat-label">低风险艺人</div></div>
        <div class="stat-card"><div class="stat-number" style="color:var(--heat-s);">${s}</div><div class="stat-label">S级热度</div></div>
        <div class="stat-card"><div class="stat-number" style="color:var(--primary);">-</div><div class="stat-label">在线模式查看全部</div></div>`;
    }
  },

  // ---- Render Home Page ----
  renderHomePage(container) {
    const heroSearchVal = this.state.filters.name || '';
    container.innerHTML = `
      <!-- Hero -->
      <div class="hero-section">
        <div class="hero-inner animate-in">
          <div class="hero-logo">
            <div class="hero-logo-icon"><span>YC</span></div>
            <span>艺安查</span>
          </div>
          <h1 class="hero-title">艺人风险尽调一站式平台</h1>
          <p class="hero-subtitle">查艺人，查风险，查商业价值 — 让每一次合作都安心可靠</p>
          <div class="hero-search-wrap">
            <div class="search-box hero-search">
              <input type="text" id="heroSearch" placeholder="输入艺人姓名、经纪公司、代表作..." value="${heroSearchVal}" onkeydown="if(event.key==='Enter')App.doSearch()">
              <button class="search-btn" onclick="App.doSearch()">搜索艺人</button>
            </div>
          </div>
          <div class="hero-hot">
            <span class="hero-hot-label">热门搜索：</span>
            <a onclick="document.getElementById('heroSearch').value='迪丽热巴';App.doSearch()">迪丽热巴</a>
            <a onclick="document.getElementById('heroSearch').value='肖战';App.doSearch()">肖战</a>
            <a onclick="document.getElementById('heroSearch').value='王一博';App.doSearch()">王一博</a>
            <a onclick="document.getElementById('heroSearch').value='赵丽颖';App.doSearch()">赵丽颖</a>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="page-content">
        <!-- Filters -->
        <div class="card mb-6">
          <div class="card-body">
            <div class="flex justify-between items-center mb-4">
              <span class="font-bold">快速筛选</span>
              <div class="flex gap-2">
                ${this.state.offlineMode ? `
                  <button class="btn btn-ghost btn-sm" onclick="App.exitOfflineMode()">↩ 在线模式</button>
                ` : `
                  <button class="btn btn-ghost btn-sm" onclick="App.loadDemoData()">📂 离线示例</button>
                  <button class="btn btn-ghost btn-sm" onclick="App.loadFullDataset()">完整数据集</button>
                  <button class="btn btn-ghost btn-sm" onclick="document.getElementById('offlineFileInput').click()">导入Excel</button>
                `}
                <button class="btn btn-ghost btn-sm" onclick="App.resetFilters()">重置筛选</button>
              </div>
            </div>
            <div class="flex flex-col gap-4">
              <div>
                <span class="text-xs text-secondary">风险等级</span>
                <div class="filter-group mt-4">
                  <span class="filter-tag active" onclick="App.setFilter('risk_level','')">全部</span>
                  <span class="filter-tag" onclick="App.setFilter('risk_level','低风险')">低风险</span>
                  <span class="filter-tag" onclick="App.setFilter('risk_level','中风险')">中风险</span>
                  <span class="filter-tag" onclick="App.setFilter('risk_level','高风险')">高风险</span>
                </div>
              </div>
              <div>
                <span class="text-xs text-secondary">热度等级</span>
                <div class="filter-group mt-4">
                  <span class="filter-tag active" onclick="App.setFilter('heat_level','')">全部</span>
                  <span class="filter-tag" onclick="App.setFilter('heat_level','S')">S级</span>
                  <span class="filter-tag" onclick="App.setFilter('heat_level','A')">A级</span>
                  <span class="filter-tag" onclick="App.setFilter('heat_level','B')">B级</span>
                  <span class="filter-tag" onclick="App.setFilter('heat_level','C')">C级</span>
                </div>
              </div>
              <div>
                <span class="text-xs text-secondary">性别</span>
                <div class="filter-group mt-4">
                  <span class="filter-tag active" onclick="App.setFilter('gender','')">全部</span>
                  <span class="filter-tag" onclick="App.setFilter('gender','男')">男</span>
                  <span class="filter-tag" onclick="App.setFilter('gender','女')">女</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid-4 mb-6" id="statsGrid">
          <div class="skeleton skeleton-stat"></div>
          <div class="skeleton skeleton-stat"></div>
          <div class="skeleton skeleton-stat"></div>
          <div class="skeleton skeleton-stat"></div>
        </div>

        <!-- Brand Recommendation Tool -->
        <div class="card mb-6" style="background:linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%);color:#fff;border:none;">
          <div class="card-body">
            <div class="flex items-center gap-3 mb-4">
              <div style="width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">🎯</div>
              <div>
                <h3 style="font-size:16px;font-weight:700;margin:0;">品牌代言推荐</h3>
                <p style="font-size:12px;opacity:0.7;margin:2px 0 0;">智能匹配品牌调性与艺人形象</p>
              </div>
            </div>
            <div class="flex flex-col gap-3">
              <div class="flex gap-3 flex-wrap">
                <select id="recBrandTone" style="flex:1;min-width:100px;padding:8px 10px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(255,255,255,0.1);color:#fff;font-size:13px;">
                  <option value="高端" style="color:#333;">高端</option>
                  <option value="年轻" style="color:#333;">年轻</option>
                  <option value="时尚" style="color:#333;">时尚</option>
                  <option value="国潮" style="color:#333;">国潮</option>
                  <option value="科技" style="color:#333;">科技</option>
                  <option value="家庭" style="color:#333;">家庭</option>
                  <option value="运动" style="color:#333;">运动</option>
                </select>
                <select id="recGender" style="padding:8px 10px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(255,255,255,0.1);color:#fff;font-size:13px;">
                  <option value="" style="color:#333;">不限性别</option>
                  <option value="女" style="color:#333;">女艺人</option>
                  <option value="男" style="color:#333;">男艺人</option>
                </select>
              </div>
              <button class="btn" style="background:#fff;color:#1E3A5F;font-weight:600;border:none;padding:10px;" onclick="App.runBrandRecommend()">获取推荐艺人</button>
            </div>
            <div id="recommendResultArea" style="margin-top:12px;"></div>
          </div>
        </div>

        <!-- Hot Artists -->
        <div class="flex justify-between items-center mb-4">
          <h2 style="font-size:20px;font-weight:700;">热门艺人推荐</h2>
        </div>
        <div id="hotArtists" class="mb-8"></div>

        <!-- Search Results -->
        <div id="searchSection" style="display:none;">
          <div class="flex justify-between items-center mb-4">
            <h2 style="font-size:20px;font-weight:700;">搜索结果</h2>
            <span class="text-sm text-secondary" id="searchCount"></span>
          </div>
          <div id="searchResults"></div>
        </div>
      </div>`;

    // Trigger loads
    this.loadStats();
    this.loadHotArtists();

    // Show search results if has active search
    const debouncedSearch = this.debounce(() => {
      const searchSection = document.getElementById('searchSection');
      if (this.state.filters.name || this.state.filters.risk_level || this.state.filters.heat_level || this.state.filters.gender) {
        if (searchSection) searchSection.style.display = '';
        this.loadSearchResults();
      }
    }, 500);

    // If there are filters, trigger search immediately
    if (this.state.filters.name || this.state.filters.risk_level || this.state.filters.heat_level || this.state.filters.gender) {
      setTimeout(() => {
        const searchSection = document.getElementById('searchSection');
        if (searchSection) searchSection.style.display = '';
        this.loadSearchResults();
      }, 100);
    }

    // Wire up hero search debounce
    const heroSearch = document.getElementById('heroSearch');
    if (heroSearch) {
      let debounceTimer;
      heroSearch.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (heroSearch.value.trim()) {
            const searchSection = document.getElementById('searchSection');
            if (searchSection) searchSection.style.display = '';
            this.doSearch();
          }
        }, 500);
      });
    }
  },

  // ---- Render Detail Page ----
  async renderDetailPage(container, id) {
    // 离线模式：使用本地数据渲染简化详情
    if (this.state.offlineMode) {
      this.renderOfflineDetail(container, id);
      return;
    }

    // Check view limit：仅当已拿到服务端配额且确已用完时提前提示；
    // 否则交由后端裁决（匿名→401 弹登录框，免费超限→402 弹升级框）
    if (this.state.quota && this.state.quota.remaining <= 0) {
      document.getElementById('upgradeModal').classList.add('show');
    }

    container.innerHTML = `
      <div class="detail-header">
        <div class="detail-header-inner">
          <div class="loading-overlay" style="width:100%;">
            <div class="spinner"></div>
            <span>加载艺人信息...</span>
          </div>
        </div>
      </div>
      <div class="detail-tabs">
        <div class="detail-tabs-inner">
          <div class="detail-tab-item active" onclick="App.switchTab('risk')">风险画像</div>
          <div class="detail-tab-item" onclick="App.switchTab('commercial')">商业价值</div>
          <div class="detail-tab-item" onclick="App.switchTab('fans')">粉丝数据</div>
          <div class="detail-tab-item" onclick="App.switchTab('insight')">深度洞察</div>
          <div class="detail-tab-item" onclick="App.switchTab('events')">风险事件</div>
        </div>
      </div>
      <div class="page-content"><div class="loading-overlay"><div class="spinner"></div><span>加载中...</span></div></div>`;

    try {
      const data = await this.api(`/artists/${id}`);
      const a = data.artist || data;

      // Record view
      if (this.canViewDetail()) {
        this.recordView();
      }

      // Determine remaining views for free users（优先用服务端配额，无则用本地计数兜底）
      const isFree = !this.state.user || this.state.user.plan_name === '免费版';
      const remaining = !isFree ? null
        : (this.state.quota && this.state.quota.remaining >= 0
            ? this.state.quota.remaining
            : Math.max(0, 5 - this.state.dailyViews));

      // Render header
      const score = a.risk_score;
      const scoreColor = this.getScoreColor(score);
      const heatTag = this.getHeatTagClass(a.heat_level);
      const riskTag = this.getRiskTagClass(a.risk_level);
      const char = this.avatarChar(a.name);
      const gradStyle = this.getHeatAvatarGradient(a.heat_level);
      const avatarStyle = gradStyle ? `background:${gradStyle}` : '';
      const subtitle = [a.agency, a.gender, a.age ? a.age + '岁' : '', a.constellation, a.birthplace].filter(Boolean).join(' · ');
      const fansName = a.fans_name || '-';
      const fansVerified = a.fans_name_verified ? ' <span class="tag tag-risk-safe" style="font-size:11px;padding:1px 6px;">已验证</span>' : '';
      const purchaseLevel = a.fans_purchase_level || '-';

      document.querySelector('.detail-header').innerHTML = `
        <div class="detail-header-inner animate-in">
          <div class="detail-avatar" style="${avatarStyle || 'background:linear-gradient(135deg,var(--primary-100),var(--primary-200));color:var(--primary);'}">${char}</div>
          <div class="detail-meta">
            <div class="detail-title-row">
              <h1>${a.name}</h1>
              ${a.heat_level ? `<span class="tag ${heatTag}" style="font-size:14px;padding:4px 12px;">${a.heat_level}级</span>` : ''}
              ${a.risk_level ? `<span class="tag ${riskTag}" style="font-size:14px;padding:4px 12px;">${a.risk_level}</span>` : ''}
            </div>
            <p class="detail-subtitle">${subtitle || '暂无详细信息'}</p>
            <div class="detail-stats">
              <span>微博粉丝：<strong>${this.formatFans(a.weibo_fans)}</strong></span>
              <span>抖音粉丝：<strong>${this.formatFans(a.douyin_fans)}</strong></span>
              <span>粉丝名：<strong>${fansName}</strong>${fansVerified}</span>
              <span>购买力：<strong style="color:var(--primary);">${purchaseLevel}</strong></span>
            </div>
          </div>
          <div class="detail-score-area">
            <div class="detail-score-big ${scoreColor}">${score ?? '-'}</div>
            <div class="detail-score-label">综合风险评分</div>
            ${remaining !== null ? `<div class="text-xs text-tertiary" style="margin-top:4px;">今日剩余 ${remaining} 次查看</div>` : ''}
          </div>
        </div>`;

      // Render tabs content
      document.querySelector('.page-content').innerHTML = `
        <!-- Risk Tab -->
        <div class="tab-content active" id="tab-risk">
          <div class="grid-2" style="gap:24px;">
            <div class="card">
              <div class="card-header">四维风险评估</div>
              <div class="card-body text-center">
                <div style="max-width:320px;margin:0 auto;">
                  <canvas id="radarCanvas" width="320" height="240"></canvas>
                </div>
                <p class="text-sm text-secondary mt-4">评分越高，风险越低</p>
              </div>
            </div>
            <div class="card">
              <div class="card-header">评分明细</div>
              <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:20px;">
                  ${this.renderScoreBar('政治风险', this.weightLabel('political'), a.risk_political)}
                  ${this.renderScoreBar('法律风险', this.weightLabel('legal'), a.risk_legal)}
                  ${this.renderScoreBar('道德风险', this.weightLabel('moral'), a.risk_moral)}
                  ${this.renderScoreBar('商业风险', this.weightLabel('commercial'), a.risk_commercial)}
                </div>
              </div>
            </div>
          </div>
          ${a.risk_summary ? `<div class="card mt-6"><div class="card-header">风险摘要</div><div class="card-body"><p style="font-size:15px;line-height:1.8;color:var(--text-secondary);">${a.risk_summary}</p></div></div>` : ''}
          <div style="text-align:center;margin-top:24px;">
            <button class="btn" style="background:var(--primary-dark);color:#fff;border:none;margin-left:8px;" onclick="App.previewRiskReport(${a.id})">👁 预览报告</button>
            <button class="btn btn-primary" onclick="App.downloadRiskReport(${a.id}, '${a.name.replace(/'/g, "\\'")}')">📥 下载综合档案报告</button>
            <button class="btn" style="background:var(--primary-dark);color:#fff;border:none;margin-left:8px;" onclick="App.downloadRiskReportPDF(${a.id}, '${a.name.replace(/'/g, "\\'")}')">📄 下载PDF</button>
            <button class="btn" style="background:linear-gradient(135deg,#7C3AED,#DB2777);color:#fff;border:none;margin-left:8px;" onclick="App.openWhitelabelModal(${a.id}, '${a.name.replace(/'/g, "\\'")}')">🎨 白标导出</button>
            <button class="btn" style="background:linear-gradient(135deg,#059669,#10B981);color:#fff;border:none;margin-left:8px;" onclick="App.openSafetyCard(${a.id})">🛡 安全评分卡</button>
          </div>
          <div class="card mt-6" id="explainPanelCard">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
              <span>风险评分可解释性 <span class="text-xs text-tertiary">· 四维因子级分解</span></span>
              <select id="explainProfileSel" class="profile-sel" style="font-size:13px;padding:5px 8px;border-radius:8px;border:1px solid var(--border,#E2E8F0);background:var(--bg,#fff);color:var(--text-primary,#0F2A4A);" onchange="App.onExplainProfileChange()" title="按客户行业缩放风险评分模型">
                <option value="default">通用模型（规范分）</option>
              </select>
            </div>
            <div class="card-body" id="explainPanel"><div class="text-sm text-tertiary">加载评分解释中...</div></div>
          </div>
          <div class="card mt-6">
            <div class="card-header">基本信息</div>
            <div class="card-body">
              <table class="data-table">
                <tr><td style="width:120px;color:var(--text-secondary);">姓名</td><td>${a.name || '-'}</td></tr>
                <tr><td style="color:var(--text-secondary);">性别</td><td>${a.gender || '-'}</td></tr>
                <tr><td style="color:var(--text-secondary);">年龄</td><td>${a.age ? a.age + '岁' : '-'}${a.birthday ? '（' + a.birthday + '）' : ''}</td></tr>
                <tr><td style="color:var(--text-secondary);">星座</td><td>${a.constellation || '-'}</td></tr>
                <tr><td style="color:var(--text-secondary);">出生地</td><td>${a.birthplace || '-'}</td></tr>
                ${a.ethnicity ? `<tr><td style="color:var(--text-secondary);">民族</td><td>${a.ethnicity}</td></tr>` : ''}
                <tr><td style="color:var(--text-secondary);">经纪公司</td><td>${a.agency || '-'}</td></tr>
                <tr><td style="color:var(--text-secondary);">人设标签</td><td>${a.persona_tags || '-'}</td></tr>
                <tr><td style="color:var(--text-secondary);">代表作</td><td>${a.masterpieces || '-'}</td></tr>
                ${a.commercial_quote ? `<tr><td style="color:var(--text-secondary);">商务报价</td><td style="font-weight:600;color:var(--primary);">${a.commercial_quote}</td></tr>` : ''}
                <tr><td style="color:var(--text-secondary);">数据来源</td><td>${a.data_source || '公开信息'}</td></tr>
              </table>
            </div>
          </div>
        </div>

        <!-- Commercial Tab -->
        <div class="tab-content" id="tab-commercial">
          <div class="card mb-6">
            <div class="card-header">商业价值概览</div>
            <div class="card-body">
              <div id="commercialScoreBox">
                <div class="grid-2">
                  <div style="text-align:center;">
                    ${a.commercial_quote ? `<div style="font-size:28px;font-weight:700;color:var(--primary);">${a.commercial_quote}</div><div style="font-size:14px;color:var(--text-secondary);margin-top:8px;">商务报价</div>` : `<div style="font-size:14px;color:var(--text-tertiary);">暂无商务报价数据</div>`}
                  </div>
                  <div style="text-align:center;">
                    <div style="font-size:28px;font-weight:700;color:var(--value-s);">${a.heat_level || '-'}</div>
                    <div style="font-size:14px;color:var(--text-secondary);margin-top:8px;">热度等级</div>
                  </div>
                </div>
                <div style="text-align:center;margin-top:10px;font-size:12px;color:var(--text-tertiary);">点击「商业价值」标签查看完整四维评分分析</div>
              </div>
            </div>
          </div>
          <div class="grid-2">
            <div class="card">
              <div class="card-header">商务信息</div>
              <div class="card-body">
                <table class="data-table">
                  <tr><td style="color:var(--text-secondary);">商务报价</td><td style="font-weight:600;color:var(--primary);">${a.commercial_quote || '-'}</td></tr>
                  <tr><td style="color:var(--text-secondary);">经纪公司</td><td>${a.agency || '-'}</td></tr>
                  <tr><td style="color:var(--text-secondary);">历史代言</td><td>${a.brand_history || '-'}</td></tr>
                  <tr><td style="color:var(--text-secondary);">粉丝购买力</td><td>${a.fans_purchase_level || '-'}</td></tr>
                </table>
              </div>
            </div>
            <div class="card">
              <div class="card-header">商业价值雷达</div>
              <div class="card-body text-center">
                <div style="max-width:280px;margin:0 auto;">
                  <canvas id="commercialRadarCanvas" width="320" height="240"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="card mt-6">
            <div class="card-header">商业价值趋势（近12个月）</div>
            <div class="card-body">
              <div style="max-width:100%;height:260px;">
                <canvas id="trendChart"></canvas>
              </div>
            </div>
          </div>
          <div class="card mt-6">
            <div class="card-header">风险事件时间线</div>
            <div class="card-body">
              <div style="max-width:100%;height:200px;">
                <canvas id="eventTimelineCanvas"></canvas>
              </div>
            </div>
          </div>
          <div class="card mt-6">
            <div class="card-header">竞品对比分析</div>
            <div class="card-body">
              <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
                <input type="text" id="compareInput" placeholder="输入对比艺人名称，逗号分隔" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid var(--border, #E5E7EB);border-radius:8px;font-size:14px;" value="${this.state.compareDefaultNames || ''}">
                <button class="btn btn-primary" onclick="App.runCompareAnalysis(${a.id}, '${a.name.replace(/'/g, "\\'")}')">开始对比</button>
              </div>
              <div id="compareResultArea"></div>
            </div>
          </div>
        </div>

        <!-- Fans Tab -->
        <div class="tab-content" id="tab-fans">
          <div class="grid-3 mb-6">
            <div class="stat-card">
              <div class="stat-number" style="color:var(--primary);">${this.formatFans(a.weibo_fans)}</div>
              <div class="stat-label">微博粉丝</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color:var(--primary);">${this.formatFans(a.douyin_fans)}</div>
              <div class="stat-label">抖音粉丝</div>
            </div>
            <div class="stat-card">
              <div class="stat-number" style="color:var(--risk-safe);">${a.fans_purchase_level || '-'}</div>
              <div class="stat-label">粉丝购买力</div>
            </div>
          </div>
          <div class="card mb-6">
            <div class="card-header">粉丝画像</div>
            <div class="card-body">
              <div style="display:flex;gap:24px;flex-wrap:wrap;justify-content:center;">
                <div style="flex:1;min-width:280px;max-width:400px;">
                  <div style="text-align:center;font-weight:600;margin-bottom:8px;color:var(--text-secondary);font-size:13px;">性别分布</div>
                  <canvas id="fanGenderChart" height="220"></canvas>
                </div>
                <div style="flex:1;min-width:280px;max-width:400px;">
                  <div style="text-align:center;font-weight:600;margin-bottom:8px;color:var(--text-secondary);font-size:13px;">年龄分布</div>
                  <canvas id="fanAgeChart" height="220"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">粉丝详细信息</div>
            <div class="card-body">
              <table class="data-table">
                <tr><td style="width:140px;color:var(--text-secondary);">官方粉丝名</td><td><strong>${a.fans_name || '-'}</strong>${a.fans_name_verified ? ' <span class="tag tag-risk-safe" style="font-size:11px;padding:1px 6px;">已验证</span>' : ''}</td></tr>
                <tr><td style="color:var(--text-secondary);">微博粉丝</td><td><strong>${this.formatFans(a.weibo_fans)}</strong></td></tr>
                <tr><td style="color:var(--text-secondary);">抖音粉丝</td><td><strong>${this.formatFans(a.douyin_fans)}</strong></td></tr>
                <tr><td style="color:var(--text-secondary);">粉丝购买力</td><td><span class="tag tag-risk-safe">${a.fans_purchase_level || '-'}</span></td></tr>
              </table>
            </div>
          </div>
        </div>

        <!-- Insight Tab -->
        ${this.renderInsightTab(a)}

        <!-- Events Tab -->
        <div class="tab-content" id="tab-events">
          <div style="text-align:center;padding:40px;"><div class="spinner"></div><span style="color:var(--text-tertiary);margin-left:8px;">加载风险事件...</span></div>
        </div>`;

      // Store artist for lazy loading (commercial score / radar)
      this.state.currentArtistId = id;
      this.state.currentArtist = a;

      // Draw radar chart
      this.drawRadarChart(a);

      // P4/P5-A：加载风险评分可解释性（四维因子级分解，支持按行业模型配置）
      this.state.currentArtistId = id;
      this.loadRiskExplanation(id, 'default');

      // Commercial radar 改为「点击商业价值标签」时懒加载真实数据（避免展示随机假数据）

      // Draw fan profile pie charts
      this.drawFanProfileCharts(a);

      // Draw commercial value trend chart
      this.drawTrendChart(a.id);

      // Pre-load events
      this.loadEvents(id);

    } catch (err) {
      document.querySelector('.page-content').innerHTML = `
        <div class="text-center" style="padding:60px;">
          <p style="font-size:16px;color:var(--text-secondary);margin-bottom:16px;">加载艺人信息失败</p>
          <p class="text-sm text-tertiary">${err.message}</p>
          <button class="btn btn-primary mt-6" onclick="App.navigate('home')">返回首页</button>
        </div>`;
    }
  },

  // ---- P4/P5-A 风险评分可解释性 ----
  async loadRiskExplanation(artistId, profile) {
    const panel = document.getElementById('explainPanel');
    if (!panel) return;
    profile = profile || 'default';
    try {
      // 拉取可用模型配置（缓存），填充下拉并选中当前项
      await this.populateExplainProfiles(profile);
      const d = await this.api(`/risk/explain/${artistId}?profile=${encodeURIComponent(profile)}`);
      panel.innerHTML = this.renderExplanation(d);
    } catch (err) {
      panel.innerHTML = `<p class="text-sm text-tertiary">评分解释暂不可用：${this.escHtml(err.message)}</p>`;
    }
  },

  async populateExplainProfiles(current) {
    try {
      if (!this.state.modelProfiles) {
        const r = await this.api('/risk/model/profiles');
        this.state.modelProfiles = (r && r.profiles) ? r.profiles : [];
      }
      const sel = document.getElementById('explainProfileSel');
      if (!sel) return;
      const profiles = this.state.modelProfiles;
      if (sel.options.length <= 1 && profiles.length) {
        sel.innerHTML = profiles.map(p =>
          `<option value="${this.escHtml(p.name)}">${this.escHtml(p.label || p.name)}</option>`
        ).join('');
      }
      sel.value = current || 'default';
    } catch (err) {
      // 配置列表拉取失败不阻断解释渲染
    }
  },

  onExplainProfileChange() {
    const sel = document.getElementById('explainProfileSel');
    if (!sel) return;
    const id = this.state.currentArtistId;
    if (id) this.loadRiskExplanation(id, sel.value);
  },

  renderExplanation(d) {
    const dims = d.dimensions || {};
    const dimNames = { political: '政治风险', legal: '法律风险', moral: '道德风险', commercial: '商业风险' };
    const basisColor = d.data_basis === 'real_events' ? 'var(--risk-safe)' : '#F59E0B';
    const basisLabel = d.data_basis === 'real_events' ? '实时事件计算' : '无事件 · 历史评估';
    const scoreText = (d.comprehensive_score != null) ? d.comprehensive_score : '—';
    const weightsLine = (d.weights_overview || []).map(w => `${w.name} ${w.weight_pct}`).join(' · ');

    const order = ['political', 'legal', 'moral', 'commercial'];
    let dimsHtml = '';
    for (const code of order) {
      const dim = dims[code] || {};
      const score = dim.score != null ? dim.score : 100;
      const level = dim.level || '低';
      const color = this.getRiskDimColor(level);
      const deductions = dim.deductions != null ? dim.deductions : 0;
      const evs = dim.events || [];
      let contrib = '';
      if (evs.length) {
        contrib = '<div style="margin-top:10px;display:flex;flex-direction:column;gap:0;">' + evs.map(ev => {
          const sevColor = this.getSevColor(ev.severity);
          const links = (ev.source_links || []).slice(0, 3).map((l, i) =>
            `<a href="${this.escHtml(l)}" target="_blank" rel="noopener" style="color:var(--primary);font-size:12px;margin-left:4px;">[${i + 1}]</a>`
          ).join('');
          const verified = ev.verified ? '<span style="color:var(--risk-safe);font-size:11px;margin-left:6px;">已核验</span>' : '<span style="color:#F59E0B;font-size:11px;margin-left:6px;">未核验</span>';
          return `<div style="display:flex;gap:10px;align-items:flex-start;font-size:13px;border-top:1px solid var(--border,#EEF2F7);padding-top:8px;margin-top:8px;">
            <span style="min-width:74px;color:var(--text-tertiary);font-size:12px;">${this.escHtml(ev.event_date || '')}</span>
            <span style="min-width:40px;"><span style="padding:1px 7px;border-radius:4px;color:#fff;font-size:12px;background:${sevColor};">${this.escHtml(ev.severity_label || ev.severity || '')}</span></span>
            <span style="flex:1;line-height:1.5;">${this.escHtml(ev.title || '')}${links}${verified}</span>
            <span style="color:#DC2626;font-weight:600;min-width:54px;text-align:right;">−${ev.deduction}</span>
          </div>`;
        }).join('') + '</div>';
      }
      dimsHtml += `
        <div class="card" style="border-left:4px solid ${color};">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <span style="font-size:14px;font-weight:600;color:var(--text-primary);">${dimNames[code]}</span>
            <span class="text-xs text-tertiary">权重 ${dim.weight_pct || ''}</span>
          </div>
          <div style="display:flex;align-items:baseline;gap:10px;margin-top:6px;">
            <span style="font-size:26px;font-weight:800;color:${color};">${score}</span>
            <span class="tag" style="background:${color};color:#fff;font-size:12px;">${level}风险</span>
            <span class="text-xs text-tertiary">扣分 ${deductions} · ${dim.events_count || 0} 条事件</span>
          </div>
          ${contrib}
        </div>`;
    }

    return `
      <div style="background:var(--bg-soft,#F8FAFC);border-radius:10px;padding:14px 16px;margin-bottom:16px;font-size:13px;color:var(--text-secondary);line-height:1.8;">
        <div><strong>综合风险评分：</strong><span style="font-size:20px;font-weight:800;color:var(--text-primary);">${scoreText}</span> 分 · ${this.escHtml(d.risk_level || '')}</div>
        <div><strong>计算模型：</strong>${this.escHtml(d.formula || '')}</div>
        <div><strong>当前权重：</strong>${this.escHtml(weightsLine)}</div>
        <div><strong>模型配置：</strong>${this.escHtml(d.model_profile || 'default')}${d.tail_boost != null ? ` · 尾部放大 ${d.tail_boost}` : ''}</div>
        <div style="margin-top:8px;"><span style="display:inline-block;padding:3px 12px;border-radius:12px;color:#fff;font-size:12px;background:${basisColor};">${basisLabel}</span> ${this.escHtml(d.coverage_note || '')}</div>
      </div>
      <div class="grid-2" style="gap:14px;margin-bottom:8px;">${dimsHtml}</div>`;
  },

  renderScoreBar(label, weight, score) {
    const scoreClass = this.getScoreColor(score);
    const pct = score ?? 0;
    const color = pct >= 80 ? 'var(--risk-safe)' : pct >= 60 ? 'var(--risk-mid)' : 'var(--risk-high)';
    return `
    <div>
      <div class="flex justify-between mb-4">
        <span class="font-medium">${label} <span class="text-xs text-tertiary">（${weight}）</span></span>
        <span style="font-weight:700;" class="${scoreClass}">${score ?? '-'}/100</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color};"></div></div>
    </div>`;
  },

  switchTab(tabId) {
    document.querySelectorAll('.detail-tab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
    // 商业价值 tab：懒加载真实商业价值评分（接 /commercial/score，401/402 由 api() 统一拦截）
    if (tabId === 'commercial' && this.state.currentArtistId) {
      this.loadCommercialScore(this.state.currentArtistId);
    }
  },

  renderInsightTab(a) {
    const insight = a.deep_insight;
    const category = a.insight_category || '';
    if (!insight && !category) {
      return `<div class="tab-content" id="tab-insight">
        <div class="text-center" style="padding:60px;">
          <div style="font-size:48px;margin-bottom:16px;">🔍</div>
          <p style="font-size:15px;color:var(--text-secondary);margin-bottom:8px;">暂无深度洞察数据</p>
          <p class="text-sm text-tertiary">该艺人尚未生成深度洞察分析，敬请期待</p>
        </div>
      </div>`;
    }

    // Category styling
    const catStyles = {
      '流量型': { bg: '#FFFBEB', color: '#92400E', icon: '🔥' },
      '实力型': { bg: '#EFF6FF', color: '#1D4ED8', icon: '⭐' },
      '情怀型': { bg: '#F5F3FF', color: '#6D28D9', icon: '💫' },
      '国际型': { bg: '#ECFEFF', color: '#0E7490', icon: '🌍' },
      '长青型': { bg: '#ECFDF5', color: '#065F46', icon: '🌲' },
    };
    const cs = catStyles[category] || { bg: 'var(--gray-100)', color: 'var(--gray-600)', icon: '📌' };

    // Parse insight sections
    const sections = this.parseInsightSections(insight || '');

    return `<div class="tab-content" id="tab-insight">
      <div class="card">
        <div class="card-header">
          <div style="display:flex;align-items:center;gap:12px;">
            <span>深度洞察</span>
            ${category ? `<span class="insight-cat-tag" style="background:${cs.bg};color:${cs.color};">${cs.icon} ${category}</span>` : ''}
          </div>
        </div>
        <div class="card-body">
          ${sections.length > 0 ? sections.map(s => `
            <div class="insight-section">
              <div class="insight-section-header">
                <span class="insight-section-icon">${s.icon}</span>
                <span class="insight-section-title">${s.label}</span>
              </div>
              <p class="insight-section-body">${s.content}</p>
            </div>
          `).join('') : `<p style="font-size:15px;line-height:1.8;color:var(--text-secondary);">${insight || '暂无深度洞察数据'}</p>`}
        </div>
      </div>
    </div>`;
  },

  parseInsightSections(text) {
    const sectionDefs = [
      { key: '职业轨迹', icon: '🎬', patterns: ['职业轨迹：', '职业轨迹:', '演艺轨迹：', '演艺轨迹:'] },
      { key: '粉丝特征', icon: '👥', patterns: ['粉丝特征：', '粉丝特征:', '粉丝画像：', '粉丝画像:'] },
      { key: '商业价值', icon: '💰', patterns: ['商业价值：', '商业价值:', '商业评估：', '商业评估:'] },
      { key: '风险预判', icon: '🛡️', patterns: ['风险预判：', '风险预判:', '风险研判：', '风险研判:'] },
    ];

    const sections = [];
    for (const def of sectionDefs) {
      let content = '';
      let matchPattern = null;
      for (const p of def.patterns) {
        if (text.includes(p)) {
          matchPattern = p;
          break;
        }
      }
      if (matchPattern) {
        const idx = text.indexOf(matchPattern);
        const after = text.slice(idx + matchPattern.length);
        // Find next section boundary
        const nextIdx = Math.min(
          ...sectionDefs.filter(d => d.key !== def.key).map(d => {
            for (const p of d.patterns) {
              const i = after.indexOf(p);
              if (i >= 0) return i;
            }
            return after.length;
          })
        );
        content = after.slice(0, nextIdx).trim();
        if (content) {
          sections.push({ label: def.key, icon: def.icon, content });
        }
      }
    }

    return sections;
  },

  drawRadarChart(a) {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    if (this.state.radarChart) {
      this.state.radarChart.destroy();
      this.state.radarChart = null;
    }
    const draw = () => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        // 确保 canvas 有有效尺寸（GitHub Pages 下首次渲染可能 0x0）
        if (canvas.width === 0 || canvas.height === 0) {
          canvas.width = 320;
          canvas.height = 240;
        }
        this.state.radarChart = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['政治风险', '法律风险', '道德风险', '商业风险'],
            datasets: [{
              label: '风险评分',
              data: [a.risk_political ?? 0, a.risk_legal ?? 0, a.risk_moral ?? 0, a.risk_commercial ?? 0],
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              borderColor: 'rgba(37, 99, 235, 0.8)',
              borderWidth: 2,
              pointBackgroundColor: '#2563EB',
              pointRadius: 4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: { stepSize: 20, color: '#9CA3AF', backdropColor: 'transparent' },
                grid: { color: '#E5E7EB' },
                pointLabels: { font: { size: 13, weight: '500' }, color: '#4B5563' },
                angleLines: { color: '#E5E7EB' },
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.label}: ${ctx.raw}/100`
                }
              }
            }
          }
        });
      } catch (e) {
        console.error('Radar chart error:', e);
      }
    };
    // 延迟到下一帧，确保 canvas 已参与 layout
    requestAnimationFrame(draw);
  },

  drawCommercialRadar(a, scoreData) {
    const canvas = document.getElementById('commercialRadarCanvas');
    if (!canvas) return;
    if (this.state.commercialRadarChart) {
      this.state.commercialRadarChart.destroy();
      this.state.commercialRadarChart = null;
    }
    const ctx = canvas.getContext('2d');

    let heatScore, fansScore, quoteScore, purchaseScore;
    if (scoreData && scoreData.dimensions) {
      // 真实评分数据（来自 /commercial/score）
      const d = scoreData.dimensions;
      heatScore = d.heat_level?.score ?? 0;
      fansScore = d.fans_scale?.score ?? 0;
      quoteScore = d.commercial_quote?.score ?? 0;
      purchaseScore = d.purchase_power?.score ?? 0;
    } else {
      // 启发式占位（未登录 / 离线 / 数据缺失），报价用中性值而非随机值
      const heatMap = { S: 95, A: 80, B: 60, C: 35, D: 15 };
      heatScore = heatMap[a.heat_level] || 30;
      const parseFans = (v) => {
        if (!v) return 30;
        const n = parseFloat(String(v).replace(',', ''));
        if (n >= 5000) return 95;
        if (n >= 1000) return 80;
        if (n >= 500) return 65;
        if (n >= 100) return 45;
        return 25;
      };
      fansScore = Math.max(parseFans(a.weibo_fans), parseFans(a.douyin_fans));
      quoteScore = 30;
      const purchaseMap = { s: 95, a: 80, b: 60, c: 35, d: 15 };
      purchaseScore = (() => {
        if (!a.fans_purchase_level) return 35;
        const v = a.fans_purchase_level.toLowerCase();
        for (const [k, sc] of Object.entries(purchaseMap)) {
          if (v.includes(k)) return sc;
        }
        return 35;
      })();
    }

    const draw = () => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (canvas.width === 0 || canvas.height === 0) {
          canvas.width = 320;
          canvas.height = 240;
        }
        this.state.commercialRadarChart = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['热度等级', '粉丝量级', '商务报价', '粉丝购买力'],
            datasets: [{
              label: '商业价值',
              data: [heatScore, fansScore, quoteScore, purchaseScore],
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              borderColor: 'rgba(139, 92, 246, 0.8)',
              borderWidth: 2,
              pointBackgroundColor: '#8B5CF6',
              pointRadius: 4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
              r: {
                beginAtZero: true, max: 100,
                ticks: { stepSize: 25, color: '#9CA3AF', backdropColor: 'transparent' },
                grid: { color: '#E5E7EB' },
                pointLabels: { font: { size: 12, weight: '500' }, color: '#4B5563' },
                angleLines: { color: '#E5E7EB' },
              }
            },
            plugins: { legend: { display: false } }
          }
        });
      } catch (e) {
        console.error('Commercial radar chart error:', e);
      }
    };
    requestAnimationFrame(draw);
  },

  // ---- 商业价值评分懒加载（对接 /commercial/score，401/402 由 api() 统一拦截）----
  async loadCommercialScore(artistId) {
    // 已缓存则直接渲染，避免重复请求
    if (this.state.commercialScores[artistId]) {
      this.renderCommercialScore(this.state.commercialScores[artistId]);
      return;
    }
    const a = this.state.currentArtist;
    try {
      const data = await this.api(`/commercial/score/${artistId}`);
      this.state.commercialScores[artistId] = data;
      this.renderCommercialScore(data);
    } catch (e) {
      // 401/402 已由 api() 弹出登录/升级框；此处回退为启发式占位，避免空白
      const box = document.getElementById('commercialScoreBox');
      if (box) box.innerHTML = `<div style="text-align:center;padding:18px;color:var(--text-tertiary);font-size:13px;">商业价值完整分析需登录后查看<br><span style="font-size:11px;">登录专业版可解锁四维评分、等级与趋势</span></div>`;
      if (a) this.drawCommercialRadar(a);
    }
  },

  renderCommercialScore(data) {
    const box = document.getElementById('commercialScoreBox');
    if (!box) return;
    const d = data.dimensions || {};
    const LABELS = { heat_level: '热度等级', fans_scale: '粉丝量级', commercial_quote: '商务报价', purchase_power: '粉丝购买力' };
    const order = ['heat_level', 'fans_scale', 'commercial_quote', 'purchase_power'];
    const bars = order.map(k =>
      this.renderScoreBar(LABELS[k], (d[k] && d[k].weight) || '', (d[k] && d[k].score) ?? 0)
    ).join('');
    box.innerHTML = `
      <div class="grid-2" style="align-items:center;margin-bottom:12px;">
        <div style="text-align:center;">
          <div style="font-size:38px;font-weight:800;color:var(--primary);">${data.total_score ?? '-'}</div>
          <div style="font-size:14px;color:var(--text-secondary);margin-top:2px;">商业价值总分 · ${data.level || ''}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:6px;">四维权重</div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.9;">
            ${LABELS.heat_level} ${(d.heat_level && d.heat_level.weight) || ''}<br>
            ${LABELS.fans_scale} ${(d.fans_scale && d.fans_scale.weight) || ''}<br>
            ${LABELS.commercial_quote} ${(d.commercial_quote && d.commercial_quote.weight) || ''}<br>
            ${LABELS.purchase_power} ${(d.purchase_power && d.purchase_power.weight) || ''}
          </div>
        </div>
      </div>
      <div style="margin-top:4px;">${bars}</div>`;
    // 用真实数据重绘雷达
    const a = this.state.currentArtist;
    if (a) this.drawCommercialRadar(a, data);
  },

  drawEventTimeline(events) {
    const canvas = document.getElementById('eventTimelineCanvas');
    if (!canvas || !events || events.length === 0) return;
    try {
    const ctx = canvas.getContext('2d');

    // Group events by type and sort by date
    const severityMap = { critical: 4, high: 3, medium: 2, low: 1 };
    const sevColors = { critical: '#DC2626', high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
    const typeColors = { political: '#7C3AED', legal: '#2563EB', moral: '#DB2777', commercial: '#059669' };

    const sorted = [...events].sort((a, b) => {
      const dA = new Date(a.event_date || '2000-01-01');
      const dB = new Date(b.event_date || '2000-01-01');
      return dA - dB;
    });

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(e => {
          const d = (e.event_date || '').slice(5, 10);
          const desc = (e.description || e.title || '').slice(0, 15);
          return d || desc;
        }),
        datasets: [{
          label: '影响值',
          data: sorted.map(e => Math.abs(e.impact_score || 0)),
          backgroundColor: sorted.map(e => {
            const sev = e.severity || 'medium';
            return sevColors[sev] || '#F59E0B';
          }),
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: '影响值', font: { size: 11 } }, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 10 }, maxRotation: 45 } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => {
                const e = sorted[items[0].dataIndex];
                return e.event_date || '';
              },
              label: (item) => {
                const e = sorted[item.dataIndex];
                const sev = e.severity || 'medium';
                const etype = e.event_type || '';
                return `[${etype}/${sev}] ${(e.description || '').slice(0, 40)}`;
              }
            }
          }
        }
      }
    });
    } catch (e) {
      console.error('Event timeline chart error:', e);
    }
  },

  // ---- Fan Profile Pie Charts ----
  drawFanProfileCharts(a) {
    try {
    const genderCanvas = document.getElementById('fanGenderChart');
    const ageCanvas = document.getElementById('fanAgeChart');
    if (!genderCanvas && !ageCanvas) return;

    // Estimate fan demographics based on artist attributes
    const tags = (a.persona_tags || '').toLowerCase();
    const gender = (a.gender || '').trim();
    const genre = (a.genre || '').toLowerCase();
    const isMale = gender === '男';
    const isFemale = gender === '女';

    // Gender distribution estimation
    let femaleRatio = 0.65; // default more female
    if (isMale && tags.includes('偶像')) femaleRatio = 0.82;
    else if (isMale && tags.includes('演员')) femaleRatio = 0.72;
    else if (isMale && tags.includes('rapper') || tags.includes('说唱')) femaleRatio = 0.45;
    else if (isMale && (tags.includes('健身') || tags.includes('体育'))) femaleRatio = 0.35;
    else if (isMale && tags.includes('搞笑')) femaleRatio = 0.50;
    else if (isMale && tags.includes('潮流')) femaleRatio = 0.60;
    else if (isFemale && tags.includes('女神')) femaleRatio = 0.40;
    else if (isFemale && tags.includes('可爱')) femaleRatio = 0.55;
    else if (isFemale && tags.includes('飒') || tags.includes('酷')) femaleRatio = 0.50;
    else if (isFemale) femaleRatio = 0.42;

    const genderData = {
      labels: ['女性粉丝', '男性粉丝'],
      datasets: [{
        data: [
          Math.round(femaleRatio * 100),
          Math.round((1 - femaleRatio) * 100)
        ],
        backgroundColor: ['#EC4899', '#3B82F6'],
        borderWidth: 2,
        borderColor: '#fff',
      }]
    };

    // Age distribution estimation
    const isIdol = tags.includes('偶像') || tags.includes('爱豆') || tags.includes('青春') || tags.includes('唱跳');
    const isVeteran = tags.includes('实力') || tags.includes('老戏骨') || tags.includes('经典');
    const isFashion = tags.includes('时尚') || tags.includes('潮流') || tags.includes('酷');

    let ageZ = isIdol ? 35 : isVeteran ? 15 : 25; // 00后
    let ageM = isIdol ? 30 : isVeteran ? 20 : 30; // 90后
    let ageE = isIdol ? 20 : isVeteran ? 30 : 25; // 80后
    let ageO = isIdol ? 10 : isVeteran ? 25 : 15; // 70后+
    let ageU = 5; // unknown

    const ageData = {
      labels: ['00后 (≤24岁)', '90后 (25-34岁)', '80后 (35-44岁)', '70后+ (≥45岁)', '未知'],
      datasets: [{
        data: [ageZ, ageM, ageE, ageO, ageU],
        backgroundColor: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#E5E7EB'],
        borderWidth: 2,
        borderColor: '#fff',
      }]
    };

    const chartOpts = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } } },
        tooltip: {
          callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` }
        }
      }
    };

    if (genderCanvas) {
      if (this.state.fanGenderChart) { this.state.fanGenderChart.destroy(); }
      this.state.fanGenderChart = new Chart(genderCanvas, { type: 'pie', data: genderData, options: chartOpts });
    }
    if (ageCanvas) {
      if (this.state.fanAgeChart) { this.state.fanAgeChart.destroy(); }
      this.state.fanAgeChart = new Chart(ageCanvas, { type: 'pie', data: ageData, options: chartOpts });
    }
    } catch (e) {
      console.error('Fan profile chart error:', e);
    }
  },

  // ---- Commercial Trend Chart ----
  async drawTrendChart(artistId) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    try {
      const data = await this.api(`/commercial/trend/${artistId}?months=12`);
      const trend = data.trend || [];

      if (trend.length < 2) {
        canvas.parentElement.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-tertiary);font-size:13px;">暂无足够历史数据<br><span style="font-size:11px;">评过分后自动记录快照，累积2条以上即可显示趋势</span></div>';
        return;
      }

      const labels = trend.map(p => p.date);
      const makeDataset = (key, label, color) => ({
        label,
        data: trend.map(p => p[key] ?? null),
        borderColor: color,
        backgroundColor: color + '18',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
      });

      if (this.state.trendChart) this.state.trendChart.destroy();
      this.state.trendChart = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            makeDataset('total_score', '商业价值总分', '#2563EB'),
            makeDataset('heat_score', '热度得分', '#F59E0B'),
            makeDataset('fans_score', '粉丝得分', '#10B981'),
            makeDataset('quote_score', '报价得分', '#8B5CF6'),
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14, font: { size: 11 } } },
            tooltip: { backgroundColor: '#1E293B', titleFont: { size: 12 }, bodyFont: { size: 11 }, padding: 10 },
          },
          scales: {
            y: { min: 0, max: 100, ticks: { font: { size: 10 } }, grid: { color: '#F1F5F9' } },
            x: { ticks: { font: { size: 10 }, maxRotation: 45 }, grid: { display: false } },
          },
        },
      });
    } catch (err) {
      console.error('Trend chart error:', err);
      if (canvas.parentElement) {
        canvas.parentElement.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-tertiary);">趋势图加载失败</div>';
      }
    }
  },

  // ---- Competitor Comparison ----
  async runCompareAnalysis(currentId, currentName) {
    const input = document.getElementById('compareInput');
    const resultArea = document.getElementById('compareResultArea');
    if (!input || !resultArea) return;

    const names = input.value.trim().split(/[,，]/).map(s => s.trim()).filter(Boolean);
    if (names.length === 0) {
      this.showToast('请输入至少一个对比艺人名称', 'error');
      return;
    }

    // 离线模式：直接在本地数据里找
    if (this.state.offlineMode) {
      const src = (this.state.offlineArtists.length ? this.state.offlineArtists : OFFLINE_DEMO_DATA);
      const found = [currentName, ...names].map(n => src.find(x => x.name === n)).filter(Boolean);
      if (found.length < 2) {
        resultArea.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-secondary);">离线数据中未找到可对比的艺人，请确认名称</div>';
        return;
      }
      this.renderCompareChart(found.map(a => ({
        artist_name: a.name,
        total_score: 100 - (a.risk_total_score || 0),
        heat_level: a.heat_level,
        risk_level: a.risk_level,
        commercial_quote: a.commercial_quote,
        weibo_fans: a.weibo_fans,
      })));
      return;
    }

    resultArea.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-secondary);">正在搜索对比艺人...</div>';

    try {
      // 1. Search for each artist name to get IDs
      const artistIds = [currentId]; // always include current artist
      const artistNames = [currentName];
      const nameIdMap = {};

      for (const name of names) {
        try {
        const data = await this.api(`/artists/search?keyword=${encodeURIComponent(name)}&limit=1`).catch(() => null);
        if (data) {
          const items = data.items || data.results || data;
            if (items && items.length > 0) {
              const found = items[0];
              const id = found.id || found.artist_id;
              const fname = found.name || found.artist_name;
              if (id && !artistIds.includes(id)) {
                artistIds.push(id);
                artistNames.push(fname);
                nameIdMap[id] = fname;
              }
            }
          }
        } catch (e) { /* skip unresolvable names */ }
      }

      if (artistIds.length < 2) {
        resultArea.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-secondary);">未找到可对比的艺人，请确认名称</div>';
        return;
      }

      // 2. Call compare API
      const data = await this.api(`/commercial/compare?ids=${artistIds.join(',')}`);

      // 3. Render comparison results
      this.renderCompareChart(data.results || data.compared_artists);
    } catch (err) {
      resultArea.innerHTML = `<div style="text-align:center;padding:20px;color:var(--risk-high);">对比失败：${err.message}</div>`;
    }
  },

  renderCompareChart(artists) {
    const resultArea = document.getElementById('compareResultArea');
    if (!resultArea || !artists || artists.length < 2) return;

    const names = artists.map(a => a.artist_name || a.name);
    const colors = ['#2563EB', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];

    // Render chart + table
    resultArea.innerHTML = `
      <div style="margin-bottom:16px;">
        <canvas id="compareBarChart" height="250"></canvas>
      </div>
      <table class="data-table" style="font-size:13px;">
        <thead>
          <tr>
            <th>艺人</th><th>商业评分</th><th>热度</th><th>风险等级</th><th>报价</th><th>微博粉丝</th>
          </tr>
        </thead>
        <tbody>
          ${artists.map((a, i) => `
            <tr>
              <td><strong>${a.artist_name || a.name}</strong></td>
              <td style="color:${colors[i % colors.length]};font-weight:600;">${(a.total_score || 0).toFixed(1)}</td>
              <td>${a.heat_level || '-'}</td>
              <td>${a.risk_level || '-'}</td>
              <td>${a.commercial_quote || '-'}</td>
              <td>${a.weibo_fans || '-'}万</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Draw grouped bar chart
    const canvas = document.getElementById('compareBarChart');
    if (!canvas) return;
    try {
    if (this.state.compareChart) this.state.compareChart.destroy();

    // Try to extract sub-scores if available
    const heatScores = artists.map(a => this.heatToScore(a.heat_level));
    const totalScores = artists.map(a => a.total_score || 0);

    this.state.compareChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: names,
        datasets: [
          {
            label: '商业价值评分',
            data: totalScores,
            backgroundColor: colors.slice(0, names.length).map(c => c + 'CC'),
            borderColor: colors.slice(0, names.length),
            borderWidth: 2,
            borderRadius: 6,
          },
          {
            label: '热度评分',
            data: heatScores,
            backgroundColor: colors.slice(0, names.length).map(c => c + '44'),
            borderColor: colors.slice(0, names.length),
            borderWidth: 1,
            borderRadius: 6,
            borderDash: [3, 3],
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { font: { size: 11 } }, grid: { color: '#F3F4F6' } },
          x: { ticks: { font: { size: 12, weight: '500' } }, grid: { display: false } },
        },
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, padding: 12, font: { size: 12 } } },
          tooltip: { mode: 'index', intersect: false },
        }
      }
    });
    } catch (e) {
      console.error('Compare chart error:', e);
    }
  },

  heatToScore(level) {
    const map = { 'S': 95, 'A': 80, 'B': 60, 'C': 40, 'D': 20 };
    return map[level] || map[level?.charAt(0)] || 50;
  },

  // ---- Brand Recommendation ----
  async runBrandRecommend() {
    const resultArea = document.getElementById('recommendResultArea');
    const tone = document.getElementById('recBrandTone')?.value || '高端';
    const gender = document.getElementById('recGender')?.value || '';
    if (!resultArea) return;

    resultArea.innerHTML = '<div style="text-align:center;padding:16px;opacity:0.7;">正在智能匹配推荐...</div>';

    // 离线模式：本地关键词匹配
    if (this.state.offlineMode) {
      const data = this.recommendOffline(tone, gender);
      this.renderRecommendResult(resultArea, data);
      return;
    }

    try {
      const params = new URLSearchParams({ brand_tone: tone, exclude_risky: 'true', limit: '5' });
      if (gender) params.set('gender', gender);

      const data = await this.api(`/commercial/recommend?${params}`);
      const recs = data.recommendations || [];

      if (recs.length === 0) {
        resultArea.innerHTML = '<div style="text-align:center;padding:16px;opacity:0.7;">暂无匹配结果</div>';
        return;
      }

      resultArea.innerHTML = `
        <div style="background:rgba(255,255,255,0.1);border-radius:10px;padding:12px;">
          <div style="font-size:12px;opacity:0.7;margin-bottom:8px;">为您推荐 ${data.total_candidates} 位艺人中的 TOP ${recs.length}</div>
          ${recs.map((r, i) => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;${i < recs.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.1);' : ''}">
              <div style="width:28px;height:28px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${i + 1}</div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:14px;cursor:pointer;" onclick="App.navigate('artist/${r.artist_id}')">${r.artist_name}</div>
                <div style="font-size:11px;opacity:0.7;">${r.match_reason || ''}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:16px;font-weight:700;">${r.total_recommend_score?.toFixed(0) || '-'}</div>
                <div style="font-size:10px;opacity:0.6;">匹配分</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      // API 失败回退到离线匹配
      const data = this.recommendOffline(tone, gender);
      this.renderRecommendResult(resultArea, data, true);
    }
  },

  renderRecommendResult(resultArea, data, isFallback = false) {
    const recs = data.recommendations || [];
    if (recs.length === 0) {
      resultArea.innerHTML = '<div style="text-align:center;padding:16px;opacity:0.7;">暂无匹配结果</div>';
      return;
    }
    resultArea.innerHTML = `
      <div style="background:rgba(255,255,255,0.1);border-radius:10px;padding:12px;">
        <div style="font-size:12px;opacity:0.7;margin-bottom:8px;">${isFallback ? '⚠️ 在线服务不可用，已用示例数据匹配 · ' : ''}推荐 ${data.total_candidates} 位艺人中的 TOP ${recs.length}</div>
        ${recs.map((r, i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;${i < recs.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.1);' : ''}">
            <div style="width:28px;height:28px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${i + 1}</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:14px;cursor:pointer;" onclick="App.navigate('artist/${r.artist_id}')">${r.artist_name}</div>
              <div style="font-size:11px;opacity:0.7;">${r.match_reason || ''}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:16px;font-weight:700;">${r.total_recommend_score?.toFixed(0) || '-'}</div>
              <div style="font-size:10px;opacity:0.6;">匹配分</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ---- Risk Report Download ----
  async downloadRiskReport(artistId, artistName) {
    try {
      this.showToast('正在生成风险报告...', 'info');
      const url = `${this.API_BASE}/risk/report/${artistId}/download`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `${artistName}_风险报告.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToast('报告下载成功！', 'success');
    } catch (err) {
      this.showToast(`报告下载失败：${err.message}`, 'error');
    }
  },

  // ---- Risk Report PDF Download (using html2pdf.js) ----
  async downloadRiskReportPDF(artistId, artistName) {
    try {
      this.showToast('正在生成PDF报告，请稍候...', 'info');

      // 1. 从后端获取HTML报告内容
      const resp = await fetch(`${this.API_BASE}/risk/report/${artistId}/download`);
      if (!resp.ok) throw new Error('获取报告失败');
      const htmlContent = await resp.text();

      // 2. 创建临时iframe来渲染HTML
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:800px;height:auto;';
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(htmlContent);
      doc.close();

      // 3. 等待渲染完成后生成PDF
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = doc.documentElement;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${artistName}_风险报告.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();

      // 4. 清理
      document.body.removeChild(iframe);
      this.showToast('PDF报告下载成功！', 'success');
    } catch (err) {
      this.showToast(`PDF生成失败：${err.message}`, 'error');
    }
  },

  // ==================== 商务安全评分卡（P5-D）====================
  async openSafetyCard(artistId) {
    const url = `${this.API_BASE}/risk/safety-card/${artistId}`;
    const headers = this.state.token ? { 'Authorization': `Bearer ${this.state.token}` } : {};
    try {
      this.showToast('正在生成安全评分卡...', 'info');
      const resp = await fetch(url, { headers });
      if (resp.status === 401) {
        const ok = await this.promptLogin();
        if (!ok) return;
        return this.openSafetyCard(artistId);
      }
      if (!resp.ok) {
        let detail = '生成失败';
        try { const j = await resp.json(); detail = j.detail || detail; } catch (e) {}
        throw new Error(detail);
      }
      const html = await resp.text();
      const w = window.open('', '_blank');
      if (!w) { this.showToast('预览被拦截，请允许弹窗', 'warning'); return; }
      w.document.open(); w.document.write(html); w.document.close();
      this.showToast('安全评分卡已打开', 'success');
    } catch (err) {
      this.showToast('安全评分卡生成失败：' + err.message, 'error');
    }
  },

  // ==================== 白标报告导出（P5-B）====================

  openWhitelabelModal(artistId, artistName) {
    this.state.wlArtistId = artistId;
    this.state.wlArtistName = artistName;
    this.state.wlLogoData = '';
    let modal = document.getElementById('wlModal');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', this._wlModalHTML());
      modal = document.getElementById('wlModal');
    }
    modal.querySelector('#wlClientName').value = '';
    modal.querySelector('#wlPrimary').value = '#2563EB';
    modal.querySelector('#wlAccent').value = '#0F2A4A';
    modal.querySelector('#wlFooter').value = '';
    modal.querySelector('#wlLogoPreview').innerHTML = '';
    modal.querySelector('#wlTemplateSel').value = '';
    this.state.wlLogoData = '';
    this.populateWhitelabelTemplates();
    modal.style.display = 'flex';
  },

  closeWhitelabelModal() {
    const m = document.getElementById('wlModal');
    if (m) m.style.display = 'none';
  },

  _wlModalHTML() {
    return `
    <div class="modal-overlay" id="wlModal" style="display:none;position:fixed;inset:0;background:rgba(15,42,74,.5);z-index:9999;align-items:center;justify-content:center;">
      <div style="background:#fff;border-radius:16px;max-width:540px;width:92%;max-height:92vh;overflow:auto;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.35);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h3 style="font-size:18px;color:#0F2A4A;margin:0;">🎨 白标报告导出</h3>
          <button onclick="App.closeWhitelabelModal()" style="border:none;background:none;font-size:24px;line-height:1;cursor:pointer;color:#94A3B8;">×</button>
        </div>
        <p style="font-size:12px;color:#64748B;margin-bottom:16px;line-height:1.6;">贴上客户品牌（Logo / 主色 / 客户名），一键导出专属风险尽调报告，支撑 AFF 5–10万/份 接单交付。品牌色仅作用于视觉主题，评分仍为艺安查规范分。</p>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
          <label style="font-size:13px;color:#334155;font-weight:600;">客户 / 品牌名称</label>
          <input id="wlClientName" type="text" placeholder="如：某某品牌公关部" style="padding:9px 12px;border:1px solid #E2E8F0;border-radius:9px;font-size:14px;" />
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
          <label style="font-size:13px;color:#334155;font-weight:600;">品牌 Logo（透明底 PNG，≤400KB）</label>
          <input id="wlLogo" type="file" accept="image/*" onchange="App.onWhitelabelLogoChange(event)" style="font-size:13px;" />
          <div id="wlLogoPreview" style="margin-top:6px;"></div>
        </div>
        <div style="display:flex;gap:14px;margin-bottom:12px;">
          <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
            <label style="font-size:13px;color:#334155;font-weight:600;">主色</label>
            <input id="wlPrimary" type="color" value="#2563EB" style="width:100%;height:38px;border:1px solid #E2E8F0;border-radius:9px;padding:2px;" />
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
            <label style="font-size:13px;color:#334155;font-weight:600;">辅色</label>
            <input id="wlAccent" type="color" value="#0F2A4A" style="width:100%;height:38px;border:1px solid #E2E8F0;border-radius:9px;padding:2px;" />
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
          <label style="font-size:13px;color:#334155;font-weight:600;">页脚备注</label>
          <input id="wlFooter" type="text" placeholder="如：本报告仅供某某品牌内部决策参考" style="padding:9px 12px;border:1px solid #E2E8F0;border-radius:9px;font-size:14px;" />
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">
          <label style="font-size:13px;color:#334155;font-weight:600;">已存模板（本地）</label>
          <div style="display:flex;gap:8px;">
            <select id="wlTemplateSel" onchange="App.loadWhitelabelTemplate()" style="flex:1;padding:9px 12px;border:1px solid #E2E8F0;border-radius:9px;font-size:14px;">
              <option value="">— 选择模板 —</option>
            </select>
            <button onclick="App.deleteWhitelabelTemplate()" style="padding:8px 12px;border:1px solid #E2E8F0;border-radius:9px;background:#F8FAFC;cursor:pointer;font-size:13px;">删除</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button onclick="App.applyWhitelabel('preview')" style="padding:9px 14px;border:none;border-radius:9px;background:#0F2A4A;color:#fff;cursor:pointer;font-size:13px;">👁 预览</button>
          <button onclick="App.applyWhitelabel('html')" style="padding:9px 14px;border:none;border-radius:9px;background:#2563EB;color:#fff;cursor:pointer;font-size:13px;">📥 下载HTML</button>
          <button onclick="App.applyWhitelabel('pdf')" style="padding:9px 14px;border:none;border-radius:9px;background:#7C3AED;color:#fff;cursor:pointer;font-size:13px;">📄 下载PDF</button>
          <button onclick="App.saveWhitelabelTemplate()" style="padding:9px 14px;border:1px solid #E2E8F0;border-radius:9px;background:#F8FAFC;cursor:pointer;font-size:13px;">💾 存为模板</button>
        </div>
      </div>
    </div>`;
  },

  onWhitelabelLogoChange(e) {
    const file = e.target.files && e.target.files[0];
    const preview = document.getElementById('wlLogoPreview');
    if (!file) { this.state.wlLogoData = ''; if (preview) preview.innerHTML = ''; return; }
    if (file.size > 400 * 1024) {
      this.showToast('Logo 不能超过 400KB', 'error');
      e.target.value = '';
      this.state.wlLogoData = '';
      if (preview) preview.innerHTML = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.state.wlLogoData = reader.result;
      if (preview) preview.innerHTML = '<img src="' + reader.result + '" style="height:48px;border:1px solid #E2E8F0;border-radius:8px;padding:4px;background:#fff;" />';
    };
    reader.readAsDataURL(file);
  },

  _wlCollectBrand() {
    return {
      client_name: (document.getElementById('wlClientName').value || '').trim(),
      client_logo: this.state.wlLogoData || '',
      primary_color: document.getElementById('wlPrimary').value || '#2563EB',
      accent_color: document.getElementById('wlAccent').value || '#0F2A4A',
      footer_note: (document.getElementById('wlFooter').value || '').trim(),
    };
  },

  async applyWhitelabel(mode) {
    const artistId = this.state.wlArtistId;
    const artistName = this.state.wlArtistName;
    if (!artistId) return;
    const authedFetch = async (path, options) => {
      const url = path.startsWith('http') ? path : `${this.API_BASE}${path}`;
      const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
      if (this.state.token) headers['Authorization'] = `Bearer ${this.state.token}`;
      let resp = await fetch(url, Object.assign({}, options, { headers }));
      if (resp.status === 401) {
        const ok = await this.promptLogin();
        if (ok) {
          if (this.state.token) headers['Authorization'] = `Bearer ${this.state.token}`;
          resp = await fetch(url, Object.assign({}, options, { headers }));
        }
      }
      return resp;
    };
    try {
      this.showToast('正在生成白标报告...', 'info');
      const brand = this._wlCollectBrand();
      const resp = await authedFetch(`/risk/report/${artistId}/whitelabel`, {
        method: 'POST',
        body: JSON.stringify(brand),
      });
      if (!resp.ok) {
        let detail = '生成失败';
        try { const j = await resp.json(); detail = j.detail || detail; } catch (e) {}
        if (resp.status === 401) detail = '请先登录后生成白标报告';
        throw new Error(detail);
      }
      const html = await resp.text();
      if (mode === 'preview') {
        const w = window.open('', '_blank');
        if (!w) { this.showToast('预览被拦截，请允许弹窗', 'warning'); return; }
        w.document.open(); w.document.write(html); w.document.close();
        this.showToast('预览已打开', 'success');
      } else if (mode === 'html') {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fn = (brand.client_name || artistName).replace(/[\\/:*?"<>|]/g, '_');
        a.href = url; a.download = fn + '_白标报告.html';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('白标HTML下载成功！', 'success');
      } else if (mode === 'pdf') {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:800px;height:auto;';
        document.body.appendChild(iframe);
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open(); doc.write(html); doc.close();
        await new Promise(r => setTimeout(r, 500));
        const element = doc.documentElement;
        const opt = {
          margin: [10, 10, 10, 10],
          filename: (brand.client_name || artistName).replace(/[\\/:*?"<>|]/g, '_') + '_白标报告.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        };
        await html2pdf().set(opt).from(element).save();
        document.body.removeChild(iframe);
        this.showToast('白标PDF下载成功！', 'success');
      }
    } catch (err) {
      this.showToast('白标生成失败：' + err.message, 'error');
    }
  },

  // ---- 白标模板（localStorage，本地复用，支撑 AFF 接单）----
  populateWhitelabelTemplates() { this.loadWhitelabelTemplates(); },
  _wlTplKey() { return 'yiancha_wl_templates'; },
  loadWhitelabelTemplates() {
    try {
      const raw = localStorage.getItem(this._wlTplKey());
      const tpls = raw ? JSON.parse(raw) : [];
      const sel = document.getElementById('wlTemplateSel');
      if (!sel) return;
      sel.innerHTML = '<option value="">— 选择模板 —</option>' + tpls.map((t, i) =>
        '<option value="' + i + '">' + (t.client_name || '未命名模板') + '</option>').join('');
    } catch (e) {}
  },
  saveWhitelabelTemplate() {
    const brand = this._wlCollectBrand();
    if (!brand.client_name) { this.showToast('请先填写客户/品牌名称再存模板', 'warning'); return; }
    try {
      const raw = localStorage.getItem(this._wlTplKey());
      const tpls = raw ? JSON.parse(raw) : [];
      tpls.push(brand);
      localStorage.setItem(this._wlTplKey(), JSON.stringify(tpls));
      this.loadWhitelabelTemplates();
      this.showToast('模板已保存（本地）', 'success');
    } catch (e) { this.showToast('保存失败：' + e.message, 'error'); }
  },
  loadWhitelabelTemplate() {
    const sel = document.getElementById('wlTemplateSel');
    if (!sel || !sel.value) return;
    try {
      const tpls = JSON.parse(localStorage.getItem(this._wlTplKey()) || '[]');
      const t = tpls[parseInt(sel.value, 10)];
      if (!t) return;
      document.getElementById('wlClientName').value = t.client_name || '';
      document.getElementById('wlPrimary').value = t.primary_color || '#2563EB';
      document.getElementById('wlAccent').value = t.accent_color || '#0F2A4A';
      document.getElementById('wlFooter').value = t.footer_note || '';
      if (t.client_logo) {
        this.state.wlLogoData = t.client_logo;
        const pv = document.getElementById('wlLogoPreview');
        if (pv) pv.innerHTML = '<img src="' + t.client_logo + '" style="height:48px;border:1px solid #E2E8F0;border-radius:8px;padding:4px;background:#fff;" />';
      }
    } catch (e) {}
  },
  deleteWhitelabelTemplate() {
    const sel = document.getElementById('wlTemplateSel');
    if (!sel || !sel.value) return;
    try {
      const tpls = JSON.parse(localStorage.getItem(this._wlTplKey()) || '[]');
      tpls.splice(parseInt(sel.value, 10), 1);
      localStorage.setItem(this._wlTplKey(), JSON.stringify(tpls));
      this.loadWhitelabelTemplates();
      this.showToast('模板已删除', 'success');
    } catch (e) {}
  },

  // ==================== 监控告警页面（#14）====================
  async renderMonitoringPage(container) {
    container.innerHTML = `
      <div class="page-content" style="max-width:1200px;margin:0 auto;padding:var(--space-8) var(--space-6);">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 style="font-size:28px;font-weight:800;letter-spacing:-1px;">🔔 风险监控告警</h1>
            <p class="text-secondary" style="margin-top:6px;">订阅重点艺人，系统持续监测新增风险事件，并通过邮件 / Webhook 推送到你自己的收件箱或风控系统。</p>
          </div>
          <button class="btn btn-primary" onclick="App.monitorRunCheck()">⚡ 立即检查</button>
        </div>
        <div id="monitorOverview" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:32px;"></div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header">➕ 添加监控艺人</div>
            <div class="card-body">
              <div class="flex gap-2" style="margin-bottom:12px;">
                <input class="form-input" id="monitorArtistInput" placeholder="输入艺人姓名，如 肖战" onkeydown="if(event.key==='Enter')App.monitorSearchArtist()">
                <button class="btn btn-outline btn-sm" onclick="App.monitorSearchArtist()">搜索</button>
              </div>
              <div id="monitorSearchResults"></div>
              <div id="monitorSubscribeForm" style="display:none;margin-top:12px;">
                <div class="form-group">
                  <label>通知邮箱（邮件渠道收件人）</label>
                  <input class="form-input" id="monitorEmail" placeholder="your@email.com">
                </div>
                <div class="form-group">
                  <label style="display:flex;align-items:center;gap:16px;font-weight:400;">
                    <span><input type="checkbox" id="monitorChEmail" checked onchange="App.monitorToggleCh('email')"> 邮件</span>
                    <span><input type="checkbox" id="monitorChWebhook" onchange="App.monitorToggleCh('webhook')"> Webhook</span>
                  </label>
                </div>
                <div class="form-group" id="monitorWebhookGroup" style="display:none;">
                  <label>出站 Webhook 地址（企业微信/飞书/钉钉机器人或自有系统）</label>
                  <input class="form-input" id="monitorWebhook" placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...">
                  <span class="text-tertiary text-xs">系统将 POST JSON 预警到此地址，便于接入你的协作/风控系统。</span>
                </div>
                <button class="btn btn-primary btn-block" onclick="App.monitorSubscribe()">确认订阅监控</button>
              </div>
            </div>
            <div class="card-header" style="border-top:1px solid var(--border-light);">📋 已监控艺人</div>
            <div class="card-body">
              <div id="monitorConfigList"><div class="loading-overlay"><div class="spinner"></div></div></div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">⚠️ 预警动态</div>
            <div class="card-body">
              <div id="monitorAlertFeed"><div class="loading-overlay"><div class="spinner"></div></div></div>
            </div>
          </div>
        </div>
        <div class="card" style="margin-top:24px;">
          <div class="card-header">📥 待核验事件 <span id="candCount" class="tag" style="background:#F0F9FF;color:#0369A1;">0</span>
            <span class="text-tertiary text-xs" style="font-weight:400;margin-left:8px;">采集自动化扫到的疑似风险事件，审核通过即正式入库并触发预警</span>
          </div>
          <div class="card-body">
            <div id="monitorCandidateList"><div class="loading-overlay"><div class="spinner"></div></div></div>
          </div>
        </div>
      </div>
    `;
    this.loadMonitoringOverview();
    this.loadMonitorConfigs();
    this.loadMonitorAlerts();
    this.loadMonitorCandidates();
  },

  monitorStatCard(label, value, color) {
    return `<div class="stat-card">
      <div class="stat-number" style="color:${color};-webkit-text-fill-color:${color};">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
  },

  async loadMonitoringOverview() {
    const el = document.getElementById('monitorOverview');
    if (!el) return;
    try {
      const d = await this.api('/monitoring/overview');
      const statusColor = d.db_status === 'ok' ? 'var(--risk-safe)' : 'var(--risk-extreme)';
      el.innerHTML =
        this.monitorStatCard('系统状态', d.api_status === 'healthy' ? '正常' : '异常', statusColor) +
        this.monitorStatCard('监控艺人', d.monitored_artists, 'var(--primary)') +
        this.monitorStatCard('待发送告警', d.unsent_alerts, d.unsent_alerts > 0 ? 'var(--risk-high)' : 'var(--primary)') +
        this.monitorStatCard('风险事件总数', d.total_events, 'var(--accent-purple)') +
        this.monitorStatCard('待核验候选', d.pending_candidates || 0, (d.pending_candidates || 0) > 0 ? 'var(--risk-high)' : 'var(--primary)');
    } catch (e) {
      el.innerHTML = `<div class="text-secondary text-sm">概览加载失败</div>`;
    }
  },

  monitorSeverityTag(sev) {
    const map = {
      critical: ['tag-risk-high', '严重'],
      high: ['tag-risk-high', '高'],
      medium: ['tag-risk-mid', '中'],
      low: ['tag-risk-safe', '低'],
    };
    const m = map[sev] || ['tag-risk-mid', sev || '?'];
    return `<span class="tag ${m[0]}">${m[1]}</span>`;
  },

  monitorSeverityText(sev) {
    return ({ critical: '严重', high: '高', medium: '中', low: '低' })[sev] || sev;
  },

  async loadMonitorConfigs() {
    const el = document.getElementById('monitorConfigList');
    if (!el) return;
    try {
      const d = await this.api('/monitoring/configs');
      if (!d.configs.length) {
        el.innerHTML = `<div class="text-tertiary text-sm" style="padding:12px 0;">暂无监控艺人，请在上方添加。</div>`;
        return;
      }
      el.innerHTML = `<table class="data-table"><thead><tr><th>艺人</th><th>渠道</th><th>新增事件</th><th></th></tr></thead><tbody>` +
        d.configs.map(c => {
          const chans = (c.channels || []).map(ch => ch === 'email' ? '📧邮件' : (ch === 'webhook' ? '🔗Webhook' : ch)).join(' ');
          const wh = c.webhook_url_masked ? `<div class="text-tertiary text-xs" style="margin-top:2px;">${c.webhook_url_masked}</div>` : '';
          const em = (c.channels || []).includes('email') && c.notify_email ? `<div class="text-secondary text-xs" style="margin-top:2px;">${c.notify_email}</div>` : '';
          return `
          <tr>
            <td><strong>${c.artist_name}</strong></td>
            <td class="text-sm">${chans || '—'}${em}${wh}</td>
            <td>${c.new_events_since_check > 0 ? `<span class="tag tag-risk-high">${c.new_events_since_check} 条</span>` : '<span class="text-tertiary text-sm">0</span>'}</td>
            <td><button class="btn btn-ghost btn-xs" onclick="App.monitorUnsubscribe(${c.id})">取消</button></td>
          </tr>`;
        }).join('') +
        `</tbody></table>`;
    } catch (e) {
      el.innerHTML = `<div class="text-tertiary text-sm" style="padding:12px 0;">监控列表加载失败</div>`;
    }
  },

  async loadMonitorAlerts() {
    const el = document.getElementById('monitorAlertFeed');
    if (!el) return;
    try {
      const d = await this.api('/monitoring/alerts');
      if (!d.alerts.length) {
        el.innerHTML = `<div class="text-tertiary text-sm" style="padding:12px 0;">暂无预警记录。</div>`;
        return;
      }
      el.innerHTML = d.alerts.map(a => `
        <div style="padding:14px 0;border-bottom:1px solid var(--border-light);">
          <div class="flex items-center gap-2 mb-4">
            ${this.monitorSeverityTag(a.severity)}
            <span class="text-tertiary text-xs">${String(a.created_at).replace('T', ' ').slice(0, 16)}</span>
            ${a.is_sent ? '<span class="tag" style="background:#ECFDF5;color:#065F46;">已推送</span>' : '<span class="tag" style="background:#FEF2F2;color:#991B1B;">待推送</span>'}
          </div>
          <div class="text-sm" style="color:var(--text-secondary);">${a.message}</div>
        </div>`).join('');
    } catch (e) {
      el.innerHTML = `<div class="text-tertiary text-sm" style="padding:12px 0;">预警加载失败（请先登录）</div>`;
    }
  },

  async monitorSearchArtist() {
    const input = document.getElementById('monitorArtistInput');
    const q = (input.value || '').trim();
    const box = document.getElementById('monitorSearchResults');
    if (!q) { this.showToast('请输入艺人姓名', 'warning'); return; }
    box.innerHTML = `<div class="text-tertiary text-sm">搜索中...</div>`;
    try {
      const data = await this.api(`/artists/search?keyword=${encodeURIComponent(q)}&limit=5`);
      if (!data || !data.length) {
        box.innerHTML = `<div class="text-tertiary text-sm">未找到匹配艺人</div>`;
        return;
      }
      box.innerHTML = data.map(a => `
        <div class="artist-card" style="padding:12px;margin-bottom:8px;cursor:pointer;" onclick="App.monitorSelectArtist(${a.id}, '${(a.name || '?').replace(/'/g, '')}')">
          <div class="artist-avatar" style="width:40px;height:40px;font-size:16px;">${(a.name || '?').slice(0, 1)}</div>
          <div class="artist-info"><div class="artist-name" style="font-size:15px;">${a.name}</div><div class="artist-meta">${a.heat_level || ''} · ${a.risk_level || ''}</div></div>
        </div>`).join('');
    } catch (e) {
      box.innerHTML = `<div class="text-tertiary text-sm">搜索失败</div>`;
    }
  },

  monitorSelectArtist(id, name) {
    this.state.monitorSelectedId = id;
    this.state.monitorSelectedName = name;
    const cards = document.querySelectorAll('#monitorSearchResults .artist-card');
    cards.forEach(el => el.style.borderColor = '');
    if (event && event.currentTarget) event.currentTarget.style.borderColor = 'var(--primary)';
    document.getElementById('monitorSubscribeForm').style.display = 'block';
    this.showToast(`已选择：${name}`, 'info');
  },

  monitorToggleCh(ch) {
    const box = document.getElementById(ch === 'webhook' ? 'monitorWebhookGroup' : null);
    if (box) box.style.display = document.getElementById('monitorChWebhook').checked ? 'block' : 'none';
  },

  async monitorSubscribe() {
    const id = this.state.monitorSelectedId;
    if (!id) { this.showToast('请先搜索并选择艺人', 'warning'); return; }
    const email = (document.getElementById('monitorEmail').value || '').trim();
    const channels = [];
    if (document.getElementById('monitorChEmail').checked) channels.push('email');
    if (document.getElementById('monitorChWebhook').checked) channels.push('webhook');
    const webhookUrl = (document.getElementById('monitorWebhook').value || '').trim();
    const body = { artist_id: id, notify_email: email, channels, webhook_url: webhookUrl || undefined };
    try {
      const d = await this.api('/monitoring/subscribe', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      this.showToast(d.message || '订阅成功', 'success');
      this.state.monitorSelectedId = null;
      document.getElementById('monitorSubscribeForm').style.display = 'none';
      document.getElementById('monitorArtistInput').value = '';
      document.getElementById('monitorSearchResults').innerHTML = '';
      document.getElementById('monitorWebhook').value = '';
      document.getElementById('monitorChWebhook').checked = false;
      document.getElementById('monitorWebhookGroup').style.display = 'none';
      this.loadMonitorConfigs();
      this.loadMonitoringOverview();
    } catch (e) {
      this.showToast(e.message || '订阅失败', 'error');
    }
  },

  async monitorUnsubscribe(id) {
    try {
      await this.api(`/monitoring/configs/${id}`, { method: 'DELETE' });
      this.showToast('已取消监控', 'success');
      this.loadMonitorConfigs();
      this.loadMonitoringOverview();
    } catch (e) {
      this.showToast(e.message || '取消失败', 'error');
    }
  },

  async monitorRunCheck() {
    try {
      this.showToast('正在检查新增风险事件...', 'info');
      const d = await this.api('/monitoring/check');
      const n = d.new_alert_count || 0;
      if (n === 0) {
        this.showToast('检查完成：暂无新增风险事件 🎉', 'success');
      } else {
        this.showToast(`检查完成：发现 ${n} 条新增预警`, 'warning');
        const lines = (d.new_alerts || []).map(a => `• [${this.monitorSeverityText(a.severity)}] ${a.artist_name}：${a.message}`).join('\n');
        this.showRiskAlertModal({ message: `本次检查新增 ${n} 条预警：\n${lines}`, level_before: '', level_after: '', score_change: 0 });
      }
      this.loadMonitorAlerts();
      this.loadMonitorConfigs();
      this.loadMonitoringOverview();
    } catch (e) {
      this.showToast(e.message || '检查失败', 'error');
    }
  },

  async loadMonitorCandidates() {
    const el = document.getElementById('monitorCandidateList');
    if (!el) return;
    const cnt = document.getElementById('candCount');
    try {
      const d = await this.api('/monitoring/candidates');
      if (cnt) cnt.textContent = d.total ? `${d.total} 条` : '0';
      if (!d.candidates.length) {
        el.innerHTML = `<div class="text-tertiary text-sm" style="padding:12px 0;">暂无待核验事件。采集自动化运行后，扫到的疑似风险事件会出现在这里供你审核。</div>`;
        return;
      }
      el.innerHTML = d.candidates.map(c => `
        <div style="padding:14px 0;border-bottom:1px solid var(--border-light);">
          <div class="flex items-center gap-2 mb-4">
            ${this.monitorSeverityTag(c.severity)}
            <strong>${c.artist_name}</strong>
            <span class="text-tertiary text-xs">${String(c.detected_at).replace('T', ' ').slice(0, 16)}</span>
            <span class="tag" style="background:#F0F9FF;color:#0369A1;">${c.source_name || '自动采集'}</span>
          </div>
          <div class="text-sm" style="color:var(--text-secondary);margin-bottom:8px;">${c.title}</div>
          ${c.description ? `<div class="text-tertiary text-xs" style="margin-bottom:8px;">${c.description}</div>` : ''}
          <div class="flex gap-2">
            <button class="btn btn-primary btn-xs" onclick="App.monitorApproveCandidate(${c.id})">✅ 通过入库</button>
            <button class="btn btn-ghost btn-xs" onclick="App.monitorRejectCandidate(${c.id})">🗑 拒绝</button>
            ${c.source_url ? `<a class="btn btn-outline btn-xs" href="${c.source_url}" target="_blank" rel="noopener">查看来源</a>` : ''}
          </div>
        </div>`).join('');
    } catch (e) {
      if (cnt) cnt.textContent = '0';
      el.innerHTML = `<div class="text-tertiary text-sm" style="padding:12px 0;">待核验列表加载失败（请先登录）</div>`;
    }
  },

  async monitorApproveCandidate(id) {
    try {
      const d = await this.api(`/monitoring/candidates/${id}/approve`, { method: 'POST' });
      this.showToast(d.message || '已通过并入库', 'success');
      this.loadMonitorCandidates();
      this.loadMonitoringOverview();
      this.loadMonitorConfigs();
    } catch (e) {
      this.showToast(e.message || '操作失败', 'error');
    }
  },

  async monitorRejectCandidate(id) {
    try {
      const d = await this.api(`/monitoring/candidates/${id}/reject`, { method: 'POST' });
      this.showToast(d.message || '已拒绝', 'success');
      this.loadMonitorCandidates();
      this.loadMonitoringOverview();
    } catch (e) {
      this.showToast(e.message || '操作失败', 'error');
    }
  },

  // ---- Risk Alert ----
  async checkRiskAlert(artistId) {
    try {
      const url = `${this.API_BASE}/risk/alert/check?artist_id=${artistId}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('检查失败');
      const data = await resp.json();

      if (data.has_alert) {
        const severityClass = {
          'low': 'info',
          'medium': 'warning',
          'high': 'error',
          'critical': 'error'
        }[data.severity] || 'info';

        this.showToast(data.message, severityClass);

        // 如果是严重预警，显示弹窗
        if (data.severity === 'critical' || data.severity === 'high') {
          this.showRiskAlertModal(data);
        }
      }

      return data;
    } catch (err) {
      console.error('风险预警检查失败:', err);
      return null;
    }
  },

  showRiskAlertModal(alert) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
          <h3>🚨 风险预警</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="padding:20px;text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
            <div style="font-size:18px;font-weight:600;margin-bottom:12px;">${alert.message}</div>
            <div style="display:flex;justify-content:center;gap:20px;margin-top:20px;">
              <div style="text-align:center;">
                <div style="font-size:24px;font-weight:bold;color:#EF4444;">${alert.level_before}</div>
                <div style="font-size:12px;color:#6B7280;">调整前</div>
              </div>
              <div style="font-size:24px;color:#9CA3AF;">→</div>
              <div style="text-align:center;">
                <div style="font-size:24px;font-weight:bold;color:#DC2626;">${alert.level_after}</div>
                <div style="font-size:12px;color:#6B7280;">调整后</div>
              </div>
            </div>
            <div style="margin-top:20px;font-size:14px;color:#6B7280;">
              评分变化：<span style="color:${alert.score_change < 0 ? '#EF4444' : '#10B981'};">${alert.score_change > 0 ? '+' : ''}${alert.score_change.toFixed(1)}分</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="this.closest('.modal').remove()">我知道了</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  // ---- Report Preview (inline) ----
  async previewRiskReport(artistId) {
    try {
      this.showToast('正在生成预览...', 'info');
      const resp = await fetch(`${this.API_BASE}/risk/report/${artistId}/download?inline=true`);
      if (!resp.ok) throw new Error('预览失败');
      const html = await resp.text();
      const w = window.open('', '_blank');
      if (!w) {
        this.showToast('预览被浏览器拦截，请允许弹窗后重试', 'warning');
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      this.showToast('预览已打开', 'success');
    } catch (err) {
      this.showToast(`报告预览失败：${err.message}`, 'error');
    }
  },

  // ---- Risk Events Timeline ----
  async loadEvents(artistId) {
    const container = document.getElementById('tab-events');
    if (!container) return;

    try {
      const data = await this.api(`/events/timeline/${artistId}`);
      const events = data.events || [];

      if (events.length === 0) {
        container.innerHTML = `
          <div class="event-empty">
            <div style="font-size:48px;margin-bottom:16px;">✅</div>
            <p style="font-size:15px;color:var(--text-secondary);margin-bottom:8px;">暂无风险事件记录</p>
            <p class="text-sm text-tertiary">该艺人暂未收录公开负面事件</p>
          </div>`;
        return;
      }

      const typeInfo = {
        political: { icon: '🏛️', label: '政治风险', cls: 'event-type-political' },
        legal: { icon: '⚖️', label: '法律风险', cls: 'event-type-legal' },
        moral: { icon: '💔', label: '道德风险', cls: 'event-type-moral' },
        commercial: { icon: '💼', label: '商业风险', cls: 'event-type-commercial' },
      };

      // Summary cards
      const summaryHTML = `
        <div class="event-summary">
          <div class="event-summary-card">
            <div class="num" style="color:var(--risk-high);">${data.total_events}</div>
            <div class="label">风险事件总数</div>
          </div>
          ${Object.entries(data.by_type || {}).map(([k, v]) => {
            const ti = typeInfo[k] || { icon: '📌', label: k };
            return `<div class="event-summary-card"><div class="num">${v}</div><div class="label">${ti.icon} ${ti.label}</div></div>`;
          }).join('')}
        </div>`;

      // Timeline items
      const timelineHTML = events.map(ev => {
        const ti = typeInfo[ev.event_type] || { icon: '📌', label: ev.event_type, cls: 'event-type-moral' };
        const resolved = ev.status === 'resolved' ? ' event-status-resolved' : '';
        const sources = ev.source_links && Array.isArray(ev.source_links) && ev.source_links.length > 0
          ? `<div class="timeline-links">${ev.source_links.map((l, i) => `<a href="${l}" target="_blank" rel="noopener">来源 ${i + 1}</a>`).join('')}</div>`
          : '';
        const keywords = ev.keywords && Array.isArray(ev.keywords) && ev.keywords.length > 0
          ? ev.keywords.map(k => `<span class="tag" style="background:var(--gray-100);color:var(--gray-500);font-size:11px;padding:1px 8px;">${k}</span>`).join('')
          : '';
        const isSerious = ev.severity === 'high' || ev.severity === 'critical';

        return `<div class="timeline-item${resolved}">
          <div class="timeline-dot ${ev.severity}"></div>
          <div class="timeline-date">${ev.event_date}${ev.end_date ? ' ~ ' + ev.end_date : ''}</div>
          <div class="timeline-title">
            ${ev.title}
            <span class="event-type-badge ${ti.cls}">${ti.icon} ${ti.label}</span>
            ${isSerious ? '<span class="tag tag-risk-high" style="font-size:11px;padding:2px 8px;">⚠ 重点关注</span>' : ''}
            ${ev.status === 'resolved' ? '<span class="tag" style="background:var(--gray-100);color:var(--gray-500);font-size:11px;padding:2px 8px;">✓ 已解决</span>' : ''}
          </div>
          <div class="timeline-desc">${ev.description}</div>
          <div class="timeline-meta">
            ${ev.public_attention ? `<span class="event-impact-badge">🔥 关注度：${ev.public_attention}</span>` : ''}
            ${ev.impact_score !== null && ev.impact_score !== undefined ? `<span class="event-impact-badge">📉 影响分：${ev.impact_score}</span>` : ''}
          </div>
          ${keywords ? `<div class="timeline-meta" style="margin-top:6px;">${keywords}</div>` : ''}
          ${sources}
        </div>`;
      }).join('');

      container.innerHTML = `
        <div class="card animate-in">
          <div class="card-header">
            <span>风险事件时间线</span>
            <span style="font-size:12px;color:var(--text-tertiary);">${data.artist_name}</span>
          </div>
          <div class="card-body">
            ${summaryHTML}
            <div class="event-timeline">
              ${timelineHTML}
            </div>
          </div>
        </div>`;

      // Draw event timeline bar chart on commercial tab
      this.drawEventTimeline(events);

    } catch (err) {
      container.innerHTML = `
        <div class="event-empty">
          <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
          <p style="font-size:15px;color:var(--text-secondary);margin-bottom:8px;">加载风险事件失败</p>
          <p class="text-sm text-tertiary">${err.message}</p>
        </div>`;
    }
  },

};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
