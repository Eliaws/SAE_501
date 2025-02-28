document.addEventListener("DOMContentLoaded", () => {
    // Au chargement, récupérer et appliquer le thème sauvegardé (s'il existe)
    const savedThemeColor = localStorage.getItem("themeColor");
    if (savedThemeColor) {
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute("content", savedThemeColor);
        }
        const colorThemeDiv = document.querySelector('div[name="colorTheme"]');
        if (colorThemeDiv) {
            colorThemeDiv.style.background = `linear-gradient(to bottom, ${savedThemeColor}, #f5f5f5)`;
        }
    }
  
    // Ajouter l'écouteur d'événement sur les boutons de thème
    const themeButtons = document.querySelectorAll(".theme-btn");
    themeButtons.forEach(button => {
        button.addEventListener("click", () => {
            const newThemeColor = button.getAttribute("data-theme-color");
            if (!newThemeColor) return;
  
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.setAttribute("content", newThemeColor);
            }
  
            const colorThemeDiv = document.querySelector('div[name="colorTheme"]');
            if (colorThemeDiv) {
                colorThemeDiv.style.background = `linear-gradient(to bottom, ${newThemeColor}, #f5f5f5)`;
            }
  
            // Sauvegarder le thème sélectionné dans le localStorage
            localStorage.setItem("themeColor", newThemeColor);
        });
    });
});
  
