import { useState } from "react";
import Head from "next/head";
import clsx from "clsx";
import { FunnelIcon, SparklesIcon, PhotoIcon } from "@heroicons/react/24/outline";

type AffiliatePlatforms =
  | "amazon"
  | "mercadoLivre"
  | "shopee"
  | "magalu"
  | "clickbank"
  | "hotmart"
  | "eduzz"
  | "kiwify"
  | "braip";

type AffiliateLinks = Record<AffiliatePlatforms, string>;

interface GenerateRequest {
  productUrl: string;
  targetLocale: string;
  targetKeywords: string;
  outlineStyle: string;
  tone: string;
  callToAction: string;
  geoPersona: string;
  includeDiscoverySchema: boolean;
  affiliateLinks: AffiliateLinks;
  imageStyle: string;
}

interface SeoMetadata {
  title: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  canonicalUrl?: string;
}

interface ProductData {
  title?: string;
  description?: string;
  highlights?: string[];
  specifications?: Record<string, string>;
  price?: string;
  brand?: string;
  images?: string[];
}

interface ReviewItem {
  reviewer: string;
  rating: number;
  summary: string;
  details: string;
}

interface GenerationResponse {
  article: string;
  seo: SeoMetadata;
  product: ProductData;
  reviews: ReviewItem[];
  affiliateLinks: AffiliateLinks;
  discoverySchema: Record<string, unknown> | null;
  images: Array<{ url: string; prompt: string }>;
  spellcheck: {
    corrections: Array<{ original: string; suggestion: string }>;
  };
}

const defaultAffiliateLinks: AffiliateLinks = {
  amazon: "",
  mercadoLivre: "",
  shopee: "",
  magalu: "",
  clickbank: "",
  hotmart: "",
  eduzz: "",
  kiwify: "",
  braip: ""
};

