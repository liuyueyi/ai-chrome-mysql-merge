// 监听插件安装事件
chrome.runtime.onInstalled.addListener(function (details) {
    // 只在首次安装时打开帮助页面
    if (details.reason === 'install') {
        // 打开帮助页面
        chrome.tabs.create({
            url: chrome.runtime.getURL('help.html')
        });
    }
});