# Agentic Review Builder

Generate Discovery-ready affiliate review articles with localized SEO copy, schema markup, spell-checked drafts, and Nano Banana imagery.

## Features
- Crawls any product URL to extract descriptions, specs, pricing, and imagery hints.
- Prompts ChatGPT (`gpt-4o-mini`) to craft long-form review articles, original testimonials, and SEO metadata in the selected locale.
- Auto-injects affiliate calls-to-action for Amazon, Mercado Livre, Shopee, Magalu, Clickbank, Hotmart, Eduzz, Kiwify, and Braip.
- Applies a dictionary-backed spell checker before returning the article and logs every correction.
- Generates Google Discover and Merchant-friendly JSON-LD schema.
- Integrates with the Nano Banana image generator (with graceful placeholders when no API key is provided).
- Ships with a ChatGPT plugin manifest (`/.well-known/ai-plugin.json`) and OpenAPI spec (`/openapi.yaml`) for easy integration.

## Getting Started
```bash
npm install
npm run dev
# visit http://localhost:3000
```

### Environment Variables
Create a `.env.local` file if you want live generations:
```
OPENAI_API_KEY=sk-...
NANO_BANANA_API_KEY=nb-...
```

## Deployment
This project is optimized for Vercel. After running `npm run build`, deploy with:
```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN
```
The production domain is `https://agentic-2a55d526.vercel.app`.

## API Reference
- `POST /api/generate` accepts the payload defined in `public/openapi.yaml` and returns article content, SEO metadata, schema, reviews, affiliate links, spell-check diagnostics, and Nano Banana images.

## License
MIT © 2025 Agentic Review Builder