export default function Home() {
  const [form, setForm] = useState<GenerateRequest>({
    productUrl: "",
    targetLocale: "pt-BR",
    targetKeywords: "",
    outlineStyle: "Conversion-focused review with FAQ",
    tone: "Trustworthy expert with enthusiasm",
    callToAction: "Encourage readers to buy via affiliate links with urgency and honesty.",
    geoPersona: "Brazilian consumer searching for reliable product reviews with localized context.",
    includeDiscoverySchema: true,
    affiliateLinks: defaultAffiliateLinks,
    imageStyle: "Cinematic, product-focused, high-contrast lighting"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResponse | null>(null);

  const handleAffiliateChange = (platform: AffiliatePlatforms, value: string) => {
    setForm((prev) => ({
      ...prev,
      affiliateLinks: { ...prev.affiliateLinks, [platform]: value }
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to generate article");
      }

      const data: GenerationResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Head>
        <title>SEO Review Article Generator</title>
      </Head>
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12">
        <header className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold lg:text-4xl">
            SEO & GEO-Aware Review Article Generator
          </h1>
          <p className="max-w-3xl text-slate-300">
            Build conversion-ready review articles with ChatGPT, Nano Banana imagery, Discovery schema,
            and embedded affiliate touchpoints. Paste any product link, tune target keywords, and let the generator pull specs,
            craft credible reviews, and deliver deploy-ready content.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl shadow-primary/10"
          >
            <div className="flex items-center gap-3 text-slate-200">
              <SparklesIcon className="h-6 w-6 text-accent" />
              <span className="text-lg font-semibold">Content briefing</span>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Product URL
              </span>
              <input
                required
                type="url"
                placeholder="https://www.example.com/product"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                value={form.productUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, productUrl: event.target.value }))
                }
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
                  Target Locale
                </span>
                <input
                  type="text"
                  placeholder="pt-BR"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                  value={form.targetLocale}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, targetLocale: event.target.value }))
                  }
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
                  Geo Persona
                </span>
                <input
                  type="text"
                  placeholder="Brazilian consumer..."
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                  value={form.geoPersona}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, geoPersona: event.target.value }))
                  }
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Target Keywords
              </span>
              <input
                type="text"
                placeholder="melhor notebook gamer, review notebook x"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                value={form.targetKeywords}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, targetKeywords: event.target.value }))
                }
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Outline Style
              </span>
              <input
                type="text"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                value={form.outlineStyle}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, outlineStyle: event.target.value }))
                }
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Narrative Tone
              </span>
              <input
                type="text"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                value={form.tone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, tone: event.target.value }))
                }
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Call to Action
              </span>
              <textarea
                rows={3}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                value={form.callToAction}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, callToAction: event.target.value }))
                }
              />
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.includeDiscoverySchema}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    includeDiscoverySchema: event.target.checked
                  }))
                }
                className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-accent focus:ring-accent"
              />
              <span className="text-sm text-slate-200">
                Generate Google Discover & Merchant compatible schema.
              </span>
            </label>

            <div className="flex items-center gap-3 pt-4 text-slate-200">
              <FunnelIcon className="h-6 w-6 text-accent" />
              <span className="text-lg font-semibold">Affiliate links</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(form.affiliateLinks).map(([platform, value]) => (
                <label key={platform} className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {platform}
                  </span>
                  <input
                    type="url"
                    placeholder={`https://affiliates.${platform}.com/...`}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                    value={value}
                    onChange={(event) =>
                      handleAffiliateChange(platform as AffiliatePlatforms, event.target.value)
                    }
                  />
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-4 text-slate-200">
              <PhotoIcon className="h-6 w-6 text-accent" />
              <span className="text-lg font-semibold">Nano Banana imagery</span>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Image Art Direction
              </span>
              <input
                type="text"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
                value={form.imageStyle}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, imageStyle: event.target.value }))
                }
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "rounded-xl bg-primary px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-primary-foreground transition hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/40",
                loading && "cursor-not-allowed opacity-60"
              )}
            >
              {loading ? "Generating..." : "Generate Article"}
            </button>

            {error && (
              <div className="rounded-xl border border-rose-700 bg-rose-950/60 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}
          </form>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300 shadow-2xl shadow-primary/10">
              <h2 className="text-lg font-semibold text-slate-100">How it works</h2>
              <ol className="mt-3 space-y-3 text-slate-400">
                <li>1. Product crawler pulls specs, highlights, imagery, and pricing from the product link.</li>
                <li>2. ChatGPT crafts a Discovery-ready outline, injects affiliate CTAs, and drafts original reviews.</li>
                <li>3. Spell-checker refines the copy. Nano Banana generates matching visuals with your art direction.</li>
                <li>4. Download the article or copy HTML & schema snippets ready for CMS or Vercel deployment.</li>
              </ol>
            </div>
            {result && (
              <div className="flex flex-col gap-6">
                <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-primary/10">
                  <h2 className="text-lg font-semibold text-slate-100">Generated Article</h2>
                  <article className="mt-4 space-y-4 text-slate-200">
                    {result.article.split("\n").map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </article>
                </section>
                <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-primary/10">
                  <h3 className="text-lg font-semibold text-slate-100">SEO Metadata</h3>
                  <dl className="mt-4 space-y-3 text-sm text-slate-300">
                    <div>
                      <dt className="font-semibold text-slate-200">Title</dt>
                      <dd>{result.seo.title}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-200">Meta Description</dt>
                      <dd>{result.seo.metaDescription}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-200">Keywords</dt>
                      <dd>{result.seo.keywords.join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-200">OG Title</dt>
                      <dd>{result.seo.ogTitle}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-200">OG Description</dt>
                      <dd>{result.seo.ogDescription}</dd>
                    </div>
                  </dl>
                </section>
                {result.discoverySchema && (
                  <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-primary/10">
                    <h3 className="text-lg font-semibold text-slate-100">Discovery JSON-LD</h3>
                    <pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-300">
                      {JSON.stringify(result.discoverySchema, null, 2)}
                    </pre>
                  </section>
                )}
                {result.images.length > 0 && (
                  <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-primary/10">
                    <h3 className="text-lg font-semibold text-slate-100">Nano Banana Shots</h3>
                    <div className="mt-4 grid gap-4">
                      {result.images.map((image) => (
                        <figure key={image.url} className="space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
                          <img
                            src={image.url}
                            alt={image.prompt}
                            className="h-40 w-full rounded-lg object-cover"
                          />
                          <figcaption className="text-xs text-slate-400">{image.prompt}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </section>
                )}
                {result.spellcheck.corrections.length > 0 && (
                  <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-primary/10">
                    <h3 className="text-lg font-semibold text-slate-100">Spell Check Corrections</h3>
                    <ul className="mt-4 space-y-2 text-sm text-slate-300">
                      {result.spellcheck.corrections.map((item, index) => (
                        <li key={`${item.original}-${index}`}>
                          <span className="font-semibold text-slate-200">{item.original}</span> →{" "}
                          <span>{item.suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
