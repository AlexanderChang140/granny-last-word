export default async function fetchSafe<T>(
    url: string,
    options?: RequestInit,
    msg?: string,
): Promise<T> {
    const res = await fetch(url, options);
    if (!res.ok) {
        const err = msg ?? `Request failed: ${res.status}`;
        throw new Error(err);
    }
    return res.json();
}
