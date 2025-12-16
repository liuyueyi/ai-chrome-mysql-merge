// 折叠面板功能
document.addEventListener('DOMContentLoaded', function () {
    var coll = document.getElementsByClassName("collapsible");
    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
                this.textContent = this.textContent.replace('▲', '▼');
            } else {
                content.style.display = "block";
                this.textContent = this.textContent.replace('▼', '▲');
            }
        });
    }
});