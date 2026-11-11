function readSaved(key) {
    try {
        return window.localStorage.getItem(`bloomrix.admin.${key}`);
    } catch (error) {
        return null;
    }
}

function applySavedSettings() {
    let theme = readSaved("theme");

    if (theme !== "light" && theme !== "dark") {
        theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    document.documentElement.setAttribute("data-bs-theme", theme);
    document.documentElement.classList.toggle("sidebar-collapsed", readSaved("sidebar") === "collapsed");
}

applySavedSettings();