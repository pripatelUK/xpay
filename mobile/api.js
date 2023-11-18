import axios from "axios";

export const api = axios.create({
  baseURL: `http://192.168.1.102:3333/auth`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
