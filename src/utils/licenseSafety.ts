/**
 * Deterministic license safety analyzer based on SPDX identifiers.
 *
 * Tiers:
 * - Green ("Safe for commercial SaaS"): MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense
 * - Yellow ("Check the rules"): GPL-2.0, GPL-3.0, LGPL-*, MPL-2.0, AGPL-3.0, EUPL-*, or open core
 * - Red ("Not open source or no license"): SSPL-1.0, BUSL-1.1, Elastic-2.0, Commons-Clause, or missing
 */

export type LicenseTier = 'safe' | 'conditional' | 'restricted';

export interface LicenseSafetyInfo {
  tier: LicenseTier;
  spdxId: string;
  badgeLabel: string;
  shortLabel: string;
  plainExplanation: string;
  isAgpl: boolean;
  isOpenCore: boolean;
  isCopyleft: boolean;
  colorClasses: {
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotBg: string;
    iconColor: string;
  };
}

const PERMISSIVE_SPDX = new Set([
  'MIT',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'ISC',
  '0BSD',
  'Unlicense',
  'CC0-1.0',
  'Zlib',
  'BSL-1.0',
]);

const COPYLEFT_CONDITIONAL_SPDX = new Set([
  'AGPL-3.0',
  'AGPL-3.0-only',
  'AGPL-3.0-or-later',
  'GPL-2.0',
  'GPL-2.0-only',
  'GPL-2.0-or-later',
  'GPL-3.0',
  'GPL-3.0-only',
  'GPL-3.0-or-later',
  'LGPL-2.1',
  'LGPL-2.1-only',
  'LGPL-2.1-or-later',
  'LGPL-3.0',
  'LGPL-3.0-only',
  'LGPL-3.0-or-later',
  'MPL-2.0',
  'EUPL-1.2',
  'EPL-2.0',
  'OSL-3.0',
]);

const SOURCE_AVAILABLE_OR_RESTRICTED_SPDX = new Set([
  'BUSL-1.1',
  'SSPL-1.0',
  'Elastic-2.0',
  'Server Side Public License',
  'Business Source License 1.1',
  'Commons Clause',
]);

