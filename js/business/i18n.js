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
        settingsBtn: '设置', // 新增设置按钮文本

        // 帮助页面文本
        helpTitle: '帮助 - MyBatis SQL Log Merger',
        backToPopup: '← 返回插件主页',
        helpHeading: 'MyBatis SQL Log Merger 帮助文档',
        introductionHeading: '简介',
        introductionText1: 'MyBatis SQL Log Merger 是一款 Chrome 扩展程序，旨在帮助开发者轻松地将 MyBatis 日志中的 SQL 模板和参数合并成完整的可执行 SQL 语句。',
        introductionText2: '该插件提供了三种不同的使用方式，满足各种使用场景的需求。',
        usageModesHeading: '使用方式',
        standaloneModeHeading: '1. 独立页面模式',
        standaloneStep1: '点击 Chrome 工具栏中的插件图标',
        standaloneStep2: '点击"Mybatis Sql合并"按钮',
        standaloneStep3: '在独立页面中粘贴 MyBatis 日志或分别输入 SQL 模板和参数',
        standaloneStep4: '点击"处理SQL"按钮生成完整的 SQL 语句',
        standaloneNote: '独立页面支持两种输入模式：单框模式（粘贴完整日志，包含sql模板和参数）和双框模式（分别输入 SQL 模板和参数）。',
        pageButtonModeHeading: '2. 页面按钮模式',
        pageButtonStep1: '在目标网站上激活提取按钮功能（点击Chrome工具栏插件图标中的"注入提取SQL按钮"用于激活此功能）',
        pageButtonStep2: '在任何网页上选中 MyBatis 日志文本',
        pageButtonStep3: '点击页面右下角出现的绿色"提取MyBatis SQL"按钮',
        pageButtonStep4: '在弹出的面板中查看合并后的 SQL 结果',
        popupModeHeading: '3. 弹出窗口模式',
        popupModeText: '弹出窗口主要用于快速访问插件的主要功能，如打开独立页面、激活页面按钮等。',
        activatingButtonHeading: '激活页面按钮功能',
        activatingButtonText: '默认情况下，页面按钮不会在任何网站上显示。您需要手动激活特定网站的功能：',
        activatingButtonStep1: '导航到您想要使用插件的目标网站',
        activatingButtonStep2: '点击 Chrome 工具栏中的插件图标',
        activatingButtonStep3: '在弹出窗口中，点击"注入提取SQL按钮"旁边的"未激活"状态标签',
        activatingButtonStep4: '状态将变为"已激活"，刷新页面后即可看到提取按钮',
        activatingButtonTip: '您也可以在设置页面中配置 URL 模式来批量激活多个网站。',
        usingExtractorHeading: '使用提取按钮',
        usingExtractorStep1: '在网页上找到并选中 MyBatis 日志文本',
        usingExtractorStep2: '点击页面右下角的绿色"提取MyBatis SQL"按钮',
        usingExtractorStep3: '在弹出的结果面板中查看合并后的 SQL',
        usingExtractorStep4: '您可以使用"复制"按钮将 SQL 复制到剪贴板',
        manualEntryHeading: '手动输入模式',
        manualEntryText: '如果您想手动输入 SQL 模板和参数，可以点击提取按钮旁的展开图标：',
        manualEntryStep1: '点击提取按钮旁的"⋯"图标',
        manualEntryStep2: '在弹出的面板中分别输入 SQL 模板和参数',
        manualEntryStep3: '点击"合成SQL"按钮生成结果',
        inputFormatsHeading: '输入格式说明',
        singleModeFormatHeading: '单框模式',
        singleModeFormatText: '支持带或不带 Preparing: 和 Parameters: 前缀的日志：',
        dualModeFormatHeading: '双框模式',
        dualModeFormatText1: 'SQL 模板支持以下两种格式：',
        dualModeFormatText2: '参数支持以下两种格式：',
        supportedTypesHeading: '支持的参数类型',
        typeLong: 'Long',
        typeString: 'String',
        typeInteger: 'Integer',
        typeDouble: 'Double',
        typeFloat: 'Float',
        typeBoolean: 'Boolean',
        typeTimestamp: 'Timestamp',
        typeDate: 'Date',
        typeNull: 'NULL 值',
        helpFooter: 'MyBatis SQL Log Merger v1.0',
        noteLabel: '注意:',
        tipLabel: '提示:'
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
        settingsBtn: 'Settings', // 新增设置按钮文本

        // Help page text
        helpTitle: 'Help - MyBatis SQL Log Merger',
        backToPopup: '← Back to Plugin Home',
        helpHeading: 'MyBatis SQL Log Merger Help Documentation',
        introductionHeading: 'Introduction',
        introductionText1: 'MyBatis SQL Log Merger is a Chrome extension designed to help developers easily merge SQL templates and parameters from MyBatis logs into complete executable SQL statements.',
        introductionText2: 'The plugin provides three different usage methods to meet various usage scenario needs.',
        usageModesHeading: 'Usage Methods',
        standaloneModeHeading: '1. Standalone Page Mode',
        standaloneStep1: 'Click the plugin icon in the Chrome toolbar',
        standaloneStep2: 'Click the "Mybatis Sql Merge" button',
        standaloneStep3: 'Paste MyBatis logs or enter SQL template and parameters separately in the standalone page',
        standaloneStep4: 'Click the "Process SQL" button to generate a complete SQL statement',
        standaloneNote: 'The standalone page supports two input modes: single-box mode (paste complete logs, including SQL template and parameters) and dual-box mode (enter SQL template and parameters separately).',
        pageButtonModeHeading: '2. Page Button Mode',
        pageButtonStep1: 'Activate the extraction button function on the target website (click the "Inject SQL Extraction Button" in the Chrome toolbar plugin icon to activate this function)',
        pageButtonStep2: 'Select MyBatis log text on any webpage',
        pageButtonStep3: 'Click the green "Extract MyBatis SQL" button that appears at the bottom right of the page',
        pageButtonStep4: 'View the merged SQL result in the pop-up panel',
        popupModeHeading: '3. Popup Window Mode',
        popupModeText: 'The popup window is mainly used to quickly access the plugin\'s main functions, such as opening the standalone page and activating page buttons.',
        activatingButtonHeading: 'Activating Page Button Function',
        activatingButtonText: 'By default, the page button will not appear on any website. You need to manually activate the function for specific websites:',
        activatingButtonStep1: 'Navigate to the target website where you want to use the plugin',
        activatingButtonStep2: 'Click the plugin icon in the Chrome toolbar',
        activatingButtonStep3: 'In the popup window, click the "Inactive" status label next to "Inject SQL Extraction Button"',
        activatingButtonStep4: 'The status will change to "Active", and you will see the extraction button after refreshing the page',
        activatingButtonTip: 'You can also configure URL patterns in the settings page to batch activate multiple websites.',
        usingExtractorHeading: 'Using the Extraction Button',
        usingExtractorStep1: 'Find and select MyBatis log text on the webpage',
        usingExtractorStep2: 'Click the green "Extract MyBatis SQL" button at the bottom right of the page',
        usingExtractorStep3: 'View the merged SQL in the pop-up result panel',
        usingExtractorStep4: 'You can use the "Copy" button to copy the SQL to the clipboard',
        manualEntryHeading: 'Manual Entry Mode',
        manualEntryText: 'If you want to manually enter SQL templates and parameters, you can click the expand icon next to the extraction button:',
        manualEntryStep1: 'Click the "⋯" icon next to the extraction button',
        manualEntryStep2: 'Enter SQL template and parameters separately in the pop-up panel',
        manualEntryStep3: 'Click the "Parse" button to generate the result',
        inputFormatsHeading: 'Input Format Description',
        singleModeFormatHeading: 'Single-box Mode',
        singleModeFormatText: 'Supports logs with or without Preparing: and Parameters: prefixes:',
        dualModeFormatHeading: 'Dual-box Mode',
        dualModeFormatText1: 'SQL templates support the following two formats:',
        dualModeFormatText2: 'Parameters support the following two formats:',
        supportedTypesHeading: 'Supported Parameter Types',
        typeLong: 'Long',
        typeString: 'String',
        typeInteger: 'Integer',
        typeDouble: 'Double',
        typeFloat: 'Float',
        typeBoolean: 'Boolean',
        typeTimestamp: 'Timestamp',
        typeDate: 'Date',
        typeNull: 'NULL Values',
        helpFooter: 'MyBatis SQL Log Merger v1.0',
        noteLabel: 'Note:',
        tipLabel: 'Tip:'
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

    // 更新帮助页面元素
    const helpElements = [
        'helpHeading', 'introductionHeading', 'introductionText1', 'introductionText2',
        'usageModesHeading', 'standaloneModeHeading', 'standaloneStep1', 'standaloneStep2',
        'standaloneStep3', 'standaloneStep4', 'standaloneNote', 'pageButtonModeHeading',
        'pageButtonStep1', 'pageButtonStep2', 'pageButtonStep3', 'pageButtonStep4',
        'popupModeHeading', 'popupModeText', 'activatingButtonHeading', 'activatingButtonText',
        'activatingButtonStep1', 'activatingButtonStep2', 'activatingButtonStep3', 'activatingButtonStep4',
        'activatingButtonTip', 'usingExtractorHeading', 'usingExtractorStep1', 'usingExtractorStep2',
        'usingExtractorStep3', 'usingExtractorStep4', 'manualEntryHeading', 'manualEntryText',
        'manualEntryStep1', 'manualEntryStep2', 'manualEntryStep3', 'inputFormatsHeading',
        'singleModeFormatHeading', 'singleModeFormatText', 'dualModeFormatHeading', 'dualModeFormatText1',
        'dualModeFormatText2', 'supportedTypesHeading', 'typeLong', 'typeString', 'typeInteger',
        'typeDouble', 'typeFloat', 'typeBoolean', 'typeTimestamp', 'typeDate', 'typeNull',
        'helpFooter', 'noteLabel', 'tipLabel'
    ];

    helpElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = getText(id);
        }
    });

    // 更新返回按钮文本
    const backButtonElement = document.querySelector('.back-button[data-i18n]');
    if (backButtonElement) {
        const key = backButtonElement.getAttribute('data-i18n');
        backButtonElement.textContent = getText(key);
    }

    // 更新帮助页面标题
    const helpTitleElement = document.querySelector('title[data-i18n]');
    if (helpTitleElement) {
        const key = helpTitleElement.getAttribute('data-i18n');
        helpTitleElement.textContent = getText(key);
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