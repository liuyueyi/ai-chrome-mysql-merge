// 设置页面的JavaScript逻辑

// 多语言翻译文本
const translations = {
    'zh': {
        settingsTitle: '设置 - MyBatis SQL Log Merger',
        settingsHeading: '设置',
        languageSettingHeading: '语言设置',
        languageSelectLabel: '界面语言',
        chineseOption: '中文 (Chinese)',
        englishOption: 'English',
        webFilterHeading: '网页过滤设置',
        webFilterLabel: '在以下网页上显示"提取MyBatis SQL"按钮',
        newUrlPatternPlaceholder: '输入URL模式，如 *://*.example.com/*',
        addUrlPatternButton: '添加',
        sqlPlatformHeading: 'SQL查询平台设置',
        sqlPlatformLabel: 'SQL查询平台网址',
        sqlPlatformUrlPlaceholder: '输入SQL查询平台的完整URL，如 https://sql-query-platform.example.com',
        sqlPlatformDescription: '配置后可在独立页面和悬浮窗中快速导航至此平台',
        settingsFooter: 'MyBatis SQL Log Merger v1.0.2',
        removeButton: '删除',
        urlPatternExists: '该URL模式已存在',
        urlPatternAdded: 'URL模式已添加',
        validUrlPattern: '请输入有效的URL模式',
        saveFailed: '设置保存失败: ',
        saveSuccess: '设置已保存'
    },
    'en': {
        settingsTitle: 'Settings - MyBatis SQL Log Merger',
        settingsHeading: 'Settings',
        languageSettingHeading: 'Language Settings',
        languageSelectLabel: 'Interface Language',
        chineseOption: '中文 (Chinese)',
        englishOption: 'English',
        webFilterHeading: 'Web Filter Settings',
        webFilterLabel: 'Show "Extract MyBatis SQL" button on the following websites',
        newUrlPatternPlaceholder: 'Enter URL pattern, e.g. *://*.example.com/*',
        addUrlPatternButton: 'Add',
        sqlPlatformHeading: 'SQL Query Platform Settings',
        sqlPlatformLabel: 'SQL Query Platform URL',
        sqlPlatformUrlPlaceholder: 'Enter the full URL of the SQL query platform, e.g. https://sql-query-platform.example.com',
        sqlPlatformDescription: 'After configuration, you can quickly navigate to this platform in standalone page and floating window',
        settingsFooter: 'MyBatis SQL Log Merger v1.0.2',
        removeButton: 'Remove',
        urlPatternExists: 'URL pattern already exists',
        urlPatternAdded: 'URL pattern added',
        validUrlPattern: 'Please enter a valid URL pattern',
        saveFailed: 'Failed to save settings: ',
        saveSuccess: 'Settings saved'
    }
};

// 获取翻译文本
function getText(key, language) {
    return translations[language] && translations[language][key] ? translations[language][key] : key;
}

