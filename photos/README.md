# Photos Folder

Place your photos here. The default filenames expected by `config.js` are:

- `photo1.jpg`
- `photo2.jpg`
- `photo3.jpg`
- `photo4.jpg`
- `photo5.jpg`
- `photo6.jpg`

## Recommended specs

- **Format**: `.jpg` or `.webp` (also `.jpeg`, `.png`, `.gif` work fine)
- **Size**: aim for roughly **800 x 600 px** (4:3 ratio). The polaroid crops to 4:3 anyway, so landscape shots work best.
- **File size**: keep each photo under 500 KB for fast loading. You can use [Squoosh](https://squoosh.app) to compress images in-browser for free.

## Changing captions

Open `config.js` and edit the `caption` field for each entry in the `photos` array:

```js
photos: [
  { src: "photos/photo1.jpg", caption: "Your caption here" },
  ...
]
```

## Using different filenames or more/fewer photos

Change the `src` paths in the `photos` array in `config.js` to match whatever you name your files. You can add or remove entries to change how many photos appear in the gallery.

## Missing photos

If a photo file is missing or fails to load, a colourful crayon-doodle placeholder is drawn automatically — so the site always looks complete even without real photos.
