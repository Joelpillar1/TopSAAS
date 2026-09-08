import React, { useEffect } from 'react';
import { Product } from '../types';
import { BadgeStyle, BadgeTheme, generateBadgeSvg } from '../utils/badgeSvg';

interface BadgeRouteProps {
  productId: string;
  products: Product[];
  submissions?: { id: string; name: string; url: string; rank?: number; upvotes?: number }[];
}

export const BadgeRoute: React.FC<BadgeRouteProps> = ({ productId, products, submissions = [] }) => {
  // Parse query params for style and theme
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const style = (params.get('style') as BadgeStyle) || 'featured';
  const theme = (params.get('theme') as BadgeTheme) || 'light';

  // Find product by id or alt id
  const altId = productId.startsWith('prod-') ? productId.replace(/^prod-/, '') : `prod-${productId}`;
  const product =
    products.find((p) => p.id === productId || p.id === altId) ||
    submissions.find((s) => s.id === productId || s.id === altId);

  const targetProduct: Product = (product as Product) || {
    id: productId,
    name: 'TopSAAS Product',
    tagline: 'Discover top SaaS tools',
    url: 'https://topsaas.org',
    category: 'Developer Tools' as Product['category'],
    rank: 1,
    upvotes: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const svgString = generateBadgeSvg(targetProduct, { style, theme });

  useEffect(() => {
    // If the browser loaded this route standalone as an image/xml, adjust title
    document.title = `${targetProduct.name} - TopSAAS Badge`;
  }, [targetProduct.name]);

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
};
