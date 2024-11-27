const listDragNDropArea = document.querySelectorAll("[data-drag-n-drop-area]");
const listDragNDropError = document.querySelectorAll("[data-incorrect-upload]");

const toggleDragAndDropIndicator = (element, show = true) => {
    const hoverClass = Array.from(element.querySelector("label").classList)
        .filter(item => item.includes("hover"))
        .map(item => item.replace("hover:", "!"));

    if (show) {
        element.classList.remove("paused");
    } else {
        element.classList.add("paused");
        if (hoverClass) {
            element.querySelector("label").classList.remove(...hoverClass);
        }
    }
};

listDragNDropArea.forEach((item) => {
    toggleDragAndDropIndicator(item, false);
});

listDragNDropError.forEach((item) => {
    item.classList.add("hidden");
    item.querySelector("button").addEventListener("click", () => {
        item.classList.add("hidden");
    });
});

listDragNDropArea.forEach((item) => {
    item.addEventListener("dragover", (e) => {
        e.preventDefault();

        const hoverClass = Array.from(item.querySelector("label").classList)
            .filter(item => item.includes("hover"))
            .map(item => item.replace("hover:", "!"));

        if (hoverClass) {
            item.querySelector("label").classList.add(...hoverClass);
        }

        toggleDragAndDropIndicator(item, true);
    });
});

["dragend", "dragleave"].forEach((event) => {
    listDragNDropArea.forEach((item) => {
        item.addEventListener(event, (e) => {
            e.preventDefault();

            toggleDragAndDropIndicator(item, false);
        });
    });
});

listDragNDropArea.forEach((item) => {
    item.addEventListener("drop", (e) => {
        e.preventDefault();
        toggleDragAndDropIndicator(item, false);

        if (e.dataTransfer.items) {
            const input = item.querySelector("[data-upload-file]");

            input.setAttribute("files", e.dataTransfer.files);
            input.files = e.dataTransfer.files;
        }
    });
});
