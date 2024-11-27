// Keep scroll position between page in navigation for mobile
const sidebar = document.querySelector("[data-navigation]");
const navigationName = sidebar.dataset.navigation;
const scrollLeft = localStorage.getItem(`sidebar-scroll-${navigationName}`);
if (scrollLeft !== null && sidebar !== null) {
    sidebar.scrollLeft = Number(scrollLeft);
}

window.addEventListener("beforeunload", () => {
    localStorage.setItem(`sidebar-scroll-${navigationName}`, sidebar.scrollLeft);
});