document.addEventListener('DOMContentLoaded', function () {
    const languageSelect = document.getElementById('languageSelect');
    const urlPatternsContainer = document.getElementById('urlPatternsContainer');
    const newUrlPatternInput = document.getElementById('newUrlPattern');
    const addUrlPatternButton = document.getElementById('addUrlPattern');
    const statusMessage = document.getElementById('statusMessage');
    const sqlQueryPlatformUrlInput = document.getElementById('sqlQueryPlatformUrl');

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

    // 加载设置
    function loadSettings() {
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

            // 确保sqlQueryPlatformUrl属性存在
            if (!settings.hasOwnProperty('sqlQueryPlatformUrl')) {
                settings.sqlQueryPlatformUrl = DEFAULT_SETTINGS.sqlQueryPlatformUrl;
            }

            // 设置语言选择
            languageSelect.value = settings.language;

            // 设置SQL查询平台URL
            sqlQueryPlatformUrlInput.value = settings.sqlQueryPlatformUrl;

            // 更新语言显示文本
            updateLanguageDisplay(settings.language);

            // 清空现有的URL模式列表
            urlPatternsContainer.innerHTML = '';

            // 添加URL模式复选框
            settings.urlPatterns.forEach(function (pattern) {
                addUrlPatternCheckbox(pattern, true);
            });

            // 如果没有模式，添加一个空的输入框供用户添加
            if (settings.urlPatterns.length === 0) {
                // 不再添加默认的<all_urls>，而是让用户自己添加需要的URL
            }
        });
    }

    // 更新语言显示文本
    function updateLanguageDisplay(language) {
        // 更新页面上的所有文本元素
        updatePageTexts(language);

        // 更新删除按钮文本
        updateRemoveButtonsText(language);

        // 更新添加按钮文本
        if (addUrlPatternButton) {
            addUrlPatternButton.textContent = getText('addUrlPatternButton', language);
        }

        // 更新输入框placeholder
        if (newUrlPatternInput) {
            newUrlPatternInput.placeholder = getText('newUrlPatternPlaceholder', language);
        }

        if (sqlQueryPlatformUrlInput) {
            sqlQueryPlatformUrlInput.placeholder = getText('sqlPlatformUrlPlaceholder', language);
        }
    }

    // 更新页面上的所有文本元素
    function updatePageTexts(language) {
        // 更新标题
        const titleElement = document.querySelector('title');
        if (titleElement) {
            titleElement.textContent = getText('settingsTitle', language);
        }

        // 更新所有带有data-i18n属性的元素
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = getText(key, language);
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        });

        // 更新带有data-i18n-placeholder属性的元素
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = getText(key, language);
        });

        // 更新选项文本
        const options = languageSelect.querySelectorAll('option');
        options.forEach(option => {
            const key = option.getAttribute('data-i18n');
            if (key) {
                option.textContent = getText(key, language);
            }
        });
    }

    // 添加URL模式复选框
    function addUrlPatternCheckbox(pattern, checked = true) {
        const div = document.createElement('div');
        div.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = pattern;
        checkbox.checked = checked;
        checkbox.id = 'pattern-' + btoa(encodeURIComponent(pattern)).replace(/[^a-zA-Z0-9]/g, ''); // 基于pattern创建唯一ID

        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = pattern;

        const removeButton = document.createElement('button');
        removeButton.textContent = getText('removeButton', languageSelect.value);
        removeButton.className = 'remove-btn';
        removeButton.style.marginLeft = '10px';
        removeButton.style.padding = '2px 5px';
        removeButton.style.fontSize = '12px';
        removeButton.onclick = function () {
            div.remove();
            // 删除后自动保存
            autoSaveSettings();
        };

        div.appendChild(checkbox);
        div.appendChild(label);
        div.appendChild(removeButton);

        urlPatternsContainer.appendChild(div);
    }

    // 添加新的URL模式
    function addNewUrlPattern() {
        const pattern = newUrlPatternInput.value.trim();
        if (pattern) {
            // 检查是否已存在
            const existingCheckboxes = urlPatternsContainer.querySelectorAll('input[type="checkbox"]');
            for (let i = 0; i < existingCheckboxes.length; i++) {
                if (existingCheckboxes[i].value === pattern) {
                    const message = getText('urlPatternExists', languageSelect.value);
                    showMessage(message, 'error');
                    return;
                }
            }

            addUrlPatternCheckbox(pattern, true);
            newUrlPatternInput.value = '';
            const message = getText('urlPatternAdded', languageSelect.value);
            showMessage(message, 'success');
        } else {
            const message = getText('validUrlPattern', languageSelect.value);
            showMessage(message, 'error');
        }
    }

    // 显示消息
    function showMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
        statusMessage.style.display = 'block';

        setTimeout(function () {
            statusMessage.style.display = 'none';
        }, 3000);
    }

    // 保存设置
    function saveSettings() {
        const language = languageSelect.value;
        const sqlQueryPlatformUrl = sqlQueryPlatformUrlInput.value.trim();

        // 收集所有URL模式（无论是否选中）
        const checkboxes = urlPatternsContainer.querySelectorAll('input[type="checkbox"]');
        const urlPatterns = [];
        checkboxes.forEach(function (checkbox) {
            urlPatterns.push(checkbox.value);
        });

        // 不再添加默认的<all_urls>，保持用户设置的模式

        const settings = {
            language: language,
            urlPatterns: urlPatterns,
            sqlQueryPlatformUrl: sqlQueryPlatformUrl
        };

        storage.set(settings, function (error) {
            if (error) {
                const message = getText('saveFailed', languageSelect.value) + error.message;
                showMessage(message, 'error');
            } else {
                const message = getText('saveSuccess', languageSelect.value);
                showMessage(message, 'success');

                // 发送消息通知其他部分设置已更新
                if (chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({
                        action: 'settingsUpdated',
                        settings: settings
                    });
                }

                // 更新语言显示文本
                updateLanguageDisplay(language);

                // 更新所有删除按钮的文本
                updateRemoveButtonsText(language);
            }
        });
    }

    // 更新所有删除按钮的文本
    function updateRemoveButtonsText(language) {
        const removeButtons = document.querySelectorAll('.remove-btn');
        const buttonText = getText('removeButton', language);
        removeButtons.forEach(button => {
            button.textContent = buttonText;
        });
    }

    // 自动保存设置
    function autoSaveSettings() {
        // 使用防抖机制，避免频繁保存
        clearTimeout(autoSaveSettings.timeout);
        autoSaveSettings.timeout = setTimeout(saveSettings, 500);
    }

    // 初始化防抖定时器
    autoSaveSettings.timeout = null;

    // 事件监听器
    addUrlPatternButton.addEventListener('click', function () {
        addNewUrlPattern();
        autoSaveSettings();
    });

    // 语言选择变化时自动保存
    languageSelect.addEventListener('change', function () {
        autoSaveSettings();
        // 立即更新界面文本
        updateLanguageDisplay(this.value);
    });

    // SQL查询平台URL变化时自动保存
    sqlQueryPlatformUrlInput.addEventListener('input', function () {
        autoSaveSettings();
    });

    // URL模式复选框变化时自动保存
    urlPatternsContainer.addEventListener('change', function (e) {
        if (e.target.type === 'checkbox') {
            autoSaveSettings();
        }
    });

    // 回车键添加URL模式
    newUrlPatternInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addNewUrlPattern();
            autoSaveSettings();
        }
    });

    // 加载设置
    loadSettings();
});