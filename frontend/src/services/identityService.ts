import axios from 'axios';
const API_BASE_URL = 'http://localhost:3000';
import { RegisterDIDParams, RegisterIssuerPlatParams } from '../type/type';

export const registerDID = async (params: RegisterDIDParams) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        console.log("ASDSDASDSADDSA:", params);
        const response = await axios.post(`${API_BASE_URL}/identity/registerDID`, params);
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        throw new Error('Failed to register root DID: ');
    }
};

export const loginSystem = async (senderAddress: string, id: string, derSignatureHex: string, msgHash: string, userVeriPublic: string) => {
    console.log("oooooooooooooooooooooooooooooooooooooo");
    console.log("senderAddress:", senderAddress);
    console.log("id:", id);
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/LoginSystem`, {
            senderAddress,
            id,
            derSignatureHex,
            msgHash,
            userVeriPublic
        });
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to LoginSystem');
    }
};

export const loginIssuerPlatform = async (senderAddress: string, id: string, issuerAddress: string) => {
    console.log("oooooooooooooooooooooooooooooooooooooo");
    console.log("senderAddress:", senderAddress);
    console.log("id:", id);
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/loginIssuerPlatform`, {
            senderAddress,
            id,
            issuerAddress
        });
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to LoginSystem');
    }
};


export const updateDID = async (params: RegisterDIDParams) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        const response = await axios.post(`${API_BASE_URL}/identity/updateDID`, params);
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        throw new Error('Failed to register root DID: ');
    }
}


export const getUserDIDs = async (senderAddress: string, userAddress: string) => {
    console.log("oooooooooooooooooooooooooooooooooooooo");
    console.log("senderAddress:", senderAddress);
    console.log("userAddress:", userAddress);
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/getUserDIDs`, {
            senderAddress,
            userAddress
        });
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据

    } catch (error) {
        console.log(error);
        throw new Error('Failed to GetUsersDIDs');
    }
};


export const getUserDIDDocument = async (senderAddress: string, did: string) => {
    console.log("oooooooooooooooooooooooooooooooooooooo");
    console.log("senderAddress:", senderAddress);
    console.log("did:", did);
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/getUserDIDDocument`, {
            senderAddress,
            did
        });
        console.log("responseData:", response.data);
        return response.data;

    } catch (error) {
        console.log(error);
        throw new Error('Failed to GetUsersDIDDocs');
    }
};

export const getVerifyPrivateKey = async (senderAddress: string, did: string) => {
    console.log("oooooooooooooooooooooooooooooooooooooo");
    console.log("senderAddress:", senderAddress);
    console.log("did:", did);
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/getVerifyPrivateKey`, {
            senderAddress,
            did
        });
        console.log("responseData:", response.data);
        return response.data;

    } catch (error) {
        console.log(error);
        throw new Error('Failed to GetUsersDIDDocs');
    }
};

export const addIssuer = async (senderAddress: string, issuerAddress: string) => {
    console.log("oooooooooooooooooooooooooooooooooooooo");
    console.log("senderAddress:", senderAddress);
    console.log("issuerAddress:", issuerAddress);
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/addIssuer`, {
            senderAddress,
            issuerAddress
        });
        console.log("responseData:", response.data);
        return response.data;

    } catch (error) {
        console.log(error);
        throw new Error('Failed to AddIssuer');
    }
};

export const removeIssuer = async (senderAddress: string, issuerAddress: string) => {
    console.log("oooooooooooooooooooooooooooooooooooooo");
    console.log("senderAddress:", senderAddress);
    console.log("issuerAddress:", issuerAddress);
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/removeIssuer`, {
            senderAddress,
            issuerAddress
        });
        console.log("responseData:", response.data);
        return response.data;

    } catch (error) {
        console.log(error);
        throw new Error('Failed to AddIssuer');
    }
};


export const showAllUsers = async (senderAddress: string) => {
    console.log("oooooooooooooooooooooooooooooooooooooo");
    console.log("senderAddress:", senderAddress);
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/showAllUsers`, {
            senderAddress
        });
        console.log("responseData:", response.data);
        return response.data;

    } catch (error) {
        console.log(error);
        throw new Error('Failed to AddIssuer');
    }
};

export const showAllUsersIden = async (senderAddress: string) => {
    console.log("oooooooooooooooooooooooooooooooooooooo");
    console.log("senderAddress:", senderAddress);
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/showAllUsersIden`, {
            senderAddress
        });
        console.log("responseData:", response.data);
        return response.data;

    } catch (error) {
        console.log(error);
        throw new Error('Failed to AddIssuer');
    }
};

export const isAdminUser = async (senderAddress: string) => {
    console.log("oooooooooooooooooooooooooooooooooooooo");
    console.log("senderAddress:", senderAddress);
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/isAdminUser`, {
            senderAddress
        });
        console.log("responseData:", response.data);
        return response.data;

    } catch (error) {
        console.log(error);
        throw new Error('Failed to checkAdmin');
    }
};

export const isIssuerUser = async (senderAddress: string) => {
    console.log("oooooooooooooooooooooooooooooooooooooo");
    console.log("senderAddress:", senderAddress);
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/isIssuerUser`, {
            senderAddress
        });
        console.log("responseData:", response.data);
        return response.data;

    } catch (error) {
        console.log(error);
        throw new Error('Failed to checkIssuer');
    }
};

// 注册子DID
export const registerIssuerPlatDID = async (params: RegisterIssuerPlatParams) => {
    try {
        console.log("ISSUER_REGISTER:", params);
        const response = await axios.post(`${API_BASE_URL}/identity/registerIssuerPlatDID`, params);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        throw new Error('Failed to register sub DID: ');
    }
};

export const getUserPlatDIDs = async (senderAddress: string, userAddress: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/getUserPlatDIDs`, {
            senderAddress, userAddress
        });
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        throw new Error('Failed to register sub DID: ');
    }
};

export const getUserPlatDIDDocument = async (senderAddress: string, did: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/identity/getUserPlatDIDDocument`, {
            senderAddress, did
        });
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        throw new Error('Failed to register sub DID: ');
    }
};

export const getIssuerPlatAllUserDIDDoc = async (senderAddress: string) => {
    try {
        console.log("GET ADDRESS:", senderAddress);
        const response = await axios.post(`${API_BASE_URL}/identity/getIssuerPlatAllUserDIDDoc`, {
            senderAddress
        });
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        throw new Error('Failed to register sub DID: ');
    }
};
