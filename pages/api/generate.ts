import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import { z } from "zod";
import nspell from "nspell";
import dictionary from "dictionary-en";

const requestSchema = z.object({
  productUrl: z.string().url(),
  targetLocale: z.string().min(2),
  targetKeywords: z.string().optional().default(""),
  outlineStyle: z.string().min(3),
  tone: z.string().min(3),
  callToAction: z.string().min(3),
  geoPersona: z.string().min(3),
  includeDiscoverySchema: z.boolean(),
  affiliateLinks: z.object({
    amazon: z.string().optional().default(""),
    mercadoLivre: z.string().optional().default(""),
    shopee: z.string().optional().default(""),
    magalu: z.string().optional().default(""),
    clickbank: z.string().optional().default(""),
    hotmart: z.string().optional().default(""),
    eduzz: z.string().optional().default(""),
    kiwify: z.string().optional().default(""),
    braip: z.string().optional().default("")
  }),
  imageStyle: z.string().optional().default("Product hero shot, cinematic lighting")
});

type GenerateBody = z.infer<typeof requestSchema>;

interface ProductData {
  title?: string;
  description?: string;
  highlights?: string[];
  specifications?: Record<string, string>;
  price?: string;
  brand?: string;
  images?: string[];
  sourceUrl: string;
}

type SpellChecker = {
  correct: (word: string) => boolean;
  suggest: (word: string) => string[];
};

interface SpellCheckResult {
  corrected: string;
  corrections: Array<{ original: string; suggestion: string }>;
}

let spellCheckerPromise: Promise<SpellChecker> | null = null;

async function getSpellChecker(): Promise<SpellChecker> {
  if (!spellCheckerPromise) {
    spellCheckerPromise = new Promise((resolve, reject) => {
      dictionary((error, dict) => {
        if (error) {
          reject(error);
          return;
        }
        if (!dict) {
          reject(new Error("Dictionary load failed"));
          return;
        }
        resolve(nspell(dict));
      });
    });
  }
  return spellCheckerPromise;
}

function cleanText(input?: string | null): string | undefined {
  if (!input) return undefined;
  return input.replace(/\s+/g, " ").trim();
}

async function scrapeProductData(url: string): Promise<ProductData> {
  try {
    const response = await axios.get<string>(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const html = response.data;
    const $ = cheerio.load(html);

    const title = cleanText($("meta[property='og:title']").attr("content")) || cleanText($("title").text());
    const description =
      cleanText($("meta[name='description']").attr("content")) ||
      cleanText($("meta[property='og:description']").attr("content"));
    const price =
      cleanText($("meta[property='product:price:amount']").attr("content")) ||
      cleanText($("[itemprop='price']").first().text());
    const brand =
      cleanText($("[itemprop='brand']").first().text()) ||
      cleanText($("meta[property='product:brand']").attr("content"));

    const images = new Set<string>();
    $("img").each((_, element) => {
      const src = $(element).attr("src") || $(element).attr("data-src");
      if (src && /^https?:\/\//.test(src)) {
        images.add(src);
      }
    });

    const highlights: string[] = [];
    $("[data-qa='product-description'] li, .product-highlights li, .a-unordered-list li")
      .slice(0, 10)
      .each((_, element) => {
        const text = cleanText($(element).text());
        if (text) {
          highlights.push(text);
        }
      });

    const specifications: Record<string, string> = {};
    $("[itemprop='additionalProperty']").each((_, element) => {
      const key = cleanText($(element).find("[itemprop='name']").text());
      const value = cleanText($(element).find("[itemprop='value']").text());
      if (key && value) {
        specifications[key] = value;
      }
    });

    if (Object.keys(specifications).length === 0) {
      $("table tr").each((_, element) => {
        const cells = $(element).find("td, th");
        if (cells.length === 2) {
          const key = cleanText($(cells[0]).text());
          const value = cleanText($(cells[1]).text());
          if (key && value) {
            specifications[key] = value;
          }
        }
      });
    }

    return {
      title,
      description,
      highlights: highlights.length > 0 ? highlights : undefined,
      specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
      price,
      brand,
      images: images.size > 0 ? Array.from(images).slice(0, 6) : undefined,
      sourceUrl: url
    };
  } catch (error) {
    console.error("Failed to scrape product data:", error);
    return {
      sourceUrl: url
    };
  }
}

async function promptChatGPT(input: {
  product: ProductData;
  request: GenerateBody;
}): Promise<{
  article: string;
  seo: {
    title: string;
    metaDescription: string;
    keywords: string[];
    ogTitle: string;
    ogDescription: string;
    canonicalUrl?: string;
  };
  reviews: Array<{ reviewer: string; rating: number; summary: string; details: string }>;
  discoverySchema: Record<string, unknown> | null;
  imagePrompts: string[];
}> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not configured.");
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an SEO-savvy review journalist who writes truthful, conversion-oriented articles. Produce JSON with fields: article, seo, reviews, discoverySchema, imagePrompts. Article must include affiliate callouts referencing every valid affiliate link provided. Reviews must be original but grounded in product facts. Keep tone trustworthy and localized for the target locale."
      },
      {
        role: "user",
        content: JSON.stringify({
          locale: input.request.targetLocale,
          targetKeywords: input.request.targetKeywords,
          outlineStyle: input.request.outlineStyle,
          tone: input.request.tone,
          geoPersona: input.request.geoPersona,
          callToAction: input.request.callToAction,
          includeDiscoverySchema: input.request.includeDiscoverySchema,
          product: input.product,
          affiliateLinks: input.request.affiliateLinks
        })
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("ChatGPT did not return any content.");
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to parse ChatGPT response:", content, error);
    throw new Error("Could not parse generation response.");
  }
}

