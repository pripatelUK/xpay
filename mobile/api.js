import axios from "axios";

export const api = axios.create({
  baseURL: `http://192.168.0.31:3333/auth`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
