/* ============================================================
 * 多面手工具箱 - 前端应用逻辑
 * ============================================================ */

const API = ''; // 同源，无需 baseURL

// ---------- 工具数据 ----------
const DATA = {
  media: {
    accent: 'brass', prefix: 'M',
    tools: [
      { name: '标题生成器', desc: '输入话题和关键词，生成多个不同风格的标题供选择，适合公众号、小红书、视频号等场景。' },
      { name: '爆款结构拆解', desc: '粘贴一篇爆款文章或脚本，自动标注开头钩子、转折点和结尾号召，帮你复用成熟套路。' },
      { name: '多平台排版转换', desc: '一次写作，自动适配公众号、知乎、小红书的排版规则，省去反复调整格式的麻烦。' },
      { name: '配图关键词推荐', desc: '根据文案内容给出适合去图库搜索的关键词组合，减少配图选择时的纠结。' },
      { name: '敏感词检测', desc: '发布前扫描文案，标出可能触发平台审核的敏感词，并给出替换建议。' },
      { name: '内容排期日历', desc: '用列表视图安排选题、写作、发布各阶段的时间，一眼看清接下来要做什么。' },
      { name: '多平台数据看板', desc: '汇总不同平台的阅读、点赞、评论数据，用同一份图表看趋势，不用来回切换后台。' },
    ]
  },
  dev: {
    accent: 'steel', prefix: 'D',
    tools: [
      { name: 'JSON 格式化 / 校验', desc: '粘贴 JSON 文本，自动格式化、高亮语法错误，并支持自定义缩进。' },
      { name: '正则表达式测试器', desc: '输入正则和测试文本，实时高亮匹配结果，方便调试复杂的匹配规则。' },
      { name: '时间戳转换', desc: '在时间戳和多种日期格式之间互相转换，支持秒/毫秒切换。' },
      { name: 'Base64 / URL 编解码', desc: '快速对文本或字符串进行编码解码，适合调试接口参数和处理特殊字符。' },
      { name: '颜色格式转换', desc: '在 HEX、RGB、HSL 之间互相转换，并实时预览颜色效果。' },
      { name: 'Diff 对比工具', desc: '并排对比两段文本或代码的差异，逐行标出新增和删除的内容。' },
      { name: 'Cron 表达式解析', desc: '输入 Cron 表达式，用人话解释执行时间，并列出接下来几次触发时间。' },
      { name: 'UUID / 随机数据生成', desc: '一键生成 UUID、随机密码或测试用假数据，支持自定义长度和格式。' },
    ]
  },
  productivity: {
    accent: 'moss', prefix: 'P',
    tools: [
      { name: '番茄钟计时器', desc: '按 25 分钟专注、5 分钟休息的节奏计时，把大任务拆成一个个可完成的番茄。' },
      { name: '待办清单', desc: '记录任务、设置优先级和截止时间，完成后打勾归档，保持每天清晰的任务视图。' },
      { name: '习惯打卡', desc: '为想养成的习惯设置每日打卡，用连续天数和月度视图看见自己的坚持。' },
      { name: '闪念笔记', desc: '随时记录一闪而过的想法，不用分类不用整理，之后统一回顾。' },
      { name: '单位换算器', desc: '在长度、重量、温度、面积等常用单位间快速换算，出差、日常计算都用得上。' },
      { name: '密码生成器', desc: '按长度和字符类型要求生成高强度随机密码，一键复制使用。' },
      { name: '二维码生成器', desc: '输入文本或链接，生成可下载的二维码图片，支持自定义颜色和尺寸。' },
    ]
  }
};

const accentVar = { brass: '--brass', steel: '--steel', moss: '--moss' };
const accentSoft = { brass: '--brass-soft', steel: '--steel-soft', moss: '--moss-soft' };

function svgArrow(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
}

// ============================================================
// API 辅助函数
// ============================================================
async function api(path, options = {}) {
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  if (opts.method === 'GET') {
    delete opts.body;
  } else if (opts.body && typeof opts.body === 'object') {
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(API + path, opts);
  return res.json();
}

// ---------- Toast ----------
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ---------- 复制到剪贴板 ----------
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制到剪贴板');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('已复制到剪贴板');
  }
}

