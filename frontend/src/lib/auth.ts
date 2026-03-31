import api from "./api";
import type { AuthData, User } from "@/types";

/**
 * Authenticates a user with email and password.
 * Persists the access token and returns the user data.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthData> {
  const data = await api.post<AuthData>("/auth/login", {
    email,
    password,
  });
  localStorage.setItem("accessToken", data.accessToken);
  return data;
}

/**
 * Registers a new user.
 * Persists the access token and returns the user data.
 */
export async function signupUser(
  email: string,
  password: string,
  displayName: string
): Promise<AuthData> {
  const data = await api.post<AuthData>("/auth/signup", {
    email,
    password,
    displayName,
  });
  localStorage.setItem("accessToken", data.accessToken);
  return data;
}

/**
 * Revokes the current session and clears local authentication data.
 */
export async function logoutUser(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("accessToken");
  }
}

/**
 * Retrieves the profile data for the currently authenticated user.
 */
export async function getProfile(): Promise<User> {
  return api.get<User>("/auth/me");
}

/**
 * Checks if an access token exists in local storage.
 * Note: This does not verify the token's validity.
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("accessToken");
}
