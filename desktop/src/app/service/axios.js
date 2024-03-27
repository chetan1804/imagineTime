import axios from 'axios';
import { BASE_URL, LOGIN_API } from '../utility/constants';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {'Content-Type': 'application/json'},
});

axiosInstance.interceptors.request.use(
  async (config) => {
    if (config.url !== LOGIN_API) {
      config.withCredentials = true;
    }
    
    // console.info('config : ', config);
    return config;
  },
  (error) => {
    console.error('error : ', error);

    return Promise.reject (error);
  }
);

export default axiosInstance;