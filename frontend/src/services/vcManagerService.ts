import axios from 'axios';
const API_BASE_URL = 'http://localhost:3000';  // 这里假设后端API运行在localhost:5000

import { applyData, IssueVCParams, ViewedStatus } from '../type/type';
import { ethers } from 'ethers';

import { secp256k1 } from '@noble/curves/secp256k1';
import { getUserDIDDocument, getVerifyPrivateKey } from './identityService';


export const issuerVC = async (params: IssueVCParams) => {
    console.log("99999999999999999999999999999");

    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        const response = await axios.post(`${API_BASE_URL}/vcManage/issuerVC`, params);
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};

export const verifyVC = async (senderAddress: string, vcId: string, didId: string) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        console.log("VCID:", vcId);
        const response = await axios.post(`${API_BASE_URL}/vcManage/verifyVC`, {
            senderAddress, vcId, didId,
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};


export const getVC = async (senderAddress: string, vcId: string) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        const response = await axios.post(`${API_BASE_URL}/vcManage/getVC`, {
            senderAddress,
            vcId,
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};


export const showVCID = async (senderAddress: string, subjectAddress: string) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        const response = await axios.post(`${API_BASE_URL}/vcManage/showVCID`, {
            senderAddress,
            subjectAddress,
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        throw new Error('Failed to register root DID: ');
    }
};

export const showIssuedVCID = async (senderAddress: string, issuerAddress: string) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        const response = await axios.post(`${API_BASE_URL}/vcManage/showIssuedVCID`, {
            senderAddress,
            issuerAddress,
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};

export const submitApplication = async (senderAddress: string, issuerAddress: string, vcType: string, data: Record<string, any>) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        console.log("senderAddress:", senderAddress);
        const response = await axios.post(`${API_BASE_URL}/vcManage/submitApplication`, {
            senderAddress, issuerAddress, vcType, data
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};
export const approveApplication = async (senderAddress: string, applicationId: string) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        console.log("senderAddress:", senderAddress);
        console.log("applicationId:", applicationId);

        // const applicationIdBigInt = ethers.getBigInt(applicationId);

        const response = await axios.post(`${API_BASE_URL}/vcManage/approveApplication`, {
            senderAddress,
            applicationId,
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};
export const getApplicationIds = async (senderAddress: string, userAddress: string) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        console.log("oooooooooooooooooooooooooooooooooooooosenderAddress:", senderAddress);
        console.log("oooooooooooooooooooooooooooooooooooooouserAddress:", userAddress);

        const response = await axios.post(`${API_BASE_URL}/vcManage/getApplicationIds`, {
            senderAddress,
            userAddress,
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};
export const getIssuerApplications = async (issuerAddress: string) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        console.log("senderAddress:", issuerAddress);
        const response = await axios.post(`${API_BASE_URL}/vcManage/getIssuerApplications`, {
            issuerAddress,
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};
export const getApplication = async (senderAddress: string, applicationId: string) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        console.log("senderAddress:", senderAddress);
        console.log("applicationId:", applicationId);
        // const applicationIdBigInt = ethers.getBigInt(applicationId);


        const response = await axios.post(`${API_BASE_URL}/vcManage/getApplication`, {
            senderAddress,
            applicationId,
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};

export const revokeVC = async (senderAddress: string, vcId: string) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        console.log("senderAddress:", senderAddress);
        console.log("vcID:", vcId);
        const response = await axios.post(`${API_BASE_URL}/vcManage/revokeVC`, {
            senderAddress,
            vcId,
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};

export const setVP = async (senderAddress: string, id: string, vpShow: ViewedStatus) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        console.log("senderAddress:", senderAddress);
        console.log("id:", id);
        console.log("vpShow:", vpShow);

        const response = await axios.post(`${API_BASE_URL}/vcManage/setVP`, {
            senderAddress,
            id,
            vpShow
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};

export const getVPShow = async (senderAddress: string, vcId: string) => {
    try {
        console.log("oooooooooooooooooooooooooooooooooooooo");
        console.log("senderAddress:", senderAddress);
        console.log("vcID:", vcId);
        const response = await axios.post(`${API_BASE_URL}/vcManage/getVPShow`, {
            senderAddress,
            vcId,
        });
        console.log("response:", response);
        console.log("responseData:", response.data);
        return response.data;  // 返回后端返回的数据
    } catch (error) {
        console.log(error);
        throw new Error('Failed to register root DID: ');
    }
};

