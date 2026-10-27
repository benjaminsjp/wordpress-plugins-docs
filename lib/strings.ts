export const strings = {
  site: {
    name: "Plugin- og CSS-dokumentasjon",
    shortName: "Dokumentasjon",
    mark: "D",
    description:
      "Intern dokumentasjon for byråets WordPress-plugins og Flatsome CSS-snippets.",
  },
  theme: {
    dark: "Mørk modus",
    light: "Lys modus",
    toggle: "Bytt mellom lys og mørk modus",
  },
  footer: {
    githubHeading: "GitHub",
    backToTop: "Til toppen",
    developedBy: "Utviklet og vedlikeholdt av",
    and: "og",
    copyright: (year: number, date: string) =>
      `© ${year} Dokumentasjon. Sist oppdatert ${date}.`,
    maintainers: [
      {
        name: "Benjamin Pedersen",
        href: "https://github.com/benjaminsjp",
      },
      {
        name: "Kim Lukas Myrvold",
        href: "https://github.com/kimlukasmyrvold",
      },
    ],
    github: [
      {
        label: "Bli Synlig",
        href: "https://github.com/bli-synlig-plugins",
      },
      {
        label: "Benjamin Pedersen",
        href: "https://github.com/benjaminsjp",
      },
      {
        label: "Kim Lukas Myrvold",
        href: "https://github.com/kimlukasmyrvold",
      },
    ],
  },
  nav: {
    home: "Hjem",
    plugins: "Plugins",
    allPlugins: "Alle plugins",
    snippets: "CSS-snippets",
    allSnippets: "Alle snippets",
    openMenu: "Vis eller skjul menyen",
    skipToContent: "Hopp til innhold",
  },
  search: {
    title: "Søk",
    description: "Søk etter plugins, CSS-snippets og kategorier.",
    trigger: "Søk",
    placeholder: "Søk etter plugins, CSS-snippets og kategorier",
    empty: "Ingen treff",
    loading: "Laster søkeindeks…",
    error: "Kunne ikke laste søkeindeksen. Prøv å åpne søket på nytt.",
    shortcut: "Åpne søk",
    groups: {
      plugins: "Plugins",
      snippets: "CSS-snippets",
      categories: "Kategorier",
    },
  },
  home: {
    title: "Dokumentasjon",
    intro:
      "Samlet oversikt over byråets WordPress-plugins og Flatsome CSS-snippets.",
    pluginCount: (count: number) =>
      count === 1 ? "1 plugin" : `${count} plugins`,
    snippetCount: (count: number) =>
      count === 1 ? "1 CSS-snippet" : `${count} CSS-snippets`,
    latestReleases: "Siste plugin-versjoner",
    recentSnippets: "Nylig oppdaterte snippets",
    categories: "Kategorier",
    viewAllPlugins: "Se alle plugins",
    viewAllSnippets: "Se alle snippets",
    snippetCountInCategory: (count: number) =>
      count === 1 ? "1 snippet" : `${count} snippets`,
    categoriesHint: "Kategorier med innhold er markert med grønt.",
  },
  plugins: {
    title: "Plugins",
    description: "Interne WordPress-plugins, versjoner og avhengigheter.",
    emptyTitle: "Ingen plugins ennå",
    emptyDescription: "Legg til en plugin under content/plugins for å vise den her.",
    emptyFilterTitle: "Ingen treff",
    emptyFilterDescription:
      "Ingen plugins matcher filteret. Prøv et annet søk, status, tag eller forfatter.",
    filterPlaceholder: "Søk i navn og sammendrag",
    allStatuses: "Alle",
    allTags: "Alle tagger",
    allAuthors: "Alle forfattere",
    authorLabel: "Forfatter",
    visibility: {
      public: "Offentlig repo",
      private: "Privat repo",
    },
    downloadLatest: "Last ned nyeste",
    viewOnGitHub: "Se på GitHub",
    privateDownloadNote:
      "Nedlasting krever at du er logget inn på GitHub med tilgang til organisasjonen. Uten tilgang viser GitHub 404.",
    deprecatedTitle: "Pluginen er foreldet",
    deprecatedDescription: "Bruk en nyere plugin i stedet.",
    replacedBy: "Erstattet av",
    betaTitle: "Siste versjon er en beta",
    betaDescription:
      "Det finnes ingen stabil utgivelse ennå. Test grundig før du tar den i bruk i produksjon.",
    seeDetails: "Se detaljer",
    updatedOn: (date: string) => `Oppdatert ${date}`,
    dependencyName: "Avhengighet",
    yes: "Ja",
    no: "Nei",
    requirements: "Krav",
    requirementsIntro:
      "Minimumsversjoner som må være på plass før du installerer.",
    dependenciesIntro:
      "Disse må være installert og aktivert for at plugin-en skal fungere.",
    manualUpdate:
      "Oppdaterer du plugin-en manuelt? Last ned zip-filen og velg Plugins → Legg til → Last opp i WordPress.",
    wordpress: "WordPress",
    php: "PHP",
    flatsome: "Flatsome",
    min: "Minimum",
    tested: "Testet",
    dependencies: "Avhengigheter",
    usedBy: "Brukes av",
    required: "Påkrevd",
    optional: "Valgfri",
    satisfies: "Oppfylt",
    unsatisfied: "Ikke oppfylt",
    unknownSatisfaction: "Ukjent",
    noDependencies: "Ingen avhengigheter i siste versjon.",
    noDependents: "Ingen andre plugins avhenger av denne.",
    overview: "Om pluginen",
    installation: "Installasjon",
    usage: "Bruk",
    versions: "Versjoner",
    versionColumn: "Versjon",
    dateColumn: "Dato",
    channelColumn: "Kanal",
    related: "Relatert",
    relatedPlugins: "Plugins",
    relatedSnippets: "CSS-snippets",
    changelog: "Endringslogg",
    fullChangelog: "Se hele endringsloggen",
    changelogAdded: "Lagt til",
    changelogChanged: "Endret",
    changelogFixed: "Rettet",
    changelogRemoved: "Fjernet",
    changelogSecurity: "Sikkerhet",
    channel: {
      stable: "Stabil",
      beta: "Beta",
    },
    yanked: "Tilbaketrukket",
    noReleasesTitle: "Ingen versjoner ennå",
    noReleasesDescription:
      "Legg til en fil under content/plugins/<slug>/releases og publiser ZIP-en som GitHub Release.",
    downloadAsset: "ZIP",
    releasePage: "GitHub-release",
    sha256: "SHA-256",
    copySha: "Kopier SHA-256",
    defaultInstallIntro:
      "Installer som en vanlig WordPress-plugin fra ZIP-filen til siste stabile versjon.",
    defaultInstallSteps: [
      "Last ned ZIP-en med knappen over, eller fra GitHub-releasen.",
      "I WordPress: Plugins → Legg til ny → Last opp plugin.",
      "Velg ZIP-filen, installer og aktiver.",
    ],
    minLabel: (value: string) => `min. ${value}`,
    testedLabel: (value: string) => `testet ${value}`,
  },
  code: {
    copy: "Kopier kode",
    copied: "Kopiert",
    scrollLabel: "Kodeblokk",
    showAll: "Vis hele koden",
    showLess: "Skjul koden",
  },
  snippets: {
    title: "CSS-snippets",
    description: "Flatsome- og WordPress-CSS organisert etter område.",
    emptyTitle: "Ingen snippets ennå",
    emptyDescription: "Legg til en snippet under content/snippets for å vise den her.",
    emptyCategoryTitle: "Ingen snippets i denne kategorien",
    emptyCategoryDescription: "Det er ikke lagt inn CSS-snippets her ennå.",
    emptyTagTitle: "Ingen snippets med denne taggen",
    emptyTagDescription: "Ingen snippets bruker denne taggen ennå.",
    tags: "Tagger",
    tagsHint: "Finn snippets på tvers av kategorier.",
    placementTitle: "Hvor skal CSS-en limes inn?",
    compatibility: "Kompatibilitet",
    notes: "Notater",
    related: "Relaterte snippets",
    updated: "Oppdatert",
    code: "Kode",
    tokenFields: "Tilpass farger",
    tokenHint:
      "Lim inn en CSS-variabel eller hex-farge. Kopier-knappen bruker verdiene her.",
    tokenReset: "Tilbakestill",
    tokenColor: (label: string) => `Velg farge for ${label}`,
    placement: {
      "flatsome-custom-css-all": {
        label: "Flatsome tilpasset CSS, alle skjermer",
        steps: [
          "Gå til Flatsome → Theme Options → Avansert → Tilpasset CSS.",
          "Lim inn koden i feltet for alle skjermstørrelser.",
        ],
      },
      "flatsome-custom-css-tablet": {
        label: "Flatsome tilpasset CSS, nettbrett",
        steps: [
          "Gå til Flatsome → Theme Options → Avansert → Tilpasset CSS.",
          "Lim inn koden i feltet for nettbrett. Ikke pakk den inn i @media.",
        ],
      },
      "flatsome-custom-css-mobile": {
        label: "Flatsome tilpasset CSS, mobil",
        steps: [
          "Gå til Flatsome → Theme Options → Avansert → Tilpasset CSS.",
          "Lim inn koden i feltet for mobil. Ikke pakk den inn i @media.",
        ],
      },
      "child-theme-stylesheet": {
        label: "Barnetemaets stylesheet",
        steps: [
          "Åpne barne-temaets style.css, eller en CSS-fil som lastes derfra.",
          "Lim inn koden nederst i filen.",
        ],
      },
      "wordpress-additional-css": {
        label: "WordPress tilleggs-CSS",
        steps: [
          "Gå til Utseende → Tilpass → Tilleggs-CSS.",
          "Lim inn koden i feltet og publiser.",
        ],
      },
      other: {
        label: "Annet",
        steps: ["Følg notatet under for hvor koden skal limes inn."],
      },
    },
  },
  toc: {
    title: "På denne siden",
  },
  notFound: {
    title: "Siden finnes ikke",
    description: "Vi fant ikke siden du leter etter. Sjekk adressen, eller gå tilbake til oversikten.",
    backHome: "Til forsiden",
  },
  status: {
    active: "Aktiv",
    deprecated: "Foreldet",
    archived: "Arkivert",
  },
  version: (version: string) => `v${version}`,
} as const
