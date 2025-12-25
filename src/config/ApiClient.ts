import { ApiClient } from "@twurple/api";
import { authProvider } from "../auth/AuthProvider";

export const apiClient = new ApiClient({ authProvider });
