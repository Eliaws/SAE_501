const paginationShortcut = document.querySelector("[data-pagination-shortcut]");
const listPaginationShortcutButtons = document.querySelectorAll(
    "[data-toggle-pagination-shortcut-btn]"
);

const clearAnchors = () => {
    listPaginationShortcutButtons.forEach((item) => {
        item.textContent = "…";
        item.style["anchor-name"] = "none";
    });
};

listPaginationShortcutButtons.forEach((item) => {
    item.setAttribute("aria-details", "pagination-shortcut");
    item.addEventListener("click", (e) => {
        if (e.currentTarget.textContent === "…") {
            clearAnchors();
            e.currentTarget.textContent = "✖";
            e.currentTarget.style["anchor-name"] = "--paginationShortcutAnchor";
            paginationShortcut.classList.remove("!hidden");
        } else {
            e.currentTarget.textContent = "…";
            paginationShortcut.classList.add("fade-out");
            paginationShortcut.addEventListener("transitionend", (e) => {
                if (e.target.matches(".fade-out")) {
                    paginationShortcut.classList.remove("fade-out");
                    paginationShortcut.classList.add("!hidden");
                    e.currentTarget.style["anchor-name"] = "none";
                }
            });
        }
    });
});