// ============================================================
// 渲染工具卡片
// ============================================================
function renderGrid(key) {
  const cat = DATA[key];
  const grid = document.getElementById('grid-' + key);
  const frag = document.createDocumentFragment();

  cat.tools.forEach((tool, i) => {
    const code = cat.prefix + '-' + String(i + 1).padStart(2, '0');
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.dataset.name = tool.name;
    card.dataset.code = code;
    card.dataset.category = key;
    card.innerHTML = `
      <div class="tool-top">
        <span class="bin-code" style="color:var(${accentVar[cat.accent]}); background:var(${accentSoft[cat.accent]})">${code}</span>
        <span class="dev-badge">已接入</span>
      </div>
      <h3>${tool.name}</h3>
      <p>${tool.desc}</p>
      <div class="cta">打开工具 ${svgArrow()}</div>
    `;
    card.addEventListener('click', () => openTool(code, tool.name, key));
    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

// ============================================================
// Modal 系统
// ============================================================
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const modalFooter = document.getElementById('modalFooter');
const modalTitle = document.getElementById('modalTitle');
const modalCode = document.getElementById('modalCode');

function openModal(code, title, accent) {
  modalCode.textContent = code;
  modalCode.style.color = `var(${accentVar[accent]})`;
  modalCode.style.background = `var(${accentSoft[accent]})`;
  modalTitle.textContent = title;
  modalOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('show');
  document.body.style.overflow = '';
  modalBody.innerHTML = '';
  modalFooter.innerHTML = '';
  currentTool = null;
}

document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

let currentTool = null;

function openTool(code, name, category) {
  const accent = DATA[category].accent;
  openModal(code, name, accent);
  const tool = TOOLS[code];
  if (!tool) {
    modalBody.innerHTML = '<p>该工具暂未实现</p>';
    return;
  }
  currentTool = tool;
  modalBody.innerHTML = tool.render();
  // footer
  if (tool.noSubmit) {
    modalFooter.innerHTML = '<button class="btn btn-secondary" onclick="closeModal()">关闭</button>';
  } else {
    modalFooter.innerHTML = `
      <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
      <button class="btn btn-primary" id="modalSubmitBtn">执行</button>
    `;
    document.getElementById('modalSubmitBtn').addEventListener('click', () => tool.submit());
  }
  if (tool.onMount) tool.onMount();
}

// ============================================================
// 工具表单定义
// ============================================================
const TOOLS = {};

// 通用结果区
function resultArea() {
  return '<div class="result-area empty" id="resultArea">点击「执行」查看结果</div>';
}
function getResultEl() { return document.getElementById('resultArea'); }
function setResult(html) {
  const el = getResultEl();
  if (el) { el.classList.remove('empty'); el.innerHTML = html; }
}
function setResultLoading(text = '处理中...') {
  const el = getResultEl();
  if (el) { el.classList.remove('empty'); el.innerHTML = `<span class="spinner"></span> ${text}`; }
}
function copyBtn(text) {
  return `<div class="result-copy"><button onclick="copyText(${JSON.stringify(text)})">📋 复制</button></div>`;
}

// ==================== D-01: JSON 格式化 / 校验 ====================
TOOLS['D-01'] = {
  render() {
    return `
      <div class="form-group">
        <label>JSON 文本</label>
        <textarea class="form-textarea" id="jsonInput" rows="8" placeholder='{"name":"工具箱","version":1}'></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>缩进空格数</label>
          <select class="form-select" id="jsonIndent">
            <option value="2">2 空格</option>
            <option value="4">4 空格</option>
            <option value="0">压缩（无空格）</option>
          </select>
        </div>
      </div>
      ${resultArea()}
    `;
  },
  async submit() {
    const text = document.getElementById('jsonInput').value.trim();
    if (!text) return showToast('请输入 JSON 文本');
    const indent = parseInt(document.getElementById('jsonIndent').value);
    setResultLoading('校验中...');
    const r = await api('/api/dev/json-format', { body: { text, indent } });
    if (r.valid) {
      setResult(`<pre>${escapeHtml(r.formatted)}</pre>${copyBtn(r.formatted)}`);
    } else {
      setResult(`<div style="color:#C0392B;">❌ ${escapeHtml(r.error)}</div>`);
    }
  }
};

// ==================== D-02: 正则表达式测试器 ====================
TOOLS['D-02'] = {
  render() {
    return `
      <div class="form-group">
        <label>正则表达式</label>
        <input class="form-input mono" id="regexPattern" placeholder="例如 \\d+\\.\\d+" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>标志位 <span class="hint">g=全局, i=忽略大小写, m=多行, s=dotAll</span></label>
          <input class="form-input mono" id="regexFlags" value="g" placeholder="gim" />
        </div>
      </div>
      <div class="form-group">
        <label>测试文本</label>
        <textarea class="form-textarea" id="regexText" rows="5" placeholder="输入要匹配的文本"></textarea>
      </div>
      ${resultArea()}
    `;
  },
  async submit() {
    const pattern = document.getElementById('regexPattern').value;
    const flags = document.getElementById('regexFlags').value;
    const text = document.getElementById('regexText').value;
    if (!pattern) return showToast('请输入正则表达式');
    setResultLoading('匹配中...');
    const r = await api('/api/dev/regex-test', { body: { pattern, flags, text } });
    if (r.valid === false) {
      setResult(`<div style="color:#C0392B;">❌ 正则错误: ${escapeHtml(r.error)}</div>`);
    } else {
      let html = `<div style="margin-bottom:8px;font-weight:600;">匹配到 ${r.match_count} 处</div>`;
      if (r.matches.length > 0) {
        html += r.matches.map((m, i) =>
          `<div style="padding:8px;background:#FFF;border:1px solid var(--line);border-radius:6px;margin-bottom:4px;">` +
          `<span style="color:var(--steel);font-weight:600;">#${i+1}</span> ` +
          `<span class="mono" style="color:var(--brass);">${escapeHtml(m.match)}</span>` +
          `<span style="color:var(--muted);font-size:11px;margin-left:8px;">位置 ${m.span[0]}-${m.span[1]}</span>` +
          (m.groups && m.groups.length ? `<div style="font-size:12px;color:var(--muted);margin-top:4px;">分组: ${m.groups.map(g=>escapeHtml(String(g))).join(', ')}</div>` : '') +
          `</div>`
        ).join('');
      }
      setResult(html);
    }
  }
};

// ==================== D-03: 时间戳转换 ====================
TOOLS['D-03'] = {
  render() {
    const now = Math.floor(Date.now() / 1000);
    return `
      <div class="form-group">
        <label>输入值</label>
        <input class="form-input mono" id="tsValue" value="${now}" placeholder="时间戳或日期" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>转换方向</label>
          <select class="form-select" id="tsDirection" onchange="document.getElementById('tsUnitGroup').style.display=this.value==='to_ts'?'block':'none'">
            <option value="to_date">时间戳 → 日期</option>
            <option value="to_ts">日期 → 时间戳</option>
          </select>
        </div>
        <div class="form-group" id="tsUnitGroup" style="display:none;">
          <label>单位</label>
          <select class="form-select" id="tsUnit">
            <option value="s">秒</option>
            <option value="ms">毫秒</option>
          </select>
        </div>
      </div>
      ${resultArea()}
    `;
  },
  async submit() {
    const value = document.getElementById('tsValue').value.trim();
    const direction = document.getElementById('tsDirection').value;
    const unit = document.getElementById('tsUnit').value;
    if (!value) return showToast('请输入值');
    setResultLoading('转换中...');
    const r = await api('/api/dev/timestamp-convert', { body: { value, direction, unit } });
    if (r.error) {
      setResult(`<div style="color:#C0392B;">❌ ${escapeHtml(r.error)}</div>`);
    } else {
      let html = '';
      if (direction === 'to_date') {
        html += `<div style="font-size:18px;font-weight:700;margin-bottom:8px;">${r.result}</div>`;
        html += `<div style="font-size:13px;color:var(--muted);">ISO: ${r.iso}</div>`;
        html += `<div style="font-size:13px;color:var(--muted);">星期: ${r.weekday}</div>`;
        html += `<div style="font-size:13px;color:var(--muted);">秒级时间戳: ${r.timestamp_s}</div>`;
        html += `<div style="font-size:13px;color:var(--muted);">毫秒时间戳: ${r.timestamp_ms}</div>`;
      } else {
        html += `<div style="font-size:18px;font-weight:700;">${r.result}</div>`;
      }
      setResult(html + copyBtn(r.result));
    }
  }
};

// ==================== D-04: Base64 / URL 编解码 ====================
TOOLS['D-04'] = {
  render() {
    return `
      <div class="form-group">
        <label>操作类型</label>
        <select class="form-select" id="encOp">
          <option value="base64_encode">Base64 编码</option>
          <option value="base64_decode">Base64 解码</option>
          <option value="url_encode">URL 编码</option>
          <option value="url_decode">URL 解码</option>
          <option value="html_encode">HTML 转义</option>
          <option value="html_decode">HTML 反转义</option>
        </select>
      </div>
      <div class="form-group">
        <label>输入文本</label>
        <textarea class="form-textarea" id="encText" rows="5" placeholder="输入要处理的文本"></textarea>
      </div>
      ${resultArea()}
    `;
  },
  async submit() {
    const text = document.getElementById('encText').value;
    const operation = document.getElementById('encOp').value;
    if (!text) return showToast('请输入文本');
    setResultLoading('处理中...');
    const r = await api('/api/dev/encode-decode', { body: { text, operation } });
    if (r.error) {
      setResult(`<div style="color:#C0392B;">❌ ${escapeHtml(r.error)}</div>`);
    } else {
      setResult(`<pre>${escapeHtml(r.result)}</pre>${copyBtn(r.result)}`);
    }
  }
};

// ==================== D-05: 颜色格式转换 ====================
TOOLS['D-05'] = {
  render() {
    return `
      <div class="form-group">
        <label>颜色值 <span class="hint">支持 #HEX / rgb(r,g,b) / hsl(h,s%,l%)</span></label>
        <div style="display:flex;gap:8px;">
          <input class="form-input mono" id="colorInput" value="#3B6E90" placeholder="#FF5733" />
          <input type="color" id="colorPicker" value="#3B6E90" style="width:48px;height:42px;border:1px solid var(--line);border-radius:8px;cursor:pointer;" />
        </div>
      </div>
      ${resultArea()}
    `;
  },
  onMount() {
    const picker = document.getElementById('colorPicker');
    const input = document.getElementById('colorInput');
    picker.addEventListener('input', () => { input.value = picker.value; });
    input.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(input.value)) picker.value = input.value;
    });
    this.submit();
  },
  async submit() {
    const color = document.getElementById('colorInput').value.trim();
    if (!color) return showToast('请输入颜色值');
    setResultLoading('转换中...');
    const r = await api('/api/dev/color-convert', { body: { color } });
    if (r.error) {
      setResult(`<div style="color:#C0392B;">❌ ${escapeHtml(r.error)}</div>`);
    } else {
      setResult(`
        <div class="color-preview" style="background:${r.preview}"></div>
        <div class="color-values">
          <div class="color-val" onclick="copyText('${r.hex}')">${r.hex}</div>
          <div class="color-val" onclick="copyText('${r.rgb}')">${r.rgb}</div>
          <div class="color-val" onclick="copyText('${r.hsl}')">${r.hsl}</div>
        </div>
      `);
    }
  }
};

