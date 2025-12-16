// 多语言支持
const translations = {
    'zh': {
        pageTitle: 'MyBatis SQL Log Merger',
        instructionsHeader: '使用说明 ▼',
        instruction1: '将您的MyBatis日志粘贴到下方的输入框中',
        instruction2: '点击"处理SQL"按钮将日志转换为完整的SQL语句',
        instruction3: '转换后的SQL将显示在结果区域',
        instruction4: '使用"清空"按钮可以清除所有内容',
        instruction5: '使用"美化SQL"按钮可以格式化并高亮显示SQL语句',
        instruction6: '使用"拷贝结果"按钮可以将SQL复制到剪贴板',
        instruction7: '可以切换输入模式：单框模式（粘贴完整日志）或双框模式（分别输入SQL模板和参数）',
        instruction8: '双框模式支持带或不带Preparing:和Parameters:前缀的输入',
        exampleHeader: '示例 ▼',
        exampleInputLabel: '输入日志片段：',
        exampleOutputLabel: '输出SQL：',
        dualModeExampleLabel: '双框模式输入示例：',
        sqlTemplateExampleLabel: 'SQL模板（可带或不带Preparing:前缀）：',
        parametersExampleLabel: '参数（可带或不带Parameters:前缀）：',
        singleModeLabel: 'MyBatis日志输入：',
        resultLabel: '处理结果：',
        sqlTemplateLabel: 'SQL模板输入：',
        sqlParametersLabel: '参数输入：',
        resultDoubleLabel: '处理结果：',
        footerText: 'MyBatis SQL Log Merger Chrome Extension',
        toggleToDoubleMode: '切换到双框模式',
        toggleToSingleMode: '切换到单框模式',
        processBtn: '处理SQL',
        formatBtn: '美化SQL',
        copyBtn: '拷贝结果',
        clearBtn: '清空',
        settingsBtn: '设置' // 新增设置按钮文本
    },
    'en': {
        pageTitle: 'MyBatis SQL Log Merger',
        instructionsHeader: 'Instructions ▼',
        instruction1: 'Paste your MyBatis logs into the input box below',
        instruction2: 'Click the "Process SQL" button to convert logs into complete SQL statements',
        instruction3: 'The converted SQL will be displayed in the result area',
        instruction4: 'Use the "Clear" button to clear all content',
        instruction5: 'Use the "Beautify SQL" button to format and highlight the SQL statement',
        instruction6: 'Use the "Copy Result" button to copy the SQL to the clipboard',
        instruction7: 'You can switch input modes: single-box mode (paste complete logs) or dual-box mode (enter SQL template and parameters separately)',
        instruction8: 'Dual-box mode supports inputs with or without Preparing: and Parameters: prefixes',
        exampleHeader: 'Example ▼',
        exampleInputLabel: 'Input log snippet:',
        exampleOutputLabel: 'Output SQL:',
        dualModeExampleLabel: 'Dual-box mode input example:',
        sqlTemplateExampleLabel: 'SQL template (with or without Preparing: prefix):',
        parametersExampleLabel: 'Parameters (with or without Parameters: prefix):',
        singleModeLabel: 'MyBatis Log Input:',
        resultLabel: 'Processing Result:',
        sqlTemplateLabel: 'SQL Template Input:',
        sqlParametersLabel: 'Parameters Input:',
        resultDoubleLabel: 'Processing Result:',
        footerText: 'MyBatis SQL Log Merger Chrome Extension',
        toggleToDoubleMode: 'Switch to Dual-box Mode',
        toggleToSingleMode: 'Switch to Single-box Mode',
        processBtn: 'Process SQL',
        formatBtn: 'Beautify SQL',
        copyBtn: 'Copy Result',
        clearBtn: 'Clear',
        settingsBtn: 'Settings' // 新增设置按钮文本
    }
};

// 默认语言
let currentLanguage = 'zh';

// 默认设置
const DEFAULT_SETTINGS = {
    language: 'zh',
    urlPatterns: [], // 默认为空数组，而不是['<all_urls>']
    sqlQueryPlatformUrl: '' // 新增SQL查询平台URL配置
};

// 获取存储API，优先使用sync，备选local
const storage = chrome.storage && chrome.storage.sync ? chrome.storage.sync :
    chrome.storage && chrome.storage.local ? chrome.storage.local :
        {
            // 提供基本的模拟实现以防万一
            get: function (defaults, callback) {
                const result = {};
                for (let key in defaults) {
                    try {
                        const item = localStorage.getItem(key);
                        result[key] = item ? JSON.parse(item) : defaults[key];
                    } catch (e) {
                        console.warn('Failed to parse localStorage item for key:', key, e);
                        result[key] = defaults[key];
                    }
                }
                callback(result);
            }
        };

// 获取翻译文本
function getText(key) {
    return translations[currentLanguage][key] || key;
}

// 切换语言
function toggleLanguage() {
    currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
    updateUIText();
    return currentLanguage;
}

// 更新UI文本
function updateUIText() {
    // 更新页面标题
    const pageTitleElement = document.getElementById('pageTitle');
    if (pageTitleElement) {
        pageTitleElement.textContent = getText('pageTitle');
    }

    // 更新使用说明部分
    const instructionsHeaderElement = document.getElementById('instructionsHeader');
    if (instructionsHeaderElement) {
        instructionsHeaderElement.textContent = getText('instructionsHeader');
    }

    const instructionElements = [
        'instruction1', 'instruction2', 'instruction3', 'instruction4',
        'instruction5', 'instruction6', 'instruction7', 'instruction8'
    ];

    instructionElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = getText(id);
        }
    });

    // 更新示例部分
    const exampleElements = [
        'exampleHeader', 'exampleInputLabel', 'exampleOutputLabel',
        'dualModeExampleLabel', 'sqlTemplateExampleLabel', 'parametersExampleLabel'
    ];

    exampleElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = getText(id);
        }
    });

    // 更新标签文本
    const labelElements = [
        'singleModeLabel', 'resultLabel', 'sqlTemplateLabel',
        'sqlParametersLabel', 'resultDoubleLabel'
    ];

    labelElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = getText(id);
        }
    });

    // 更新按钮文本
    const buttonElements = [
        'toggleModeBtn', 'toggleModeBtnDouble', 'processBtn',
        'formatBtn', 'copyBtn', 'clearBtn', 'settingsBtn'
    ];

    buttonElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = getText(id);
        }
    });

    // 更新页脚文本
    const footerTextElement = document.getElementById('footerText');
    if (footerTextElement) {
        footerTextElement.textContent = getText('footerText');
    }
}

// 初始化多语言支持
document.addEventListener('DOMContentLoaded', function () {
    // 尝试从设置中加载语言偏好设置
    loadLanguageFromSettings();
});

// 从设置中加载语言
function loadLanguageFromSettings() {
    storage.get(DEFAULT_SETTINGS, function (settings) {
        // 确保settings是一个有效的对象
        if (!settings || typeof settings !== 'object') {
            settings = DEFAULT_SETTINGS;
        }

        // 确保language属性存在
        if (!settings.hasOwnProperty('language')) {
            settings.language = DEFAULT_SETTINGS.language;
        }

        // 设置当前语言
        currentLanguage = settings.language;

        // 更新UI文本
        updateUIText();
    });
}

// 监听设置更新消息
if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "settingsUpdated") {
            // 设置更新后重新加载语言
            if (request.settings && request.settings.language) {
                currentLanguage = request.settings.language;
                updateUIText();
            }
        }
    });
}