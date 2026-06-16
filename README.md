# URANIII Audio Gear Showcase

A premium, highly responsive, single-page Audio Gear Showcase website, paired with a standalone JSON Database Management dashboard. 

## Features

- **Premium Dark Mode UI**: Built with a luxury tech aesthetic featuring deep slates, matte blacks, and crisp typography.
- **GSAP Animations**: Buttery-smooth scroll animations that reveal content naturally.
- **3D Model Support**: Built-in support for interactive `.glb` files via Google's `<model-viewer>`.
- **Standalone Admin Dashboard**: Edit the site's data directly in the browser. Features auto-saving locally via a lightweight Python server, while remaining fully compatible with static hosting for production.
- **Cloudflare Pages Ready**: Fully static vanilla stack (HTML5, CSS3, modern JS), making it perfectly suited for static site hosting.

## Project Structure

- `index.html` / `style.css` / `app.js` - Main showcase website.
- `admin.html` / `admin.js` - The database management dashboard.
- `products.json` - The seed data structure used by both the showcase and dashboard.

## Deployment

To deploy this project:
1. Push the entire directory to a GitHub/GitLab repository.
2. Connect the repository to Cloudflare Pages.
3. No build steps are required. The site will deploy instantly.

When you need to update products locally, run `start.bat` (Windows) or `python server.py` to launch the Admin Dashboard, which will auto-save your edits directly to `products.json`. Then commit those changes to your repository.
