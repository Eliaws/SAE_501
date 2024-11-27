const form = document.querySelector("[data-form]");

form?.addEventListener("reset", (e) => {
    const listImgs = e.target.querySelectorAll("[data-preview-upload]");
    const listUploadedImgs = e.target.querySelectorAll("[data-image-path]");

    listImgs.forEach((item) => {
        item.src = "";
    });

    listUploadedImgs.forEach((item) => {
        item.src = item.dataset.imagePath;
    });
});
