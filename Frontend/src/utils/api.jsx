import axios from "axios";
import Cookies from "js-cookie"; 

const API_URL = "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get("jwt_token"); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const signup = async (name, username, password) => {
  try {
    const response = await apiClient.post("/auth/signup", {
      name,
      username,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const login = async (username, password) => {
  try {
    const response = await apiClient.post("/auth/login", {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

export const getCategories = async (page, limit) => {
  try {
    const response = await apiClient.get("/ctable", {
      params: { page, limit },
    });
    return response.data;
  } catch (err) {
    console.error(err);
    throw new Error(err.response?.data?.message || "No data");
  }
};

export const getProducts = async (
  categoryName,
  minPrice,
  maxPrice,
  minUnits,
  maxUnits,
  page,
  limit
) => {
  try {
    const response = await apiClient.get("/ptable", {
      params: {
        categoryName: categoryName,
        minPrice: minPrice || 0,
        maxPrice: maxPrice || Infinity,
        minUnits: minUnits || 0,
        maxUnits: maxUnits || Infinity,
        page,
        limit,
      },
    });
    return response.data;
  } catch (err) {
    console.error(err);
    throw new Error(err.response?.data?.message || "No data");
  }
};

export const searchProducts = async (query, categoryName, page, limit) => {
  try {
    const response = await apiClient.get("/search", {
      params: {
        query,
        categoryName: categoryName.join(","),
        page,
        limit,
      },
    });
    return response.data;
  } catch (err) {
    console.error(err);
    throw new Error(err.response?.data?.message || "Search failed");
  }
};
