export const STATUSES = ["Active", "Pending", "Inactive"];
export const ROLES = ["Administrator", "Mentor", "Reviewer", "Intern"];
export const ACTIVITY_STATUSES = ["Completed", "In progress", "Pending"];
export const PROGRESS_STEPS = [0, 25, 50, 75, 100];

export function pluralize(count, word) {
    return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function isText(value) {
    return typeof value === "string" && value.trim() !== "";
}

function isValidDate(value) {
    return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

export function normalizeUser(record) {
    if (record === null || typeof record !== "object") {
        return null;
    }

    const { id, name, email, role, registeredOn, status, avatar } = record;

    if (!Number.isInteger(id)) {
        return null;
    }

    if (!isText(name) || !isText(email) || !email.includes("@")) {
        return null;
    }

    if (!STATUSES.includes(status) || !isValidDate(registeredOn)) {
        return null;
    }

    return {
        id,
        name: name.trim(),
        email: email.trim(),
        role: ROLES.includes(role) ? role : "Intern",
        registeredOn,
        status,
        avatar: isText(avatar) ? avatar.trim() : ""
    };
}

export function normalizeActivity(record) {
    if (record === null || typeof record !== "object") {
        return null;
    }

    const { id, userId, description, timestamp, status, progress } = record;

    if (!Number.isInteger(id) || !Number.isInteger(userId)) {
        return null;
    }

    if (!isText(description) || !isValidDate(timestamp)) {
        return null;
    }

    if (!ACTIVITY_STATUSES.includes(status)) {
        return null;
    }

    return {
        id,
        userId,
        description: description.trim(),
        timestamp,
        status,
        progress: PROGRESS_STEPS.includes(progress) ? progress : 0
    };
}

export function normalizeList(records, normalizeRecord) {
    const valid = records
        .map((record) => normalizeRecord(record))
        .filter((record) => record !== null);

    return { valid, skippedCount: records.length - valid.length };
}

export function countByStatus(users) {
    return STATUSES.reduce((counts, status) => {
        return { ...counts, [status]: users.filter((user) => user.status === status).length };
    }, {});
}

export function filterUsers(users, { query, status, role }) {
    const text = query.trim().toLowerCase();

    return users.filter((user) => {
        const searchable = `${user.name} ${user.email} ${user.role}`.toLowerCase();
        const matchesText = text === "" || searchable.includes(text);
        const matchesStatus = status === "all" || user.status.toLowerCase() === status;
        const matchesRole = role === "all" || user.role === role;

        return matchesText && matchesStatus && matchesRole;
    });
}

export function sortByNewest(users) {
    return [...users].sort((first, second) => {
        return new Date(second.registeredOn).getTime() - new Date(first.registeredOn).getTime();
    });
}

export function paginate(items, page, pageSize) {
    const total = items.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(Math.max(page, 1), pageCount);
    const start = (current - 1) * pageSize;

    return {
        items: items.slice(start, start + pageSize),
        page: current,
        pageCount,
        total,
        from: total === 0 ? 0 : start + 1,
        to: Math.min(start + pageSize, total)
    };
}

export function nextUserId(users) {
    return users.reduce((highest, user) => Math.max(highest, user.id), 0) + 1;
}

export function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

export function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    });
}

export function formatDateTime(isoDateTime) {
    return new Date(isoDateTime).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

export function getInitials(name) {
    const parts = name.trim().split(" ").filter((part) => part !== "");

    if (parts.length === 0) {
        return "?";
    }

    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

    return `${first}${last}`.toUpperCase();
}