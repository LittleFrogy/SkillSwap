const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { text, sourceLanguage = "en", targetLanguage } = req.body;

    if (!text?.trim() || !targetLanguage) {
      return res.status(400).json({
        message: "Text and target language are required.",
      });
    }

    if (sourceLanguage === targetLanguage) {
      return res.json({
        translatedText: text,
      });
    }

    const url =
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=${sourceLanguage}|${targetLanguage}`;

    const apiResponse = await fetch(url);
    const data = await apiResponse.json();

    if (!apiResponse.ok || data.responseStatus !== 200) {
      return res.status(500).json({
        message: "Translation failed.",
      });
    }

    res.json({
      translatedText: data.responseData.translatedText,
    });
  } catch (error) {
    res.status(500).json({
      message: "Translation service failed.",
      error: error.message,
    });
  }
});

module.exports = router;
