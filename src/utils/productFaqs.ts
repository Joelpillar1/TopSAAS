import type { Product } from '../types';
import { firstSentences, stripMarkup } from './plainCopy';

export interface ProductFaq {
  q: string;
  a: string;
}

const clean = (value?: string | null): string =>
  stripMarkup(value || '').replace(/\s+/g, ' ').trim();

const withPeriod = (value: string): string => {
  if (!value) return '';
  return /[.!?]$/.test(value) ? value : `${value}.`;
};

const primaryCategory = (product: Product): string =>
  clean(product.category).split(',')[0].trim() || 'SaaS';

/**
 * Product FAQs are generated from the listing fields so every product page
 * carries question-and-answer copy that is specific to that product. The same
 * list feeds the visible FAQ block and the FAQPage structured data, so the two
 * can never drift apart.
 */
export const productFaqs = (product: Product): ProductFaq[] => {
  const name = clean(product.name) || 'This product';
  const category = primaryCategory(product);
  const categoryLower = category.toLowerCase();
  const tagline = clean(product.tagline);
  const description = firstSentences(clean(product.description), 320);
  const pricing = clean(product.pricingModel);
  const audience = clean(product.targetAudience);
  const upvotes = typeof product.upvotes === 'number' ? product.upvotes : 0;
  const rank = typeof product.rank === 'number' ? product.rank : 0;

  const summary = withPeriod(
    description || tagline || `${name} is a ${categoryLower} product listed on TopSAAS`
  );

  const faqs: ProductFaq[] = [
    {
      q: `What is ${name}?`,
      a: `${name} is listed in the ${category} category on TopSAAS. ${summary}`,
    },
    {
      q: `Who is ${name} for?`,
      a: audience
        ? `${name} is aimed at ${withPeriod(audience).replace(/\.$/, '')}. It sits in the ${category} category on TopSAAS, alongside other tools that serve the same buyers.`
        : `${name} sits in the ${category} category on TopSAAS. That category covers tools bought by founders, operators, and teams evaluating ${categoryLower} software. Check the ${name} website for the plans, limits, and integrations that decide whether it fits your workflow.`,
    },
    {
      q: `How much does ${name} cost?`,
      a: pricing
        ? `${name} lists a ${pricing} pricing model on TopSAAS. Plans and limits change often, so confirm the current price, free tier, and trial terms on the ${name} website before you commit.`
        : `TopSAAS does not publish a price for ${name}. The listing links to the product website, where current plans, free tiers, and trial terms are documented.`,
    },
    {
      q: `Is ${name} verified on TopSAAS?`,
      a: product.verified
        ? `Yes. ${name} holds a verified listing on TopSAAS. Verified listings pass manual review and display a verified badge on the leaderboard and on this page.`
        : `${name} is listed on TopSAAS without a verified badge. A verified badge is added after a paid Verified Launch review, which checks the product website, pricing, and listing details.`,
    },
    {
      q: `How is ${name} ranked on TopSAAS?`,
      a: upvotes > 0
        ? `${name} has ${upvotes.toLocaleString('en-US')} community ${upvotes === 1 ? 'upvote' : 'upvotes'} and currently sits at rank #${rank} on the TopSAAS leaderboard. Ranking is driven by community upvotes and launch engagement rather than paid placement.`
        : `${name} has no community upvotes yet, so it is not ranked on the current TopSAAS leaderboard. Upvotes from signed-in users move a listing up the board each week.`,
    },
    {
      q: `Where can I compare alternatives to ${name}?`,
      a: `Browse the TopSAAS ${category} listings and the full product directory to compare ${name} with similar tools. The related products section on this page links to other ${category} listings ranked on TopSAAS.`,
    },
  ];

  const offer = clean(product.offerDiscount) || clean(product.offerDetails);
  if (offer) {
    faqs.push({
      q: `Does ${name} offer a discount for TopSAAS visitors?`,
      a: `${name} lists this offer on TopSAAS: ${withPeriod(offer)}${
        product.offerCode ? ` Use code ${clean(product.offerCode)} at checkout.` : ''
      }`,
    });
  }

  return faqs;
};
