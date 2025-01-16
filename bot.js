const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const tesseract = require('tesseract.js'); // For OCR (text extraction from images)

const BOT_TOKEN = '7373279424:AAF8FeR1hutyA9-AMgbq710FSV3HWcjxrpc'; 
const bot = new Telegraf(BOT_TOKEN);

const languages = [
  { name: 'Amharic', code: 'am' },
  { name: 'English', code: 'en' },
  { name: 'Oromifa', code: 'om' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Somali', code: 'so' },
  { name: 'Afar', code: 'aa' },
];

const userLanguage = {};

bot.start((ctx) => {
  const username = ctx.message.from.username || ctx.message.from.first_name;
  ctx.reply(
    `Hey @${username}, it's so wonderful to have you in "Neb Translator" Bot! Here you can translate your dialect language to another country's language. Use /begin to get started.`
  );
});


bot.command('begin', (ctx) => {
  ctx.reply(
    "Okay, let's start from here, choose your language:",
    Markup.inlineKeyboard(
      languages.map((lang) => Markup.button.callback(lang.name, `set_language_${lang.code}`))
    )
  );
});

// Set user language
languages.forEach((lang) => {
  bot.action(`set_language_${lang.code}`, (ctx) => {
    userLanguage[ctx.from.id] = lang.code; // Store user's language
    ctx.reply(`You have set your language to ${lang.name}. Now send any message in your language.`);
    ctx.answerCbQuery();
  });
});

// Handle text translation
bot.on('text', async (ctx) => {
  const userLang = userLanguage[ctx.from.id];

  if (!userLang) {
    ctx.reply('Please use /begin to set your language first.');
    return;
  }

  const userMessage = ctx.message.text;
  ctx.reply(
    'Choose the language you want to translate to:',
    Markup.inlineKeyboard(
      languages.map((lang) => Markup.button.callback(lang.name, `translate_to_${lang.code}_${userMessage}`))
    )
  );
});

// Perform translation
bot.action(/translate_to_(.+)/, async (ctx) => {
  const data = ctx.match[1];
  const [targetLang, ...textArray] = data.split('_'); // Handle multiple words
  const textToTranslate = textArray.join('_'); // Rejoin message
  const userLang = userLanguage[ctx.from.id];

  try {
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: textToTranslate,
        langpair: `${userLang}|${targetLang}`,
      },
    });

    if (response.data.responseData && response.data.responseData.translatedText) {
      const translatedText = response.data.responseData.translatedText;

      // Find the target language name
      const targetLangObj = languages.find((lang) => lang.code === targetLang);
      const targetLangName = targetLangObj ? targetLangObj.name : targetLang;

      ctx.reply(`${targetLangName}: "${translatedText}"`);
    } else {
      ctx.reply('Sorry, the translation could not be processed. Please try again.');
    }
  } catch (error) {
    console.error('Error during translation:', error); // Log error for debugging
    ctx.reply('Sorry, an error occurred while translating. Please try again.');
  }
  ctx.answerCbQuery();
});

// Photo translation command
bot.command('phototranslate', (ctx) => {
  ctx.reply('Send a photo that has text you would like to translate.');
});

// Handle photo uploads
bot.on('photo', async (ctx) => {
  const photo = ctx.message.photo.pop(); // Get the highest resolution photo
  const fileId = photo.file_id;

  try {
    const fileLink = await ctx.telegram.getFileLink(fileId);

    ctx.reply('Processing the image...');

    // Extract text from the image
    tesseract
      .recognize(fileLink.href, 'eng') // Specify OCR language
      .then(({ data: { text } }) => {
        if (text.trim()) {
          ctx.reply(
            `Extracted text: "${text}". Choose the language you want to translate to:`,
            Markup.inlineKeyboard(
              languages.map((lang) => Markup.button.callback(lang.name, `translate_photo_${lang.code}_${encodeURIComponent(text)}`))
            )
          );
        } else {
          ctx.reply('No text detected in the image. Please try again with a clearer image.');
        }
      })
      .catch((error) => {
        console.error('Error during OCR:', error); // Log error for debugging
        ctx.reply('An error occurred while processing the image. Please try again.');
      });
  } catch (error) {
    console.error('Error fetching photo:', error); // Log error for debugging
    ctx.reply('An error occurred while fetching the photo. Please try again.');
  }
});

