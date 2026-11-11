import { loadUsers } from "../shared/api.js";
import debounce from "../shared/debounce.js";
import {
    ROLES,
    filterUsers,
    formatDate,
    nextUserId,
    normalizeList,
    normalizeUser,
    paginate,
    pluralize,
    sortByNewest,
    todayIso
} from "../shared/data-utils.js";
import { createAvatar, createBadge, getBootstrap, makeElement, requireElement } from "../shared/dom.js";
import { initLayout } from "../shared/layout.js";
import { getPreferences } from "../shared/preferences.js";
import { showToast } from "../shared/toast.js";
import { bindLiveValidation, resetValidation, validateForm } from "../shared/validation.js";

initLayout();

const PAGE_SIZE = 5;
const SEARCH_DELAY_MS = 300;
const STATUS_VALUES = ["all", "active", "pending", "inactive"];
const DEFAULT_FILTERS = { query: "", status: "all", role: "all", page: 1 };

const elements = {
    filterForm: requireElement("filter-form"),
    searchInput: requireElement("user-search"),
    roleSelect: requireElement("role-filter"),
    clearButton: requireElement("clear-filters"),
    state: requireElement("users-state"),
    tableWrap: requireElement("table-wrap"),
    tableBody: requireElement("user-table-body"),
    resultCount: requireElement("result-count"),
    paginationNav: requireElement("pagination-nav"),
    pagination: requireElement("pagination")
};
const statusRadios = [...document.querySelectorAll("input[name='status_filter']")];

let users = [];
let skippedCount = 0;
let filters = readFiltersFromUrl();

function readFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status") ?? "all";
    const role = params.get("role") ?? "all";
    const page = Number(params.get("page"));

    return {
        query: (params.get("q") ?? "").trim(),
        status: STATUS_VALUES.includes(status) ? status : "all",
        role: ROLES.includes(role) ? role : "all",
        page: Number.isInteger(page) && page > 0 ? page : 1
    };
}

function writeFiltersToUrl() {
    const params = new URLSearchParams();

    if (filters.query !== "") {
        params.set("q", filters.query);
    }

    if (filters.status !== "all") {
        params.set("status", filters.status);
    }

    if (filters.role !== "all") {
        params.set("role", filters.role);
    }

    if (filters.page > 1) {
        params.set("page", String(filters.page));
    }

    const queryString = params.toString();
    const address = queryString === "" ? window.location.pathname : `${window.location.pathname}?${queryString}`;

    window.history.replaceState({}, "", address);
}

function writeControls() {
    elements.searchInput.value = filters.query;
    elements.roleSelect.value = filters.role;
    statusRadios.forEach((radio) => {
        radio.checked = radio.value === filters.status;
    });
}

function readControls() {
    const checked = statusRadios.find((radio) => radio.checked);

    return {
        query: elements.searchInput.value.trim(),
        status: checked === undefined ? "all" : checked.value,
        role: elements.roleSelect.value
    };
}

function showState(kind, message, action = null) {
    elements.state.textContent = "";
    elements.state.hidden = false;
    elements.tableWrap.classList.add("d-none");
    elements.paginationNav.hidden = true;
    elements.resultCount.textContent = "";

    if (kind === "loading") {
        const row = makeElement("div", "d-flex align-items-center justify-content-center gap-2 p-4");
        const spinner = makeElement("div", "spinner-border spinner-border-sm text-primary");

        spinner.setAttribute("role", "status");
        row.append(spinner, makeElement("span", "", message));
        elements.state.append(row);
        return;
    }

    const isError = kind === "error";
    const alert = makeElement("div", `alert ${isError ? "alert-danger" : "alert-info"} m-3`);

    alert.setAttribute("role", isError ? "alert" : "status");
    alert.append(makeElement("p", "mb-2", message));

    if (action !== null) {
        const button = makeElement("button", `btn btn-sm ${isError ? "btn-outline-danger" : "btn-outline-primary"}`, action.label);

        button.type = "button";
        button.addEventListener("click", action.onClick);
        alert.append(button);
    }

    elements.state.append(alert);
}

function hideState() {
    elements.state.hidden = true;
    elements.state.textContent = "";
    elements.tableWrap.classList.remove("d-none");
}

function buildActionButton(user, mode) {
    const isEdit = mode === "edit";
    const button = makeElement("button", `btn ${isEdit ? "btn-outline-primary" : "btn-outline-danger"}`, isEdit ? "Edit" : "Delete");

    button.type = "button";
    button.dataset.bsToggle = "modal";
    button.dataset.bsTarget = isEdit ? "#user-modal" : "#delete-modal";
    button.dataset.mode = mode;
    button.dataset.userId = String(user.id);
    button.setAttribute("aria-label", `${isEdit ? "Edit" : "Delete"} ${user.name}`);
    return button;
}