// ==================== D-06: Diff 对比工具 ====================
TOOLS['D-06'] = {
  render() {
    return `
      <div class="form-group">
        <label>对比模式</label>
        <select class="form-select" id="diffMode">
          <option value="side_by_side">并排对比</option>
          <option value="unified">统一格式 (Unified)</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>文本 A</label>
          <textarea class="form-textarea" id="diffText1" rows="6" placeholder="原始文本"></textarea>
        </div>
        <div class="form-group">
          <label>文本 B</label>
          <textarea class="form-textarea" id="diffText2" rows="6" placeholder="修改后文本"></textarea>
        </div>
      </div>
      ${resultArea()}
    `;
  },
  async submit() {
    const text1 = document.getElementById('diffText1').value;
    const text2 = document.getElementById('diffText2').value;
    const mode = document.getElementById('diffMode').value;
    setResultLoading('对比中...');
    const r = await api('/api/dev/diff', { body: { text1, text2, mode } });
    if (r.same) {
      setResult('<div style="color:var(--moss);font-weight:600;">✅ 两段文本完全相同</div>');
    } else if (mode === 'unified') {
      setResult(`<pre>${escapeHtml(r.diff)}</pre>`);
    } else {
      let html = '<div class="diff-container">';
      html += '<div class="diff-col-header">文本 A</div><div class="diff-col-header">文本 B</div>';
      const maxLen = Math.max(r.side.left.length, r.side.right.length);
      for (let i = 0; i < maxLen; i++) {
        const l = r.side.left[i] || { text: '', type: 'empty' };
        const ri = r.side.right[i] || { text: '', type: 'empty' };
        html += `<div class="diff-line ${l.type}">${escapeHtml(l.text)}</div>`;
        html += `<div class="diff-line ${ri.type}">${escapeHtml(ri.text)}</div>`;
      }
      html += '</div>';
      setResult(html);
    }
  }
};

// ==================== D-07: Cron 表达式解析 ====================
TOOLS['D-07'] = {
  render() {
    return `
      <div class="form-group">
        <label>Cron 表达式 <span class="hint">分 时 日 月 周（5段式）</span></label>
        <input class="form-input mono" id="cronExpr" value="0 9 * * 1-5" placeholder="*/5 * * * *" />
      </div>
      <div class="form-group">
        <label>预测次数</label>
        <input class="form-input" type="number" id="cronCount" value="5" min="1" max="20" />
      </div>
      ${resultArea()}
    `;
  },
  onMount() { this.submit(); },
  async submit() {
    const expression = document.getElementById('cronExpr').value.trim();
    const count = parseInt(document.getElementById('cronCount').value) || 5;
    if (!expression) return showToast('请输入 Cron 表达式');
    setResultLoading('解析中...');
    const r = await api('/api/dev/cron-parse', { body: { expression, count } });
    if (r.valid === false) {
      setResult(`<div style="color:#C0392B;">❌ ${escapeHtml(r.error)}</div>`);
    } else {
      let html = `<div class="cron-desc">📋 ${escapeHtml(r.description)}</div>`;
      html += '<div style="font-weight:600;margin-bottom:6px;">接下来触发时间：</div>';
      html += '<div class="cron-next"><ol style="margin:0;padding-left:20px;">';
      r.next_runs.forEach(t => { html += `<li>${escapeHtml(t)}</li>`; });
      html += '</ol></div>';
      setResult(html);
    }
  }
};

