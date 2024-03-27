import axios  from 'axios';
import axiosInstance from './axios'

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

export const cancelRequest = () => source.cancel();

export const request = (config) => axiosInstance.request(config);

export const multipleRequest = (requests) => axios.all(requests);