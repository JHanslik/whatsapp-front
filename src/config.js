import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"
    : "http://localhost:5000/api";

export const CLOUDINARY_URL =
  "https://res.cloudinary.com/dxgxkqwxm/image/upload";
