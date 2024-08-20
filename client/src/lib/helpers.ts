// A simpler fetch() method
interface RequestOptions<T extends "fetch" | "function"> {
    method: "POST" | "GET" | "PUT" | "DELETE";
    body?: T extends "fetch" ? string : any;
    headers?: any;
    credentials?: RequestCredentials | undefined;
}

export async function F({
    endpoint,
    method = "GET",
    body,
    headers = {},
    extra = {},
    credentials = "include",
}: RequestOptions<"function"> & {
    endpoint: string;
    extra?: any;
    body?: any;
}): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!headers?.["Content-Type"]) headers["Content-Type"] = "application/json";

        const options: RequestOptions<"fetch"> = {
            method,
            headers,
            ...extra,
        };

        if (body) options["body"] = JSON.stringify(body);
        if (credentials) options["credentials"] = "include";

        fetch(process.env.REACT_APP_API + "/api" + endpoint, options)
            .then(async res => {
                if (!res.ok) return reject(await res.json());
                return await res.json();
            })
            .then(res => resolve(res))
            .catch(err => reject(err));
    });
}

// Date to DD/MM/YYYY Format
export function formatDate(date: Date): string {
    // Extract day, month, and year from the date object
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    // Return formatted date string
    return `${day}/${month}/${year}`;
}

export function secondsToMMSS(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // Pad minutes and seconds with leading zeros if needed
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = remainingSeconds.toString().padStart(2, '0');

    return `${minutesStr}:${secondsStr}`;
}

// Truncating wallet addresses
export function truncateWalletAddress(walletAddress: string, prefixLength = 10, suffixLength = 6): string {
    // Check if the wallet address is valid
    if (typeof walletAddress !== "string" || walletAddress.length < prefixLength + suffixLength)
        return walletAddress; // Return the original address if it's invalid or too short

    // Extract the prefix and suffix parts of the address
    const prefix = walletAddress.substring(0, prefixLength);
    const suffix = walletAddress.substring(walletAddress.length - suffixLength);

    // Generate the truncated address with prefix, ellipsis, and suffix
    const truncatedAddress = `${prefix}...${suffix}`;

    return truncatedAddress;
}

// Returns color based on given string
export function stringToColor(str: string): string {
    let hash = 0;
    str.split("").forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash);
    });
    let colour = "#";
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        colour += value.toString(16).padStart(2, "0");
    }

    return colour;
}

// A timeout function
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error("Request timed out"));
        }, ms);
    });

    return Promise.race([promise, timeout]);
}
