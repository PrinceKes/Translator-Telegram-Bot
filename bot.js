require('dotenv').config();
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const tesseract = require('tesseract.js');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not defined. Please set it in the .env file.');
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const translationAPI = 'https://translator-api-2l1a.onrender.com/translate';

const languageCodeMap = {
  Amharic: 'am',
  English: 'en',
  Oromifa: 'om',
  Arabic: 'ar',
  Tigrinya: 'ti',
  Somali: 'so',
  Afar: 'aa',
};


const userProfileFile = 'user_profiles.json'; 

if (!fs.existsSync(userProfileFile)) {
    fs.writeFileSync(userProfileFile, JSON.stringify({}, null, 2));
}


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
        // { text: 'Sidama', callback_data: 'Sidama' },
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

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  bot.sendMessage(
    chatId,
    `Hey @${username}, My name is NebTransact developed by StrongNationDev. I can translate your language to another language of your choice. Send /nowstart to begin!`
  );
});


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


// /setfavorite command
if (!fs.existsSync(userProfileFile)) {
    fs.writeFileSync(userProfileFile, JSON.stringify({}, null, 2));
  }

  // /setfavorite Command
bot.onText(/\/setfavorite/, (msg) => {
    const chatId = msg.chat.id;
  
    bot.sendMessage(chatId, 'Would you like to set your favorite languages? Yes or No?');
    bot.once('message', (response) => {
      const userResponse = response.text.toLowerCase();
      if (userResponse === 'no') {
        bot.sendMessage(
          chatId,
          `Well, that's not a problem, let me know next time you want to translate. Thank you 😊`
        );
      } else if (userResponse === 'yes') {
        bot.sendMessage(
          chatId,
          `Okay, to set your favorite languages, send your favorite language in short words:\n\n` +
          `Afar as "aa"\nSomali as "so"\nArabic as "ar"\nAmharic as "am"\nEnglish as "en"\nOromo as "om"\n\n` +
          `Only send the short letters of the language. You can send more than one by separating them with commas (e.g., "so, ar, en").`
        );
        bot.once('message', (langResponse) => {
          const languages = langResponse.text.toLowerCase().split(',').map(lang => lang.trim());
          const validLanguages = ['aa', 'so', 'ar', 'am', 'en', 'om'];
  
          const filteredLanguages = languages.filter(lang => validLanguages.includes(lang));
          if (filteredLanguages.length === 0) {
            bot.sendMessage(chatId, `No valid language codes were provided. Please try again.`);
            return;
          }
  
          const userId = response.from.id;
  
          // Load existing profiles
          const profiles = JSON.parse(fs.readFileSync(userProfileFile, 'utf8'));
  
          // Add languages to the user's profile
          if (!profiles[userId]) {
            profiles[userId] = { favoriteLanguages: [] };
          }
  
          profiles[userId].favoriteLanguages.push(...filteredLanguages);
  
          // Remove duplicates
          profiles[userId].favoriteLanguages = [...new Set(profiles[userId].favoriteLanguages)];
  
          // Save back to file
          fs.writeFileSync(userProfileFile, JSON.stringify(profiles, null, 2));
  
          bot.sendMessage(
            chatId,
            `Your favorite languages have been saved: ${profiles[userId].favoriteLanguages.join(', ')}`
          );
        });
      } else {
        bot.sendMessage(chatId, `Please respond with either "Yes" or "No".`);
      }
    });
  });
  
  // /myfavorite Command
  bot.onText(/\/myfavorite/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
  
    const profiles = JSON.parse(fs.readFileSync(userProfileFile, 'utf8'));
  
    if (profiles[userId] && profiles[userId].favoriteLanguages && profiles[userId].favoriteLanguages.length > 0) {
      bot.sendMessage(
        chatId,
        `Your favorite languages are: ${profiles[userId].favoriteLanguages.join(', ')}`
      );
    } else {
      bot.sendMessage(chatId, `You haven't set any favorite languages yet. Use /setfavorite to set one.`);
    }
  });

  
// Handle photo text extraction (/photo_text command)
bot.onText(/\/photo_text/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'The command you just used can extract text from photos and send it back to you, which you can then translate afterwards. Now send a photo in JPG or PNG format.'
  );
});

// Handle photos sent by users
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const fileId = msg.photo[msg.photo.length - 1].file_id;

  try {
    const fileLink = await bot.getFileLink(fileId);

    const { data: { text } } = await tesseract.recognize(fileLink, 'eng');

    if (text.trim()) {
      bot.sendMessage(chatId, `The text in the photo is:\n\n${text}`);
      bot.sendMessage(chatId, 'You can use the /nowstart command to translate that message.');
    } else {
      bot.sendMessage(chatId, 'Could not detect any text in the photo. Please try with a clearer image.');
    }
  } catch (err) {
    bot.sendMessage(chatId, 'Failed to extract text from the photo. Please try again.');
    console.error(err);
  }
});