// ==================== D-08: UUID / 随机数据生成 ====================
TOOLS['D-08'] = {
  render() {
    return `
      <div class="form-group">
        <label>生成类型</label>
        <select class="form-select" id="genType" onchange="TOOLS['D-08'].toggleForm()">
          <option value="uuid">UUID</option>
          <option value="password">随机密码</option>
          <option value="fake">测试假数据</option>
        </select>
      </div>
      <div id="uuidForm">
        <div class="form-row">
          <div class="form-group">
            <label>UUID 版本</label>
            <select class="form-select" id="uuidVer"><option value="4">v4 (随机)</option><option value="1">v1 (时间)</option></select>
          </div>
          <div class="form-group">
            <label>数量</label>
            <input class="form-input" type="number" id="uuidCount" value="5" min="1" max="50" />
          </div>
        </div>
        <div class="checkbox-group">
          <label class="checkbox-item"><input type="checkbox" id="uuidUpper"> 大写</label>
        </div>
      </div>
      <div id="pwdForm" style="display:none;">
        <div class="form-group">
          <label>密码长度</label>
          <input class="form-input" type="number" id="pwdLen" value="16" min="4" max="128" />
        </div>
        <div class="checkbox-group">
          <label class="checkbox-item"><input type="checkbox" id="pwdUpper" checked> 大写字母</label>
          <label class="checkbox-item"><input type="checkbox" id="pwdLower" checked> 小写字母</label>
          <label class="checkbox-item"><input type="checkbox" id="pwdDigit" checked> 数字</label>
          <label class="checkbox-item"><input type="checkbox" id="pwdSym" checked> 特殊符号</label>
          <label class="checkbox-item"><input type="checkbox" id="pwdAmb"> 排除易混字符 (0O1lI)</label>
        </div>
      </div>
      <div id="fakeForm" style="display:none;">
        <div class="form-row">
          <div class="form-group">
            <label>数据类型</label>
            <select class="form-select" id="fakeType">
              <option value="name">姓名</option>
              <option value="email">邮箱</option>
              <option value="phone">手机号</option>
              <option value="address">地址</option>
              <option value="id_card">身份证号</option>
              <option value="company">公司名</option>
              <option value="date">日期</option>
              <option value="number">随机数字</option>
              <option value="lorem">随机文本</option>
            </select>
          </div>
          <div class="form-group">
            <label>数量</label>
            <input class="form-input" type="number" id="fakeCount" value="5" min="1" max="50" />
          </div>
        </div>
      </div>
      ${resultArea()}
    `;
  },
  toggleForm() {
    const t = document.getElementById('genType').value;
    document.getElementById('uuidForm').style.display = t === 'uuid' ? 'block' : 'none';
    document.getElementById('pwdForm').style.display = t === 'password' ? 'block' : 'none';
    document.getElementById('fakeForm').style.display = t === 'fake' ? 'block' : 'none';
  },
  async submit() {
    const t = document.getElementById('genType').value;
    setResultLoading('生成中...');
    if (t === 'uuid') {
      const version = parseInt(document.getElementById('uuidVer').value);
      const count = parseInt(document.getElementById('uuidCount').value) || 5;
      const uppercase = document.getElementById('uuidUpper').checked;
      const r = await api('/api/dev/uuid-generate', { body: { version, count, uppercase } });
      setResult(`<div class="uuid-list">${r.uuids.map(u => `<div onclick="copyText('${u}')" style="cursor:pointer;padding:2px 0;">${u}</div>`).join('')}</div>${copyBtn(r.uuids.join('\n'))}`);
    } else if (t === 'password') {
      const length = parseInt(document.getElementById('pwdLen').value) || 16;
      const r = await api('/api/dev/random-password', { body: {
        length,
        uppercase: document.getElementById('pwdUpper').checked,
        lowercase: document.getElementById('pwdLower').checked,
        digits: document.getElementById('pwdDigit').checked,
        symbols: document.getElementById('pwdSym').checked,
        exclude_ambiguous: document.getElementById('pwdAmb').checked,
      }});
      if (r.error) { setResult(`<div style="color:#C0392B;">❌ ${r.error}</div>`); return; }
      setResult(`<div style="font-size:18px;font-family:'IBM Plex Mono',monospace;font-weight:600;text-align:center;padding:16px;background:#FFF;border:1px solid var(--line);border-radius:8px;word-break:break-all;">${escapeHtml(r.password)}</div>${copyBtn(r.password)}`);
    } else {
      const data_type = document.getElementById('fakeType').value;
      const count = parseInt(document.getElementById('fakeCount').value) || 5;
      const r = await api('/api/dev/fake-data', { body: { data_type, count } });
      setResult(`<div class="uuid-list">${r.data.map((d,i) => `<div onclick="copyText('${escapeHtml(String(d))}')" style="cursor:pointer;padding:2px 0;">${i+1}. ${escapeHtml(String(d))}</div>`).join('')}</div>${copyBtn(r.data.join('\n'))}`);
    }
  }
};

// ==================== M-01: 标题生成器 ====================
TOOLS['M-01'] = {
  render() {
    return `
      <div class="form-group">
        <label>话题 <span class="hint">必填</span></label>
        <input class="form-input" id="titleTopic" placeholder="例如：小红书运营" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>关键词 <span class="hint">逗号分隔</span></label>
          <input class="form-input" id="titleKeywords" placeholder="例如：涨粉，变现" />
        </div>
        <div class="form-group">
          <label>风格</label>
          <select class="form-select" id="titleStyle">
            <option value="多种">多种混合</option>
            <option value="痛点">痛点型</option>
            <option value="悬念">悬念型</option>
            <option value="数字">数字型</option>
            <option value="对比">对比型</option>
            <option value="情感">情感型</option>
          </select>
        </div>
      </div>
      ${resultArea()}
    `;
  },
  async submit() {
    const topic = document.getElementById('titleTopic').value.trim();
    const keywords = document.getElementById('titleKeywords').value;
    const style = document.getElementById('titleStyle').value;
    if (!topic) return showToast('请输入话题');
    setResultLoading('生成中...');
    const r = await api('/api/media/title-generator', { body: { topic, keywords, style } });
    if (r.error) { setResult(`<div style="color:#C0392B;">❌ ${r.error}</div>`); return; }
    setResult(`<ul class="title-list">${r.titles.map(t => `<li onclick="copyText(${JSON.stringify(t)})"><span>${escapeHtml(t)}</span><span class="copy-icon">📋</span></li>`).join('')}</ul>`);
  }
};

// ==================== M-02: 爆款结构拆解 ====================
TOOLS['M-02'] = {
  render() {
    return `
      <div class="form-group">
        <label>文章/脚本内容</label>
        <textarea class="form-textarea" id="articleContent" rows="10" placeholder="粘贴文章内容，段落间用空行分隔"></textarea>
      </div>
      ${resultArea()}
    `;
  },
  async submit() {
    const content = document.getElementById('articleContent').value.trim();
    if (!content) return showToast('请输入文章内容');
    setResultLoading('分析中...');
    const r = await api('/api/media/article-analysis', { body: { content } });
    if (r.error) { setResult(`<div style="color:#C0392B;">❌ ${r.error}</div>`); return; }
    let html = '';
    if (r.stats) {
      html += `<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">`;
      html += `<span style="font-size:12px;padding:4px 10px;background:var(--steel-soft);border-radius:6px;">${r.stats.paragraphs} 段</span>`;
      html += `<span style="font-size:12px;padding:4px 10px;background:var(--brass-soft);border-radius:6px;">${r.stats.word_count} 字</span>`;
      html += `<span style="font-size:12px;padding:4px 10px;background:var(--moss-soft);border-radius:6px;">约 ${r.stats.estimated_read_time}</span>`;
      html += `<span style="font-size:12px;padding:4px 10px;background:${r.stats.has_hook?'var(--moss-soft)':'#FCE8E6'};border-radius:6px;">${r.stats.has_hook?'✓ 有钩子':'✗ 无钩子'}</span>`;
      html += `<span style="font-size:12px;padding:4px 10px;background:${r.stats.has_cta?'var(--moss-soft)':'#FCE8E6'};border-radius:6px;">${r.stats.has_cta?'✓ 有号召':'✗ 无号召'}</span>`;
      html += `</div>`;
    }
    html += r.sections.map(s =>
      `<div class="analysis-section ${s.type}">
        <div class="sec-label">[${s.label}] 第 ${s.index} 段</div>
        <div class="sec-note">📝 ${escapeHtml(s.note)}</div>
        <div class="sec-content">${escapeHtml(s.content)}</div>
      </div>`
    ).join('');
    setResult(html);
  }
};

