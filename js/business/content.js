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
            }
        };

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "processLog") {
        try {
            const sql = mergeSqlLog(request.logText);
            sendResponse({ success: true, sql: sql });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
});

// Listen for settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "settingsUpdated") {
        // 重新检查是否应该显示按钮
        checkShouldShowButton();
    }
});

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

// Check if button should be shown based on settings
function checkShouldShowButton() {
    // Get current URL
    const currentUrl = window.location.href;

    // Load settings and check if button should be shown
    storage.get(DEFAULT_SETTINGS, function (settings) {
        // 确保settings是一个有效的对象
        if (!settings || typeof settings !== 'object') {
            settings = DEFAULT_SETTINGS;
        }

        // 确保urlPatterns是一个数组
        if (!Array.isArray(settings.urlPatterns)) {
            settings.urlPatterns = DEFAULT_SETTINGS.urlPatterns;
        }

        // 调试信息
        console.log('Current URL:', currentUrl);
        console.log('Settings URL Patterns:', settings.urlPatterns);

        let shouldShow = false;

        // Check if current URL matches any of the patterns
        for (let i = 0; i < settings.urlPatterns.length; i++) {
            const pattern = settings.urlPatterns[i];

            // Handle special case <all_urls>
            if (pattern === '<all_urls>') {
                shouldShow = true;
                break;
            }

            // Convert pattern to regex
            try {
                // 如果pattern是完整的URL（以http或https开头），则检查是否匹配
                if (pattern.startsWith('http://') || pattern.startsWith('https://')) {
                    // 检查当前URL是否以pattern开头
                    if (currentUrl.startsWith(pattern)) {
                        shouldShow = true;
                        break;
                    }
                } else {
                    // 处理通配符模式
                    // Escape special regex characters except * and ?
                    let regexPattern = pattern.replace(/[.+^${}()|[\]\\]/g, '\$&');
                    // Convert * to .* and ? to .
                    regexPattern = regexPattern.replace(/\*/g, '.*').replace(/\?/g, '.');

                    const regex = new RegExp('^' + regexPattern + '$');

                    // Check if current URL matches pattern
                    if (regex.test(currentUrl)) {
                        shouldShow = true;
                        break;
                    }

                    // Also check protocol + hostname + pathname combination
                    const urlObj = new URL(currentUrl);
                    const simplifiedUrl = urlObj.protocol + '//' + urlObj.hostname + urlObj.pathname;
                    if (regex.test(simplifiedUrl)) {
                        shouldShow = true;
                        break;
                    }
                }
            } catch (e) {
                console.warn('Invalid URL pattern:', pattern);
            }
        }

        // 调试信息
        console.log('Should show button:', shouldShow);

        // Show or hide button based on settings
        const existingButtonGroup = document.getElementById('mybatis-sql-merger-toolbar');
        if (shouldShow) {
            if (!existingButtonGroup) {
                addButtonGroupToPage(settings.language);
            } else {
                // Update button text based on language setting
                updateButtonText(existingButtonGroup, settings.language);
            }
        } else {
            if (existingButtonGroup) {
                existingButtonGroup.remove();
            }
        }
    });
}

// Update button text based on language
function updateButtonText(buttonGroup, language) {
    const extractButton = buttonGroup.querySelector('#mybatis-sql-merger-extract-btn');
    const expandButton = buttonGroup.querySelector('#mybatis-sql-merger-expand-btn');

    if (extractButton) {
        extractButton.textContent = language === 'zh' ? '提取SQL' : 'Merge SQL';
    }

    // 更新展开按钮的图标状态
    updateExpandButtonIcon(expandButton, language);
}

// Update expand button icon based on panel visibility
function updateExpandButtonIcon(expandButton, language) {
    if (expandButton) {
        const panel = document.getElementById('mybatis-sql-merger-panel');
        if (panel) {
            // Panel is visible, show close icon
            expandButton.innerHTML = '✕'; // Close icon
            expandButton.title = language === 'zh' ? '隐藏面板' : 'Hide Panel';
        } else {
            // Panel is hidden, show expand icon
            expandButton.innerHTML = '⋯'; // Expand icon (using horizontal ellipsis)
            expandButton.title = language === 'zh' ? '展开面板' : 'Expand Panel';
        }
    }
}

