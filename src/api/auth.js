import axios from "axios";

const API_URL = "http://127.0.0.1:8000/auth";

export const loginUser = async (username, password) => {
  const payload = { username, password };
  const res = await axios.post(`${API_URL}/login`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};

export const registerUser = async (username, password, role, email) => {
  const payload = { username, password, role, email };
  const res = await axios.post(`${API_URL}/register`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};
