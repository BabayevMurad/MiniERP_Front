import axios from "axios";

const API_URL = "http://127.0.0.1:8000/auth";

export const loginUser = async (username, password) => {
  const res = await axios.post(`${API_URL}/login`, { username, password });
  return res.data;
};

export const registerUser = async (username, password, role) => {
  const res = await axios.post(`${API_URL}/register`, { username, password, role });
  return res.data;
};
