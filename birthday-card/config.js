// ============================================================
//  config.js — Edit this file to personalise the birthday card
// ============================================================
//
//  HOW TO EDIT:
//  1. Change friendName to the birthday person's name.
//  2. Update cardGreeting — {name} is replaced at runtime.
//  3. Replace the letterParagraphs array with your own words.
//  4. Add real photo files to the photos/ folder and update
//     the photos array below (src + caption).
//  5. Open index.html in a browser — no build step needed.
//
// ============================================================

const CONFIG = {
  // The recipient's name — used everywhere {name} appears
  friendName: "Friend",

  // Text displayed on the greeting card after it is pulled out
  // {name} is replaced with friendName at runtime
  cardGreeting: "Happy Birthday, {name}!",

  // Title at the top of the letter panels
  letterTitle: "A little letter for you",

  // Body of the letter — each string becomes one paragraph
  letterParagraphs: [
    "Can you believe another year has zoomed by? It feels like just yesterday we were laughing until our sides ached over something completely ridiculous, and here we are again — older, wiser, and somehow even sillier than before.",
    "You bring so much warmth and colour into the lives of everyone around you. The way you light up a room, the kindness you show without even thinking about it, the terrible puns you deliver with a completely straight face — all of it is impossibly wonderful.",
    "I hope this birthday is everything you deserve: cake that tastes like a dream, moments that make your heart swell, and just enough chaos to keep things interesting. You deserve all of it and then some.",
    "Here's to you, to all the adventures still ahead of us, and to many more years of making spectacular memories together. Thank you for being exactly, perfectly, wonderfully you.",
  ],

  // Sign-off line at the bottom of the letter
  letterSignoff: "With love, your friend",

  // Photos shown in the polaroid stack
  // src: path relative to index.html  |  caption: text under the photo
  // If an image fails to load a crayon-doodle placeholder is drawn automatically.
  photos: [
    { src: "photos/photo1.jpg", caption: "That one summer ☀️" },
    { src: "photos/photo2.jpg", caption: "Best day ever" },
    { src: "photos/photo3.jpg", caption: "We looked SO cool" },
    { src: "photos/photo4.jpg", caption: "Absolutely no regrets" },
    { src: "photos/photo5.jpg", caption: "Classic us 😂" },
    { src: "photos/photo6.jpg", caption: "More memories to come" },
  ],
};
