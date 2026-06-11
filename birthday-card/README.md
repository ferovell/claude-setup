# Interactive Birthday Card

A fully static, single-page interactive birthday gift card with a Crayola crayon aesthetic.
No build step, no npm, no external JavaScript libraries — just open `index.html` in a browser.

## Quick start

1. Edit `config.js` to personalise the name, greeting, letter text, and captions.
2. Add your photos to the `photos/` folder (see `photos/README.md`).
3. Open `index.html` directly in any modern browser (Chrome, Firefox, Safari, Edge).

## Previewing locally

**Easiest — just open the file:**
Double-click `index.html` or drag it into a browser tab. Everything works without a server.

**With a local server (recommended for testing photo loading):**
```bash
# Python 3
cd birthday-card
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```

## Hosting on GitHub Pages

1. Create a new GitHub repository (it can be private or public).
2. Push the entire `birthday-card/` folder contents to the repository root:
   ```bash
   git init
   git add .
   git commit -m "Birthday card"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. In the repository **Settings → Pages**, set the source to **Deploy from a branch**, choose `main`, folder `/` (root), and click **Save**.
4. After a minute, GitHub will give you a URL like `https://YOUR_USERNAME.github.io/YOUR_REPO/` — share that link as the birthday gift!

> **Tip:** if you want to keep the repo private, GitHub Pages still works on private repos for users on free plans — the *page itself* is publicly accessible even if the source code is private.

## Interaction flow

| Stage | What happens |
|-------|-------------|
| **Envelope** | A wiggling envelope with a wax seal. Click/tap (or press Enter/Space) to open the flap and reveal the card and photo stack peeking out. |
| **Card pull-out** | Drag the greeting card upward and past the threshold to pop it free. A confetti burst fills the screen. |
| **Letter** | A folded accordion letter drops in. Drag downward to unfold each crease one at a time. Releasing mid-fold snaps to the nearest state. |
| **Gallery** | After the letter is fully unfolded, a second envelope appears with polaroid photos. Drag the stack out, then swipe each polaroid off the top — it loops to the bottom infinitely. |

## File list

| File | Purpose |
|------|---------|
| `index.html` | HTML structure, inline SVG filters, all scene divs |
| `style.css` | Crayola visual style, animations, responsive layout |
| `app.js` | State machine, all interaction logic, confetti, letter fold, polaroid swipe |
| `config.js` | Editable content: name, greeting, letter text, photo list |
| `photos/` | Folder for your `.jpg` / `.png` photos |

## Visual style

- **Background**: off-white paper (#FBF7EE) with SVG feTurbulence grain overlay
- **Palette**: Crayola red, orange, yellow, green, blue, violet, pink, brown
- **Fonts**: Gochi Hand (headings) + Patrick Hand (body) via Google Fonts
- **Borders**: wobbly asymmetric `border-radius` giving a hand-cut feel
- **Shadows**: chunky, offset with no blur for a cut-paper look
- **Animation**: all JS motion runs through a shared 24fps ticker; CSS animations use `steps()` for a stop-motion effect

## Browser support

Any modern browser from 2020 onward. Requires support for:
- CSS custom properties
- Pointer Events API
- `requestAnimationFrame`
- `roundRect` canvas API (Chrome 99+, Firefox 112+, Safari 15.4+)

## Customisation tips

- To add more letter paragraphs, add strings to `letterParagraphs` in `config.js` and add corresponding `<p>` elements in the matching `letter-panel` in `index.html`.
- Photo filenames and captions are fully configurable in `config.js` — the `src` path is relative to `index.html`.
- All colours are defined as CSS custom properties in `:root` in `style.css`.
