import axios from "axios";

const API = axios.create({
  baseURL: "https://api.odpay.in/api",
});

// Add request interceptor to dynamically set Authorization header
API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;

// import axios from "axios";

// // Helper function to get token from sessionStorage
// const getAuthToken = () => {
//   return sessionStorage.getItem("authToken") || "";
// };

// const API = axios.create({
//   baseURL: "https://staging.odpay.in/api",
// });

// // Add request interceptor to dynamically set Authorization header
// API.interceptors.request.use(
//   (config) => {
//     const token = getAuthToken();
//     if (token) {
//       config.headers.Authorization = token;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default API;