// Handle translation of extracted photo text
bot.action(/translate_photo_(.+)/, async (ctx) => {
  const data = ctx.match[1];
  const [targetLang, encodedText] = data.split('_', 2);
  const textToTranslate = decodeURIComponent(encodedText);

  try {
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: textToTranslate,
        langpair: `en|${targetLang}`, // Assuming extracted text is in English
      },
    });

    if (response.data.responseData && response.data.responseData.translatedText) {
      const translatedText = response.data.responseData.translatedText;

      // Find the target language name
      const targetLangObj = languages.find((lang) => lang.code === targetLang);
      const targetLangName = targetLangObj ? targetLangObj.name : targetLang;

      ctx.reply(`${targetLangName}: "${translatedText}"`);
    } else {
      ctx.reply('Sorry, the translation could not be processed. Please try again.');
    }
  } catch (error) {
    console.error('Error during translation:', error); // Log error for debugging
    ctx.reply('Sorry, an error occurred while translating. Please try again.');
  }
  ctx.answerCbQuery();
});

// Launch the bot
bot.launch();




// const { Telegraf, Markup } = require('telegraf');
// const axios = require('axios');  // Import axios for making API requests

// const BOT_TOKEN = '7373279424:AAF8FeR1hutyA9-AMgbq710FSV3HWcjxrpc'; 
// const bot = new Telegraf(BOT_TOKEN);

// const languages = [
//   { name: 'Amharic', code: 'am' },
//   { name: 'English', code: 'en' },
//   { name: 'Oromifa', code: 'om' },
//   { name: 'Arabic', code: 'ar' },
//   { name: 'Somali', code: 'so' },
//   { name: 'Afar', code: 'aa' }
// ];

// const userLanguage = {};

// bot.start((ctx) => {
//   const username = ctx.message.from.username || ctx.message.from.first_name;
//   ctx.reply(
//     `Hey @${username}, it's so wonderful to have you in "Neb Translator" Bot! Here you can translate your dialect language to another country's language. Use /begin to get started.`
//   );
// });

// bot.command('begin', (ctx) => {
//   ctx.reply(
//     "Okay, let's start from here, choose your language:",
//     Markup.inlineKeyboard(
//       languages.map((lang) => Markup.button.callback(lang.name, `set_language_${lang.code}`))
//     )
//   );
// });

// languages.forEach((lang) => {
//   bot.action(`set_language_${lang.code}`, (ctx) => {
//     userLanguage[ctx.from.id] = lang.code; // Store the language code
//     ctx.reply(`Okay, you have set your language to ${lang.name}. Now send any message in your language.`);
//     ctx.answerCbQuery();
//   });
// });

// bot.on('text', async (ctx) => {
//   const userLang = userLanguage[ctx.from.id];

//   if (!userLang) {
//     ctx.reply('Please use /begin to set your language first.');
//     return;
//   }

//   const userMessage = ctx.message.text;
//   ctx.reply(
//     'Choose the language you want to translate to:',
//     Markup.inlineKeyboard(
//       languages.map((lang) => Markup.button.callback(lang.name, `translate_to_${lang.code}_${userMessage}`))
//     )
//   );
// });

// bot.action(/translate_to_(.+)/, async (ctx) => {
//   const data = ctx.match[1];
//   const [targetLang, ...textArray] = data.split('_'); // Handle multiple words
//   const textToTranslate = textArray.join('_'); // Rejoin message
//   const userLang = userLanguage[ctx.from.id];

//   try {
//     const response = await axios.get('https://api.mymemory.translated.net/get', {
//       params: {
//         q: textToTranslate,
//         langpair: `${userLang}|${targetLang}`,
//       },
//     });

//     console.log(`Translation requested: Source: ${userLang}, Target: ${targetLang}, Text: ${textToTranslate}`);
//     console.log('API Response:', response.data);  // Log the complete response for debugging

//     if (response.data.responseData && response.data.responseData.translatedText) {
//       const translatedText = response.data.responseData.translatedText;

//       // Find the language name for the target language
//       const targetLangObj = languages.find((lang) => lang.code === targetLang);
//       const targetLangName = targetLangObj ? targetLangObj.name : targetLang;

//       ctx.reply(`${targetLangName}: "${translatedText}"`);
//     } else {
//       ctx.reply('Sorry, the translation could not be processed. Please try again.');
//     }
//   } catch (error) {
//     console.error('Error during translation:', error);  // Log the error for debugging
//     ctx.reply('Sorry, an error occurred while translating. Please try again.');
//   }
//   ctx.answerCbQuery();
// });

