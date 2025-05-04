
const axios = require("axios");
const FormData = require("form-data");


const uploadDataToIPFS = async (data, filename) => {
    const formData = new FormData();
    // 关键：字段名必须为 "file"，数据可以是字符串/Buffer
    formData.append("file", Buffer.from(data), filename);

    try {
        const response = await axios.post(
            "http://localhost:5001/api/v0/add",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                },
            }
        );
        return response.data.Hash;
    } catch (error) {
        console.error("上传失败:", error.response?.data || error.message);
        return null;
    }
};


const readDataFromIPFS = async (cid) => {
    try {
        const response = await axios.get(
            `http://localhost:8080/ipfs/${cid}`,
            {
                responseType: "text", // 根据数据类型调整（如 "json"、"arraybuffer"）
            }
        );
        return response.data;
    } catch (error) {
        console.error("读取失败:", error.message);
        return null;
    }
};

module.exports = {
    uploadDataToIPFS,
    readDataFromIPFS
}