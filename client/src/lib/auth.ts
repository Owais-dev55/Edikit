import { baseUrl } from "@/utils/constant";
import axios from "axios";
import { clearUser, setUser } from "@/redux/slices/authSlice";
import { AppDispatch } from "@/redux/store";
import { getInitialsAvatar } from "@/utils/getInitialsAvatar";

declare global {
  interface Window {
    AppleID: {
      auth: {
        signIn: () => Promise<any>;
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

export default api;

//login user endpoint
export const loginUser = async (
  email: string,
  password: string,
  dispatch: AppDispatch
) => {
  try {
    const { data } = await api.post("/auth/login", { email, password });
    // Use avatar URL from server if available, otherwise generate initials
    const avatar = data.avatar?.startsWith("http")
      ? data.avatar
      : getInitialsAvatar(data.fullName);

    localStorage.setItem("user", JSON.stringify(data));
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

    // Use avatar URL from server if available, otherwise generate initials
    const avatar = data.avatar?.startsWith("http")
      ? data.avatar
      : getInitialsAvatar(data.fullName);
    dispatch(setUser({ ...data, avatar }));
  } catch (error) {
    console.log("❌ /auth/me failed", error);
    dispatch(clearUser());
  }
};

//signup user endpoint
export const signupUser = async (
  fullName: string,
  email: string,
  password: string
) => {
  const { data } = await api.post("/auth/register", {
    fullName,
    email,
    password,
  });

  return data;
};

export const appleLogin = async () => {
  const response = await window.AppleID.auth.signIn();

  const res = await fetch(`${baseUrl}/auth/apple`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identityToken: response.authorization.id_token,
      fullName:
        response.user?.name?.firstName + " " + response.user?.name?.lastName,
    }),
  });

  const data = await res.json();
  console.log("Logged in user:", data);
};

export const logoutUser = async (dispatch: AppDispatch) => {
  try {
    await api.post("/auth/logout");
    localStorage.removeItem("user");
    dispatch(clearUser());
  } catch {
    localStorage.removeItem("user");
    dispatch(clearUser());
  }
};

export const  handleGoogleLogin = async () => {
    window.location.href = `${baseUrl}/auth/google`;
    const { data } = await api.get("/auth/me")
    localStorage.setItem("user", JSON.stringify(data));
    console.log("Logged in user:", data);
    return data;
  };