document.addEventListener("DOMContentLoaded", () => {
    // Variable pour savoir si le formulaire a été modifié
    let isFormDirty = false;
  
    const forms = document.querySelectorAll("form");
  
    forms.forEach((form) => {
        form.addEventListener("input", () => {
            isFormDirty = true;
        });
        form.addEventListener("submit", () => {
            isFormDirty = false;
        });
    });
  
    window.addEventListener("beforeunload", (e) => {
        if (isFormDirty) {
            e.preventDefault();
        }
    });
});