// ==================== M-03: 多平台排版转换 ====================
TOOLS['M-03'] = {
  render() {
    return `
      <div class="form-group">
        <label>目标平台</label>
        <select class="form-select" id="fmtPlatform">
          <option value="wechat">公众号</option>
          <option value="zhihu">知乎</option>
          <option value="xiaohongshu">小红书</option>
          <option value="plain">纯文本</option>
        </select>
      </div>
      <div class="form-group">
        <label>内容</label>
        <textarea class="form-textarea" id="fmtContent" rows="8" placeholder="输入要转换的内容，段落间用空行分隔"></textarea>
      </div>
      ${resultArea()}
    `;
  },
  async submit() {
    const content = document.getElementById('fmtContent').value;
    const platform = document.getElementById('fmtPlatform').value;
    if (!content.trim()) return showToast('请输入内容');
    setResultLoading('转换中...');
    const r = await api('/api/media/format-convert', { body: { content, platform } });
    if (r.error) { setResult(`<div style="color:#C0392B;">❌ ${r.error}</div>`); return; }
    setResult(`<pre style="white-space:pre-wrap;">${escapeHtml(r.result)}</pre>${copyBtn(r.result)}`);
  }
};

// ==================== M-04: 配图关键词推荐 ====================
TOOLS['M-04'] = {
  render() {
    return `
      <div class="form-group">
        <label>文案内容</label>
        <textarea class="form-textarea" id="kwContent" rows="8" placeholder="输入文案内容，系统会提取关键词并推荐配图搜索词"></textarea>
      </div>
      ${resultArea()}
    `;
  },
  async submit() {
    const content = document.getElementById('kwContent').value;
    if (!content.trim()) return showToast('请输入文案内容');
    setResultLoading('提取中...');
    const r = await api('/api/media/image-keywords', { body: { content } });
    if (r.error) { setResult(`<div style="color:#C0392B;">❌ ${r.error}</div>`); return; }
    let html = '<div style="font-weight:600;margin-bottom:8px;">内容关键词</div><div>';
    r.content_keywords.forEach(k => html += `<span class="keyword-tag">${escapeHtml(k)}</span>`);
    html += '</div><div style="font-weight:600;margin:12px 0 8px;">配图搜索词推荐</div><div>';
    r.scene_keywords.forEach(k => html += `<span class="keyword-tag scene">${escapeHtml(k)}</span>`);
    html += '</div>';
    setResult(html);
  }
};

// ==================== M-05: 敏感词检测 ====================
TOOLS['M-05'] = {
  render() {
    return `
      <div class="form-group">
        <label>待检测文案</label>
        <textarea class="form-textarea" id="swContent" rows="8" placeholder="输入发布前要检查的文案"></textarea>
      </div>
      ${resultArea()}
    `;
  },
  async submit() {
    const content = document.getElementById('swContent').value;
    if (!content.trim()) return showToast('请输入文案');
    setResultLoading('检测中...');
    const r = await api('/api/media/sensitive-check', { body: { content } });
    if (r.error) { setResult(`<div style="color:#C0392B;">❌ ${r.error}</div>`); return; }
    let html = `<div style="font-weight:600;margin-bottom:10px;padding:10px 12px;border-radius:8px;background:${r.is_safe?'var(--moss-soft)':'#FFF5F5'};color:${r.is_safe?'var(--moss)':'#C0392B'};">${r.summary}</div>`;
    if (r.found.length > 0) {
      html += r.found.map(f =>
        `<div class="sensitive-item">
          <span class="sw-word">「${escapeHtml(f.word)}」</span>
          <span style="color:var(--muted);font-size:12px;">上下文: ...${escapeHtml(f.context)}...</span>
          <span class="sw-suggestion">→ 建议替换为: ${escapeHtml(f.suggestion)}</span>
        </div>`
      ).join('');
    }
    setResult(html);
  }
};

// ==================== M-06: 内容排期日历 ====================
TOOLS['M-06'] = {
  noSubmit: true,
  render() {
    return `
      <div style="margin-bottom:16px;padding:16px;background:#FAFAF7;border:1px solid var(--line);border-radius:10px;">
        <div class="form-row">
          <div class="form-group"><label>标题</label><input class="form-input" id="schedTitle" placeholder="内容标题" /></div>
          <div class="form-group"><label>平台</label>
            <select class="form-select" id="schedPlatform"><option value="">不限</option><option>公众号</option><option>知乎</option><option>小红书</option><option>视频号</option></select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>阶段</label>
            <select class="form-select" id="schedStage"><option>选题</option><option>写作</option><option>编辑</option><option>发布</option></select>
          </div>
          <div class="form-group"><label>日期</label><input class="form-input" type="date" id="schedDate" /></div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="TOOLS['M-06'].addItem()">+ 添加排期</button>
      </div>
      <div id="schedList"></div>
    `;
  },
  async onMount() { await this.loadList(); },
  async loadList() {
    const r = await api('/api/media/schedule');
    const el = document.getElementById('schedList');
    if (!r.items || r.items.length === 0) {
      el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">暂无排期，添加一个吧</p>';
      return;
    }
    el.innerHTML = '<div class="schedule-list">' + r.items.map(item =>
      `<div class="sched-item">
        <span class="sched-stage stage-${item.stage}">${item.stage}</span>
        <span style="flex:1;">${escapeHtml(item.title)}${item.platform ? ` <span style="color:var(--muted);font-size:12px;">[${escapeHtml(item.platform)}]</span>` : ''}</span>
        <span class="mono" style="font-size:12px;color:var(--muted);">${item.scheduled_date}</span>
        <button class="icon-btn" onclick="TOOLS['M-06'].delItem(${item.id})">✕</button>
      </div>`
    ).join('') + '</div>';
  },
  async addItem() {
    const title = document.getElementById('schedTitle').value.trim();
    const platform = document.getElementById('schedPlatform').value;
    const stage = document.getElementById('schedStage').value;
    const scheduled_date = document.getElementById('schedDate').value;
    if (!title) return showToast('请输入标题');
    if (!scheduled_date) return showToast('请选择日期');
    const r = await api('/api/media/schedule', { method: 'POST', body: { title, platform, stage, scheduled_date } });
    if (r.id) {
      showToast('排期已添加');
      document.getElementById('schedTitle').value = '';
      await this.loadList();
    }
  },
  async delItem(id) {
    await api(`/api/media/schedule/${id}`, { method: 'DELETE' });
    showToast('已删除');
    await this.loadList();
  }
};

