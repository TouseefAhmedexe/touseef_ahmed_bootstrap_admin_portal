const USERS_URL = "data/users.json";
const ACTIVITIES_URL = "data/activities.json";

export async function fetchJson(url) {
    let response;

    try {
        response = await fetch(url, { headers: { Accept: "application/json" } });
    } catch (error) {
        throw new Error("The data could not be reached. Check your connection and try again.");
    }

    if (!response.ok) {
        throw new Error(`The data file ${url} could not be loaded (status ${response.status}).`);
    }

    let data;

    try {
        data = await response.json();
    } catch (error) {
        throw new Error(`The data in ${url} is not valid JSON.`);
    }

    if (!Array.isArray(data)) {
        throw new Error(`The data in ${url} has an unexpected format. A list was expected.`);
    }

    return data;
}

export const loadUsers = () => fetchJson(USERS_URL);

export const loadActivities = () => fetchJson(ACTIVITIES_URL);