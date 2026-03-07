const axios = require("axios");
const FormData = require("form-data");
const { aiServiceUrl, requestTimeoutMs } = require("../config/env");

async function detectFromBuffer(file) {
  const formData = new FormData();
  formData.append("frame", file.buffer, {
    filename: file.originalname || "frame.jpg",
    contentType: file.mimetype || "application/octet-stream",
  });

  const response = await axios.post(`${aiServiceUrl}/detect`, formData, {
    headers: {
      ...formData.getHeaders(),
    },
    timeout: requestTimeoutMs,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return response.data;
}

module.exports = {
  detectFromBuffer,
};
