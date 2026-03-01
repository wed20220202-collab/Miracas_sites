/* =============================
   来校者フィルター（並び替え）
============================= */

let sortState = {
    key: null,
    asc: true
};

/* ヘッダークリック処理 */
document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll("th.filter").forEach(th => {

        th.addEventListener("click", () => {

            const key = th.dataset.key;

            if (!key) return;

            // 同じキーなら昇順⇄降順
            if (sortState.key === key) {
                sortState.asc = !sortState.asc;
            } else {
                sortState.key = key;
                sortState.asc = true;
            }

            sortVisitors();
        });

    });

});

/* 並び替え処理 */
function sortVisitors() {

    let visitors = JSON.parse(localStorage.getItem("visitors")) || [];

    if (!sortState.key) return;

    visitors.sort((a, b) => {

        const valA = a[sortState.key] || "";
        const valB = b[sortState.key] || "";

        // 数値判定
        if (!isNaN(valA) && !isNaN(valB)) {
            return sortState.asc
                ? Number(valA) - Number(valB)
                : Number(valB) - Number(valA);
        }

        // 文字列比較
        return sortState.asc
            ? valA.localeCompare(valB, "ja")
            : valB.localeCompare(valA, "ja");

    });

    localStorage.setItem("visitors", JSON.stringify(visitors));

    // 既存の表示関数を再実行
    if (typeof displayVisitors === "function") {
        displayVisitors();
    }

}
