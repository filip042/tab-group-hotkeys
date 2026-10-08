(async function applyThemeColors() {
    const { colors } = await browser.theme.getCurrent();
    if (!colors) {
        return;
    }

    const map = {
        popup: "--bg",
        popup_text: "--text",
        popup_highlight: "--button-bg",
        focus_outline: "--focus",
    };
    for (const [key, cssVar] of Object.entries(map)) {
        if (colors[key]) {
            document.documentElement.style.setProperty(cssVar, colors[key]);
        }
    }
})();