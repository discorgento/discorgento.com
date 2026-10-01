import type { TranslationKey } from '~/lib/i18n';
import { useTranslations } from '~/lib/i18n';

export interface SocialLink {
  label: string;
  url: string;
}

export interface TeamMember {
  slug: string;
  name: string;
  roleKey: TranslationKey;
  /** short self-written line, kept in both locales (null = not written yet) */
  bio: Record<string, string> | null;
  /** external avatar used when there is no file in public/time/<slug>.jpg */
  fallback: string | null;
  socials: SocialLink[];
}

export interface ResolvedMember extends Omit<TeamMember, 'bio'> {
  photo: string | null;
  profile: string;
  initials: string;
  role: string;
  bio: string | null;
}

export const team: TeamMember[] = [
  {
    slug: 'maria-ferro',
    name: 'Maria Ferro',
    roleKey: 'home.hosts.role.host',
    bio: {
      'pt-BR': 'Desenvolvedora Magento e Host do discorgento.',
      en: 'Magento Developer and Host at discorgento.',
    },
    fallback: 'https://avatars.githubusercontent.com/u/80163994?s=400&v=4',
    socials: [
      { label: 'linkedin', url: 'https://www.linkedin.com/in/maria-ferro/' },
      { label: 'github', url: 'https://github.com/maria-axe' },
    ],
  },
  {
    slug: 'jonatan-machado',
    name: 'Jonatan Machado',
    roleKey: 'home.hosts.role.cohostCommunity',
    bio: {
      'pt-BR':
        'Co-Host do podcast e cuidador da comunidade discorgento. Atua com desenvolvimento frontend e backend.',
      en: 'Co-Host of the discorgento podcast and steward of the community. Works on frontend and backend development.',
    },
    fallback: 'https://avatars.githubusercontent.com/u/2486808?s=400&v=4',
    socials: [
      { label: 'linkedin', url: 'https://www.linkedin.com/in/jonatanaxe/' },
      { label: 'github', url: 'https://github.com/jonatanaxe' },
    ],
  },
  {
    slug: 'ivan-augusto',
    name: 'Ivan Augusto',
    roleKey: 'home.hosts.role.cohostAdmin',
    bio: {
      'pt-BR':
        'Magento Tech Lead e desenvolvedor full-stack sênior, com 9 anos de experiência. Passagem pela IronPlane e formação pelo CEFET-MG.',
      en: 'Magento Tech Lead and senior full-stack developer with 9 years of experience. IronPlane · CEFET-MG.',
    },
    fallback: null,
    socials: [
      { label: 'linkedin', url: 'https://www.linkedin.com/in/ivanaugustobd/' },
      { label: 'github', url: 'https://github.com/ivanaugustobd' },
    ],
  },
  {
    slug: 'vitor-coutinho',
    name: 'Vitor Coutinho Fernandes',
    roleKey: 'home.hosts.role.cohostAdmin',
    bio: {
      'pt-BR': 'Apaixonado por programação, sem medo de ser um eterno Young Padawan.',
      en: 'Passionate about programming, without fear of being an eternal Young Padawan.',
    },
    fallback: 'https://avatars.githubusercontent.com/u/26583101?s=400&v=4',
    socials: [
      { label: 'linkedin', url: 'https://www.linkedin.com/in/vitor-coutinho-fernandes/' },
      { label: 'github', url: 'https://github.com/coutodev' },
    ],
  },
];

/**
 * Person nodes for the roster, keyed by the profile URL so the two editions
 * describe the same humans without colliding. Built here rather than in each
 * route because the pt-BR and en pages are otherwise identical and drift easily.
 */
export function buildTeamJsonLd(locale: string, site: URL) {
  const publisherId = `${new URL('/', site).href}#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': getTeam(locale).map((person) => ({
      '@type': 'Person',
      '@id': person.profile,
      name: person.name,
      description: person.bio ?? undefined,
      jobTitle: person.role,
      image: person.photo ?? undefined,
      worksFor: { '@id': publisherId },
      sameAs: person.socials.map((social) => social.url),
    })),
  };
}

/** Resolves photos (public/time/<slug>.{jpg,png,webp} wins), initials, role and bio for a locale. */
export function getTeam(locale: string): ResolvedMember[] {
  const t = useTranslations(locale);
  const localPhotos = Object.keys(import.meta.glob('../../public/time/*.{jpg,png,webp}'));
  const extensions = ['jpg', 'png', 'webp'];

  return team.map((person) => {
    const localPhoto = extensions
      .map((extension) => localPhotos.find((file) => file.endsWith(`/${person.slug}.${extension}`)))
      .find(Boolean);
    return {
      ...person,
      photo: localPhoto ? `/time/${localPhoto.split('/').pop()}` : person.fallback,
      /* the photo links to the person's own page — first social (linkedin) */
      profile: person.socials[0].url,
      initials: person.name
        .split(' ')
        .filter((word) => word.length > 2)
        .map((word) => word[0])
        .slice(0, 2)
        .join(''),
      role: t(person.roleKey),
      bio: person.bio ? (person.bio[locale] ?? person.bio['pt-BR']) : null,
    };
  });
}
