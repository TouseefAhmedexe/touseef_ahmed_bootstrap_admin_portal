import { getBootstrap } from "./dom.js";
import { readStored, removeStored, writeStored } from "./storage.js";

const THEMES = ["light", "dark"];
const root = document.documentElement;

function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function updateThemeButton(theme) {
    const button = document.getElementById("theme-button");

    if (button !== null) {
        button.textContent = theme === "dark" ? "Light theme" : "Dark theme";
    }
}

export function getSavedTheme() {
    const saved = readStored("theme");

    return THEMES.includes(saved) ? saved : "system";
}

export function chooseTheme(choice) {
    if (choice !== "system" && !THEMES.includes(choice)) {
        return false;
    }

    const theme = choice === "system" ? getSystemTheme() : choice;
    const wasSaved = choice === "system" ? removeStored("theme") : writeStored("theme", choice);

    root.setAttribute("data-bs-theme", theme);
    updateThemeButton(theme);
    return wasSaved;
}

export function isSidebarCollapsed() {
    return root.classList.contains("sidebar-collapsed");
}

export function setSidebarCollapsed(collapsed) {
    const toggle = document.getElementById("sidebar-toggle");

    root.classList.toggle("sidebar-collapsed", collapsed);

    if (toggle !== null) {
        toggle.setAttribute("aria-expanded", String(!collapsed));
    }

    return writeStored("sidebar", collapsed ? "collapsed" : "expanded");
}

function setupThemeButton() {
    const button = document.getElementById("theme-button");

    if (button === null) {
        return;
    }

    updateThemeButton(root.getAttribute("data-bs-theme"));

    button.addEventListener("click", () => {
        chooseTheme(root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark");
    });
}

function setupSidebarButton() {
    const toggle = document.getElementById("sidebar-toggle");

    if (toggle === null) {
        return;
    }

    toggle.setAttribute("aria-expanded", String(!isSidebarCollapsed()));
    toggle.addEventListener("click", () => setSidebarCollapsed(!isSidebarCollapsed()));
}

function markActiveLink() {
    const currentFile = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".sidebar__main-link").forEach((link) => {
        const isCurrent = link.pathname.split("/").pop() === currentFile;

        link.classList.toggle("active", isCurrent);

        if (isCurrent) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function setupTooltips() {
    const { Tooltip } = getBootstrap();

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => {
        Tooltip.getOrCreateInstance(element);
    });
}

export function initLayout() {
    setupThemeButton();
    setupSidebarButton();
    markActiveLink();
    setupTooltips();
}