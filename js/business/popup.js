document.addEventListener('DOMContentLoaded', function () {
    const openStandaloneButton = document.getElementById('openStandalone');
    const toggleExtractionButton = document.getElementById('toggleExtraction');
    const openSettingsButton = document.getElementById('openSettings');
    const extractionStatus = document.getElementById('extractionStatus');
    const extractionText = document.getElementById('extractionText');

    // 多语言翻译文本
    const translations = {
        'zh': {
            appTitle: 'MyBatis SQL Log Merger',
            versionText: 'v1.0',
            mergeText: 'MyBatis SQL合并',
            injectExtractionText: '注入提取SQL按钮',
            cancelExtractionText: '取消提取SQL按钮',
            settingsText: '设置',
            activeStatus: '已激活',
            inactiveStatus: '未激活'
        },
        'en': {
            appTitle: 'MyBatis SQL Log Merger',
            versionText: 'v1.0',
            mergeText: 'MyBatis SQL Merge',
            injectExtractionText: 'Inject SQL Extraction Button',
            cancelExtractionText: 'Cancel SQL Extraction Button',
            settingsText: 'Settings',
            activeStatus: 'Active',
            inactiveStatus: 'Inactive'
        }
    };

    // 获取翻译文本
    function getText(key, language) {
        return translations[language] && translations[language][key] ? translations[language][key] : key;
    }

    // 默认设置
    const DEFAULT_SETTINGS = {
        language: 'zh',
        urlPatterns: [],  // 默认为空数组，而不是['<all_urls>']
        sqlQueryPlatformUrl: ''  // 新增SQL查询平台URL配置
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
                },
                set: function (items, callback) {
                    try {
                        for (let key in items) {
                            localStorage.setItem(key, JSON.stringify(items[key]));
                        }
                        if (callback) callback();
                    } catch (e) {
                        console.error('Failed to save to localStorage:', e);
                        if (callback) callback(e);
                    }
                }
            };

    // 更新页面文本
    function updatePageTexts(language, isActive = false) {
        // 更新所有带有data-i18n属性的元素
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            let text = getText(key, language);

            // 特殊处理提取按钮文本
            if (element.id === 'extractionText') {
                text = getText(isActive ? 'cancelExtractionText' : 'injectExtractionText', language);
            }

            element.textContent = text;
        });
    }

    // Add event listener for opening standalone page
    if (openStandaloneButton) {
        openStandaloneButton.addEventListener('click', function () {
            chrome.tabs.create({ url: chrome.runtime.getURL('standalone.html') });
        });
    }

    // Add event listener for toggling extraction button
    if (toggleExtractionButton) {
        toggleExtractionButton.addEventListener('click', function () {
            // 获取当前活动标签页
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length > 0) {
                    const currentTab = tabs[0];
                    const currentUrl = currentTab.url;

                    // 获取当前域名
                    try {
                        const urlObj = new URL(currentUrl);
                        const host = urlObj.origin; // 包含协议和域名

                        // 获取当前设置
                        storage.get(DEFAULT_SETTINGS, function (settings) {
                            // 确保settings是一个有效的对象
                            if (!settings || typeof settings !== 'object') {
                                settings = DEFAULT_SETTINGS;
                            }

                            // 确保language属性存在
                            if (!settings.hasOwnProperty('language')) {
                                settings.language = DEFAULT_SETTINGS.language;
                            }

                            // 确保urlPatterns是一个数组
                            if (!Array.isArray(settings.urlPatterns)) {
                                settings.urlPatterns = DEFAULT_SETTINGS.urlPatterns;
                            }

                            // 检查当前host是否已经在urlPatterns中
                            const index = settings.urlPatterns.indexOf(host);

                            if (index > -1) {
                                // 如果存在，则移除
                                settings.urlPatterns.splice(index, 1);
                                extractionStatus.textContent = getText('inactiveStatus', settings.language);
                                extractionStatus.className = 'status-indicator status-inactive';
                                // 更新按钮文本为"注入提取SQL按钮"
                                extractionText.textContent = getText('injectExtractionText', settings.language);
                            } else {
                                // 如果不存在，则添加
                                settings.urlPatterns.push(host);
                                extractionStatus.textContent = getText('activeStatus', settings.language);
                                extractionStatus.className = 'status-indicator status-active';
                                // 更新按钮文本为"取消提取SQL按钮"
                                extractionText.textContent = getText('cancelExtractionText', settings.language);
                            }

                            // 保存更新后的设置
                            storage.set(settings, function () {
                                // 发送消息通知content script设置已更新
                                if (chrome.tabs && chrome.tabs.sendMessage) {
                                    chrome.tabs.sendMessage(currentTab.id, {
                                        action: 'settingsUpdated',
                                        settings: settings
                                    });
                                }

                                // 发送消息通知其他部分设置已更新
                                if (chrome.runtime && chrome.runtime.sendMessage) {
                                    chrome.runtime.sendMessage({
                                        action: 'settingsUpdated',
                                        settings: settings
                                    });
                                }

                                // 自动刷新当前页面以显示注入的按钮
                                chrome.tabs.reload(currentTab.id);
                            });
                        });
                    } catch (e) {
                        console.error('Failed to parse URL:', currentUrl);
                    }
                }
            });
        });
    }

    // Add event listener for opening settings page
    if (openSettingsButton) {
        openSettingsButton.addEventListener('click', function () {
            chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
        });
    }

    // 检查当前页面是否已激活提取按钮功能
    function checkExtractionStatus() {
        // 获取当前活动标签页
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length > 0) {
                const currentTab = tabs[0];
                const currentUrl = currentTab.url;

                // 获取当前域名
                try {
                    const urlObj = new URL(currentUrl);
                    const host = urlObj.origin; // 包含协议和域名

                    // 获取当前设置
                    storage.get(DEFAULT_SETTINGS, function (settings) {
                        // 确保settings是一个有效的对象
                        if (!settings || typeof settings !== 'object') {
                            settings = DEFAULT_SETTINGS;
                        }

                        // 确保language属性存在
                        if (!settings.hasOwnProperty('language')) {
                            settings.language = DEFAULT_SETTINGS.language;
                        }

                        // 确保urlPatterns是一个数组
                        if (!Array.isArray(settings.urlPatterns)) {
                            settings.urlPatterns = DEFAULT_SETTINGS.urlPatterns;
                        }

                        // 检查当前host是否已经在urlPatterns中
                        const index = settings.urlPatterns.indexOf(host);
                        const isActive = index > -1;

                        if (isActive) {
                            extractionStatus.textContent = getText('activeStatus', settings.language);
                            extractionStatus.className = 'status-indicator status-active';
                        } else {
                            extractionStatus.textContent = getText('inactiveStatus', settings.language);
                            extractionStatus.className = 'status-indicator status-inactive';
                        }

                        // 更新页面文本
                        updatePageTexts(settings.language, isActive);
                    });
                } catch (e) {
                    console.error('Failed to parse URL:', currentUrl);
                }
            }
        });
    }

    // 初始化时检查提取按钮状态
    checkExtractionStatus();
});

