export const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "-";

export const money = (value) =>
    Number(value || 0).toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    });
