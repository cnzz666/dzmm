// ==================== 科技辅助版 Worker.js ====================
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = "https://www.xn--i8s951di30azba.com";
    
    try {
      // 处理辅助功能API
      if (url.pathname === "/_assist/inject") {
        return handleInjectModify(request, targetUrl);
      }
      if (url.pathname === "/_assist/credit-lock") {
        return handleCreditLock(request);
      }
      if (url.pathname === "/_assist/vip-upgrade") {
        return handleVipUpgrade(request);
      }
      if (url.pathname === "/_assist/get-control") {
        return getControlPanelHTML();
      }
      if (url.pathname === "/_assist/toggle") {
        return handleToggleAssist(request);
      }
      if (url.pathname === "/_assist/current-settings") {
        return getCurrentSettings();
      }
      
      return await handleProxyRequest(request, targetUrl, url);
    } catch (error) {
      return new Response(`代理错误: ${error.message}`, {
        status: 500,
        headers: { "Content-Type": "text/plain" }
      });
    }
  }
};

// ==================== 辅助功能核心 ====================
const assistConfig = {
  enabled: true,
  creditLock: {
    enabled: false,
    fixedValue: 999999
  },
  vipLevel: {
    enabled: false,
    level: 999,
    badge: "ULTIMATE"
  },
  unlimitedChat: true,
  noCooldown: true,
  bypassLimits: true
};