function applySpellCheck(checker: SpellChecker, text: string): SpellCheckResult {
  const tokens = text.split(/(\s+|[.,;:!?()"“”'’])/);
  const corrections: Array<{ original: string; suggestion: string }> = [];
  const correctedTokens = tokens.map((token) => {
    const wordMatch = token.match(/^[\p{L}\p{N}][\p{L}\p{N}'-]*$/u);
    if (!wordMatch) {
      return token;
    }
    const lower = token.toLowerCase();
    if (checker.correct(lower)) {
      return token;
    }
    const suggestion = checker.suggest(lower)[0];
    if (suggestion) {
      const correctedWord = /^[A-Z]/.test(token)
        ? suggestion.charAt(0).toUpperCase() + suggestion.slice(1)
        : suggestion;
      corrections.push({ original: token, suggestion: correctedWord });
      return correctedWord;
    }
    return token;
  });

  return {
    corrected: correctedTokens.join(""),
    corrections
  };
}

async function generateDiscoverySchema(payload: {
  article: string;
  seo: { title: string; metaDescription: string; keywords: string[] };
  reviews: Array<{ reviewer: string; rating: number; summary: string; details: string }>;
  product: ProductData;
  affiliateLinks: GenerateBody["affiliateLinks"];
}): Promise<Record<string, unknown>> {
  const reviewList = payload.reviews.map((review) => ({
    "@type": "Review",
    author: { "@type": "Person", name: review.reviewer },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1
    },
    reviewBody: review.details,
    name: review.summary
  }));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: payload.product.title,
    description: payload.product.description ?? payload.seo.metaDescription,
    image: payload.product.images,
    aggregateRating:
      reviewList.length > 0
        ? {
            "@type": "AggregateRating",
            ratingValue:
              (reviewList.reduce((total, current) => total + (current.reviewRating?.ratingValue as number), 0) /
                reviewList.length
              ).toFixed(1),
            reviewCount: reviewList.length
          }
        : undefined,
    review: reviewList,
    offers: payload.product.price
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "BRL",
          lowPrice: payload.product.price,
          highPrice: payload.product.price,
          availability: "https://schema.org/InStock",
          url: payload.product.sourceUrl
        }
      : undefined,
    isRelatedTo: Object.fromEntries(
      Object.entries(payload.affiliateLinks).filter(([, link]) => link).map(([platform, link]) => [platform, link])
    )
  };
}

async function requestNanoBananaImages(input: {
  prompts: string[];
  product: ProductData;
  style: string;
}): Promise<Array<{ url: string; prompt: string }>> {
  const apiKey = process.env.NANO_BANANA_API_KEY;
  const prompts = input.prompts.length > 0 ? input.prompts : [
    `${input.product.title ?? "Product"} hero shot, ${input.style}`,
    `${input.product.title ?? "Product"} lifestyle photo, ${input.style}`
  ];

  if (!apiKey) {
    return prompts.map((prompt, index) => ({
      url: `https://placehold.co/800x600/0f172a/94a3b8.png?text=Nano+Banana+${index + 1}`,
      prompt
    }));
  }

  try {
    const response = await axios.post(
      "https://api.nanobanana.com/v1/images/generate",
      {
        prompts,
        aspect_ratio: "4:3",
        style: input.style,
        count: Math.min(prompts.length, 3),
        metadata: {
          product: input.product.title,
          brand: input.product.brand,
          source: input.product.sourceUrl
        }
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    const images = Array.isArray(response.data?.images) ? response.data.images : [];
    if (images.length === 0) {
      throw new Error("Empty Nano Banana response");
    }

    return images.map((image: { url: string }, index: number) => ({
      url: image.url,
      prompt: prompts[index] ?? input.style
    }));
  } catch (error) {
    console.error("Nano Banana generation failed:", error);
    return prompts.map((prompt, index) => ({
      url: `https://placehold.co/800x600/111827/64748b.png?text=Nano+Banana+${index + 1}`,
      prompt
    }));
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body: GenerateBody;
  try {
    body = requestSchema.parse(req.body);
  } catch (error) {
    res.status(400).json({ error: "Invalid request body.", details: error });
    return;
  }

  try {
    const [product, checker] = await Promise.all([scrapeProductData(body.productUrl), getSpellChecker()]);

    const generation = await promptChatGPT({ product, request: body });

    const spellChecked = applySpellCheck(checker, generation.article);
    const article = spellChecked.corrected;

    const discoverySchema =
      body.includeDiscoverySchema && generation.discoverySchema
        ? generation.discoverySchema
        : body.includeDiscoverySchema
        ? await generateDiscoverySchema({
            article,
            seo: generation.seo,
            reviews: generation.reviews,
            product,
            affiliateLinks: body.affiliateLinks
          })
        : null;

    const images = await requestNanoBananaImages({
      prompts: generation.imagePrompts ?? [],
      product,
      style: body.imageStyle
    });

    res.status(200).json({
      article,
      seo: generation.seo,
      product,
      reviews: generation.reviews,
      affiliateLinks: body.affiliateLinks,
      discoverySchema,
      images,
      spellcheck: spellChecked
    });
  } catch (error) {
    console.error("Generation failed:", error);
    const message = error instanceof Error ? error.message : "Failed to build article.";
    res.status(500).json({ error: message });
  }
}