// ==================== M-07: 多平台数据看板 ====================
TOOLS['M-07'] = {
  noSubmit: true,
  render() {
    return `
      <div style="margin-bottom:16px;">
        <label style="font-size:13px;margin-right:8px;">数据范围：</label>
        <select class="form-select" id="dashDays" style="width:auto;display:inline-block;" onchange="TOOLS['M-07'].load()">
          <option value="7">最近 7 天</option>
          <option value="14">最近 14 天</option>
          <option value="30">最近 30 天</option>
        </select>
      </div>
      <div id="dashContent"><span class="spinner"></span> 加载中...</div>
    `;
  },
  async onMount() { await this.load(); },
  async load() {
    const days = parseInt(document.getElementById('dashDays').value) || 7;
    const r = await api(`/api/media/dashboard?days=${days}`);
    const el = document.getElementById('dashContent');
    const s = r.summary;
    let html = `
      <div class="dashboard-summary">
        <div class="dash-stat"><div class="ds-val" style="color:var(--steel)">${s.total_views.toLocaleString()}</div><div class="ds-label">总阅读</div></div>
        <div class="dash-stat"><div class="ds-val" style="color:var(--brass)">${s.total_likes.toLocaleString()}</div><div class="ds-label">总点赞</div></div>
        <div class="dash-stat"><div class="ds-val" style="color:var(--moss)">${s.total_comments.toLocaleString()}</div><div class="ds-label">总评论</div></div>
        <div class="dash-stat"><div class="ds-val" style="color:#7B3FA0">${s.total_shares.toLocaleString()}</div><div class="ds-label">总分享</div></div>
      </div>
    `;
    const colors = { '公众号': 'var(--brass)', '知乎': 'var(--steel)', '小红书': 'var(--moss)' };
    for (const [platform, data] of Object.entries(r.platforms)) {
      const maxVal = Math.max(...data.views, 1);
      html += `<div class="dash-platform"><div class="dash-platform-name">${escapeHtml(platform)}</div><div class="dash-bar-chart">`;
      data.views.forEach((v, i) => {
        const h = Math.max(2, (v / maxVal) * 76);
        html += `<div class="dash-bar" style="height:${h}px;background:${colors[platform] || 'var(--steel)'}" title="${r.dates[i]}: ${v}"></div>`;
      });
      html += '</div>';
      html += '<div style="display:flex;gap:3px;">' + r.dates.map(d => `<div class="dash-bar-title">${d.slice(5)}</div>`).join('') + '</div>';
      html += '</div>';
    }
    el.innerHTML = html;
  }
};

// ==================== P-01: 番茄钟计时器 ====================
TOOLS['P-01'] = {
  noSubmit: true,
  _timer: null,
  _seconds: 0,
  _duration: 25 * 60,
  _running: false,
  _sessionId: null,
  render() {
    return `
      <div class="pomodoro-timer">
        <div class="pomodoro-time" id="pomoTime">25:00</div>
        <div style="display:flex;justify-content:center;gap:8px;margin-bottom:16px;">
          <button class="btn btn-secondary btn-sm" onclick="TOOLS['P-01'].setDuration(25)">25分钟</button>
          <button class="btn btn-secondary btn-sm" onclick="TOOLS['P-01'].setDuration(15)">15分钟</button>
          <button class="btn btn-secondary btn-sm" onclick="TOOLS['P-01'].setDuration(5)">5分钟</button>
        </div>
        <div class="form-group" style="max-width:300px;margin:0 auto 16px;">
          <input class="form-input" id="pomoTask" placeholder="正在做的事（可选）" />
        </div>
        <div style="display:flex;justify-content:center;gap:10px;">
          <button class="btn btn-primary" id="pomoStartBtn" onclick="TOOLS['P-01'].toggle()">开始专注</button>
          <button class="btn btn-secondary" onclick="TOOLS['P-01'].reset()">重置</button>
        </div>
      </div>
      <div id="pomoStats"></div>
    `;
  },
  async onMount() { await this.loadStats(); },
  setDuration(min) {
    if (this._running) return;
    this._duration = min * 60;
    this._seconds = 0;
    this.updateDisplay();
  },
  updateDisplay() {
    const remaining = this._duration - this._seconds;
    const m = String(Math.floor(remaining / 60)).padStart(2, '0');
    const s = String(remaining % 60).padStart(2, '0');
    document.getElementById('pomoTime').textContent = `${m}:${s}`;
  },
  async toggle() {
    if (this._running) {
      // 暂停
      clearInterval(this._timer);
      this._running = false;
      document.getElementById('pomoStartBtn').textContent = '继续';
    } else {
      // 开始
      if (this._seconds === 0) {
        const task = document.getElementById('pomoTask').value;
        const r = await api('/api/productivity/pomodoro', { body: { action: 'start', task, duration: this._duration / 60 } });
        if (r.session_id) this._sessionId = r.session_id;
      }
      this._running = true;
      document.getElementById('pomoStartBtn').textContent = '暂停';
      this._timer = setInterval(() => {
        this._seconds++;
        this.updateDisplay();
        if (this._seconds >= this._duration) {
          clearInterval(this._timer);
          this._running = false;
          this.complete();
        }
      }, 1000);
    }
  },
  async complete() {
    if (this._sessionId) {
      await api('/api/productivity/pomodoro', { body: { action: 'complete', session_id: this._sessionId } });
      this._sessionId = null;
    }
    document.getElementById('pomoStartBtn').textContent = '开始专注';
    this._seconds = 0;
    this.updateDisplay();
    showToast('🍅 番茄钟完成！休息一下吧');
    await this.loadStats();
  },
  reset() {
    clearInterval(this._timer);
    this._running = false;
    this._seconds = 0;
    this._sessionId = null;
    document.getElementById('pomoStartBtn').textContent = '开始专注';
    this.updateDisplay();
  },
  async loadStats() {
    const r = await api('/api/productivity/pomodoro', { body: { action: 'stats' } });
    const el = document.getElementById('pomoStats');
    if (!el) return;
    el.innerHTML = `
      <div class="pomodoro-stats">
        <div class="pomodoro-stat"><div class="stat-val">${r.today_sessions}</div><div class="stat-label">今日番茄</div></div>
        <div class="pomodoro-stat"><div class="stat-val">${r.total_sessions}</div><div class="stat-label">累计番茄</div></div>
        <div class="pomodoro-stat"><div class="stat-val">${Math.floor(r.total_minutes/60)}h${r.total_minutes%60}m</div><div class="stat-label">专注时长</div></div>
      </div>
      ${r.trend && r.trend.length ? `<div style="margin-top:16px;"><div style="font-size:13px;font-weight:600;margin-bottom:8px;">最近 7 天</div><div class="dash-bar-chart">${r.trend.map(t => `<div class="dash-bar" style="height:${Math.max(2,t.count*10)}px;background:var(--brass)" title="${t.date}: ${t.count}个"></div>`).join('')}</div></div>` : ''}
    `;
  }
};

