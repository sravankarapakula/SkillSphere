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

// Use sessionStorage exclusively to support independent multi-account testing in separate tabs
const getValue = (key) => sessionStorage.getItem(key);

export const getAccessToken = () =>
    getValue("accessToken") || getValue("token");

export const getRefreshToken = () => getValue("refreshToken");

export const getStoredUser = () => safeParse(getValue("user"));

export const getStoredAuth = () => ({
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    user: getStoredUser(),
    rememberMe: false
});

export const storeAuth = ({
    accessToken,
    refreshToken,
    user,
    rememberMe = false
}) => {
    // Clear both localStorage and sessionStorage to purge any old stale states
    clearAuth();

    const storage = sessionStorage;
    storage.setItem("accessToken", accessToken);
    storage.setItem("refreshToken", refreshToken);
    storage.setItem("user", JSON.stringify(user));
    storage.setItem("rememberMe", "false");
};

export const updateStoredTokens = ({ accessToken, refreshToken, user }) => {
    const storage = sessionStorage;

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
    sessionStorage.setItem("user", JSON.stringify(user));
};

export const clearAuth = () => {
    AUTH_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
};