function buildActions(user) {
    const group = makeElement("div", "btn-group btn-group-sm");

    group.setAttribute("role", "group");
    group.setAttribute("aria-label", `Actions for ${user.name}`);
    group.append(buildActionButton(user, "edit"), buildActionButton(user, "delete"));
    return group;
}

function buildRow(user) {
    const row = document.createElement("tr");
    const nameCell = makeElement("td");
    const person = makeElement("div", "d-flex align-items-center gap-2");
    const text = makeElement("div");
    const dateCell = makeElement("td", "d-none d-lg-table-cell");
    const time = document.createElement("time");
    const statusCell = makeElement("td");
    const actionCell = makeElement("td", "text-end");

    text.append(
        makeElement("div", "fw-semibold", user.name),
        makeElement("div", "small text-body-secondary d-md-none", user.email)
    );
    person.append(createAvatar(user), text);
    nameCell.append(person);

    time.dateTime = user.registeredOn;
    time.textContent = formatDate(user.registeredOn);
    dateCell.append(time);

    statusCell.append(createBadge(user.status));
    actionCell.append(buildActions(user));

    row.append(
        nameCell,
        makeElement("td", "d-none d-md-table-cell", user.email),
        makeElement("td", "", user.role),
        dateCell,
        statusCell,
        actionCell
    );
    return row;
}

function buildPageItem(label, page, { active = false, disabled = false, name = label } = {}) {
    const classes = ["page-item", active ? "active" : "", disabled ? "disabled" : ""]
        .filter((className) => className !== "")
        .join(" ");
    const item = makeElement("li", classes);
    const button = makeElement("button", "page-link", label);

    button.type = "button";
    button.dataset.page = String(page);
    button.disabled = disabled;
    button.setAttribute("aria-label", name);

    if (active) {
        item.setAttribute("aria-current", "page");
    }

    item.append(button);
    return item;
}

function renderPagination({ page, pageCount }) {
    elements.pagination.textContent = "";
    elements.paginationNav.hidden = pageCount <= 1;

    if (pageCount <= 1) {
        return;
    }

    elements.pagination.append(buildPageItem("Previous", page - 1, { disabled: page === 1, name: "Previous page" }));

    for (let number = 1; number <= pageCount; number += 1) {
        elements.pagination.append(buildPageItem(String(number), number, { active: number === page, name: `Page ${number}` }));
    }

    elements.pagination.append(buildPageItem("Next", page + 1, { disabled: page === pageCount, name: "Next page" }));
}

function render() {
    if (users.length === 0) {
        showState("empty", "There are no users in the list. Reload the page to load the sample data again.", {
            label: "Reload the page",
            onClick: () => window.location.reload()
        });
        return;
    }

    const matches = sortByNewest(filterUsers(users, filters));

    if (matches.length === 0) {
        writeFiltersToUrl();
        showState("empty", "No users match your search. Try other words or clear the filters.", {
            label: "Clear filters",
            onClick: clearFilters
        });
        return;
    }

    const pageData = paginate(matches, filters.page, PAGE_SIZE);
    const filtered = matches.length === users.length ? "" : ` (filtered from ${users.length})`;
    const verb = skippedCount === 1 ? "was" : "were";
    const skipped = skippedCount === 0 ? "" : ` ${pluralize(skippedCount, "record")} could not be used and ${verb} skipped.`;

    filters = { ...filters, page: pageData.page };
    writeFiltersToUrl();
    hideState();

    elements.tableBody.textContent = "";
    elements.tableBody.append(...pageData.items.map((user) => buildRow(user)));
    elements.resultCount.textContent = `Showing ${pageData.from}-${pageData.to} of ${pluralize(pageData.total, "user")}${filtered}.${skipped}`;
    renderPagination(pageData);
}

function clearFilters() {
    filters = { ...DEFAULT_FILTERS };
    writeControls();
    render();
    elements.searchInput.focus();
}

function applyFilters(changes) {
    if (users.length === 0) {
        return;
    }

    filters = { ...filters, ...changes };
    render();
}

function handleFilterChange() {
    applyFilters({ ...readControls(), page: 1 });
}

elements.filterForm.addEventListener("submit", (event) => event.preventDefault());
elements.searchInput.addEventListener("input", debounce(handleFilterChange, SEARCH_DELAY_MS));
elements.roleSelect.addEventListener("change", handleFilterChange);
statusRadios.forEach((radio) => radio.addEventListener("change", handleFilterChange));

elements.clearButton.addEventListener("click", () => {
    if (users.length > 0) {
        clearFilters();
    }
});

elements.pagination.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");

    if (button === null || button.disabled) {
        return;
    }

    applyFilters({ page: Number(button.dataset.page) });

    const current = elements.pagination.querySelector(".active .page-link");

    if (current !== null) {
        current.focus();
    }
});

