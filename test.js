const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const tesseract = require('tesseract.js');

const fs = require('fs');
const path = require('path');
const userProfileFile = path.join(__dirname, 'users.json');

const BOT_TOKEN = '7373279424:AAF8FeR1hutyA9-AMgbq710FSV3HWcjxrpc';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const translationAPI = 'http://localhost:8000/translate';

const languageCodeMap = {
  Amharic: 'am',
  English: 'en',
  Oromifa: 'om',
  Arabic: 'ar',
  Somali: 'so',
  Afar: 'aa',
};

let userSelections = {};

const translations = {
  en: {
    selectLanguage: "You have selected ${language}. Now send a message in ${language}.",
  },
  ar: {
    selectLanguage: "لقد اخترت ${language}. الآن أرسل رسالة باللغة ${language}.",
  },
  aa: {
    selectLanguage: "Waxaad dooratay ${language}. Hadda soo dir farriin ku qoran ${language}.",
  },
  so: {
    selectLanguage: "Waxaad dooratay ${language}. Hadda soo dir fariin ku qoran ${language}.",
  },
  am: {
    selectLanguage: "እርስዎ የምርጫዎችን ቋንቋ ${language} አስተምረዋል። አሁን በቋንቋ ${language} መልእክት ላኩ።",
  },
  om: {
    selectLanguage: "Karaan kee ${language} filattee jirta. Amma ergaa keessatti barreessi ${language}.",
  },
};

const createLanguageButtons = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Amharic', callback_data: 'Amharic' }, { text: 'English', callback_data: 'English' }],
        [{ text: 'Oromifa', callback_data: 'Oromifa' }, { text: 'Arabic', callback_data: 'Arabic' }],
        [{ text: 'Somali', callback_data: 'Somali' }, { text: 'Afar', callback_data: 'Afar' }],
      ],
    },
  };
};

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  bot.sendMessage(
    chatId,
    `Hey @${username}, My name is NebTransact developed by StrongNationDev. I can translate your language to another language of your choice. Send /nowstart to begin!`
  );
});

// /nowstart command
bot.onText(/\/nowstart/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  bot.sendMessage(
    chatId,
    `Okay, @${username}, please what language do you want to tell me to translate for you?`,
    createLanguageButtons()
  );
});

// Handle language selection
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const language = query.data;

  if (!userSelections[userId]) userSelections[userId] = {};

  const languageCode = languageCodeMap[language];
  const userTranslation = translations[languageCode];

  if (!userSelections[userId].fromLanguage) {
    userSelections[userId].fromLanguage = languageCode;
    const message = userTranslation
      ? userTranslation.selectLanguage.replace(/\${language}/g, language)
      : `You have selected ${language}. Now send a message in ${language}.`;
    bot.sendMessage(chatId, message);
  } else if (!userSelections[userId].toLanguage) {
    userSelections[userId].toLanguage = languageCode;

    const { fromLanguage, message } = userSelections[userId];
    axios
      .post(translationAPI, {
        from: fromLanguage,
        to: userSelections[userId].toLanguage,
        text: message,
      })
      .then((response) => {
        const translatedText = response.data.translatedText;
        bot.sendMessage(chatId, `Your original message in ${language}: '${message}' is now translated to ${language}.`);
        bot.sendMessage(chatId, `Your translated message is: '${translatedText}'`);
        delete userSelections[userId];
      })
      .catch((err) => {
        bot.sendMessage(chatId, 'Failed to translate the message. Please try again later.');
        console.error(err);
      });
  }
});

// Handle user message input
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userSelections[userId] && userSelections[userId].fromLanguage && !userSelections[userId].message) {
    userSelections[userId].message = msg.text;
    bot.sendMessage(
      chatId,
      'Message received. Now select the language you want to translate your message to:',
      createLanguageButtons()
    );
  }
});
