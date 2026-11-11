import { getInitials } from "./data-utils.js";

const BADGE_CLASSES = {
    Active: "text-bg-success",
    Completed: "text-bg-success",
    Pending: "text-bg-warning",
    "In progress": "text-bg-info",
    Inactive: "text-bg-secondary"
};

export function requireElement(id) {
    const element = document.getElementById(id);

    if (element === null) {
        throw new Error(`The element #${id} is missing from the page.`);
    }

    return element;
}

export function getBootstrap() {
    if (typeof window.bootstrap === "undefined") {
        throw new Error("Bootstrap did not load. Check the path lib/bootstrap/bootstrap.bundle.min.js.");
    }

    return window.bootstrap;
}

export function makeElement(tag, className = "", text = "") {
    const element = document.createElement(tag);

    element.className = className;
    element.textContent = text;
    return element;
}

export function createBadge(status) {
    return makeElement("span", `badge ${BADGE_CLASSES[status] ?? "text-bg-secondary"}`, status);
}

export function createAvatar(user, sizeClass = "") {
    const avatar = makeElement("span", `avatar ${sizeClass}`.trim());

    function showInitials() {
        avatar.textContent = getInitials(user.name);
    }

    if (user.avatar === "") {
        showInitials();
        return avatar;
    }

    const image = document.createElement("img");

    image.className = "avatar__image";
    image.src = `images/avatars/${user.avatar}`;
    image.alt = "";
    image.addEventListener("error", showInitials, { once: true });
    avatar.append(image);
    return avatar;
}

