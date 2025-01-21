const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const BOT_TOKEN = '7373279424:AAF8FeR1hutyA9-AMgbq710FSV3HWcjxrpc';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const translationAPI = 'https://translator-api-2l1a.onrender.com/translate';

const languageCodeMap = {
  Amharic: 'am',
  English: 'en',
  Oromifa: 'om',
  Arabic: 'ar',
  Tigrinya: 'ti',
//   Sidama: 'sid',
  Somali: 'so',
  Afar: 'aa',
};

const userState = {};

const createLanguageButtons = () => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'Amharic', callback_data: 'Amharic' },
        { text: 'English', callback_data: 'English' },
      ],
      [
        { text: 'Oromifa', callback_data: 'Oromifa' },
        { text: 'Arabic', callback_data: 'Arabic' },
      ],
      [
        { text: 'Tigrinya', callback_data: 'Tigrinya' },
        { text: 'Sidama', callback_data: 'Sidama' },
      ],
      [
        { text: 'Somali', callback_data: 'Somali' },
        { text: 'Afar', callback_data: 'Afar' },
      ],
    ],
  },
});

const translateMessage = async (text, from, to) => {
  try {
    const response = await axios.post(translationAPI, { from, to, text });
    return response.data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return 'Translation failed.';
  }
};

bot.onText(/\/nowstart/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;

  userState[msg.from.id] = { step: 'SELECT_LANGUAGE' };

  const message = `Hello @${username}, please select a language to get started.`;
  bot.sendMessage(chatId, message, createLanguageButtons());
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const selectedLanguage = query.data;

  const user = userState[userId] || {};
  const currentStep = user.step;

  if (currentStep === 'SELECT_LANGUAGE') {
    userState[userId] = { selectedLanguage: selectedLanguage, step: 'AWAIT_MESSAGE' };
    const translatedMessage = await translateMessage(
      `You have selected ${selectedLanguage}. Now send a message in ${selectedLanguage}.`,
      'en',
      languageCodeMap[selectedLanguage]
    );
    bot.sendMessage(chatId, translatedMessage);
  } else if (currentStep === 'AWAIT_TRANSLATION') {
    const sourceLanguage = languageCodeMap[user.selectedLanguage];
    const targetLanguage = languageCodeMap[selectedLanguage];

    const translatedMessage = await translateMessage(
      user.lastMessage,
      sourceLanguage,
      targetLanguage
    );

    bot.sendMessage(
      chatId,
      ` ${selectedLanguage}: ${translatedMessage}`
    );

    userState[userId] = { step: 'AWAIT_MESSAGE', selectedLanguage: user.selectedLanguage };
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const user = userState[userId] || {};

  if (!user.selectedLanguage) {
    bot.sendMessage(chatId, 'Please use the /nowstart command to select a language first.');
    return;
  }

  if (user.step === 'AWAIT_MESSAGE') {
    userState[userId] = { ...user, lastMessage: msg.text, step: 'AWAIT_TRANSLATION' };

    const translatedResponse = await translateMessage(
      'What language do you want to translate your message to?',
      'en',
      languageCodeMap[user.selectedLanguage]
    );

    bot.sendMessage(chatId, translatedResponse, createLanguageButtons());
  }
});














// const TelegramBot = require('node-telegram-bot-api');
// const axios = require('axios');

// const BOT_TOKEN = '7373279424:AAF8FeR1hutyA9-AMgbq710FSV3HWcjxrpc';
// const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// const translationAPI = 'http://localhost:8000/translate';

// const languageCodeMap = {
//   Amharic: 'am',
//   English: 'en',
//   Oromifa: 'om',
//   Arabic: 'ar',
//   Tigrinya: 'ti',
//   Sidama: 'sid',
//   Somali: 'so',
//   Afar: 'aa',
// };

// const userLanguages = {};
// const userMessages = {};

// const createLanguageButtons = () => {
//   return {
//     reply_markup: {
//       inline_keyboard: [
//         [
//           { text: 'Amharic', callback_data: 'Amharic' },
//           { text: 'English', callback_data: 'English' },
//         ],
//         [
//           { text: 'Oromifa', callback_data: 'Oromifa' },
//           { text: 'Arabic', callback_data: 'Arabic' },
//         ],
//         [
//           { text: 'Tigrinya', callback_data: 'Tigrinya' },
//           { text: 'Sidama', callback_data: 'Sidama' },
//         ],
//         [
//           { text: 'Somali', callback_data: 'Somali' },
//           { text: 'Afar', callback_data: 'Afar' },
//         ],
//       ],
//     },
//   };
// };

// const translateMessage = async (text, from, to) => {
//   try {
//     const response = await axios.post(translationAPI, {
//       from,
//       to,
//       text,
//     });
//     return response.data.translatedText;
//   } catch (error) {
//     console.error('Translation error:', error);
//     return text;
//   }
// };

// bot.onText(/\/nowstart/, async (msg) => {
//   const chatId = msg.chat.id;
//   const username = msg.from.username;