// 保留原有的函数以便其他地方可能使用
function mergeSqlLog(logText) {
    // Split the log into lines
    const lines = logText.split('\n');

    let preparingLine = '';
    let parametersLine = '';

    // Find the Preparing and Parameters lines
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // 判断行类型只需要检查是否包含Preparing:或Parameters:
        if (line.includes('Preparing:')) {
            preparingLine = line;
        } else if (line.includes('Parameters:')) {
            parametersLine = line;
        }
    }

    if (!preparingLine) {
        throw new Error('Could not find "Preparing" line in the log');
    }

    // Extract SQL template
    const sqlTemplate = preparingLine.split('Preparing:')[1].trim();

    // Extract parameters if available
    let parameters = [];
    if (parametersLine) {
        const paramsStr = parametersLine.split('Parameters:')[1].trim();
        parameters = parseParameters(paramsStr);
    }

    // Merge SQL with parameters
    return mergeSqlWithParameters(sqlTemplate, parameters);
}

function parseParameters(paramsStr) {
    if (!paramsStr) return [];

    // Split parameters by comma, but be careful with commas inside parentheses
    const parameters = [];
    let currentParam = '';
    let parenCount = 0;

    for (let i = 0; i < paramsStr.length; i++) {
        const char = paramsStr[i];

        if (char === '(') {
            parenCount++;
            currentParam += char;
        } else if (char === ')') {
            parenCount--;
            currentParam += char;
        } else if (char === ',' && parenCount === 0) {
            parameters.push(currentParam.trim());
            currentParam = '';
        } else {
            currentParam += char;
        }
    }

    // Don't forget the last parameter
    if (currentParam.trim()) {
        parameters.push(currentParam.trim());
    }

    // Process each parameter to extract just the value
    return parameters.map(param => {
        // Match patterns like "123(Long)" or "abc(String)"
        // Handle different parameter formats:
        // - Numeric: "123(Long)" -> "123"
        // - String: "abc(String)" -> "abc"
        // - Null: "null(Timestamp)" -> null
        const match = param.match(/^(.+)\s*\([^)]+\)\s*$/);
        if (match) {
            let value = match[1].trim();
            // Handle null values
            if (value.toLowerCase() === 'null') {
                return 'NULL';
            }
            // If it's a string, remove quotes
            if (value.startsWith('"') && value.endsWith('"') && value.length > 1) {
                value = value.substring(1, value.length - 1);
            }
            return value;
        }
        // Fallback: return as is
        return param.trim();
    });
}

function mergeSqlWithParameters(sqlTemplate, parameters) {
    let resultSql = sqlTemplate;

    // Replace each ? with the corresponding parameter
    for (let i = 0; i < parameters.length; i++) {
        const param = parameters[i];
        // Check if the parameter is numeric
        if (isNumeric(param)) {
            resultSql = resultSql.replace('?', param);
        } else {
            // For string values, wrap in quotes
            resultSql = resultSql.replace('?', `'${param}'`);
        }
    }

    return resultSql;
}

function isNumeric(value) {
    // Check if the value is a number (integer or float)
    return !isNaN(value) && !isNaN(parseFloat(value));
}