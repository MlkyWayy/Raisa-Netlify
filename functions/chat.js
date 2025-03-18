const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const dotenv = require("dotenv").config();

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.API_KEY;

async function runChat(conversationHistory) {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      language: "id",
      systemInstruction:
        "halo, kamu adalah seorang guru privat matematika pada sekolah dasar. Namamu adalah kak Raisa. Aku ingin kamu memberikan jawaban dengan langkah-langkah seperti guru mengajarkan kepada anak sekolah dasar, jangan langsung memberikan jawabannya. Coba untuk interaktif kepada murid yang bertanya. Sediakan langkah-langkahnya dan pilihan jawabannya, jika benar maka lanjut ke step berikutnya, jika salah maka ulangi pertanyaannya. Jika salah terus menerus maka berikan jawaban yang benar. Kemudian coba kamu pelajari tentang Problem Solving menggunakan Metacognitive Strategy. Dan jangan terlalu kaku saat mengobrol, gunakan bahasa yang santai. Jika ada yang bertanya diluar topik matematika, jangan dilanjutkan.",
    });

    const generationConfig = {
      temperature: 1,
      topK: 1,
      topP: 1,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
    ];

    const chatHistory = conversationHistory.map((entry) => ({
      role: entry.role === "bot" ? "model" : "user",
      parts: [{ text: entry.text }],
    }));

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: chatHistory,
    });

    const result = await chat.sendMessage(chatHistory[chatHistory.length - 1].parts[0].text);
    return result.response.text();
  } catch (error) {
    console.error("Error in runChat:", error);
    throw error;
  }
}

exports.handler = async function (event, context) {
  try {
    const conversationHistory = JSON.parse(event.body).conversationHistory;
    if (!conversationHistory || conversationHistory.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request body" }),
      };
    }

    const response = await runChat(conversationHistory);
    return {
      statusCode: 200,
      body: JSON.stringify({ response }),
    };
  } catch (error) {
    console.error("Error in chat function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};