//   const message = `Okay, @${username}, please what language do you want to tell me to translate for you?`;
//   bot.sendMessage(chatId, message, createLanguageButtons());
// });

// bot.on('callback_query', async (query) => {
//   const chatId = query.message.chat.id;
//   const userId = query.from.id;
//   const selectedLanguage = query.data;

//   userLanguages[userId] = languageCodeMap[selectedLanguage];

//   const translatedMessage = await translateMessage(
//     `You have selected ${selectedLanguage}. Now send a message in ${selectedLanguage}`,
//     'en',
//     userLanguages[userId]
//   );

//   bot.sendMessage(chatId, translatedMessage);
// });


// bot.on('message', async (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const text = msg.text;

//   if (!userLanguages[userId]) {
//     bot.sendMessage(
//       chatId,
//       'Please use the /nowstart command to select a language first.'
//     );
//     return;
//   }

//   userMessages[userId] = text;

//   const translatedResponse = await translateMessage(
//     'What language do you want to translate your message to?',
//     'en',
//     userLanguages[userId]
//   );

//   bot.sendMessage(chatId, translatedResponse, createLanguageButtons());
// });

// bot.on('callback_query', async (query) => {
//   const chatId = query.message.chat.id;
//   const userId = query.from.id;
//   const selectedLanguage = query.data;

//   if (!userMessages[userId]) {
//     bot.sendMessage(chatId, 'Please send a message first.');
//     return;
//   }

//   const sourceLanguage = userLanguages[userId];
//   const targetLanguage = languageCodeMap[selectedLanguage];

//   const translatedMessage = await translateMessage(
//     userMessages[userId],
//     sourceLanguage,
//     targetLanguage
//   );

//   bot.sendMessage(
//     chatId,
//     `Your message translated to ${selectedLanguage}: ${translatedMessage}`
//   );

//   delete userMessages[userId];
// });














// const TelegramBot = require('node-telegram-bot-api');
// const axios = require('axios');

// // Bot Token
// const BOT_TOKEN = '7373279424:AAF8FeR1hutyA9-AMgbq710FSV3HWcjxrpc';
// const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// // Translation API Endpoint
// const translationAPI = 'http://localhost:8000/translate';

// // Map of Languages and their Codes
// const languageCodeMap = {
//   Amharic: 'am',
//   English: 'en',
//   Oromifa: 'om',
//   Arabic: 'ar',
//   Tigrinya: 'ti',
//   Sidama: 'sid',
//   Somali: 'so',
//   Afar: 'aa',
// };

// // User Language Preferences
// const userLanguages = {};

// // Generate Language Buttons
// const createLanguageButtons = () => {
//   return {
//     reply_markup: {
//       inline_keyboard: [
//         [
//           { text: 'Amharic', callback_data: 'Amharic' },
//           { text: 'English', callback_data: 'English' },
//         ],
//         [
//           { text: 'Oromifa', callback_data: 'Oromifa' },
//           { text: 'Arabic', callback_data: 'Arabic' },
//         ],
//         [
//           { text: 'Tigrinya', callback_data: 'Tigrinya' },
//           { text: 'Sidama', callback_data: 'Sidama' },
//         ],
//         [
//           { text: 'Somali', callback_data: 'Somali' },
//           { text: 'Afar', callback_data: 'Afar' },
//         ],
//       ],
//     },
//   };
// };

// // Translate a Message
// const translateMessage = async (text, from, to) => {
//   try {
//     const response = await axios.post(translationAPI, {
//       from,
//       to,
//       text,
//     });
//     return response.data.translatedText;
//   } catch (error) {
//     console.error('Translation error:', error);
//     return text; // Fallback to original text if translation fails
//   }
// };

// // Handle /nowstart Command
// bot.onText(/\/nowstart/, async (msg) => {
//   const chatId = msg.chat.id;
//   const username = msg.from.username;

//   // Default communication in English
//   const message = `Okay, @${username}, please what language do you want to tell me to translate for you?`;
//   bot.sendMessage(chatId, message, createLanguageButtons());
// });

// // Handle Language Selection
// bot.on('callback_query', async (query) => {
//   const chatId = query.message.chat.id;
//   const userId = query.from.id;
//   const selectedLanguage = query.data;

//   // Save user's communication language
//   userLanguages[userId] = languageCodeMap[selectedLanguage];

//   // Send confirmation message in selected language
//   const translatedMessage = await translateMessage(
//     `You have selected ${selectedLanguage}. Now send a message in ${selectedLanguage}`,
//     'en',
//     userLanguages[userId]
//   );

//   bot.sendMessage(chatId, translatedMessage);
// });

// // Handle User Messages
// bot.on('message', async (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const text = msg.text;

//   // Check if user has selected a language
//   if (!userLanguages[userId]) {
//     bot.sendMessage(
//       chatId,
//       'Please use the /nowstart command to select a language first.'
//     );
//     return;
//   }

//   // Translate user's message to their selected language
//   const translatedResponse = await translateMessage(
//     `Thank you for your message: "${text}"`,
//     'en',
//     userLanguages[userId]
//   );

//   bot.sendMessage(chatId, translatedResponse);
// });
