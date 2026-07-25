# Market Scalpers — Deployment Guide

This is a static site (plain HTML/CSS/JS, no build step needed). You can deploy it in minutes.

## Option A — Netlify (easiest, drag & drop)
1. Go to https://app.netlify.com/drop
2. Drag the whole `marketscalpers` folder onto the page.
3. Netlify gives you a live URL instantly (e.g. `random-name.netlify.app`).
4. Go to Site settings → Domain management → Add custom domain → enter `marketscalpers.in` and follow the DNS instructions (point your domain's A/CNAME records to Netlify).

## Option B — Vercel
1. Install Vercel CLI: `npm i -g vercel` (or use https://vercel.com/new and drag the folder in the browser).
2. Run `vercel` inside the `marketscalpers` folder and follow the prompts.
3. Run `vercel --prod` to publish. Add your custom domain in the Vercel dashboard → Project → Settings → Domains.

## Option C — GitHub Pages
1. Create a new GitHub repo, push this folder's contents to it.
2. Repo → Settings → Pages → Deploy from branch → `main` / root.
3. Add a `CNAME` file containing `marketscalpers.in` if using a custom domain, and point your domain's DNS to GitHub Pages' IPs.

## Option D — Your existing hosting (GoDaddy / cPanel etc.)
1. Zip the folder or use FTP/File Manager.
2. Upload all contents of `marketscalpers/` into your `public_html` (or equivalent web root).
3. Make sure `index.html` sits at the root so `https://www.marketscalpers.in/` loads it directly.

## Notes
- No server, database or build tools are required — every page (`index.html`, `about.html`, `courses.html`, `psychology.html`, `results.html`, `blog.html`, `contact.html`) is a plain static file.
- The nav and footer are shared via `partials/nav.html` and `partials/footer.html`, loaded with `fetch()`. This requires the site to be served over `http(s)://` (which every option above does) — it will NOT work if you just double-click `index.html` from your file explorer, since `fetch()` is blocked on the `file://` protocol. To preview locally, run `npx serve .` inside the folder and open the printed `localhost` link.
- The live ticker (`js/ticker.js`) calls free public APIs (CoinGecko for crypto, gold-api.com for XAU/XAG, frankfurter.app for FX). If any of these ever go down or change their terms, the ticker automatically falls back to sample data so the page never breaks — swap in a paid data provider there if you want guaranteed uptime/accuracy for production trading signals.
- The contact and enrollment forms currently just show a "Message sent" confirmation in the browser (no backend). To actually receive submissions, connect them to a form service like Formspree, Getform, or a simple serverless function — happy to wire that up on request.
- Update `partials/footer.html` and `contact.html` if your address, phone, or socials change — they're the only two places that content lives.
