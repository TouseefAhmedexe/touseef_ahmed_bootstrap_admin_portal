import { loadActivities, loadUsers } from "../shared/api.js";
import {
    countByStatus,
    formatDateTime,
    normalizeActivity,
    normalizeList,
    normalizeUser,
    pluralize
} from "../shared/data-utils.js";
import { createAvatar, createBadge, makeElement, requireElement } from "../shared/dom.js";
import { initLayout } from "../shared/layout.js";

initLayout();

const PROGRESS_WIDTHS = { 0: "", 25: "w-25", 50: "w-50", 75: "w-75", 100: "w-100" };
const BAR_COLORS = { Completed: "bg-success", "In progress": "", Pending: "bg-warning" };

const activityState = requireElement("activity-state");
const activityList = requireElement("activity-list");

function showState(kind, message, onRetry = null) {
    activityState.textContent = "";
    activityState.hidden = false;

    if (kind === "loading") {
        const row = makeElement("div", "d-flex align-items-center justify-content-center gap-2 p-4");
        const spinner = makeElement("div", "spinner-border spinner-border-sm text-primary");

        spinner.setAttribute("role", "status");
        row.append(spinner, makeElement("span", "", message));
        activityState.append(row);
        return;
    }

    const isError = kind === "error";
    const alert = makeElement("div", `alert ${isError ? "alert-danger" : "alert-info"} m-3`);

    alert.setAttribute("role", isError ? "alert" : "status");
    alert.append(makeElement("p", "mb-2", message));

    if (onRetry !== null) {
        const button = makeElement("button", "btn btn-sm btn-outline-danger", "Try again");

        button.type = "button";
        button.addEventListener("click", onRetry);
        alert.append(button);
    }

    activityState.append(alert);
}

function hideState() {
    activityState.hidden = true;
    activityState.textContent = "";
}

function renderStats(users) {
    const counts = countByStatus(users);
    const values = {
        total: users.length,
        active: counts.Active,
        pending: counts.Pending,
        inactive: counts.Inactive
    };

    document.querySelectorAll("[data-stat]").forEach((element) => {
        element.textContent = String(values[element.dataset.stat] ?? 0);
    });

    document.querySelectorAll("[data-stat-share]").forEach((element) => {
        const value = values[element.dataset.statShare] ?? 0;
        const share = users.length === 0 ? 0 : Math.round((value / users.length) * 100);

        element.textContent = `${share}% of all users`;
    });
}

function showStatsUnavailable() {
    document.querySelectorAll("[data-stat-share]").forEach((element) => {
        element.textContent = "Data not available";
    });
}

function buildProgress(activity) {
    const row = makeElement("div", "d-flex align-items-center gap-2");
    const track = makeElement("div", "progress progress--thin flex-grow-1");
    const barClasses = ["progress-bar", BAR_COLORS[activity.status], PROGRESS_WIDTHS[activity.progress]]
        .filter((name) => name !== "");

    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", `Progress: ${activity.description}`);
    track.setAttribute("aria-valuenow", String(activity.progress));
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.append(makeElement("div", barClasses.join(" ")));

    row.append(track, makeElement("span", "small text-body-secondary", `${activity.progress}%`));
    return row;
}

function buildActivity(activity, users) {
    const user = users.find((item) => item.id === activity.userId);
    const item = makeElement("li", "list-group-item py-3");
    const row = makeElement("div", "d-flex gap-3");
    const body = makeElement("div", "flex-grow-1");
    const top = makeElement("div", "d-flex flex-wrap justify-content-between align-items-start gap-2");
    const meta = makeElement("p", "small text-body-secondary mb-2");
    const time = document.createElement("time");
    const person = user === undefined ? "Unknown user" : `${user.name} (${user.role})`;

    time.dateTime = activity.timestamp;
    time.textContent = formatDateTime(activity.timestamp);
    meta.append(person, " | ", time);

    top.append(makeElement("p", "fw-semibold mb-0", activity.description), createBadge(activity.status));
    body.append(top, meta, buildProgress(activity));
    row.append(createAvatar(user ?? { name: "?", avatar: "" }), body);
    item.append(row);
    return item;
}

function renderActivities(activities, users, skippedCount) {
    activityList.textContent = "";

    if (activities.length === 0) {
        showState("empty", "There are no activities yet.");
        return;
    }

    const newestFirst = [...activities].sort((first, second) => {
        return new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime();
    });

    hideState();
    activityList.append(...newestFirst.map((activity) => buildActivity(activity, users)));

    if (skippedCount > 0) {
        const verb = skippedCount === 1 ? "was" : "were";

        activityList.append(makeElement(
            "li",
            "list-group-item small text-body-secondary",
            `${pluralize(skippedCount, "activity record")} could not be used and ${verb} skipped.`
        ));
    }
}

async function loadDashboard() {
    showState("loading", "Loading activities...");

    try {
        const [rawUsers, rawActivities] = await Promise.all([loadUsers(), loadActivities()]);
        const userResult = normalizeList(rawUsers, normalizeUser);
        const activityResult = normalizeList(rawActivities, normalizeActivity);

        renderStats(userResult.valid);
        renderActivities(activityResult.valid, userResult.valid, activityResult.skippedCount);
    } catch (error) {
        activityList.textContent = "";
        showStatsUnavailable();
        showState("error", error.message, loadDashboard);
    }
}

loadDashboard();