// ==================== P-02: 待办清单 ====================
TOOLS['P-02'] = {
  noSubmit: true,
  render() {
    return `
      <div style="margin-bottom:16px;display:flex;gap:8px;">
        <input class="form-input" id="todoInput" placeholder="添加新任务..." onkeydown="if(event.key==='Enter')TOOLS['P-02'].add()" />
        <select class="form-select" id="todoPriority" style="width:auto;">
          <option value="high">高</option>
          <option value="normal" selected>中</option>
          <option value="low">低</option>
        </select>
        <button class="btn btn-primary btn-sm" onclick="TOOLS['P-02'].add()">添加</button>
      </div>
      <div id="todoList"></div>
    `;
  },
  async onMount() { await this.load(); },
  async load() {
    const r = await api('/api/productivity/todos');
    const el = document.getElementById('todoList');
    if (!r.todos || r.todos.length === 0) {
      el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">暂无待办，添加一个吧</p>';
      return;
    }
    el.innerHTML = r.todos.map(t =>
      `<div class="list-item ${t.completed ? 'done' : ''}">
        <span class="priority-dot priority-${t.priority}"></span>
        <span class="item-text">${escapeHtml(t.title)}${t.due_date ? ` <span style="font-size:11px;color:var(--muted);">📅 ${t.due_date}</span>` : ''}</span>
        <div class="item-actions">
          <button class="icon-btn" onclick="TOOLS['P-02'].toggle(${t.id})">${t.completed ? '↩' : '✓'}</button>
          <button class="icon-btn" onclick="TOOLS['P-02'].del(${t.id})">✕</button>
        </div>
      </div>`
    ).join('');
  },
  async add() {
    const title = document.getElementById('todoInput').value.trim();
    const priority = document.getElementById('todoPriority').value;
    if (!title) return showToast('请输入任务');
    await api('/api/productivity/todos', { method: 'POST', body: { title, priority } });
    document.getElementById('todoInput').value = '';
    showToast('已添加');
    await this.load();
  },
  async toggle(id) {
    await api(`/api/productivity/todos/${id}/toggle`, { method: 'PUT' });
    await this.load();
  },
  async del(id) {
    await api(`/api/productivity/todos/${id}`, { method: 'DELETE' });
    await this.load();
  }
};

// ==================== P-03: 习惯打卡 ====================
TOOLS['P-03'] = {
  noSubmit: true,
  render() {
    return `
      <div style="margin-bottom:16px;display:flex;gap:8px;">
        <input class="form-input" id="habitInput" placeholder="添加新习惯..." onkeydown="if(event.key==='Enter')TOOLS['P-03'].add()" />
        <button class="btn btn-primary btn-sm" onclick="TOOLS['P-03'].add()">添加</button>
      </div>
      <div id="habitList"></div>
    `;
  },
  async onMount() { await this.load(); },
  async load() {
    const r = await api('/api/productivity/habits');
    const el = document.getElementById('habitList');
    if (!r.habits || r.habits.length === 0) {
      el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">暂无习惯，添加一个吧</p>';
      return;
    }
    el.innerHTML = r.habits.map(h =>
      `<div class="list-item">
        <span style="width:10px;height:10px;border-radius:3px;background:${h.color};flex-shrink:0;"></span>
        <span class="item-text">${escapeHtml(h.name)}</span>
        <span class="habit-streak">🔥 ${h.streak} 天 · 累计 ${h.total_days} 天</span>
        <div class="item-actions">
          <button class="icon-btn" style="${h.checked_today ? 'background:var(--moss);color:white;border-color:var(--moss);' : ''}" onclick="TOOLS['P-03'].checkin(${h.id})">${h.checked_today ? '✓' : '○'}</button>
          <button class="icon-btn" onclick="TOOLS['P-03'].del(${h.id})">✕</button>
        </div>
      </div>`
    ).join('');
  },
  async add() {
    const name = document.getElementById('habitInput').value.trim();
    if (!name) return showToast('请输入习惯名称');
    await api('/api/productivity/habits', { method: 'POST', body: { name } });
    document.getElementById('habitInput').value = '';
    showToast('习惯已创建');
    await this.load();
  },
  async checkin(id) {
    const r = await api(`/api/productivity/habits/${id}/checkin`, { method: 'POST' });
    showToast(r.message);
    await this.load();
  },
  async del(id) {
    await api(`/api/productivity/habits/${id}`, { method: 'DELETE' });
    showToast('已删除');
    await this.load();
  }
};

// ==================== P-04: 闪念笔记 ====================
TOOLS['P-04'] = {
  noSubmit: true,
  render() {
    return `
      <div class="form-group">
        <textarea class="form-textarea" id="noteInput" rows="3" placeholder="随手记下闪过的想法..." onkeydown="if(event.key==='Enter'&&event.ctrlKey)TOOLS['P-04'].add()"></textarea>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <input class="form-input" id="noteTag" placeholder="标签（可选）" style="flex:0 0 150px;" />
        <button class="btn btn-primary btn-sm" onclick="TOOLS['P-04'].add()">保存笔记</button>
      </div>
      <div id="noteList"></div>
    `;
  },
  async onMount() { await this.load(); },
  async load() {
    const r = await api('/api/productivity/notes');
    const el = document.getElementById('noteList');
    if (!r.notes || r.notes.length === 0) {
      el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">暂无笔记，记录第一个想法吧</p>';
      return;
    }
    el.innerHTML = r.notes.map(n =>
      `<div class="list-item" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <div class="item-text">${escapeHtml(n.content)}</div>
        <div style="display:flex;align-items:center;gap:8px;width:100%;">
          ${n.tag ? `<span style="font-size:11px;padding:2px 8px;background:var(--moss-soft);color:var(--moss);border-radius:4px;">${escapeHtml(n.tag)}</span>` : ''}
          <span class="mono" style="font-size:11px;color:var(--muted);flex:1;">${n.created_at}</span>
          <button class="icon-btn" onclick="TOOLS['P-04'].del(${n.id})">✕</button>
        </div>
      </div>`
    ).join('');
  },
  async add() {
    const content = document.getElementById('noteInput').value.trim();
    const tag = document.getElementById('noteTag').value.trim();
    if (!content) return showToast('请输入笔记内容');
    await api('/api/productivity/notes', { method: 'POST', body: { content, tag } });
    document.getElementById('noteInput').value = '';
    document.getElementById('noteTag').value = '';
    showToast('笔记已保存');
    await this.load();
  },
  async del(id) {
    await api(`/api/productivity/notes/${id}`, { method: 'DELETE' });
    await this.load();
  }
};

