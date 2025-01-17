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

  if (!userSelections[userId].fromLanguage) {
    userSelections[userId].fromLanguage = languageCodeMap[language] || language;
    bot.sendMessage(chatId, `You have selected ${language}. Now send a message in ${language}.`);
  } else if (!userSelections[userId].toLanguage) {
    userSelections[userId].toLanguage = languageCodeMap[language] || language;

    const { fromLanguage, message } = userSelections[userId];
    axios
      .post(translationAPI, {
        from: fromLanguage,
        to: userSelections[userId].toLanguage,
        text: message,
      })
      .then((response) => {
        const translatedText = response.data.translatedText;
        bot.sendMessage(
          chatId,
          `Your original message in ${language}: '${message}' is now translated to ${language}.`
        );
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


// /setfavorite command
// Ensure the file exists
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

  
  // /setfavorite Command
// bot.onText(/\/setfavorite/, (msg) => {
//     const chatId = msg.chat.id;
  
//     bot.sendMessage(chatId, 'Would you like to set your favorite languages? Yes or No?');
//     bot.once('message', (response) => {
//       const userResponse = response.text.toLowerCase();
//       if (userResponse === 'no') {
//         bot.sendMessage(
//           chatId,
//           `Well, that's not a problem, let me know next time you want to translate. Thank you 😊`
//         );
//       } else if (userResponse === 'yes') {
//         bot.sendMessage(
//           chatId,
//           `Okay, to set your favorite languages, send your favorite language in short words:\n\n` +
//           `Afar as "aa"\nSomali as "so"\nArabic as "ar"\nAmharic as "am"\nEnglish as "en"\nOromo as "om"\n\n` +
//           `Only send the short letters of the language.`
//         );
//         bot.once('message', (langResponse) => {
//           const favoriteLanguage = langResponse.text.toLowerCase();
//           const validLanguages = ['aa', 'so', 'ar', 'am', 'en', 'om'];
  
//           if (validLanguages.includes(favoriteLanguage)) {
//             const userId = response.from.id;
  
//             const profiles = JSON.parse(fs.readFileSync(userProfileFile, 'utf8'));
//             profiles[userId] = { favoriteLanguage };
  
//             fs.writeFileSync(userProfileFile, JSON.stringify(profiles, null, 2));
  
//             bot.sendMessage(chatId, `Your favorite language '${favoriteLanguage}' has been saved!`);
//           } else {
//             bot.sendMessage(chatId, `Invalid language code. Please try again.`);
//           }
//         });
//       } else {
//         bot.sendMessage(chatId, `Please respond with either "Yes" or "No".`);
//       }
//     });
//   });
  
//   // /myfavorite Command
//   bot.onText(/\/myfavorite/, (msg) => {
//     const chatId = msg.chat.id;
//     const userId = msg.from.id;
  
//     const profiles = JSON.parse(fs.readFileSync(userProfileFile, 'utf8'));
  
//     if (profiles[userId] && profiles[userId].favoriteLanguage) {
//       bot.sendMessage(chatId, `Your favorite language is: '${profiles[userId].favoriteLanguage}'`);
//     } else {
//       bot.sendMessage(chatId, `You haven't set a favorite language yet. Use /setfavorite to set one.`);
//     }
//   });


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
//   Somali: 'so',
//   Afar: 'aa',
// };

// let userSelections = {}; 

// const createLanguageButtons = () => {
//   return {
//     reply_markup: {
//       inline_keyboard: [
//         [{ text: 'Amharic', callback_data: 'Amharic' }, { text: 'English', callback_data: 'English' }],
//         [{ text: 'Oromifa', callback_data: 'Oromifa' }, { text: 'Arabic', callback_data: 'Arabic' }],
//         [{ text: 'Somali', callback_data: 'Somali' }, { text: 'Afar', callback_data: 'Afar' }],
//       ],
//     },
//   };
// };

// // /start command
// bot.onText(/\/start/, (msg) => {
//   const chatId = msg.chat.id;
//   const username = msg.from.username;
//   bot.sendMessage(
//     chatId,
//     `Hey @${username}, My name is NebTransact developed by StrongNationDev. I can translate your language to another language of your choice. Send /nowstart to begin!`
//   );
// });

// // /nowstart command
// bot.onText(/\/nowstart/, (msg) => {
//   const chatId = msg.chat.id;
//   const username = msg.from.username;
//   bot.sendMessage(
//     chatId,
//     `Okay, @${username}, please what language do you want to tell me to translate for you?`,
//     createLanguageButtons()
//   );
// });

// // Handle language selection
// bot.on('callback_query', (query) => {
//   const chatId = query.message.chat.id;
//   const userId = query.from.id;
//   const language = query.data;

//   if (!userSelections[userId]) userSelections[userId] = {};

//   if (!userSelections[userId].fromLanguage) {
//     userSelections[userId].fromLanguage = languageCodeMap[language] || language;
//     bot.sendMessage(chatId, `You have selected ${language}. Now send a message in ${language}.`);
//   } else if (!userSelections[userId].toLanguage) {
//     userSelections[userId].toLanguage = languageCodeMap[language] || language;

//     const { fromLanguage, message } = userSelections[userId];
//     axios
//       .post(translationAPI, {
//         from: fromLanguage,
//         to: userSelections[userId].toLanguage,
//         text: message,
//       })
//       .then((response) => {
//         const translatedText = response.data.translatedText;
//         bot.sendMessage(
//           chatId,
//           `Your original message in ${language}: '${message}' is now translated to ${language}.`
//         );
//         bot.sendMessage(chatId, `Your translated message is: '${translatedText}'`);
//         delete userSelections[userId];
//       })
//       .catch((err) => {
//         bot.sendMessage(chatId, 'Failed to translate the message. Please try again later.');
//         console.error(err);
//       });
//   }
// });

// // Handle user message input
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;

//   if (userSelections[userId] && userSelections[userId].fromLanguage && !userSelections[userId].message) {
//     userSelections[userId].message = msg.text;
//     bot.sendMessage(
//       chatId,
//       'Message received. Now select the language you want to translate your message to:',
//       createLanguageButtons()
//     );
//   }
// });


// // /setfavorite command
// bot.onText(/\/setfavorite/, (msg) => {
//   const chatId = msg.chat.id;
//   bot.sendMessage(chatId, 'Would you like to set your favorite languages? Yes or No?');
// });

// // Handle photo text extraction (/photo_text command)
// bot.onText(/\/photo_text/, (msg) => {
//   const chatId = msg.chat.id;
//   bot.sendMessage(
//     chatId,
//     'The command you just used can extract text from photos and send it back to you, which you can then translate afterwards. Now send a photo in JPG or PNG format.'
//   );
// });

// // Handle photos sent by users
// bot.on('photo', async (msg) => {
//   const chatId = msg.chat.id;
//   const fileId = msg.photo[msg.photo.length - 1].file_id;

//   try {
//     const fileLink = await bot.getFileLink(fileId);
//     // Replace this with your OCR API logic
//     const extractedText = 'Sample text from the photo'; // Example placeholder

//     bot.sendMessage(chatId, `The text in the photo is:\n\n${extractedText}`);
//     bot.sendMessage(chatId, 'You can use the /nowstart command to translate that message.');
//   } catch (err) {
//     bot.sendMessage(chatId, 'Failed to extract text from the photo. Please try again.');
//     console.error(err);
//   }
// });