// Add a button group to the page to process selected text
function addButtonGroupToPage(language = 'zh') {
    // Create a toolbar container for the button group
    const toolbar = document.createElement('div');
    toolbar.id = 'mybatis-sql-merger-toolbar';
    toolbar.style.position = 'fixed';
    toolbar.style.bottom = '20px';
    toolbar.style.right = '20px';
    toolbar.style.zIndex = '10000';
    toolbar.style.display = 'flex';
    toolbar.style.alignItems = 'center';
    toolbar.style.backgroundColor = 'rgb(76, 175, 80)';
    toolbar.style.borderRadius = '4px';
    toolbar.style.padding = '4px';
    toolbar.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

    // 添加折叠状态标志
    toolbar.isCollapsed = false;

    // Create the extract button
    const extractButton = document.createElement('button');
    extractButton.id = 'mybatis-sql-merger-extract-btn';
    extractButton.textContent = language === 'zh' ? '提取SQL' : 'Merge SQL';
    extractButton.style.padding = '8px 12px';
    extractButton.style.backgroundColor = 'transparent';
    extractButton.style.color = 'white';
    extractButton.style.border = 'none';
    extractButton.style.borderRadius = '2px';
    extractButton.style.cursor = 'pointer';
    extractButton.style.fontSize = '13px';
    extractButton.style.fontWeight = '500';
    extractButton.style.transition = 'background-color 0.2s';

    // Add hover effect for extract button
    extractButton.addEventListener('mouseenter', function () {
        this.style.backgroundColor = 'rgb(17, 150, 21)';
    });

    extractButton.addEventListener('mouseleave', function () {
        this.style.backgroundColor = 'transparent';
    });

    // Add click event to process selected text and show result in floating panel
    extractButton.addEventListener('click', function () {
        const selection = window.getSelection();
        if (selection.toString().trim()) {
            try {
                const sql = mergeSqlLog(selection.toString());
                // Show result in floating panel instead of alert
                showFloatingPanelWithResult(sql, language);
                // Update the expand button icon
                updateExpandButtonIcon(toolbar.querySelector('#mybatis-sql-merger-expand-btn'), language);
            } catch (error) {
                // Show error in floating panel
                showFloatingPanelWithError(error.message, language);
                // Update the expand button icon
                updateExpandButtonIcon(toolbar.querySelector('#mybatis-sql-merger-expand-btn'), language);
            }
        } else {
            // Show message in floating panel
            showFloatingPanelWithMessage(language === 'zh' ? '请先选择MyBatis日志文本' : 'Please select MyBatis log text first', language);
            // Update the expand button icon
            updateExpandButtonIcon(toolbar.querySelector('#mybatis-sql-merger-expand-btn'), language);
        }
    });

    // Create the collapse button with icon
    const collapseButton = document.createElement('button');
    collapseButton.id = 'mybatis-sql-merger-collapse-btn';
    collapseButton.innerHTML = '»'; // Collapse icon
    collapseButton.title = language === 'zh' ? '折叠按钮组' : 'Collapse Toolbar';
    collapseButton.style.padding = '8px 6px';
    collapseButton.style.backgroundColor = 'transparent';
    collapseButton.style.color = 'white';
    collapseButton.style.border = 'none';
    collapseButton.style.borderRadius = '2px';
    collapseButton.style.cursor = 'pointer';
    collapseButton.style.fontSize = '14px';
    collapseButton.style.fontWeight = '500';
    collapseButton.style.marginLeft = '2px';
    collapseButton.style.transition = 'background-color 0.2s';
    collapseButton.style.minWidth = 'auto';

    // Add click event to toggle collapse state
    collapseButton.addEventListener('click', function () {
        const toolbar = document.getElementById('mybatis-sql-merger-toolbar');
        if (toolbar) {
            if (!toolbar.isCollapsed) {
                // 折叠状态：只显示折叠按钮，吸附在右边框
                toolbar.isCollapsed = true;
                toolbar.style.right = '0px';
                toolbar.style.bottom = '50%';
                toolbar.style.transform = 'translateY(50%)';
                toolbar.style.flexDirection = 'column';
                toolbar.style.padding = '2px';

                // 隐藏其他按钮
                extractButton.style.display = 'none';
                expandButton.style.display = 'none';

                // 更改折叠按钮图标和提示
                collapseButton.innerHTML = '«';
                collapseButton.title = language === 'zh' ? '展开按钮组' : 'Expand Toolbar';
            } else {
                // 展开状态：恢复正常布局
                toolbar.isCollapsed = false;
                toolbar.style.right = '20px';
                toolbar.style.bottom = '20px';
                toolbar.style.transform = 'none';
                toolbar.style.flexDirection = 'row';
                toolbar.style.padding = '4px';

                // 显示其他按钮
                extractButton.style.display = '';
                expandButton.style.display = '';

                // 更改折叠按钮图标和提示
                collapseButton.innerHTML = '»';
                collapseButton.title = language === 'zh' ? '折叠按钮组' : 'Collapse Toolbar';

                // 不再需要恢复默认的虚化状态
            }
        }
    });

    // Add hover effect for collapse button
    collapseButton.addEventListener('mouseenter', function () {
        this.style.backgroundColor = 'rgb(17, 150, 21)';
    });

    collapseButton.addEventListener('mouseleave', function () {
        this.style.backgroundColor = 'transparent';
    });

    // Create the expand button with icon
    const expandButton = document.createElement('button');
    expandButton.id = 'mybatis-sql-merger-expand-btn';
    expandButton.innerHTML = '⋯'; // Expand icon (using horizontal ellipsis)
    expandButton.title = language === 'zh' ? '展开面板' : 'Expand Panel';
    expandButton.style.padding = '8px 10px';
    expandButton.style.backgroundColor = 'transparent';
    expandButton.style.color = 'white';
    expandButton.style.border = 'none';
    expandButton.style.borderRadius = '2px';
    expandButton.style.cursor = 'pointer';
    expandButton.style.fontSize = '16px';
    expandButton.style.fontWeight = '500';
    expandButton.style.marginLeft = '2px';
    expandButton.style.transition = 'background-color 0.2s';
    expandButton.style.minWidth = 'auto';

    // Add hover effect for expand button
    expandButton.addEventListener('mouseenter', function () {
        this.style.backgroundColor = 'rgb(17, 150, 21)';
    });

    expandButton.addEventListener('mouseleave', function () {
        this.style.backgroundColor = 'transparent';
    });

    // Add click event to toggle the floating panel
    expandButton.addEventListener('click', function () {
        const panel = document.getElementById('mybatis-sql-merger-panel');
        if (panel) {
            // Panel is visible, remove it
            panel.remove();
            // Update icon to expand
            this.innerHTML = '⋯';
            this.title = language === 'zh' ? '展开面板' : 'Expand Panel';
        } else {
            // Panel is hidden, show it with inputs
            showFloatingPanelWithInputs(language);
            // Update icon to close
            this.innerHTML = '✕';
            this.title = language === 'zh' ? '隐藏面板' : 'Hide Panel';
        }
    });

    // Add mouse enter event to activate toolbar
    toolbar.addEventListener('mouseenter', function () {
        // 在折叠状态下，临时显示其他按钮但不改变折叠状态
        if (this.isCollapsed) {
            extractButton.style.display = '';
            expandButton.style.display = '';
            // 增加按钮组宽度以容纳所有按钮
            this.style.width = 'auto';
        }
    });

    // Add mouse leave event to deactivate toolbar
    toolbar.addEventListener('mouseleave', function () {
        // 如果是折叠状态，恢复原来的样式
        if (this.isCollapsed) {
            extractButton.style.display = 'none';
            expandButton.style.display = 'none';
            this.style.width = '';
        }
    });

    // Add selection change event to update toolbar based on selection
    document.addEventListener('selectionchange', function () {
        // 不再需要根据选择状态改变工具栏的外观
    });

    // Add buttons to the toolbar
    toolbar.appendChild(extractButton);
    toolbar.appendChild(expandButton);
    toolbar.appendChild(collapseButton);

    // Add toolbar to the page
    document.body.appendChild(toolbar);
}

