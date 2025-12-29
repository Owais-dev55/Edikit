import { baseUrl } from "@/utils/constant";
import axios from "axios";
import { clearUser, setUser } from "@/redux/slices/authSlice";
import { AppDispatch } from "@/redux/store";
import { getInitialsAvatar } from "@/utils/getInitialsAvatar";

declare global {
  interface Window {
    AppleID: {
      auth: {
        signIn: () => Promise<{
          authorization: {
            id_token: string;
          };
          user?: {
            name?: {
              firstName?: string;
              lastName?: string;
            };
          };
        }>;
      };
    };
  }
}

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Add Bearer token if cookie not available (mobile browser fallback)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("user_token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Token added to request header");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

//login user endpoint
export const loginUser = async (
  email: string,
  password: string,
  dispatch: AppDispatch
) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });

    if (data.token) {
      localStorage.setItem("user_token", data.token);
    }

    const avatar = data.avatar?.startsWith("http")
      ? data.avatar
      : getInitialsAvatar(data.fullName);

    const userWithAvatar = { ...data, avatar };
    dispatch(setUser(userWithAvatar));
    return data;
  } catch (error) {
    throw error;
  }
};

export const refreshUser = async (dispatch: AppDispatch) => {
  console.log("🔄 refreshUser called");

  try {
    const { data } = await api.get("/auth/me");
    console.log("✅ /auth/me success:", data);

    const avatar = data.avatar?.startsWith("http")
      ? data.avatar
      : getInitialsAvatar(data.fullName);
    dispatch(setUser({ ...data, avatar }));
  } catch (error: unknown) {
    console.log("❌/auth/me failed", error);

    // Only remove token if we get a 401 (Unauthorized) - means token is invalid
    // Don't remove on network errors or other issues
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 401) {
      console.log("🔒 401 Unauthorized - removing invalid token");
      dispatch(clearUser());
    } else {
      console.log(
        "⚠️ Auth check failed but keeping token (might be network issue)"
      );
      // Keep token for retry, but clear user state
      dispatch(clearUser());
    }
  }
};

//signup user endpoint
export const signupUser = async (
  fullName: string,
  email: string,
  password: string,
  dispatch: AppDispatch
) => {
  const { data } = await api.post("/auth/register", {
    fullName,
    email,
    password,
  });

  if (data.token) {
    localStorage.setItem("user_token", data.token);
  }

  const avatar = data.avatar?.startsWith("http")
    ? data.avatar
    : getInitialsAvatar(data.fullName);

  const userWithAvatar = { ...data, avatar };
  dispatch(setUser(userWithAvatar));

  return data;
};

export const appleLogin = async (dispatch: AppDispatch) => {
  const response = await window.AppleID.auth.signIn();

  const res = await fetch(`${baseUrl}/auth/apple`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      identityToken: response.authorization.id_token,
      fullName:
        response.user?.name?.firstName + " " + response.user?.name?.lastName,
    }),
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("user_token", data.token);
  }

  if (res.ok && data) {
    const avatar = data.avatar?.startsWith("http")
      ? data.avatar
      : getInitialsAvatar(data.fullName);
    dispatch(setUser({ ...data, avatar }));
  }

  console.log("Logged in user:", data);
  return data;
};

export const logoutUser = async (dispatch: AppDispatch) => {
  try {
    await api.post("/auth/logout");
    localStorage.removeItem("user_token");
    dispatch(clearUser());
  } catch {
    localStorage.removeItem("user_token");
    dispatch(clearUser());
  }
};

export const handleGoogleLogin = async () => {
  window.location.href = `${baseUrl}/auth/google`;
  const { data } = await api.get("/auth/me");
  localStorage.setItem("user", JSON.stringify(data));
  console.log("Logged in user:", data);
  return data;
};
