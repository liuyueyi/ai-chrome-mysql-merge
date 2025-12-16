// Functions for standalone page
console.log('Standalone page script loaded');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded for standalone page');

    // Get elements
    const inputElement = document.getElementById('input');
    const sqlTemplateElement = document.getElementById('sqlTemplate');
    const sqlParametersElement = document.getElementById('sqlParameters');
    const resultElement = document.getElementById('result');
    const resultDoubleElement = document.getElementById('resultDouble');
    const highlightedResultElement = document.getElementById('highlighted-result');
    const highlightedResultDoubleElement = document.getElementById('highlighted-result-double');
    const codeElement = highlightedResultElement.querySelector('code');
    const codeDoubleElement = highlightedResultDoubleElement.querySelector('code');
    const processButton = document.getElementById('processBtn');
    const clearButton = document.getElementById('clearBtn');
    const formatButton = document.getElementById('formatBtn');
    const copyButton = document.getElementById('copyBtn');
    const toggleModeButton = document.getElementById('toggleModeBtn');
    const toggleModeButtonDouble = document.getElementById('toggleModeBtnDouble');
    const settingsButton = document.getElementById('settingsBtn'); // 新增设置按钮
    const navigateToSqlPlatformButton = document.getElementById('navigateToSqlPlatform'); // 新增导航按钮

    // Debug logging
    console.log('Settings button element:', settingsButton);
    console.log('Settings button ID:', settingsButton ? settingsButton.id : 'Not found');

    // Mode elements
    const singleMode = document.getElementById('singleMode');
    const doubleMode = document.getElementById('doubleMode');

    // State variables
    let currentSql = '';
    let currentMode = 'single'; // 'single' or 'double'

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

    // Load settings and initialize UI
    loadSettingsAndInitialize();

    // Add event listeners
    if (processButton) {
        processButton.addEventListener('click', processLog);
    }

    if (clearButton) {
        clearButton.addEventListener('click', clearAll);
    }

    if (formatButton) {
        formatButton.addEventListener('click', formatAndHighlightSql);
    }

    if (copyButton) {
        copyButton.addEventListener('click', copySql);
    }

    // Add event listeners for mode switching
    if (toggleModeButton) {
        toggleModeButton.addEventListener('click', toggleInputMode);
    }

    if (toggleModeButtonDouble) {
        toggleModeButtonDouble.addEventListener('click', toggleInputMode);
    }

    // 添加设置按钮点击事件
    if (settingsButton) {
        console.log('Adding click event listener to settings button');
        settingsButton.addEventListener('click', openSettingsPage);
    } else {
        console.error('Settings button not found in DOM');
    }

    // 添加导航按钮点击事件
    if (navigateToSqlPlatformButton) {
        navigateToSqlPlatformButton.addEventListener('click', navigateToSqlPlatform);
    }

    // 打开设置页面
    function openSettingsPage() {
        console.log('Attempting to open settings page...');
        console.log('Chrome object available:', !!chrome);

        // 检查chrome对象是否存在
        if (!chrome) {
            console.error('Chrome object not available');
            alert('无法打开设置页面。请在Chrome浏览器中作为扩展程序运行此页面。');
            return;
        }

        console.log('Chrome runtime available:', !!(chrome.runtime));
        console.log('Chrome tabs available:', !!(chrome.tabs));

        // 尝试使用chrome.runtime.getURL直接构造URL并打开新标签页
        if (chrome.runtime && chrome.runtime.getURL) {
            try {
                const settingsUrl = chrome.runtime.getURL('settings.html');
                console.log('Settings URL:', settingsUrl);

                // 使用tabs.create打开设置页面
                if (chrome.tabs) {
                    chrome.tabs.create({ url: settingsUrl }, function (tab) {
                        if (chrome.runtime.lastError) {
                            console.error('Error creating tab:', chrome.runtime.lastError);
                            // 如果tabs.create失败，尝试window.open作为备用
                            window.open(settingsUrl, '_blank');
                        } else {
                            console.log('Successfully opened settings tab:', tab);
                        }
                    });
                } else {
                    // 如果没有tabs API，直接使用window.open
                    window.open(settingsUrl, '_blank');
                }
                return;
            } catch (e) {
                console.error('Error opening settings page:', e);
            }
        }

        // 最后的备用方案
        alert('无法打开设置页面。请手动导航到扩展的设置页面。');
    }

    // 导航到SQL查询平台
    function navigateToSqlPlatform() {
        // 从i18n.js中获取DEFAULT_SETTINGS
        if (typeof DEFAULT_SETTINGS !== 'undefined') {
            storage.get(DEFAULT_SETTINGS, function (settings) {
                // 确保settings是一个有效的对象
                if (!settings || typeof settings !== 'object') {
                    settings = DEFAULT_SETTINGS;
                }

                // 确保sqlQueryPlatformUrl属性存在
                if (settings.hasOwnProperty('sqlQueryPlatformUrl') && settings.sqlQueryPlatformUrl) {
                    // 在新标签页中打开SQL查询平台
                    window.open(settings.sqlQueryPlatformUrl, '_blank');
                } else {
                    alert('请先在设置页面配置SQL查询平台网址。');
                }
            });
        } else {
            alert('无法获取设置信息。');
        }
    }

    // 加载设置并初始化界面
    function loadSettingsAndInitialize() {
        // 从i18n.js中获取DEFAULT_SETTINGS
        if (typeof DEFAULT_SETTINGS !== 'undefined') {
            storage.get(DEFAULT_SETTINGS, function (settings) {
                // 确保settings是一个有效的对象
                if (!settings || typeof settings !== 'object') {
                    settings = DEFAULT_SETTINGS;
                }

                // 确保language属性存在
                if (!settings.hasOwnProperty('language')) {
                    settings.language = DEFAULT_SETTINGS.language;
                }

                // 根据设置的语言更新界面
                updateUIText(settings.language);

                // 检查是否配置了SQL查询平台URL，如果配置了则显示导航按钮
                if (settings.hasOwnProperty('sqlQueryPlatformUrl') && settings.sqlQueryPlatformUrl) {
                    if (navigateToSqlPlatformButton) {
                        navigateToSqlPlatformButton.style.display = 'inline-block';
                        // 根据语言设置按钮文本
                        navigateToSqlPlatformButton.textContent = settings.language === 'zh' ?
                            '导航到SQL查询平台' : 'Navigate to SQL Platform';
                    }
                }
            });
        }
    }

    // 根据语言更新界面文本
    function updateUIText(language) {
        // 这里可以根据需要更新界面文本
        // 由于大部分文本已经在i18n.js中处理，这里可以保持简单
        console.log('Language set to:', language);

        // 更新按钮文本
        if (toggleModeButton) {
            toggleModeButton.textContent = language === 'zh' ?
                '切换到双框模式' : 'Switch to Dual-box Mode';
        }

        if (toggleModeButtonDouble) {
            toggleModeButtonDouble.textContent = language === 'zh' ?
                '切换到单框模式' : 'Switch to Single-box Mode';
        }

        // 更新导航按钮文本
        if (navigateToSqlPlatformButton) {
            navigateToSqlPlatformButton.textContent = language === 'zh' ?
                '导航到SQL查询平台' : 'Navigate to SQL Platform';
        }

        // 更新textarea的placeholder文本
        updatePlaceholderText(language);
    }

    // 更新textarea的placeholder文本
    function updatePlaceholderText(language) {
        if (inputElement) {
            inputElement.placeholder = language === 'zh' ?
                '请在此粘贴您的MyBatis日志...' :
                'Please paste your MyBatis logs here...';
        }

        if (sqlTemplateElement) {
            sqlTemplateElement.placeholder = language === 'zh' ?
                '请在此输入SQL模板，例如：\nPreparing: SELECT * FROM users WHERE id = ? AND name = ?\n或\nSELECT * FROM users WHERE id = ? AND name = ?' :
                'Please enter SQL template, e.g.:\nPreparing: SELECT * FROM users WHERE id = ? AND name = ?\nor\nSELECT * FROM users WHERE id = ? AND name = ?';
        }

        if (sqlParametersElement) {
            sqlParametersElement.placeholder = language === 'zh' ?
                '请在此输入参数，例如：\nParameters: 123(Long), John(String)\n或\n123(Long), John(String)' :
                'Please enter parameters, e.g.:\nParameters: 123(Long), John(String)\nor\n123(Long), John(String)';
        }
    }

    function processLog() {
        if (currentMode === 'single') {
            processSingleMode();
        } else {
            processDoubleMode();
        }
    }

    function processSingleMode() {
        const logText = inputElement.value;
        if (!logText.trim()) {
            resultElement.textContent = '请输入MyBatis日志内容。';
            return;
        }

        try {
            const sql = mergeSqlLog(logText);
            currentSql = sql;
            resultElement.textContent = sql;
            codeElement.textContent = sql;

            // 更新按钮状态
            formatButton.disabled = false;
            copyButton.disabled = false;

            // 隐藏高亮显示，显示普通文本
            resultElement.style.display = 'block';
            highlightedResultElement.style.display = 'none';
        } catch (error) {
            resultElement.textContent = '处理日志时出错: ' + error.message;
            currentSql = '';
            // 更新按钮状态
            formatButton.disabled = true;
            copyButton.disabled = true;
        }
    }

    function processDoubleMode() {
        const sqlTemplateInput = sqlTemplateElement.value;
        const sqlParametersInput = sqlParametersElement.value;

        if (!sqlTemplateInput.trim()) {
            resultDoubleElement.textContent = '请输入SQL模板。';
            return;
        }

        try {
            // 处理SQL模板（兼容带和不带Preparing:前缀的情况）
            let sqlTemplate = sqlTemplateInput.trim();
            if (sqlTemplate.includes('Preparing:')) {
                sqlTemplate = sqlTemplate.split('Preparing:')[1].trim();
            }

            // 解析参数（兼容带和不带Parameters:前缀的情况）
            let parameters = [];
            if (sqlParametersInput.trim()) {
                let paramsStr = sqlParametersInput.trim();
                if (paramsStr.includes('Parameters:')) {
                    paramsStr = paramsStr.split('Parameters:')[1].trim();
                }
                parameters = parseParameters(paramsStr);
            }

            // 合并SQL与参数
            const sql = mergeSqlWithParameters(sqlTemplate, parameters);
            currentSql = sql;
            resultDoubleElement.textContent = sql;
            codeDoubleElement.textContent = sql;

            // 更新按钮状态
            formatButton.disabled = false;
            copyButton.disabled = false;

            // 隐藏高亮显示，显示普通文本
            resultDoubleElement.style.display = 'block';
            highlightedResultDoubleElement.style.display = 'none';
        } catch (error) {
            resultDoubleElement.textContent = '处理SQL模板和参数时出错: ' + error.message;
            currentSql = '';
            // 更新按钮状态
            formatButton.disabled = true;
            copyButton.disabled = true;
        }
    }

    function clearAll() {
        // 清除所有输入和输出
        inputElement.value = '';
        sqlTemplateElement.value = '';
        sqlParametersElement.value = '';
        resultElement.textContent = '';
        resultDoubleElement.textContent = '';
        codeElement.textContent = '';
        codeDoubleElement.textContent = '';
        currentSql = '';

        // 更新按钮状态
        formatButton.disabled = true;
        copyButton.disabled = true;

        // 隐藏高亮显示，显示普通文本
        resultElement.style.display = 'block';
        highlightedResultElement.style.display = 'none';
        resultDoubleElement.style.display = 'block';
        highlightedResultDoubleElement.style.display = 'none';
    }

    // 合并格式化和高亮功能
    function formatAndHighlightSql() {
        if (!currentSql.trim()) {
            alert('请先处理SQL日志');
            return;
        }

        try {
            // 使用sql-formatter库格式化SQL
            const formattedSql = sqlFormatter.format(currentSql);
            currentSql = formattedSql;

            // 应用语法高亮
            const highlightedSql = simpleSqlHighlight(formattedSql);

            // 根据当前模式显示结果
            if (currentMode === 'single') {
                // 显示高亮结果
                resultElement.style.display = 'none';
                highlightedResultElement.style.display = 'block';
                codeElement.innerHTML = highlightedSql;
            } else {
                // 显示高亮结果
                resultDoubleElement.style.display = 'none';
                highlightedResultDoubleElement.style.display = 'block';
                codeDoubleElement.innerHTML = highlightedSql;
            }
        } catch (error) {
            alert('格式化和高亮SQL时出错: ' + error.message);
        }
    }

    function copySql() {
        if (!currentSql.trim()) {
            alert('没有可复制的SQL');
            return;
        }

        try {
            navigator.clipboard.writeText(currentSql).then(function () {
                // 显示复制成功的提示
                const originalText = copyButton.textContent;
                copyButton.textContent = '已复制!';
                setTimeout(function () {
                    copyButton.textContent = originalText;
                }, 2000);
            }).catch(function (error) {
                alert('复制失败: ' + error);
            });
        } catch (error) {
            alert('复制失败: ' + error.message);
        }
    }

    // 模式切换功能
    function toggleInputMode() {
        if (currentMode === 'single') {
            // 切换到双框模式
            singleMode.style.display = 'none';
            doubleMode.style.display = 'block';
            currentMode = 'double';
        } else {
            // 切换到单框模式
            doubleMode.style.display = 'none';
            singleMode.style.display = 'block';
            currentMode = 'single';
        }

        // 清除当前SQL
        currentSql = '';

        // 更新按钮状态
        formatButton.disabled = true;
        copyButton.disabled = true;

        // 更新模式切换按钮文本
        updateModeToggleButtonText();
    }

    // 更新模式切换按钮文本
    function updateModeToggleButtonText() {
        // 获取当前语言设置
        const language = typeof currentLanguage !== 'undefined' ? currentLanguage : 'zh';

        if (toggleModeButton) {
            toggleModeButton.textContent = language === 'zh' ?
                '切换到双框模式' : 'Switch to Dual-box Mode';
        }

        if (toggleModeButtonDouble) {
            toggleModeButtonDouble.textContent = language === 'zh' ?
                '切换到单框模式' : 'Switch to Single-box Mode';
        }
    }
});