// ==================== P-05: 单位换算器 ====================
TOOLS['P-05'] = {
  _categories: null,
  render() {
    return `
      <div class="form-group">
        <label>分类</label>
        <select class="form-select" id="ucCategory" onchange="TOOLS['P-05'].onCategoryChange()"></select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>数值</label>
          <input class="form-input" type="number" id="ucValue" value="1" oninput="TOOLS['P-05'].convert()" />
        </div>
        <div class="form-group">
          <label>从</label>
          <select class="form-select" id="ucFrom" onchange="TOOLS['P-05'].convert()"></select>
        </div>
        <div class="form-group">
          <label>到</label>
          <select class="form-select" id="ucTo" onchange="TOOLS['P-05'].convert()"></select>
        </div>
      </div>
      ${resultArea()}
    `;
  },
  async onMount() {
    const r = await api('/api/productivity/unit-categories');
    this._categories = r.categories;
    const catSel = document.getElementById('ucCategory');
    catSel.innerHTML = Object.keys(this._categories).map(c => `<option value="${c}">${c}</option>`).join('');
    this.onCategoryChange();
  },
  onCategoryChange() {
    const cat = document.getElementById('ucCategory').value;
    const units = this._categories[cat] || [];
    const fromSel = document.getElementById('ucFrom');
    const toSel = document.getElementById('ucTo');
    fromSel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
    toSel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
    if (units.length > 1) toSel.selectedIndex = 1;
    this.convert();
  },
  async convert() {
    const category = document.getElementById('ucCategory').value;
    const value = parseFloat(document.getElementById('ucValue').value);
    const from_unit = document.getElementById('ucFrom').value;
    const to_unit = document.getElementById('ucTo').value;
    if (isNaN(value)) return;
    const r = await api('/api/productivity/unit-convert', { body: { category, value, from_unit, to_unit } });
    if (r.error) { setResult(`<div style="color:#C0392B;">❌ ${r.error}</div>`); return; }
    setResult(`<div style="font-size:20px;font-weight:700;text-align:center;padding:12px;">${escapeHtml(r.result_str)} <span style="font-size:14px;color:var(--muted);">${escapeHtml(to_unit)}</span></div><div style="text-align:center;font-size:12px;color:var(--muted);">${escapeHtml(r.expression)}</div>${copyBtn(r.result_str)}`);
  }
};

// ==================== P-06: 密码生成器 ====================
TOOLS['P-06'] = {
  render() {
    return `
      <div class="form-group">
        <label>密码长度: <span id="pwdLenLabel" class="mono">16</span></label>
        <input type="range" id="pwdLength" min="4" max="64" value="16" style="width:100%;" oninput="document.getElementById('pwdLenLabel').textContent=this.value" />
      </div>
      <div class="checkbox-group" style="margin-bottom:16px;">
        <label class="checkbox-item"><input type="checkbox" id="pwdUpper" checked> 大写 A-Z</label>
        <label class="checkbox-item"><input type="checkbox" id="pwdLower" checked> 小写 a-z</label>
        <label class="checkbox-item"><input type="checkbox" id="pwdDigit" checked> 数字 0-9</label>
        <label class="checkbox-item"><input type="checkbox" id="pwdSym"> 符号 !@#$</label>
        <label class="checkbox-item"><input type="checkbox" id="pwdAmb"> 排除易混 0O1lI</label>
      </div>
      ${resultArea()}
    `;
  },
  onMount() { this.submit(); },
  async submit() {
    const length = parseInt(document.getElementById('pwdLength').value);
    const uppercase = document.getElementById('pwdUpper').checked;
    const lowercase = document.getElementById('pwdLower').checked;
    const digits = document.getElementById('pwdDigit').checked;
    const symbols = document.getElementById('pwdSym').checked;
    const exclude_ambiguous = document.getElementById('pwdAmb').checked;
    setResultLoading('生成中...');
    const r = await api('/api/productivity/password-generate', { body: { length, uppercase, lowercase, digits, symbols, exclude_ambiguous } });
    if (r.error) { setResult(`<div style="color:#C0392B;">❌ ${r.error}</div>`); return; }
    setResult(`<div style="font-size:20px;font-family:'IBM Plex Mono',monospace;font-weight:600;text-align:center;padding:16px;background:#FFF;border:1px solid var(--line);border-radius:8px;word-break:break-all;">${escapeHtml(r.password)}</div>${copyBtn(r.password)}`);
  }
};

// ==================== P-07: 二维码生成器 ====================
TOOLS['P-07'] = {
  render() {
    return `
      <div class="form-group">
        <label>二维码内容 <span class="hint">文本或链接</span></label>
        <input class="form-input" id="qrText" value="https://github.com" placeholder="输入文本或URL" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>尺寸</label>
          <select class="form-select" id="qrSize">
            <option value="6">小</option>
            <option value="10" selected>中</option>
            <option value="14">大</option>
          </select>
        </div>
        <div class="form-group">
          <label>前景色</label>
          <input type="color" id="qrFg" value="#000000" class="form-input" style="height:42px;padding:4px;" />
        </div>
        <div class="form-group">
          <label>背景色</label>
          <input type="color" id="qrBg" value="#FFFFFF" class="form-input" style="height:42px;padding:4px;" />
        </div>
      </div>
      ${resultArea()}
    `;
  },
  async submit() {
    const text = document.getElementById('qrText').value.trim();
    if (!text) return showToast('请输入二维码内容');
    const size = parseInt(document.getElementById('qrSize').value);
    const fg_color = document.getElementById('qrFg').value;
    const bg_color = document.getElementById('qrBg').value;
    setResultLoading('生成中...');
    const r = await api('/api/productivity/qrcode', { body: { text, size, fg_color, bg_color } });
    if (r.error) { setResult(`<div style="color:#C0392B;">❌ ${r.error}</div>`); return; }
    setResult(`<div class="qr-preview"><img src="${r.image}" alt="QR Code" /><div style="margin-top:12px;"><a href="${r.image}" download="qrcode.png" class="btn btn-secondary btn-sm">⬇ 下载图片</a></div></div>`);
  }
};

// ============================================================
// 辅助函数
// ============================================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// 初始化
// ============================================================
Object.keys(DATA).forEach(renderGrid);

// sidebar links
const catLinks = document.querySelectorAll('.cat-link[data-target]');
catLinks.forEach(link => {
  link.addEventListener('click', () => {
    catLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.getElementById(link.dataset.target).scrollIntoView({ behavior: 'smooth', block: 'start' });
    closeSidebar();
  });
});

// scrollspy
const sections = document.querySelectorAll('section.category');
const spy = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      catLinks.forEach(l => l.classList.toggle('active', l.dataset.target === entry.target.id));
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });
sections.forEach(s => spy.observe(s));

// mobile sidebar
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
const menuBtn = document.getElementById('menuBtn');
const sidebarClose = document.getElementById('sidebarClose');

function openSidebar() { sidebar.classList.add('open'); backdrop.classList.add('show'); }
function closeSidebar() { sidebar.classList.remove('open'); backdrop.classList.remove('show'); }
menuBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
backdrop.addEventListener('click', closeSidebar);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });

// search filter
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  document.querySelectorAll('.tool-card').forEach(card => {
    const match = card.dataset.name.toLowerCase().includes(q) || card.textContent.toLowerCase().includes(q);
    card.classList.toggle('hidden', q.length > 0 && !match);
  });
  sections.forEach(sec => {
    const grid = sec.querySelector('.grid');
    const anyVisible = [...grid.querySelectorAll('.tool-card')].some(c => !c.classList.contains('hidden'));
    sec.classList.toggle('hidden', q.length > 0 && !anyVisible);
  });
});
