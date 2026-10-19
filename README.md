# Ego Favour Anyaeji Website

A responsive personal scrapbook website for Ego Favour Anyaeji. It introduces Ego, her interests, her current studies in SS2 Art Department, and her hope of becoming a lawyer.

## Technology

- HTML5 provides the page structure and accessible contact form.
- CSS3 provides the scrapbook visual design, responsive layouts, and reduced-motion support.
- Vanilla JavaScript powers page interactions and sends contact form submissions to the API.
- Node.js runs the serverless contact handler in `api/contact.js` on Vercel.
- SendByte delivers messages by email after the Vercel environment variables are configured.

There is no database. The backend validates submissions, rejects oversized or malformed requests, checks a hidden anti-spam field, and applies a basic per-instance rate limit. It sends valid messages through SendByte only when all required settings are present.

## Run and check

Open `index.html` through a local HTTP server for a visual preview. To test the API route locally, use the Vercel development runtime with the environment variables below. `npm run check` checks the JavaScript syntax.

## Contact email setup

Set these private environment variables in Vercel. Never commit a real API key.

- `SENDBYTE_API_KEY`: SendByte API key (the only required variable).
  The recipient (`chigozieanyaeji@gmail.com`) and sender (`ego@usevesselapp.com`) are set in the code.

An example file is provided as `.env.example`. If the settings are missing, the endpoint returns a setup message and does not claim delivery. Messages are not displayed publicly or saved in a database.

## Hosting

The requested Vercel address is `https://egoawebsite.vercel.app`. The GitHub source is prepared for Vercel; confirm the Vercel project and domain assignment after deployment.

## Assets

The paper grain and dream landscape are SVG assets. The floral decoration is a transparent WebP image. The personal photo preview, when selected by a visitor, stays in that browser and is not uploaded.