// Show the floating panel with extracted SQL result
function showFloatingPanelWithResult(sql, language = 'zh') {
    // Remove existing panel if it exists
    const existingPanel = document.getElementById('mybatis-sql-merger-panel');
    if (existingPanel) {
        existingPanel.remove();
    }

    // Create the floating panel
    const panel = document.createElement('div');
    panel.id = 'mybatis-sql-merger-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '100px';
    panel.style.right = '20px';
    panel.style.zIndex = '10001';
    panel.style.width = '400px';
    panel.style.backgroundColor = 'white';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    panel.style.padding = '20px';
    panel.style.fontFamily = 'Arial, sans-serif';

    // Create panel header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    header.style.borderBottom = '1px solid #eee';
    header.style.paddingBottom = '10px';

    const title = document.createElement('h3');
    title.textContent = language === 'zh' ? '提取的SQL结果' : 'Extracted SQL Result';
    title.style.margin = '0';
    title.style.color = '#333';

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';

    // Create help button
    const helpButton = document.createElement('button');
    helpButton.innerHTML = '?';
    helpButton.style.background = 'none';
    helpButton.style.border = 'none';
    helpButton.style.fontSize = '18px';
    helpButton.style.cursor = 'pointer';
    helpButton.style.color = '#999';
    helpButton.style.padding = '0';
    helpButton.style.width = '30px';
    helpButton.style.height = '30px';
    helpButton.style.display = 'flex';
    helpButton.style.alignItems = 'center';
    helpButton.style.justifyContent = 'center';
    helpButton.style.marginRight = '10px';
    helpButton.title = language === 'zh' ? '帮助' : 'Help';

    helpButton.addEventListener('click', function () {
        // Open help.html in a new tab
        chrome.runtime.getURL ?
            window.open(chrome.runtime.getURL('help.html'), '_blank') :
            window.open('help.html', '_blank');
    });

    // Create mybatis icon button
    const mybatisButton = document.createElement('button');
    mybatisButton.innerHTML = 'M';
    mybatisButton.style.background = 'none';
    mybatisButton.style.border = 'none';
    mybatisButton.style.fontSize = '18px';
    mybatisButton.style.cursor = 'pointer';
    mybatisButton.style.color = '#999';
    mybatisButton.style.padding = '0';
    mybatisButton.style.width = '30px';
    mybatisButton.style.height = '30px';
    mybatisButton.style.display = 'flex';
    mybatisButton.style.alignItems = 'center';
    mybatisButton.style.justifyContent = 'center';
    mybatisButton.style.marginRight = '10px';
    mybatisButton.title = language === 'zh' ? 'MyBatis合成器' : 'MyBatis Composer';

    mybatisButton.addEventListener('click', function () {
        // Open standalone.html in a new tab
        chrome.runtime.getURL ?
            window.open(chrome.runtime.getURL('standalone.html'), '_blank') :
            window.open('standalone.html', '_blank');
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#999';
    closeButton.style.padding = '0';
    closeButton.style.width = '30px';
    closeButton.style.height = '30px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';

    closeButton.addEventListener('click', function () {
        panel.remove();
        // Update the expand button icon
        const expandButton = document.querySelector('#mybatis-sql-merger-expand-btn');
        if (expandButton) {
            expandButton.innerHTML = '⋯';
            expandButton.title = language === 'zh' ? '展开面板' : 'Expand Panel';
        }
    });

    // Append buttons to container
    buttonContainer.appendChild(helpButton);
    buttonContainer.appendChild(mybatisButton);
    buttonContainer.appendChild(closeButton);

    header.appendChild(title);
    header.appendChild(buttonContainer);

    // Create result display - 固定高度并支持滚动
    const resultLabel = document.createElement('label');
    resultLabel.textContent = language === 'zh' ? '结果:' : 'Result:';
    resultLabel.style.display = 'block';
    resultLabel.style.margin = '15px 0 5px';
    resultLabel.style.fontWeight = 'bold';
    resultLabel.style.color = '#555';

    const resultDisplay = document.createElement('div');
    resultDisplay.id = 'mybatis-sql-result';
    resultDisplay.style.width = '100%';
    resultDisplay.style.height = '120px'; // 固定高度
    resultDisplay.style.maxHeight = '120px'; // 最大高度
    resultDisplay.style.padding = '10px';
    resultDisplay.style.border = '1px solid #ddd';
    resultDisplay.style.borderRadius = '4px';
    resultDisplay.style.backgroundColor = '#f8f8f8';
    resultDisplay.style.fontFamily = 'monospace';
    resultDisplay.style.fontSize = '14px';
    resultDisplay.style.whiteSpace = 'pre-wrap';
    resultDisplay.style.overflow = 'auto'; // 支持滚动
    resultDisplay.style.overflowX = 'auto';
    resultDisplay.style.overflowY = 'auto';
    resultDisplay.style.color = '#333';
    resultDisplay.textContent = sql;

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '10px';
    buttonsContainer.style.marginTop = '15px';

    // Navigation button to SQL platform
    const navigateButton = document.createElement('button');
    navigateButton.id = 'navigate-to-sql-platform';
    navigateButton.textContent = language === 'zh' ? '复制并导航到SQL查询平台' : 'Copy & To SQL Platform';
    navigateButton.style.flex = '2';
    navigateButton.style.padding = '10px';
    navigateButton.style.backgroundColor = '#9c27b0';
    navigateButton.style.color = 'white';
    navigateButton.style.border = 'none';
    navigateButton.style.borderRadius = '4px';
    navigateButton.style.cursor = 'pointer';
    navigateButton.style.fontSize = '14px';

    navigateButton.addEventListener('mouseenter', function () {
        this.style.backgroundColor = '#7b1fa2';
    });

    navigateButton.addEventListener('mouseleave', function () {
        this.style.backgroundColor = '#9c27b0';
    });

    navigateButton.addEventListener('click', function () {
        // 获取SQL查询平台URL并导航
        storage.get(DEFAULT_SETTINGS, function (settings) {
            // 检查结果区域是否有SQL内容
            const sqlResult = resultDisplay.textContent.trim();

            if (sqlResult) {
                // 如果有SQL结果，先复制结果
                try {
                    navigator.clipboard.writeText(sqlResult).then(function () {
                        // 复制成功后再导航
                        if (settings.hasOwnProperty('sqlQueryPlatformUrl') && settings.sqlQueryPlatformUrl) {
                            window.open(settings.sqlQueryPlatformUrl, '_blank');
                        } else {
                            alert(language === 'zh' ? '请先在设置页面配置SQL查询平台网址。' : 'Please configure the SQL query platform URL in the settings page first.');
                        }
                    }).catch(function (error) {
                        alert(language === 'zh' ? '复制失败: ' + error : 'Copy failed: ' + error);
                    });
                } catch (error) {
                    alert(language === 'zh' ? '复制失败: ' + error.message : 'Copy failed: ' + error.message);
                }
            } else {
                // 如果没有SQL结果，直接导航
                if (settings.hasOwnProperty('sqlQueryPlatformUrl') && settings.sqlQueryPlatformUrl) {
                    window.open(settings.sqlQueryPlatformUrl, '_blank');
                } else {
                    alert(language === 'zh' ? '请先在设置页面配置SQL查询平台网址。' : 'Please configure the SQL query platform URL in the settings page first.');
                }
            }
        });
    });

    // Copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = language === 'zh' ? '复制' : 'Copy';
    copyButton.style.flex = '1';
    copyButton.style.padding = '10px';
    copyButton.style.backgroundColor = '#2196F3';
    copyButton.style.color = 'white';
    copyButton.style.border = 'none';
    copyButton.style.borderRadius = '4px';
    copyButton.style.cursor = 'pointer';
    copyButton.style.fontSize = '14px';

    copyButton.addEventListener('mouseenter', function () {
        this.style.backgroundColor = '#0b7dda';
    });

    copyButton.addEventListener('mouseleave', function () {
        this.style.backgroundColor = '#2196F3';
    });

    copyButton.addEventListener('click', function () {
        const resultText = resultDisplay.textContent;
        if (!resultText) {
            alert(language === 'zh' ? '没有可复制的内容' : 'No content to copy');
            return;
        }

        try {
            navigator.clipboard.writeText(resultText).then(function () {
                const originalText = copyButton.textContent;
                copyButton.textContent = language === 'zh' ? '已复制!' : 'Copied!';
                setTimeout(function () {
                    copyButton.textContent = originalText;
                }, 2000);
            }).catch(function (error) {
                alert(language === 'zh' ? '复制失败: ' + error : 'Copy failed: ' + error);
            });
        } catch (error) {
            alert(language === 'zh' ? '复制失败: ' + error.message : 'Copy failed: ' + error.message);
        }
    });

    // Assemble the panel
    panel.appendChild(header);
    panel.appendChild(resultLabel);
    panel.appendChild(resultDisplay);

    buttonsContainer.appendChild(copyButton);
    buttonsContainer.appendChild(navigateButton);
    panel.appendChild(buttonsContainer);

    // Add panel to the page
    document.body.appendChild(panel);
}

// Show the floating panel with error message
function showFloatingPanelWithError(errorMessage, language = 'zh') {
    showFloatingPanelWithMessage(language === 'zh' ? '处理日志时出错: ' + errorMessage : 'Error processing log: ' + errorMessage, language);
}

// Show the floating panel with a message
function showFloatingPanelWithMessage(message, language = 'zh') {
    // Remove existing panel if it exists
    const existingPanel = document.getElementById('mybatis-sql-merger-panel');
    if (existingPanel) {
        existingPanel.remove();
    }

    // Create the floating panel
    const panel = document.createElement('div');
    panel.id = 'mybatis-sql-merger-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '100px';
    panel.style.right = '20px';
    panel.style.zIndex = '10001';
    panel.style.width = '400px';
    panel.style.backgroundColor = 'white';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    panel.style.padding = '20px';
    panel.style.fontFamily = 'Arial, sans-serif';

    // Create panel header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    header.style.borderBottom = '1px solid #eee';
    header.style.paddingBottom = '10px';

    const title = document.createElement('h3');
    title.textContent = language === 'zh' ? '提示信息' : 'Message';
    title.style.margin = '0';
    title.style.color = '#333';

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';

    // Create help button
    const helpButton = document.createElement('button');
    helpButton.innerHTML = '?';
    helpButton.style.background = 'none';
    helpButton.style.border = 'none';
    helpButton.style.fontSize = '18px';
    helpButton.style.cursor = 'pointer';
    helpButton.style.color = '#999';
    helpButton.style.padding = '0';
    helpButton.style.width = '30px';
    helpButton.style.height = '30px';
    helpButton.style.display = 'flex';
    helpButton.style.alignItems = 'center';
    helpButton.style.justifyContent = 'center';
    helpButton.style.marginRight = '10px';
    helpButton.title = language === 'zh' ? '帮助' : 'Help';

    helpButton.addEventListener('click', function () {
        // Open help.html in a new tab
        chrome.runtime.getURL ?
            window.open(chrome.runtime.getURL('help.html'), '_blank') :
            window.open('help.html', '_blank');
    });

    // Create mybatis icon button
    const mybatisButton = document.createElement('button');
    mybatisButton.innerHTML = 'M';
    mybatisButton.style.background = 'none';
    mybatisButton.style.border = 'none';
    mybatisButton.style.fontSize = '18px';
    mybatisButton.style.cursor = 'pointer';
    mybatisButton.style.color = '#999';
    mybatisButton.style.padding = '0';
    mybatisButton.style.width = '30px';
    mybatisButton.style.height = '30px';
    mybatisButton.style.display = 'flex';
    mybatisButton.style.alignItems = 'center';
    mybatisButton.style.justifyContent = 'center';
    mybatisButton.style.marginRight = '10px';
    mybatisButton.title = language === 'zh' ? 'MyBatis合成器' : 'MyBatis Composer';

    mybatisButton.addEventListener('click', function () {
        // Open standalone.html in a new tab
        chrome.runtime.getURL ?
            window.open(chrome.runtime.getURL('standalone.html'), '_blank') :
            window.open('standalone.html', '_blank');
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#999';
    closeButton.style.padding = '0';
    closeButton.style.width = '30px';
    closeButton.style.height = '30px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';

    closeButton.addEventListener('click', function () {
        panel.remove();
        // Update the expand button icon
        const expandButton = document.querySelector('#mybatis-sql-merger-expand-btn');
        if (expandButton) {
            expandButton.innerHTML = '⋯';
            expandButton.title = language === 'zh' ? '展开面板' : 'Expand Panel';
        }
    });

    // Append buttons to container
    buttonContainer.appendChild(helpButton);
    buttonContainer.appendChild(mybatisButton);
    buttonContainer.appendChild(closeButton);

    header.appendChild(title);
    header.appendChild(buttonContainer);

    // Create message display
    const messageDisplay = document.createElement('div');
    messageDisplay.style.width = '100%';
    messageDisplay.style.padding = '10px';
    messageDisplay.style.border = '1px solid #ddd';
    messageDisplay.style.borderRadius = '4px';
    messageDisplay.style.backgroundColor = '#f8f8f8';
    messageDisplay.style.fontFamily = 'Arial, sans-serif';
    messageDisplay.style.fontSize = '14px';
    messageDisplay.style.whiteSpace = 'pre-wrap';
    messageDisplay.textContent = message;

    // Assemble the panel
    panel.appendChild(header);
    panel.appendChild(messageDisplay);

    // Add panel to the page
    document.body.appendChild(panel);
}

// Show the floating panel with input fields for manual entry
function showFloatingPanelWithInputs(language = 'zh') {
    // Remove existing panel if it exists
    const existingPanel = document.getElementById('mybatis-sql-merger-panel');
    if (existingPanel) {
        existingPanel.remove();
    }

    // Create the floating panel
    const panel = document.createElement('div');
    panel.id = 'mybatis-sql-merger-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '100px';
    panel.style.right = '20px';
    panel.style.zIndex = '10001';
    panel.style.width = '400px';
    panel.style.backgroundColor = 'white';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    panel.style.padding = '20px';
    panel.style.fontFamily = 'Arial, sans-serif';

    // Create panel header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    header.style.borderBottom = '1px solid #eee';
    header.style.paddingBottom = '10px';

    const title = document.createElement('h3');
    title.textContent = language === 'zh' ? 'MyBatis SQL 合成器' : 'MyBatis SQL Composer';
    title.style.margin = '0';
    title.style.color = '#333';

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';

    // Create help button
    const helpButton = document.createElement('button');
    helpButton.innerHTML = '?';
    helpButton.style.background = 'none';
    helpButton.style.border = 'none';
    helpButton.style.fontSize = '18px';
    helpButton.style.cursor = 'pointer';
    helpButton.style.color = '#999';
    helpButton.style.padding = '0';
    helpButton.style.width = '30px';
    helpButton.style.height = '30px';
    helpButton.style.display = 'flex';
    helpButton.style.alignItems = 'center';
    helpButton.style.justifyContent = 'center';
    helpButton.style.marginRight = '10px';
    helpButton.title = language === 'zh' ? '帮助' : 'Help';

    helpButton.addEventListener('click', function () {
        // Open help.html in a new tab
        chrome.runtime.getURL ?
            window.open(chrome.runtime.getURL('help.html'), '_blank') :
            window.open('help.html', '_blank');
    });

    // Create mybatis icon button
    const mybatisButton = document.createElement('button');
    mybatisButton.innerHTML = 'M';
    mybatisButton.style.background = 'none';
    mybatisButton.style.border = 'none';
    mybatisButton.style.fontSize = '18px';
    mybatisButton.style.cursor = 'pointer';
    mybatisButton.style.color = '#999';
    mybatisButton.style.padding = '0';
    mybatisButton.style.width = '30px';
    mybatisButton.style.height = '30px';
    mybatisButton.style.display = 'flex';
    mybatisButton.style.alignItems = 'center';
    mybatisButton.style.justifyContent = 'center';
    mybatisButton.style.marginRight = '10px';
    mybatisButton.title = language === 'zh' ? 'MyBatis合成器' : 'MyBatis Composer';

    mybatisButton.addEventListener('click', function () {
        // Open standalone.html in a new tab
        chrome.runtime.getURL ?
            window.open(chrome.runtime.getURL('standalone.html'), '_blank') :
            window.open('standalone.html', '_blank');
    });

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#999';
    closeButton.style.padding = '0';
    closeButton.style.width = '30px';
    closeButton.style.height = '30px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';

    closeButton.addEventListener('click', function () {
        panel.remove();
        // Update the expand button icon
        const expandButton = document.querySelector('#mybatis-sql-merger-expand-btn');
        if (expandButton) {
            expandButton.innerHTML = '⋯';
            expandButton.title = language === 'zh' ? '展开面板' : 'Expand Panel';
        }
    });

    // Append buttons to container
    buttonContainer.appendChild(helpButton);
    buttonContainer.appendChild(mybatisButton);
    buttonContainer.appendChild(closeButton);

    header.appendChild(title);
    header.appendChild(buttonContainer);

    // Create form elements
    const form = document.createElement('div');

    // SQL Template input
    const templateLabel = document.createElement('label');
    templateLabel.textContent = language === 'zh' ? 'SQL模板:' : 'SQL Template:';
    templateLabel.style.display = 'block';
    templateLabel.style.marginBottom = '5px';
    templateLabel.style.fontWeight = 'bold';
    templateLabel.style.color = '#555';

    const templateInput = document.createElement('textarea');
    templateInput.id = 'mybatis-sql-template';
    templateInput.placeholder = language === 'zh' ? '请输入SQL模板，例如: SELECT * FROM users WHERE id = ? AND name = ?' : 'Enter SQL template, e.g.: SELECT * FROM users WHERE id = ? AND name = ?';
    templateInput.style.width = '100%';
    templateInput.style.height = '80px';
    templateInput.style.padding = '10px';
    templateInput.style.border = '1px solid #ddd';
    templateInput.style.borderRadius = '4px';
    templateInput.style.resize = 'vertical';
    templateInput.style.fontFamily = 'monospace';
    templateInput.style.fontSize = '14px';

    // Parameters input
    const parametersLabel = document.createElement('label');
    parametersLabel.textContent = language === 'zh' ? '参数:' : 'Parameters:';
    parametersLabel.style.display = 'block';
    parametersLabel.style.margin = '15px 0 5px';
    parametersLabel.style.fontWeight = 'bold';
    parametersLabel.style.color = '#555';

    const parametersInput = document.createElement('textarea');
    parametersInput.id = 'mybatis-sql-parameters';
    parametersInput.placeholder = language === 'zh' ? '请输入参数，例如: 123(Long), "John"(String)' : 'Enter parameters, e.g.: 123(Long), "John"(String)';
    parametersInput.style.width = '100%';
    parametersInput.style.height = '60px';
    parametersInput.style.padding = '10px';
    parametersInput.style.border = '1px solid #ddd';
    parametersInput.style.borderRadius = '4px';
    parametersInput.style.resize = 'vertical';
    parametersInput.style.fontFamily = 'monospace';
    parametersInput.style.fontSize = '14px';

    // Result display - 固定高度并支持滚动
    const resultLabel = document.createElement('label');
    resultLabel.textContent = language === 'zh' ? '结果:' : 'Result:';
    resultLabel.style.display = 'block';
    resultLabel.style.margin = '15px 0 5px';
    resultLabel.style.fontWeight = 'bold';
    resultLabel.style.color = '#555';

    const resultDisplay = document.createElement('div');
    resultDisplay.id = 'mybatis-sql-result';
    resultDisplay.style.width = '100%';
    resultDisplay.style.height = '120px'; // 固定高度
    resultDisplay.style.maxHeight = '120px'; // 最大高度
    resultDisplay.style.padding = '10px';
    resultDisplay.style.border = '1px solid #ddd';
    resultDisplay.style.borderRadius = '4px';
    resultDisplay.style.backgroundColor = '#f8f8f8';
    resultDisplay.style.fontFamily = 'monospace';
    resultDisplay.style.fontSize = '14px';
    resultDisplay.style.whiteSpace = 'pre-wrap';
    resultDisplay.style.overflow = 'auto'; // 支持滚动
    resultDisplay.style.overflowX = 'auto';
    resultDisplay.style.overflowY = 'auto';
    resultDisplay.style.color = '#333';

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '10px';
    buttonsContainer.style.marginTop = '15px';

    // Navigation button to SQL platform
    const navigateButton = document.createElement('button');
    navigateButton.id = 'navigate-to-sql-platform';
    navigateButton.textContent = language === 'zh' ? '导航到SQL查询平台' : 'Copy&To SQL Console';
    navigateButton.style.flex = '2.5';
    navigateButton.style.padding = '10px';
    navigateButton.style.backgroundColor = '#9c27b0';
    navigateButton.style.color = 'white';
    navigateButton.style.border = 'none';
    navigateButton.style.borderRadius = '4px';
    navigateButton.style.cursor = 'pointer';
    navigateButton.style.fontSize = '14px';

    navigateButton.addEventListener('mouseenter', function () {
        this.style.backgroundColor = '#7b1fa2';
    });

    navigateButton.addEventListener('mouseleave', function () {
        this.style.backgroundColor = '#9c27b0';
    });

    navigateButton.addEventListener('click', function () {
        // 获取SQL查询平台URL并导航
        storage.get(DEFAULT_SETTINGS, function (settings) {
            // 检查结果区域是否有SQL内容
            const sqlResult = resultDisplay.textContent.trim();

            if (sqlResult) {
                // 如果有SQL结果，先复制结果
                try {
                    navigator.clipboard.writeText(sqlResult).then(function () {
                        // 复制成功后再导航
                        if (settings.hasOwnProperty('sqlQueryPlatformUrl') && settings.sqlQueryPlatformUrl) {
                            window.open(settings.sqlQueryPlatformUrl, '_blank');
                        } else {
                            alert(language === 'zh' ? '请先在设置页面配置SQL查询平台网址。' : 'Please configure the SQL query platform URL in the settings page first.');
                        }
                    }).catch(function (error) {
                        alert(language === 'zh' ? '复制失败: ' + error : 'Copy failed: ' + error);
                    });
                } catch (error) {
                    alert(language === 'zh' ? '复制失败: ' + error.message : 'Copy failed: ' + error.message);
                }
            } else {
                // 如果没有SQL结果，直接导航
                if (settings.hasOwnProperty('sqlQueryPlatformUrl') && settings.sqlQueryPlatformUrl) {
                    window.open(settings.sqlQueryPlatformUrl, '_blank');
                } else {
                    alert(language === 'zh' ? '请先在设置页面配置SQL查询平台网址。' : 'Please configure the SQL query platform URL in the settings page first.');
                }
            }
        });
    });

    // Compose button
    const composeButton = document.createElement('button');
    composeButton.textContent = language === 'zh' ? '合成SQL' : 'Parse';
    composeButton.style.flex = '1';
    composeButton.style.padding = '10px';
    composeButton.style.backgroundColor = '#4CAF50';
    composeButton.style.color = 'white';
    composeButton.style.border = 'none';
    composeButton.style.borderRadius = '4px';
    composeButton.style.cursor = 'pointer';
    composeButton.style.fontSize = '14px';

    composeButton.addEventListener('mouseenter', function () {
        this.style.backgroundColor = '#45a049';
    });

    composeButton.addEventListener('mouseleave', function () {
        this.style.backgroundColor = '#4CAF50';
    });

    composeButton.addEventListener('click', function () {
        try {
            // Get input values
            const sqlTemplate = templateInput.value.trim();
            const parametersStr = parametersInput.value.trim();

            if (!sqlTemplate) {
                resultDisplay.textContent = language === 'zh' ? '请输入SQL模板' : 'Please enter SQL template';
                return;
            }

            // Process SQL template (handle Preparing: prefix)
            let processedTemplate = sqlTemplate;
            if (processedTemplate.includes('Preparing:')) {
                processedTemplate = processedTemplate.split('Preparing:')[1].trim();
            }

            // Process parameters (handle Parameters: prefix)
            let processedParameters = [];
            if (parametersStr) {
                let processedParamsStr = parametersStr;
                if (processedParamsStr.includes('Parameters:')) {
                    processedParamsStr = processedParamsStr.split('Parameters:')[1].trim();
                }
                processedParameters = parseParameters(processedParamsStr);
            }

            // Merge SQL with parameters
            const sql = mergeSqlWithParameters(processedTemplate, processedParameters);
            resultDisplay.textContent = sql;
        } catch (error) {
            resultDisplay.textContent = language === 'zh' ? '处理时出错: ' + error.message : 'Error: ' + error.message;
        }
    });

    // Copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = language === 'zh' ? '复制' : 'Copy';
    copyButton.style.flex = '1';
    copyButton.style.padding = '10px';
    copyButton.style.backgroundColor = '#2196F3';
    copyButton.style.color = 'white';
    copyButton.style.border = 'none';
    copyButton.style.borderRadius = '4px';
    copyButton.style.cursor = 'pointer';
    copyButton.style.fontSize = '14px';

    copyButton.addEventListener('mouseenter', function () {
        this.style.backgroundColor = '#0b7dda';
    });

    copyButton.addEventListener('mouseleave', function () {
        this.style.backgroundColor = '#2196F3';
    });

    copyButton.addEventListener('click', function () {
        const resultText = resultDisplay.textContent;
        if (!resultText) {
            alert(language === 'zh' ? '没有可复制的内容' : 'No content to copy');
            return;
        }

        try {
            navigator.clipboard.writeText(resultText).then(function () {
                const originalText = copyButton.textContent;
                copyButton.textContent = language === 'zh' ? '已复制!' : 'Copied!';
                setTimeout(function () {
                    copyButton.textContent = originalText;
                }, 2000);
            }).catch(function (error) {
                alert(language === 'zh' ? '复制失败: ' + error : 'Copy failed: ' + error);
            });
        } catch (error) {
            alert(language === 'zh' ? '复制失败: ' + error.message : 'Copy failed: ' + error.message);
        }
    });

    // Assemble the panel
    form.appendChild(templateLabel);
    form.appendChild(templateInput);
    form.appendChild(parametersLabel);
    form.appendChild(parametersInput);
    form.appendChild(resultLabel);
    form.appendChild(resultDisplay);

    buttonsContainer.appendChild(composeButton);
    buttonsContainer.appendChild(copyButton);
    buttonsContainer.appendChild(navigateButton);
    form.appendChild(buttonsContainer);

    panel.appendChild(header);
    panel.appendChild(form);

    // Add panel to the page
    document.body.appendChild(panel);
}

// Check if button should be shown when page loads
window.addEventListener('load', function () {
    checkShouldShowButton();
});