const AUTH_KEYS = [
    "accessToken",
    "refreshToken",
    "user",
    "rememberMe",
    "token"
];

const safeParse = (value) => {
    try {
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

const getValue = (key) =>
    localStorage.getItem(key) || sessionStorage.getItem(key);

const getRememberedStorage = () =>
    localStorage.getItem("rememberMe") === "true"
        ? localStorage
        : sessionStorage;

export const getAccessToken = () =>
    getValue("accessToken") || getValue("token");

export const getRefreshToken = () => getValue("refreshToken");

export const getStoredUser = () => safeParse(getValue("user"));

export const getStoredAuth = () => ({
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    user: getStoredUser(),
    rememberMe: localStorage.getItem("rememberMe") === "true"
});

export const storeAuth = ({
    accessToken,
    refreshToken,
    user,
    rememberMe = false
}) => {
    clearAuth();

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("accessToken", accessToken);
    storage.setItem("refreshToken", refreshToken);
    storage.setItem("user", JSON.stringify(user));
    storage.setItem("rememberMe", String(Boolean(rememberMe)));
};

export const updateStoredTokens = ({ accessToken, refreshToken, user }) => {
    const storage = getRememberedStorage();

    if (accessToken) {
        storage.setItem("accessToken", accessToken);
    }

    if (refreshToken) {
        storage.setItem("refreshToken", refreshToken);
    }

    if (user) {
        storage.setItem("user", JSON.stringify(user));
    }
};

export const updateStoredUser = (user) => {
    getRememberedStorage().setItem("user", JSON.stringify(user));
};

export const clearAuth = () => {
    AUTH_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
};
