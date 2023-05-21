require('dotenv').config();
const axios = require('axios');
const fs = require('fs');



async function sendMessage(message, files, chatID, botToken) {
    if (!message) return null;

    if (!chatID) chatID = process.env.CHAT_ID;
    if (!botToken) botToken = process.env.BOT_TOKEN;

    try {
        const formData = new FormData();
        formData.append('chat_id', chatID);
        formData.append('text', message);
        if (files) {
            if (Array.isArray(files)) {
                files.forEach(file => {
                    formData.append('document', fs.createReadStream(file));
                });
            } else if (typeof (files) === 'string') {
                formData.append('document', fs.createReadStream(files));
            }
        }

        const response = await axios.post(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        return response;

    } catch (err) {
        console.error(err);
    }
}





module.exports = {
    sendMessage
}