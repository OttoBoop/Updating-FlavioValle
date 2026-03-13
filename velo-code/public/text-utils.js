// public/text-utils.js - V4 name helpers

export function combineNames(firstName, lastName) {
    const first = normalizeNamePart(firstName);
    const last = normalizeNamePart(lastName);

    if (!first && !last) {
        return '';
    }

    if (!first) {
        return last;
    }

    if (!last) {
        return first;
    }

    return `${first} ${last}`;
}

export function normalizeNamePart(value) {
    return String(value || '')
        .trim()
        .replace(/\s+/g, ' ');
}
