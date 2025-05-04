
import axios from 'axios';
const API_BASE_URL = 'http://localhost:3000';


export const getLog = async () => {
    try {
        const response = await axios.post(`${API_BASE_URL}/log/getLogs`);
        console.log("LOG:", response);
        return response.data;
    } catch (error) {
        throw new Error('Failed to get log');
    }
};