// Reuse the SQL merging functions from popup.js
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

// Simple SQL syntax highlighter
function simpleSqlHighlight(sql) {
    if (!sql) return '';

    // Escape HTML
    let highlighted = sql
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Highlight SQL keywords
    const keywords = [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE',
        'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'OUTER JOIN',
        'ON', 'AND', 'OR', 'NOT', 'IN', 'NOT IN', 'LIKE', 'BETWEEN',
        'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
        'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW',
        'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'CONSTRAINT',
        'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
        'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT'
    ];

    // Highlight functions
    const functions = [
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'NOW', 'DATE', 'TIME',
        'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
        'UPPER', 'LOWER', 'SUBSTRING', 'CONCAT', 'LENGTH',
        'IFNULL', 'COALESCE', 'CAST', 'CONVERT'
    ];

    // Apply keyword highlighting
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
        highlighted = highlighted.replace(regex, '<span class="sql-keyword">$1</span>');
    });

    // Apply function highlighting
    functions.forEach(func => {
        const regex = new RegExp(`\\b(${func})\\b`, 'gi');
        highlighted = highlighted.replace(regex, '<span class="sql-function">$1</span>');
    });

    // Highlight strings (values in quotes)
    highlighted = highlighted.replace(/('[^']*')/g, '<span class="sql-string">$1</span>');

    // Highlight numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="sql-number">$1</span>');

    // Highlight comments
    highlighted = highlighted.replace(/(--.*)/g, '<span class="sql-comment">$1</span>');
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="sql-comment">$1</span>');

    return highlighted;
}