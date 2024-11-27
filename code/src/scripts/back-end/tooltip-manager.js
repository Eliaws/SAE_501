const listTooltips = document.querySelectorAll("[data-tooltip]");
const listTooltipAnchors = document.querySelectorAll("[data-tooltip-anchor]");

const hideTooltip = (e) => {
    const tooltip = document.querySelector(
        `[data-tooltip="${e.currentTarget.dataset.tooltipAnchor}"]`
    );
    tooltip.classList.add("fade-out");
    tooltip.addEventListener("transitionend", () => {
        if (tooltip.matches(".fade-out")) {
            tooltip.classList.remove("fade-out");
            tooltip.classList.add("hidden");
        }
    });
};

const showTooltip = (e) => {
    const tooltip = document.querySelector(
        `[data-tooltip="${e.currentTarget.dataset.tooltipAnchor}"]`
    );
    tooltip.classList.remove("hidden", "fade-out");
};

listTooltipAnchors.forEach((item) => {
    item.style["anchor-name"] = `--${item.dataset.tooltipAnchor}`;
    item.setAttribute("aria-details", item.dataset.tooltipAnchor);
    item.addEventListener("mouseenter", showTooltip);
    item.addEventListener("focus", showTooltip);
    item.addEventListener("mouseleave", hideTooltip);
    item.addEventListener("blur", hideTooltip);
});

listTooltips.forEach((item) => {
    item.style["position-anchor"] = `--${item.dataset.tooltip}`;
    item.setAttribute("id", item.dataset.tooltip);
});