// bot.launch();




















// const { Telegraf, Markup } = require('telegraf');
// const translate = require('@vitalets/google-translate-api');
// const tesseract = require('tesseract.js');

// const BOT_TOKEN = '7373279424:AAF8FeR1hutyA9-AMgbq710FSV3HWcjxrpc';

// const bot = new Telegraf(BOT_TOKEN);

// const languages = ['Amharic', 'English', 'Oromifa', 'Arabic', 'Somali', 'Afar'];

// const userLanguage = {};

// bot.start((ctx) => {
//   const username = ctx.message.from.username || ctx.message.from.first_name;
//   ctx.reply(
//     `Hey @${username}, it's so wonderful to have you in "Neb Translator" Bot! Here you can translate your dialect language to another country's language. Use /begin to get started.`
//   );
// });

// bot.command('begin', (ctx) => {
//   ctx.reply(
//     "Okay, let's start from here, choose your language:",
//     Markup.inlineKeyboard(
//       languages.map((lang) => Markup.button.callback(lang, `set_language_${lang}`))
//     )
//   );
// });

// languages.forEach((lang) => {
//   bot.action(`set_language_${lang}`, (ctx) => {
//     userLanguage[ctx.from.id] = lang;
//     ctx.reply(`Okay, you have set your language to ${lang}. Now send any message in your language.`);
//     ctx.answerCbQuery();
//   });
// });

// bot.on('text', async (ctx) => {
//   const userLang = userLanguage[ctx.from.id];

//   if (!userLang) {
//     ctx.reply('Please use /begin to set your language first.');
//     return;
//   }

//   const userMessage = ctx.message.text;
//   ctx.reply(
//     'Choose the language you want to translate to:',
//     Markup.inlineKeyboard(
//       languages.map((lang) => Markup.button.callback(lang, `translate_to_${lang}_${userMessage}`))
//     )
//   );
// });

// languages.forEach((lang) => {
//   bot.action(/translate_to_(.+)/, async (ctx) => {
//     const data = ctx.match[1];
//     const [targetLang, textToTranslate] = data.split('_', 2);
//     const userLang = userLanguage[ctx.from.id];

//     try {
//       const result = await translate(textToTranslate, { from: userLang, to: targetLang.toLowerCase() });
//       ctx.reply(`${targetLang}: "${result.text}"`);
//     } catch (error) {
//       ctx.reply('Sorry, an error occurred while translating. Please try again.');
//     }
//     ctx.answerCbQuery();
//   });
// });

// bot.command('phototranslate', (ctx) => {
//   ctx.reply('Send a photo that has text that you would like to translate.');
// });

// bot.on('photo', async (ctx) => {
//   const photo = ctx.message.photo.pop();
//   const fileId = photo.file_id;

//   const fileLink = await ctx.telegram.getFileLink(fileId);

//   ctx.reply('Processing the image...');

//   tesseract
//     .recognize(fileLink.href, 'eng')
//     .then(({ data: { text } }) => {
//       if (text.trim()) {
//         ctx.reply(
//           `Extracted text: "${text}". Choose the language you want to translate to:`,
//           Markup.inlineKeyboard(
//             languages.map((lang) => Markup.button.callback(lang, `translate_photo_${lang}_${text}`))
//           )
//         );
//       } else {
//         ctx.reply('No text detected in the image. Please try again with a clearer image.');
//       }
//     })
//     .catch((error) => {
//       ctx.reply('An error occurred while processing the image. Please try again.');
//       console.error(error);
//     });
// });

// languages.forEach((lang) => {
//   bot.action(/translate_photo_(.+)/, async (ctx) => {
//     const data = ctx.match[1];
//     const [targetLang, textToTranslate] = data.split('_', 2);

//     try {
//       const result = await translate(textToTranslate, { to: targetLang.toLowerCase() });
//       ctx.reply(`${targetLang}: "${result.text}"`);
//     } catch (error) {
//       ctx.reply('Sorry, an error occurred while translating. Please try again.');
//     }
//     ctx.answerCbQuery();
//   });
// });

// bot.launch().then(() => {
//   console.log('Neb Translator Bot is running!');
// });

// // Graceful shutdown
// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));
