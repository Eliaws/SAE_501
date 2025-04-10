document.addEventListener("DOMContentLoaded", function () {
    const textareas = document.querySelectorAll("textarea[data-chars-limit]");

    textareas.forEach(textarea => {
        const charsLimit = parseInt(textarea.getAttribute("data-chars-limit"), 10);
        const counterDescription = textarea.nextElementSibling;

        textarea.addEventListener("input", function () {
            const remainingChars = charsLimit - textarea.value.length;
            counterDescription.textContent = `${remainingChars} caractères restants`;
        });

        // Initial update in case there's pre-filled content
        const initialRemainingChars = charsLimit - textarea.value.length;
        counterDescription.textContent = `${initialRemainingChars} caractères restants`;
    });
});
