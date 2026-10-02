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
  /**
   * srcset for the 36px byline slot, or null when the photo has no cheaper form.
   *
   * The same photo is used twice: the byline draws it at 2.25rem and the host grid
   * at 166px and up. Lighthouse flagged the byline for downloading 400px of avatar
   * into a 36px box, and it is right — but the fix is not to shrink the file, since
   * the grid needs the big one. It is to let the two slots ask for different sizes.
   *
   * GitHub serves any dimension through `?s=`, so the byline can simply ask for
   * 96w and let the grid keep 400w. A local file cannot be rewritten, so it needs a
   * real small copy on disk (public/time/<slug>-96.*); without one the byline keeps
   * the full image rather than pretending otherwise.
   */
  photoSrcset: string | null;
  profile: string;
  initials: string;
  role: string;
  bio: string | null;
}

/** Widths a browser should pick for the byline, smallest first. */
const BYLINE_WIDTH = 96;

/** GitHub avatars are resized server-side by the `s` query parameter. */
function avatarSrcset(url: string): string | null {
  const m = /^(https:\/\/avatars\.githubusercontent\.com\/[^?]+)\?s=(\d+)/.exec(url);
  if (!m) return null;
  return `${m[1]}?s=${BYLINE_WIDTH} ${BYLINE_WIDTH}w, ${m[1]}?s=${m[2]} ${m[2]}w`;
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
    fallback: null,
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
    fallback: null,
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
    fallback: null,
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

    /** Small byline copy, named <slug>-96.<ext> so it cannot shadow the main photo. */
    const bylineCopy = (slug: string): string | null =>
      extensions
        .map((extension) =>
          localPhotos.find((file) => file.endsWith(`/${slug}-${BYLINE_WIDTH}.${extension}`))
        )
        .find(Boolean) ?? null;

    return team.map((person) => {
      const localPhoto = extensions
        .map((extension) => localPhotos.find((file) => file.endsWith(`/${person.slug}.${extension}`)))
        .find(Boolean);
      const photo = localPhoto ? `/time/${localPhoto.split('/').pop()}` : person.fallback;
      const small = bylineCopy(person.slug);
      return {
        ...person,
        photo,
        photoSrcset: small
          ? `${`/time/${small.split('/').pop()}`} ${BYLINE_WIDTH}w`
          : photo
            ? avatarSrcset(photo)
            : null,
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
