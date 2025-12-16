# MyBatis SQL Log Merger Chrome Extension

[English Version](#english-version) | [中文版本](#中文版本)

---

## English Version

This Chrome extension helps developers merge MyBatis SQL logs into complete SQL statements for easier debugging and analysis.

![Extension Icon](images/icon128.png)

### Features

- Parse MyBatis log output to extract SQL templates and parameters
- Automatically merge parameters into SQL templates to form complete executable SQL
- Simple UI with input and output fields
- Works with complex parameter types including Long, String, Timestamp, etc.
- Three interaction modes: popup window, standalone page, and page button
- Clean and intuitive user interface
- SQL formatting and syntax highlighting
- Collapsible instructions and examples
- Copy to clipboard functionality
- Dual input modes: single-box mode (paste complete logs) or dual-box mode (separate SQL template and parameters)
- Flexible input parsing: both single and dual modes support inputs with or without Preparing:/Parameters: prefixes
- Configurable URL patterns for page button display
- Multi-language support (Chinese/English)

### Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing this extension

### Project Structure

```
sql-log-merge/
├── css/
│   └── styles.css              # Styles for standalone page
├── images/
│   ├── icon16.png              # Extension icon (16x16)
│   ├── icon48.png              # Extension icon (48x48)
│   └── icon128.png             # Extension icon (128x128)
├── js/
│   ├── business/               # Business logic JavaScript files
│   │   ├── collapsible.js      # Collapsible panel functionality
│   │   ├── content.js          # Content script for page interaction
│   │   ├── popup.js            # Logic for popup window
│   │   └── standalone.js       # Logic for standalone page
│   └── vendor/                 # Third-party libraries
│       └── sql-formatter.min.js # SQL formatting library
├── manifest.json               # Chrome extension manifest
├── popup.html                 # Popup window HTML
├── standalone.html            # Standalone page HTML
├── settings.html              # Settings page HTML
├── README.md                  # This file
├── sample-input.txt           # Sample MyBatis log input
└── expected-output.txt        # Expected SQL output for sample input
```

### Usage

This extension provides three ways to merge MyBatis SQL logs:

#### 1. Popup Window (Default)
1. Click the extension icon in the Chrome toolbar
2. Paste your MyBatis log output into the input field
3. Click "Process" to generate the merged SQL statement
4. The complete SQL will appear in the result area

#### 2. Standalone Page
1. Click the extension icon in the Chrome toolbar
2. Click "Open Standalone Page" to open the standalone page
3. Use the standalone page interface to process your logs

##### Input Modes
The standalone page offers two input modes that can be toggled:

1. **Single-box Mode (Default)**: 
   - Paste the complete MyBatis log in one text area
   - Example:
     ```
     ==>  Preparing: SELECT * FROM users WHERE id = ? AND name = ?
     ==> Parameters: 123(Long), "John"(String)
     ```

2. **Dual-box Mode**: 
   - Enter the SQL template and parameters separately
   - Both SQL template and parameters support inputs with or without prefixes
   - SQL Template (either format works):
     ```
     Preparing: SELECT * FROM users WHERE id = ? AND name = ?
     ```
     or
     ```
     SELECT * FROM users WHERE id = ? AND name = ?
     ```
   - Parameters (either format works):
     ```
     Parameters: 123(Long), "John"(String)
     ```
     or
     ```
     123(Long), "John"(String)
     ```

#### 3. Page Button
1. Navigate to any webpage
2. Select MyBatis log text on the page
3. Click the green "Extract MyBatis SQL" button that appears at the bottom right
4. The merged SQL will be displayed in an alert dialog

##### Configuring Page Button Display
By default, the page button is not displayed on any website. You can configure which websites should display the button:

1. Click the extension icon in the Chrome toolbar
2. Click "Settings" to open the settings page
3. In the "Web Filter Settings" section, add URL patterns where you want the button to appear
4. Examples of URL patterns:
   - `https://example.com/*` - Matches all pages on example.com
   - `*://*.example.com/*` - Matches all pages on example.com and its subdomains with any protocol
   - `https://grafana.test.cn/` - Matches only this specific URL

### Standalone Page Features
The standalone page offers enhanced functionality:

1. **Collapsible Instructions**: Click on the "Instructions" or "Example" headers to expand/collapse sections
2. **Input Mode Toggle**: Switch between single-box and dual-box input modes
3. **Flexible Input Parsing**: Both modes support inputs with or without Preparing:/Parameters: prefixes
4. **Enhanced Button Controls**: 
   - Process SQL: Convert MyBatis logs to SQL
   - Beautify SQL: Format and syntax highlight the SQL statement (enabled after processing)
   - Copy Result: Copy the SQL to clipboard (enabled after processing)
   - Clear: Reset all fields
5. **Professional SQL Formatting**: Uses the sql-formatter library for professional SQL formatting
6. **Integrated Formatting and Highlighting**: The "Beautify SQL" button now combines both formatting and syntax highlighting
7. **Responsive Design**: Adapts to different screen sizes

### Example

Input:
```
2025-12-15 15:09:30.055	
ga||tender-api||tender-api-58d84fb947-k6264||DEBUG||com.paut.tender.mgt.business.mapper.order.OrderPaymentMapper.queryPreMinusAmountBySettleSysNos||2025-12-15T15:09:29.971Z||f55726b11267623a1c5de0b06a5d718f|313/445|[thread-pool-asyncServiceExecutor12]||f55726b11267623a1c5de0b06a5d718f-TID: N/A - 485> ==>  Preparing: select SUM(IFNULL(op.pre_minus_amount, 0)) as preMinusAmount,opd.settlement_sys_no as settlementSysNo from zc_tender_db.order_payment_detail opd inner join zc_tender_db.order_payment op on op.sys_no = opd.payment_sys_no where opd.settlement_sys_no in ( ? , ? , ? ) and op.common_status = 1 group by opd.settlement_sys_no

2025-12-15 15:09:30.055	
ga||tender-api||tender-api-58d84fb947-k6264||DEBUG||com.paut.tender.mgt.business.mapper.order.OrderPaymentMapper.queryPreMinusAmountBySettleSysNos||2025-12-15T15:09:29.971Z||f55726b11267623a1c5de0b06a5d718f|314/446|[thread-pool-asyncServiceExecutor12]||f55726b11267623a1c5de0b06a5d718f-TID: N/A - 554> ==> Parameters: 1201489816869648539(Long), 1201468021147800812(Long), 1201468021143606337(Long)
```

Output:
```sql
select SUM(IFNULL(op.pre_minus_amount, 0)) as preMinusAmount,opd.settlement_sys_no as settlementSysNo from zc_tender_db.order_payment_detail opd inner join zc_tender_db.order_payment op on op.sys_no = opd.payment_sys_no where opd.settlement_sys_no in ( 1201489816869648539 , 1201468021147800812 , 1201468021143606337 ) and op.common_status = 1 group by opd.settlement_sys_no
```

### Supported Parameter Types

- Long
- String
- Integer
- Double
- Float
- Boolean
- Timestamp
- Date
- NULL values

### Limitations

- Currently only works with basic SELECT, INSERT, UPDATE, DELETE statements
- Complex nested parameter structures may not be fully supported
- Does not validate the resulting SQL for syntax correctness

### Contributing

Feel free to submit issues or pull requests to improve this extension.

---

## 中文版本

这是一个Chrome扩展程序，帮助开发者将MyBatis SQL日志合并成完整的SQL语句，便于调试和分析。

![扩展图标](images/icon128.png)

### 功能特点

- 解析MyBatis日志输出，提取SQL模板和参数
- 自动将参数合并到SQL模板中，形成完整的可执行SQL
- 简洁的UI界面，包含输入和输出字段
- 支持复杂的参数类型，包括Long、String、Timestamp等
- 三种交互模式：弹出窗口、独立页面和页面按钮
- 界面简洁直观
- SQL格式化和语法高亮
- 可折叠的使用说明和示例
- 复制到剪贴板功能
- 双输入模式：单框模式（粘贴完整日志）或双框模式（分别输入SQL模板和参数）
- 灵活的输入解析：单框和双框模式都支持带或不带Preparing:/Parameters:前缀的输入
- 可配置的URL模式用于页面按钮显示
- 多语言支持（中文/英文）

### 安装方法

1. 克隆或下载此仓库
2. 打开Chrome浏览器，访问 `chrome://extensions/`
3. 在右上角启用"开发者模式"
4. 点击"加载已解压的扩展程序"，选择包含此扩展的目录

### 项目结构

```
sql-log-merge/
├── css/
│   └── styles.css              # 独立页面样式
├── images/
│   ├── icon16.png              # 扩展图标 (16x16)
│   ├── icon48.png              # 扩展图标 (48x48)
│   └── icon128.png             # 扩展图标 (128x128)
├── js/
│   ├── business/               # 业务逻辑JavaScript文件
│   │   ├── collapsible.js      # 可折叠面板功能
│   │   ├── content.js          # 页面交互的内容脚本
│   │   ├── popup.js            # 弹出窗口逻辑
│   │   └── standalone.js       # 独立页面逻辑
│   └── vendor/                 # 第三方库
│       └── sql-formatter.min.js # SQL格式化库
├── manifest.json               # Chrome扩展清单文件
├── popup.html                 # 弹出窗口HTML
├── standalone.html            # 独立页面HTML
├── settings.html              # 设置页面HTML
├── README.md                  # 此文件
├── sample-input.txt           # 示例MyBatis日志输入
└── expected-output.txt        # 示例输入对应的预期SQL输出
```

### 使用方法

该扩展提供三种方式来合并MyBatis SQL日志：

#### 1. 弹出窗口（默认）
1. 点击Chrome工具栏中的扩展图标
2. 将MyBatis日志输出粘贴到输入字段中
3. 点击"处理"按钮生成合并后的SQL语句
4. 完整的SQL将显示在结果区域

#### 2. 独立页面
1. 点击Chrome工具栏中的扩展图标
2. 点击"打开独立页面"打开独立页面
3. 使用独立页面界面处理您的日志

##### 输入模式
独立页面提供两种可切换的输入模式：

1. **单框模式（默认）**：
   - 在一个文本区域中粘贴完整的MyBatis日志
   - 示例：
     ```
     ==>  Preparing: SELECT * FROM users WHERE id = ? AND name = ?
     ==> Parameters: 123(Long), "John"(String)
     ```

2. **双框模式**：
   - 分别输入SQL模板和参数
   - SQL模板和参数都支持带或不带前缀的输入
   - SQL模板（任一格式均可）：
     ```
     Preparing: SELECT * FROM users WHERE id = ? AND name = ?
     ```
     或
     ```
     SELECT * FROM users WHERE id = ? AND name = ?
     ```
   - 参数（任一格式均可）：
     ```
     Parameters: 123(Long), "John"(String)
     ```
     或
     ```
     123(Long), "John"(String)
     ```

#### 3. 页面按钮
1. 导航到任何网页
2. 选择页面上的MyBatis日志文本
3. 点击右下角出现的绿色"提取MyBatis SQL"按钮
4. 合并后的SQL将在警告对话框中显示

##### 配置页面按钮显示
默认情况下，页面按钮不会在任何网站上显示。您可以配置哪些网站应该显示该按钮：

1. 点击Chrome工具栏中的扩展图标
2. 点击"设置"打开设置页面
3. 在"网页过滤设置"部分，添加您希望显示按钮的URL模式
4. URL模式示例：
   - `https://example.com/*` - 匹配example.com上的所有页面
   - `*://*.example.com/*` - 匹配example.com及其子域上的所有页面（任意协议）
   - `https://grafana.test.cn/` - 仅匹配此特定URL

### 独立页面功能
独立页面提供增强功能：

1. **可折叠说明**：点击"使用说明"或"示例"标题可展开/折叠部分
2. **输入模式切换**：在单框和双框输入模式之间切换
3. **灵活输入解析**：两种模式都支持带或不带Preparing:/Parameters:前缀的输入
4. **增强按钮控制**：
   - 处理SQL：将MyBatis日志转换为SQL
   - 美化SQL：格式化并高亮显示SQL语句（处理后启用）
   - 拷贝结果：将SQL复制到剪贴板（处理后启用）
   - 清空：重置所有字段
5. **专业SQL格式化**：使用sql-formatter库进行专业的SQL格式化
6. **集成格式化和高亮**："美化SQL"按钮现在结合了格式化和语法高亮功能
7. **响应式设计**：适应不同屏幕尺寸

### 示例

输入：
```
2025-12-15 15:09:30.055	
ga||tender-api||tender-api-58d84fb947-k6264||DEBUG||com.paut.tender.mgt.business.mapper.order.OrderPaymentMapper.queryPreMinusAmountBySettleSysNos||2025-12-15T15:09:29.971Z||f55726b11267623a1c5de0b06a5d718f|313/445|[thread-pool-asyncServiceExecutor12]||f55726b11267623a1c5de0b06a5d718f-TID: N/A - 485> ==>  Preparing: select SUM(IFNULL(op.pre_minus_amount, 0)) as preMinusAmount,opd.settlement_sys_no as settlementSysNo from zc_tender_db.order_payment_detail opd inner join zc_tender_db.order_payment op on op.sys_no = opd.payment_sys_no where opd.settlement_sys_no in ( ? , ? , ? ) and op.common_status = 1 group by opd.settlement_sys_no

2025-12-15 15:09:30.055	
ga||tender-api||tender-api-58d84fb947-k6264||DEBUG||com.paut.tender.mgt.business.mapper.order.OrderPaymentMapper.queryPreMinusAmountBySettleSysNos||2025-12-15T15:09:29.971Z||f55726b11267623a1c5de0b06a5d718f|314/446|[thread-pool-asyncServiceExecutor12]||f55726b11267623a1c5de0b06a5d718f-TID: N/A - 554> ==> Parameters: 1201489816869648539(Long), 1201468021147800812(Long), 1201468021143606337(Long)
```

输出：
```sql
select SUM(IFNULL(op.pre_minus_amount, 0)) as preMinusAmount,opd.settlement_sys_no as settlementSysNo from zc_tender_db.order_payment_detail opd inner join zc_tender_db.order_payment op on op.sys_no = opd.payment_sys_no where opd.settlement_sys_no in ( 1201489816869648539 , 1201468021147800812 , 1201468021143606337 ) and op.common_status = 1 group by opd.settlement_sys_no
```

### 支持的参数类型

- Long
- String
- Integer
- Double
- Float
- Boolean
- Timestamp
- Date
- NULL值

### 限制

- 目前仅适用于基本的SELECT、INSERT、UPDATE、DELETE语句
- 复杂的嵌套参数结构可能无法完全支持
- 不验证生成的SQL的语法正确性

### 贡献

欢迎提交问题或拉取请求来改进此扩展。