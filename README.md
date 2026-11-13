# Number Neighbours

A small browser puzzle. Place each number from 1 to 8 in the board so that consecutive numbers do not touch horizontally or vertically. Diagonal neighbours are allowed.

## Play

Drag each number tile into an empty box. Tiles cannot be moved after placement. The game checks the board automatically when all eight numbers are placed. If the arrangement has a conflict, choose **Clear puzzle** to begin another attempt.

The attempt count and selected colour scheme are saved in the browser. The game uses standard HTML, CSS and JavaScript, with no build step or package dependencies. The cartoon font is loaded from Google Fonts, with local system fonts as a fallback.

## Files

- `index.html` — page content and game rules
- `style.css` — layout, colour schemes and tile styling
- `game.js` — puzzle rules, drag-and-drop controls, sounds and saved settings

## Publish with GitHub Pages

1. Create a GitHub repository for the game.
2. Add `index.html`, `style.css`, `game.js` and this `README.md` to the repository's top level.
3. Push or upload the files to your chosen branch.
4. In the repository, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**, then select your branch and the **/(root)** folder. Save the settings.
6. Open the Pages URL shown in the repository settings once GitHub finishes publishing.

GitHub Pages serves the `index.html` file from the selected publishing source. See the [GitHub Pages publishing guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) for details.