const userModalElement = requireElement("user-modal");
const userForm = requireElement("user-form");
const modalTitle = requireElement("user-modal-title");
const saveButton = requireElement("user-save");
const deleteModalElement = requireElement("delete-modal");
const deleteName = requireElement("delete-name");
const deleteConfirm = requireElement("delete-confirm");
const fields = {
    name: requireElement("user-name"),
    email: requireElement("user-email"),
    role: requireElement("user-role"),
    status: requireElement("user-status"),
    date: requireElement("user-date")
};

const openAddOnLoad = new URLSearchParams(window.location.search).get("add") === "1";

let editingId = null;

function announce(message) {
    if (getPreferences().toastUsers) {
        showToast(message, "info");
    }
}

function findUser(id) {
    return users.find((user) => user.id === id);
}

function checkEmailUnique() {
    const email = fields.email.value.trim().toLowerCase();
    const taken = users.some((user) => user.email.toLowerCase() === email && user.id !== editingId);

    fields.email.setCustomValidity(taken ? "That email address is already used by another user." : "");
}

function prepareForm(mode, user) {
    const isEdit = mode === "edit";

    userForm.reset();
    resetValidation(userForm);
    editingId = isEdit ? user.id : null;
    modalTitle.textContent = isEdit ? "Edit user" : "Add user";
    saveButton.textContent = isEdit ? "Save changes" : "Add user";
    fields.date.max = todayIso();

    if (isEdit) {
        fields.name.value = user.name;
        fields.email.value = user.email;
        fields.role.value = user.role;
        fields.status.value = user.status;
        fields.date.value = user.registeredOn;
    } else {
        fields.date.value = todayIso();
    }

    checkEmailUnique();
}

function readUserForm() {
    const data = new FormData(userForm);

    return {
        name: data.get("full_name").trim(),
        email: data.get("email_address").trim(),
        role: data.get("role"),
        status: data.get("status"),
        registeredOn: data.get("registered_on")
    };
}

userModalElement.addEventListener("show.bs.modal", (event) => {
    const trigger = event.relatedTarget;
    const mode = trigger?.dataset.mode ?? "add";
    const user = mode === "edit" ? findUser(Number(trigger.dataset.userId)) : undefined;

    if (mode === "edit" && user === undefined) {
        event.preventDefault();
        showToast("That user could not be found.", "danger");
        return;
    }

    prepareForm(mode, user);
});

userModalElement.addEventListener("shown.bs.modal", () => fields.name.focus());

userForm.addEventListener("submit", (event) => {
    event.preventDefault();
    userForm.dataset.submitted = "true";
    checkEmailUnique();

    if (!validateForm(userForm)) {
        return;
    }

    const wasEdit = editingId !== null;
    const existing = wasEdit ? findUser(editingId) : undefined;
    const candidate = normalizeUser({
        id: wasEdit ? editingId : nextUserId(users),
        avatar: existing?.avatar ?? "",
        ...readUserForm()
    });

    if (candidate === null) {
        showToast("The answers could not be used. Check the form and try again.", "danger");
        return;
    }

    if (wasEdit) {
        users = users.map((user) => (user.id === candidate.id ? candidate : user));
    } else {
        users = [...users, candidate];
        filters = { ...DEFAULT_FILTERS };
        writeControls();
    }

    getBootstrap().Modal.getOrCreateInstance(userModalElement).hide();
    render();
    announce(wasEdit ? `${candidate.name} was updated.` : `${candidate.name} was added to the list.`);
});

deleteModalElement.addEventListener("show.bs.modal", (event) => {
    const trigger = event.relatedTarget;
    const user = trigger ? findUser(Number(trigger.dataset.userId)) : undefined;

    if (user === undefined) {
        event.preventDefault();
        return;
    }

    deleteName.textContent = user.name;
    deleteConfirm.dataset.userId = String(user.id);
});

deleteModalElement.addEventListener("hidden.bs.modal", () => {
    if (document.activeElement === document.body) {
        elements.searchInput.focus();
    }
});

deleteConfirm.addEventListener("click", () => {
    const user = findUser(Number(deleteConfirm.dataset.userId));

    getBootstrap().Modal.getOrCreateInstance(deleteModalElement).hide();

    if (user === undefined) {
        return;
    }

    users = users.filter((item) => item.id !== user.id);
    render();
    announce(`${user.name} was removed from this list. Reload the page to load the sample data again.`);
});

function openAddFromUrl() {
    if (openAddOnLoad && users.length > 0) {
        getBootstrap().Modal.getOrCreateInstance(userModalElement).show();
    }
}

bindLiveValidation(userForm);
fields.email.addEventListener("input", checkEmailUnique);

async function loadData() {
    showState("loading", "Loading users...");

    try {
        const rawUsers = await loadUsers();
        const result = normalizeList(rawUsers, normalizeUser);

        users = result.valid;
        skippedCount = result.skippedCount;
        writeControls();
        render();
    } catch (error) {
        showState("error", error.message, { label: "Try again", onClick: loadData });
    }
}

loadData().then(openAddFromUrl);