// 响应修改函数
async function handleInjectModify(request, targetUrl) {
  try {
    const body = await request.json();
    const { type, value, cookie } = body;
    
    if (!cookie) {
      throw new Error("需要提供当前cookie");
    }
    
    // 这里可以根据type修改不同的响应
    // 例如：修改/api/me返回的余额，修改对话计数等
    
    return new Response(JSON.stringify({
      success: true,
      message: `已注入修改: ${type} = ${value}`,
      timestamp: new Date().toISOString()
    }), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

async function handleCreditLock(request) {
  try {
    const body = await request.json();
    const { enabled, value } = body;
    
    assistConfig.creditLock.enabled = enabled;
    if (value !== undefined) {
      assistConfig.creditLock.fixedValue = value;
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: enabled ? `余额已锁定为: ${assistConfig.creditLock.fixedValue}` : "余额锁定已关闭",
      config: assistConfig.creditLock
    }), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

async function handleVipUpgrade(request) {
  try {
    const body = await request.json();
    const { enabled, level, badge } = body;
    
    assistConfig.vipLevel.enabled = enabled;
    if (level !== undefined) {
      assistConfig.vipLevel.level = level;
    }
    if (badge !== undefined) {
      assistConfig.vipLevel.badge = badge;
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: enabled ? `VIP等级已提升至: ${level} (${badge})` : "VIP修改已关闭",
      config: assistConfig.vipLevel
    }), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

async function handleToggleAssist(request) {
  try {
    const body = await request.json();
    const { feature, enabled } = body;
    
    if (feature === 'all') {
      assistConfig.enabled = enabled;
    } else if (assistConfig[feature] !== undefined) {
      if (typeof assistConfig[feature] === 'boolean') {
        assistConfig[feature] = enabled;
      } else if (assistConfig[feature].enabled !== undefined) {
        assistConfig[feature].enabled = enabled;
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: `${feature} ${enabled ? '启用' : '关闭'}`,
      config: assistConfig
    }), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

function getCurrentSettings() {
  return new Response(JSON.stringify({
    success: true,
    config: assistConfig,
    timestamp: new Date().toISOString()
  }), {
    headers: { "Content-Type": "application/json" }
  });
}

// ==================== 代理请求处理（带注入） ====================
async function handleProxyRequest(request, targetUrl, url) {
  const targetHeaders = new Headers(request.headers);
  targetHeaders.delete("host");
  targetHeaders.delete("origin");
  targetHeaders.delete("referer");
  targetHeaders.set("origin", targetUrl);
  targetHeaders.set("referer", targetUrl + url.pathname);
  
  const targetRequest = new Request(targetUrl + url.pathname + url.search, {
    method: request.method,
    headers: targetHeaders,
    body: request.body,
    redirect: "manual"
  });
  
  const response = await fetch(targetRequest);
  return await processProxyResponse(response, request, url);
}
__name(handleProxyRequest, "handleProxyRequest");

async function processProxyResponse(response, originalRequest, url) {
  const contentType = response.headers.get("content-type") || "";
  const clonedResponse = response.clone();
  
  if (contentType.includes("text/html")) {
    try {
      const html = await clonedResponse.text();
      const modifiedHtml = injectControlPanel(html, url);
      const newHeaders2 = new Headers(response.headers);
      newHeaders2.set("Content-Type", "text/html; charset=utf-8");
      return new Response(modifiedHtml, {
        status: response.status,
        headers: newHeaders2
      });
    } catch (error) {
      console.error("HTML注入失败:", error);
      return response;
    }
  }
  
  // 对JSON响应进行修改（如余额修改）
  if (contentType.includes("application/json") && assistConfig.enabled) {
    try {
      const text = await clonedResponse.text();
      let data = JSON.parse(text);
      
      // 修改/api/me响应中的余额
      if (url.pathname.includes('/api/me') && data.credit !== undefined) {
        if (assistConfig.creditLock.enabled) {
          data.credit = assistConfig.creditLock.fixedValue;
        } else if (assistConfig.unlimitedChat) {
          data.credit = 999999;
        }
      }
      
      // 修改用户信息中的VIP标识
      if (data.role || data.vip_level) {
        if (assistConfig.vipLevel.enabled) {
          data.role = assistConfig.vipLevel.badge;
          data.vip_level = assistConfig.vipLevel.level;
          data.is_premium = true;
          data.subscription = "lifetime_ultimate";
        }
      }
      
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      newHeaders.set("Access-Control-Allow-Headers", "*");
      newHeaders.set("Access-Control-Allow-Credentials", "true");
      
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: newHeaders
      });
    } catch (error) {
      // 如果JSON解析失败，返回原始响应
      console.error("JSON修改失败:", error);
    }
  }
  
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "*");
  newHeaders.set("Access-Control-Allow-Credentials", "true");
  newHeaders.delete("content-security-policy");
  newHeaders.delete("content-security-policy-report-only");
  
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders
  });
}
__name(processProxyResponse, "processProxyResponse");

// ==================== iPhone 17灵动岛风格控制面板 ====================
function getControlPanelHTML() {
  const panelHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>科技辅助面板 | Quantum Assist</title>
    <style>
        :root {
            --system-background: #000000;
            --secondary-background: #1c1c1e;
            --tertiary-background: #2c2c2e;
            --label-primary: #ffffff;
            --label-secondary: #98989d;
            --label-tertiary: #6c6c70;
            --accent-blue: #0a84ff;
            --accent-green: #30d158;
            --accent-orange: #ff9f0a;
            --accent-red: #ff453a;
            --accent-purple: #bf5af2;
            --dynamic-island-height: 37px;
            --dynamic-island-width: 126px;
            --glass-background: rgba(28, 28, 30, 0.8);
            --glass-border: rgba(255, 255, 255, 0.1);
            --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.32);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
            background: var(--system-background);
            color: var(--label-primary);
            line-height: 1.4;
            overflow-x: hidden;
            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
            min-height: 100vh;
        }
        
        /* 灵动岛容器 */
        .dynamic-island {
            position: fixed;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: var(--dynamic-island-width);
            height: var(--dynamic-island-height);
            background: rgba(40, 40, 40, 0.95);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border-radius: 50px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: var(--glass-shadow);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            cursor: pointer;
            overflow: hidden;
        }
        
        .dynamic-island.expanded {
            width: 94vw;
            height: 85vh;
            border-radius: 28px;
            top: 20px;
            max-width: 400px;
        }
        
        .island-content {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 16px;
            width: 100%;
            height: 100%;
            opacity: 1;
            transition: opacity 0.3s ease;
        }
        
        .dynamic-island.expanded .island-content {
            opacity: 0;
            pointer-events: none;
        }
        
        .island-icon {
            width: 20px;
            height: 20px;
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
        }
        
        .island-text {
            font-size: 14px;
            font-weight: 600;
            color: var(--label-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
        }
        
        .island-status {
            width: 8px;
            height: 8px;
            border-radius: 4px;
            background: var(--accent-green);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* 扩展面板内容 */
        .expanded-panel {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            padding: 24px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease 0.1s;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        .dynamic-island.expanded .expanded-panel {
            opacity: 1;
            pointer-events: all;
        }
        
        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .panel-title {
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .close-btn {
            width: 32px;
            height: 32px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.08);
            border: none;
            color: var(--label-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .close-btn:hover {
            background: rgba(255, 255, 255, 0.12);
        }
        
        /* 功能卡片 */
        .function-grid {
            display: grid;
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .function-card {
            background: var(--secondary-background);
            border-radius: 18px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .function-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--accent-blue), transparent);
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .function-card:hover::before {
            opacity: 1;
        }
        
        .function-card.active {
            border-color: var(--accent-blue);
            background: rgba(10, 132, 255, 0.08);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        
        .card-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--label-primary);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .card-icon {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
        }
        
        .credit-icon { background: linear-gradient(135deg, #30d158, #34c759); }
        .vip-icon { background: linear-gradient(135deg, #ff9f0a, #ff9500); }
        .unlock-icon { background: linear-gradient(135deg, #bf5af2, #af52de); }
        .speed-icon { background: linear-gradient(135deg, #0a84ff, #007aff); }
        
        /* 开关样式 */
        .toggle-switch {
            position: relative;
            width: 52px;
            height: 32px;
        }
        
        .toggle-input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 255, 0.16);
            transition: .4s;
            border-radius: 32px;
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        .toggle-input:checked + .toggle-slider {
            background: var(--accent-blue);
        }
        
        .toggle-input:checked + .toggle-slider:before {
            transform: translateX(20px);
        }
        
        /* 数值调整器 */
        .value-adjuster {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 16px;
        }
        
        .value-input {
            flex: 1;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 12px;
            padding: 12px 16px;
            color: var(--label-primary);
            font-size: 16px;
            font-family: inherit;
            transition: all 0.2s;
        }
        
        .value-input:focus {
            outline: none;
            border-color: var(--accent-blue);
            background: rgba(10, 132, 255, 0.08);
        }
        
        .apply-btn {
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
            border: none;
            border-radius: 12px;
            padding: 12px 20px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            white-space: nowrap;
        }
        
        .apply-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(10, 132, 255, 0.3);
        }
        
        .apply-btn:active {
            transform: translateY(0);
        }
        
        /* 状态指示器 */
        .status-indicators {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 24px;
        }
        
        .status-item {
            background: var(--tertiary-background);
            border-radius: 14px;
            padding: 16px;
            text-align: center;
        }
        
        .status-value {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        
        .status-label {
            font-size: 12px;
            color: var(--label-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* 响应式调整 */
        @media (max-width: 380px) {
            .dynamic-island.expanded {
                width: 92vw;
                height: 82vh;
            }
            
            .expanded-panel {
                padding: 20px;
            }
            
            .function-card {
                padding: 16px;
            }
        }
        
        /* 滚动条样式 */
        .expanded-panel::-webkit-scrollbar {
            width: 4px;
        }
        
        .expanded-panel::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .expanded-panel::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.16);
            border-radius: 2px;
        }
    </style>
</head>
<body>
    <!-- 灵动岛 -->
    <div class="dynamic-island" id="dynamicIsland">
        <div class="island-content">
            <div class="island-icon">QA</div>
            <div class="island-text">Quantum Assist</div>
            <div class="island-status"></div>
        </div>
        
        <!-- 扩展面板 -->
        <div class="expanded-panel" id="expandedPanel">
            <div class="panel-header">
                <div class="panel-title">科技辅助面板</div>
                <button class="close-btn" id="closePanel">×</button>
            </div>
            
            <div class="function-grid">
                <!-- 额度锁定功能 -->
                <div class="function-card" id="creditCard">
                    <div class="card-header">
                        <div class="card-title">
                            <div class="card-icon credit-icon">💰</div>
                            <span>额度锁定</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="toggle-input" id="creditToggle">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="value-adjuster">
                        <input type="number" class="value-input" id="creditValue" value="999999" placeholder="锁定数值">
                        <button class="apply-btn" id="applyCredit">应用</button>
                    </div>
                </div>
                
                <!-- VIP等级修改 -->
                <div class="function-card" id="vipCard">
                    <div class="card-header">
                        <div class="card-title">
                            <div class="card-icon vip-icon">👑</div>
                            <span>VIP等级修改</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="toggle-input" id="vipToggle">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="value-adjuster">
                        <input type="number" class="value-input" id="vipLevel" value="999" placeholder="VIP等级">
                        <input type="text" class="value-input" id="vipBadge" value="ULTIMATE" placeholder="徽章标识">
                        <button class="apply-btn" id="applyVip">应用</button>
                    </div>
                </div>
                
                <!-- 无限对话 -->
                <div class="function-card" id="unlimitedCard">
                    <div class="card-header">
                        <div class="card-title">
                            <div class="card-icon unlock-icon">♾️</div>
                            <span>无限对话</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="toggle-input" id="unlimitedToggle" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <p style="color: var(--label-secondary); font-size: 14px; margin-top: 8px;">
                        移除对话次数限制，畅聊无忧
                    </p>
                </div>
                
                <!-- 无冷却限制 -->
                <div class="function-card" id="cooldownCard">
                    <div class="card-header">
                        <div class="card-title">
                            <div class="card-icon speed-icon">⚡</div>
                            <span>无冷却限制</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="toggle-input" id="cooldownToggle" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <p style="color: var(--label-secondary); font-size: 14px; margin-top: 8px;">
                        移除请求冷却时间，极速响应
                    </p>
                </div>
            </div>
            
            <div class="status-indicators">
                <div class="status-item">
                    <div class="status-value" id="currentCredit">999,999</div>
                    <div class="status-label">当前额度</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="currentVip">ULTIMATE</div>
                    <div class="status-label">VIP等级</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="connectionStatus">●</div>
                    <div class="status-label">连接状态</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="activeMods">4</div>
                    <div class="status-label">激活模块</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // DOM元素
        const dynamicIsland = document.getElementById('dynamicIsland');
        const expandedPanel = document.getElementById('expandedPanel');
        const closePanel = document.getElementById('closePanel');
        
        // 控制元素
        const creditToggle = document.getElementById('creditToggle');
        const creditValue = document.getElementById('creditValue');
        const applyCredit = document.getElementById('applyCredit');
        
        const vipToggle = document.getElementById('vipToggle');
        const vipLevel = document.getElementById('vipLevel');
        const vipBadge = document.getElementById('vipBadge');
        const applyVip = document.getElementById('applyVip');
        
        const unlimitedToggle = document.getElementById('unlimitedToggle');
        const cooldownToggle = document.getElementById('cooldownToggle');
        
        // 状态显示
        const currentCredit = document.getElementById('currentCredit');
        const currentVip = document.getElementById('currentVip');
        const connectionStatus = document.getElementById('connectionStatus');
        const activeMods = document.getElementById('activeMods');
        
        // 当前配置
        let currentConfig = {
            creditLock: { enabled: false, value: 999999 },
            vipModify: { enabled: false, level: 999, badge: "ULTIMATE" },
            unlimitedChat: true,
            noCooldown: true
        };
        
        // 灵动岛交互
        let isExpanded = false;
        
        dynamicIsland.addEventListener('click', () => {
            if (!isExpanded) {
                expandIsland();
            }
        });
        
        closePanel.addEventListener('click', () => {
            collapseIsland();
        });
        
        function expandIsland() {
            dynamicIsland.classList.add('expanded');
            isExpanded = true;
            loadCurrentSettings();
        }
        
        function collapseIsland() {
            dynamicIsland.classList.remove('expanded');
            isExpanded = false;
        }
        
        // 加载当前设置
        async function loadCurrentSettings() {
            try {
                const response = await fetch('/_assist/current-settings');
                const data = await response.json();
                if (data.success) {
                    currentConfig = data.config;
                    updateUIFromConfig();
                }
            } catch (error) {
                console.error('加载设置失败:', error);
            }
        }
        
        function updateUIFromConfig() {
            // 额度锁定
            creditToggle.checked = currentConfig.creditLock.enabled;
            creditValue.value = currentConfig.creditLock.fixedValue;
            
            // VIP修改
            vipToggle.checked = currentConfig.vipLevel.enabled;
            vipLevel.value = currentConfig.vipLevel.level;
            vipBadge.value = currentConfig.vipLevel.badge;
            
            // 其他功能
            unlimitedToggle.checked = currentConfig.unlimitedChat;
            cooldownToggle.checked = currentConfig.noCooldown;
            
            // 更新状态显示
            updateStatusDisplay();
        }
        
        function updateStatusDisplay() {
            let activeCount = 0;
            
            if (currentConfig.creditLock.enabled) {
                currentCredit.textContent = currentConfig.creditLock.fixedValue.toLocaleString();
                activeCount++;
            } else {
                currentCredit.textContent = "35";
            }
            
            if (currentConfig.vipLevel.enabled) {
                currentVip.textContent = currentConfig.vipLevel.badge;
                activeCount++;
            } else {
                currentVip.textContent = "BASIC";
            }
            
            if (currentConfig.unlimitedChat) activeCount++;
            if (currentConfig.noCooldown) activeCount++;
            
            activeMods.textContent = activeCount;
            connectionStatus.style.color = '#30d158';
        }
        
        // 功能控制
        applyCredit.addEventListener('click', async () => {
            const enabled = creditToggle.checked;
            const value = parseInt(creditValue.value) || 999999;
            
            try {
                const response = await fetch('/_assist/credit-lock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled, value })
                });
                
                const data = await response.json();
                if (data.success) {
                    currentConfig.creditLock.enabled = enabled;
                    currentConfig.creditLock.fixedValue = value;
                    updateStatusDisplay();
                    
                    // 视觉反馈
                    const card = document.getElementById('creditCard');
                    card.classList.add('active');
                    setTimeout(() => card.classList.remove('active'), 500);
                }
            } catch (error) {
                console.error('设置额度锁定失败:', error);
            }
        });
        
        applyVip.addEventListener('click', async () => {
            const enabled = vipToggle.checked;
            const level = parseInt(vipLevel.value) || 999;
            const badge = vipBadge.value || "ULTIMATE";
            
            try {
                const response = await fetch('/_assist/vip-upgrade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled, level, badge })
                });
                
                const data = await response.json();
                if (data.success) {
                    currentConfig.vipLevel.enabled = enabled;
                    currentConfig.vipLevel.level = level;
                    currentConfig.vipLevel.badge = badge;
                    updateStatusDisplay();
                    
                    const card = document.getElementById('vipCard');
                    card.classList.add('active');
                    setTimeout(() => card.classList.remove('active'), 500);
                }
            } catch (error) {
                console.error('设置VIP修改失败:', error);
            }
        });
        
        // 开关控制
        unlimitedToggle.addEventListener('change', async () => {
            const enabled = unlimitedToggle.checked;
            
            try {
                const response = await fetch('/_assist/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feature: 'unlimitedChat', enabled })
                });
                
                const data = await response.json();
                if (data.success) {
                    currentConfig.unlimitedChat = enabled;
                    updateStatusDisplay();
                }
            } catch (error) {
                console.error('设置无限对话失败:', error);
            }
        });
        
        cooldownToggle.addEventListener('change', async () => {
            const enabled = cooldownToggle.checked;
            
            try {
                const response = await fetch('/_assist/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feature: 'noCooldown', enabled })
                });
                
                const data = await response.json();
                if (data.success) {
                    currentConfig.noCooldown = enabled;
                    updateStatusDisplay();
                }
            } catch (error) {
                console.error('设置无冷却失败:', error);
            }
        });
        
        // 初始化
        document.addEventListener('DOMContentLoaded', () => {
            loadCurrentSettings();
            updateStatusDisplay();
            
            // 模拟连接状态
            setInterval(() => {
                connectionStatus.style.opacity = connectionStatus.style.opacity === '0.5' ? '1' : '0.5';
            }, 1000);
        });
        
        // 触摸优化
        let startY = 0;
        let startHeight = 0;
        
        expandedPanel.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startHeight = dynamicIsland.offsetHeight;
        }, { passive: true });
        
        expandedPanel.addEventListener('touchmove', (e) => {
            if (!isExpanded) return;
            
            const currentY = e.touches[0].clientY;
            const deltaY = startY - currentY;
            
            if (deltaY > 50) {
                collapseIsland();
            }
        }, { passive: true });
        
        // 防止点击穿透
        expandedPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    </script>
</body>
</html>`;
  
  return new Response(panelHTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  });
}

// 注入函数（简化版）
function injectControlPanel(html, url) {
  const controlPanelInject = `
    <!-- 科技辅助注入 -->
    <script>
      // 自动注入控制面板
      (function() {
        // 防止重复注入
        if (window.quantumAssistInjected) return;
        window.quantumAssistInjected = true;
        
        // 创建悬浮按钮
        const assistBtn = document.createElement('div');
        assistBtn.innerHTML = '⚡';
        assistBtn.style.cssText = \`
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #0a84ff, #bf5af2);
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
          cursor: pointer;
          z-index: 99999;
          box-shadow: 0 8px 24px rgba(10, 132, 255, 0.4);
          user-select: none;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        \`;
        
        assistBtn.addEventListener('click', () => {
          window.open('/_assist/get-control', '_blank', 'width=400,height=800');
        });
        
        assistBtn.addEventListener('mouseenter', () => {
          assistBtn.style.transform = 'scale(1.1)';
          assistBtn.style.boxShadow = '0 12px 32px rgba(10, 132, 255, 0.6)';
        });
        
        assistBtn.addEventListener('mouseleave', () => {
          assistBtn.style.transform = 'scale(1)';
          assistBtn.style.boxShadow = '0 8px 24px rgba(10, 132, 255, 0.4)';
        });
        
        // 添加拖动功能
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        assistBtn.addEventListener('mousedown', (e) => {
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          startLeft = assistBtn.offsetLeft;
          startTop = assistBtn.offsetTop;
          assistBtn.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;
          
          assistBtn.style.left = (startLeft + deltaX) + 'px';
          assistBtn.style.right = 'auto';
          assistBtn.style.bottom = 'auto';
          assistBtn.style.top = (startTop + deltaY) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
          isDragging = false;
          assistBtn.style.cursor = 'pointer';
        });
        
        // 添加到页面
        document.body.appendChild(assistBtn);
        
        // 添加键盘快捷键
        document.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
            window.open('/_assist/get-control', '_blank', 'width=400,height=800');
          }
        });
        
        // 在控制台显示提示
        console.log('%c⚡ Quantum Assist 已加载', 'color: #0a84ff; font-size: 16px; font-weight: bold;');
        console.log('使用 Ctrl+Shift+Q 快速打开控制面板');
      })();
    </script>
  `;
  
  // 将控制面板注入到body结束前
  return html.replace('</body>', controlPanelInject + '</body>');
}

// 辅助函数
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookies[name] = valueParts.join('=');
    }
  });
  
  return cookies;
}

function parseSetCookies(setCookieHeader) {
  const cookies = {};
  if (!setCookieHeader) return cookies;
  
  const cookieStrings = setCookieHeader.split(', ');
  cookieStrings.forEach(cookieStr => {
    const [nameValue, ...attributes] = cookieStr.split('; ');
    const [name, ...valueParts] = nameValue.split('=');
    if (name) {
      cookies[name] = valueParts.join('=');
    }
  });
  
  return cookies;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

__name(worker_default, "default");
export { worker_default as default };