export function getLicenseSafety(rawSpdx: string | null | undefined, options?: { isOpenCore?: boolean }): LicenseSafetyInfo {
  const normalized = (rawSpdx || '').trim();

  // Open core override
  if (options?.isOpenCore) {
    return {
      tier: 'conditional',
      spdxId: normalized || 'Open Core',
      badgeLabel: 'Check the rules (Open Core)',
      shortLabel: 'Open Core',
      plainExplanation: 'Core repo may be permissive, but commercial/enterprise features are restricted in separate folders (e.g. /ee).',
      isAgpl: false,
      isOpenCore: true,
      isCopyleft: false,
      colorClasses: {
        badgeBg: 'bg-amber-500/10',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-500/30',
        dotBg: 'bg-amber-500',
        iconColor: 'text-amber-600',
      },
    };
  }

  // Missing or empty license
  if (!normalized || normalized.toUpperCase() === 'NOASSERTION' || normalized.toLowerCase() === 'none') {
    return {
      tier: 'restricted',
      spdxId: 'None',
      badgeLabel: 'No recognized license (check repo)',
      shortLabel: 'Check license',
      plainExplanation: 'GitHub did not detect a standard license file. Without explicit permission, default copyright applies, so do not commercialize, modify, or host this code until you have read the repository LICENSE.',
      isAgpl: false,
      isOpenCore: false,
      isCopyleft: false,
      colorClasses: {
        badgeBg: 'bg-rose-500/10',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-500/30',
        dotBg: 'bg-rose-500',
        iconColor: 'text-rose-600',
      },
    };
  }

  // Source-available / Non-OSI restricted
  const upper = normalized.toUpperCase();
  const isSourceAvailable =
    SOURCE_AVAILABLE_OR_RESTRICTED_SPDX.has(normalized) ||
    upper.includes('BUSL') ||
    upper.includes('SSPL') ||
    upper.includes('COMMONS') ||
    upper.includes('ELASTIC');

  if (isSourceAvailable) {
    return {
      tier: 'restricted',
      spdxId: normalized,
      badgeLabel: 'Not open source / Source-available',
      shortLabel: 'Source-available',
      plainExplanation: 'Source is visible on GitHub but legally restricts commercial SaaS or competing cloud hosting services.',
      isAgpl: false,
      isOpenCore: false,
      isCopyleft: false,
      colorClasses: {
        badgeBg: 'bg-rose-500/10',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-500/30',
        dotBg: 'bg-rose-500',
        iconColor: 'text-rose-600',
      },
    };
  }

  // Permissive core with extra restrictions, for example Apache-2.0 plus a
  // hosted-service restriction. These are source-available, not OSI open source.
  const hasAdditionalTerms =
    upper.includes('ADDITIONAL TERMS') ||
    upper.includes('HOSTED SERVICE RESTRICTION') ||
    upper.includes('SOURCE-AVAILABLE') ||
    upper.includes('SOURCE AVAILABLE');

  if (hasAdditionalTerms) {
    return {
      tier: 'conditional',
      spdxId: normalized,
      badgeLabel: 'Source-available: extra terms',
      shortLabel: 'Source-available',
      plainExplanation: 'Permissive core with additional restrictions. Self-hosting and internal commercial use are usually allowed, but offering it as a hosted or embedded service may need written permission.',
      isAgpl: false,
      isOpenCore: false,
      isCopyleft: false,
      colorClasses: {
        badgeBg: 'bg-amber-500/10',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-500/30',
        dotBg: 'bg-amber-500',
        iconColor: 'text-amber-600',
      },
    };
  }

  // AGPL check
  const isAgpl = upper.includes('AGPL');
  if (isAgpl) {
    return {
      tier: 'conditional',
      spdxId: normalized,
      badgeLabel: 'Check the rules: AGPL copyleft trap',
      shortLabel: 'AGPL-3.0 (Network copyleft)',
      plainExplanation: 'You must publish your entire modified source code to your SaaS users, even when running it as a hosted web app.',
      isAgpl: true,
      isOpenCore: false,
      isCopyleft: true,
      colorClasses: {
        badgeBg: 'bg-amber-500/10',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-500/30',
        dotBg: 'bg-amber-500',
        iconColor: 'text-amber-600',
      },
    };
  }

  // Other Copyleft (GPL, LGPL, MPL, etc.)
  const isCopyleft =
    COPYLEFT_CONDITIONAL_SPDX.has(normalized) ||
    upper.startsWith('GPL') ||
    upper.startsWith('LGPL') ||
    upper.startsWith('MPL') ||
    upper.startsWith('EUPL');

  if (isCopyleft) {
    const isMplOrLgpl = upper.includes('MPL') || upper.includes('LGPL');
    return {
      tier: 'conditional',
      spdxId: normalized,
      badgeLabel: 'Check the rules (Copyleft)',
      shortLabel: normalized,
      plainExplanation: isMplOrLgpl
        ? 'Weak copyleft: you only need to share changes made directly to the licensed files, not your proprietary app.'
        : 'Strong copyleft: if you distribute binaries to users you must share source code. Cloud-only hosting might avoid this, but verify carefully.',
      isAgpl: false,
      isOpenCore: false,
      isCopyleft: true,
      colorClasses: {
        badgeBg: 'bg-amber-500/10',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-500/30',
        dotBg: 'bg-amber-500',
        iconColor: 'text-amber-600',
      },
    };
  }

  // Permissive check (MIT, Apache, BSD, ISC)
  const isPermissive =
    PERMISSIVE_SPDX.has(normalized) ||
    upper.includes('MIT') ||
    upper.includes('APACHE') ||
    upper.includes('BSD') ||
    upper.includes('ISC');

  if (isPermissive) {
    return {
      tier: 'safe',
      spdxId: normalized,
      badgeLabel: 'Safe for commercial SaaS',
      shortLabel: 'Safe for SaaS',
      plainExplanation: 'Permissive license allows commercial monetization, private modifications, closed-source hosting, and rebranding.',
      isAgpl: false,
      isOpenCore: false,
      isCopyleft: false,
      colorClasses: {
        badgeBg: 'bg-emerald-500/10',
        badgeText: 'text-emerald-700',
        badgeBorder: 'border-emerald-500/30',
        dotBg: 'bg-emerald-500',
        iconColor: 'text-emerald-600',
      },
    };
  }

  // Unrecognized fallback: Default to conditional check
  return {
    tier: 'conditional',
    spdxId: normalized,
    badgeLabel: 'Check the rules',
    shortLabel: normalized,
    plainExplanation: 'Non-standard or custom license terms. Review the repository LICENSE file before commercializing.',
    isAgpl: false,
    isOpenCore: false,
    isCopyleft: false,
    colorClasses: {
      badgeBg: 'bg-neutral-100',
      badgeText: 'text-neutral-700',
      badgeBorder: 'border-neutral-300',
      dotBg: 'bg-neutral-400',
      iconColor: 'text-neutral-500',
    },
  };
}
