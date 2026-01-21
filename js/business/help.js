// Help page specific JavaScript functionality

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function () {
    // 从设置中加载语言偏好设置
    if (typeof loadLanguageFromSettings === 'function') {
        loadLanguageFromSettings();
    } else {
        // 如果无法从设置加载，则使用默认的更新UI文本函数
        if (typeof updateUIText === 'function') {
            updateUIText();
        }
    }

    // 添加返回按钮事件监听器
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', function (e) {
            e.preventDefault();
            window.close(); // 关闭当前窗口
        });
    }
});