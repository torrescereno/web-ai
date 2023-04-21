export const getStorageData = (keyName: string, defaultValue: string) => {
    if (typeof window !== "undefined") {
        const savedItem: string = localStorage.getItem(keyName) || "";
        return savedItem || defaultValue;
    }
}

