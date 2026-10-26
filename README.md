# Plugin- og CSS-dokumentasjon

Intern, statisk dokumentasjon for byråets WordPress-plugins og Flatsome CSS-snippets. Siden er `noindex` og tillater ingen roboter. Nedlastinger peker på ZIP-er som ligger som GitHub Release-assets i plugin-repositoriene — dette repositoriet inneholder ingen ZIP-filer.

Stabil nedlastingslenke per plugin: `/plugins/<slug>/latest.zip`. Den omdirigerer (307) ved build til siste stabile GitHub-asset. GitHubs egen `releases/latest/download/` kan ikke brukes, fordi ZIP-navnet inneholder versjonen. Lenken oppdateres ved neste deploy etter at en ny release-JSON er lagt inn. Versjonstabellen peker fortsatt på hver enkelt release.

## Krav

- Node 22 (se `.nvmrc`)
- npm

```bash
npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000).

Andre kommandoer:

```bash
npm run validate
npm run lint
npm run typecheck
npm test
npm run build
npm run verify-github
npm run new-release -- <slug> <version>
npm run check-immutability
```

## GitHub-token (kun CI)

**Ikke lim inn tokenet i repositoriet, i Vercel, eller i chat.** Bygget på Vercel trenger ingen hemmeligheter.

CI sjekker at dokumenterte plugin-versjoner faktisk finnes som GitHub Releases, også i **private** repositorier. Derfor trengs et **read-only** token som hemmelighet i *dette* docs-repositoriet:

1. Lag et [fine-grained personal access token](https://github.com/settings/personal-access-tokens) (eller en GitHub App-installasjonstoken) med **Read** på Contents og Metadata for plugin-repositoriene i `bli-synlig-plugins` (inkludert eventuelle private repositorier).
2. I docs-repositoriet: **Settings → Secrets and variables → Actions → New repository secret**.
3. Navn: `PLUGIN_GITHUB_TOKEN` (ikke `GITHUB_TOKEN` — det navnet er reservert av GitHub Actions).
4. Lim inn tokenet der, og ingen andre steder.

Lokalt er tokenet valgfritt. Uten det hopper `npm run verify-github` over sjekken. For å kjøre den selv:

```powershell
$env:GITHUB_TOKEN = "…"   # midlertidig i terminalen, ikke i en committet fil
npm run verify-github
```

`.env*`-filer er gitignore-t. Ikke commit tokenet.

## Slik legger du til innhold

Kun filer under `content/`. Ikke endre `app/`, `lib/` eller komponenter. Tekniske ID-er (slug, tag, filnavn) er engelsk kebab-case. Synlig tekst (`name`, `summary`, MDX) er norsk (`nb`).

Kopier en eksisterende plugin eller snippet som mal. Kjør `npm run validate` før PR. Sidene bruker `dynamicParams = false` — start `next dev` på nytt etter en ny slug, ellers blir det 404.

### Ny plugin

1. Publiser GitHub Release i plugin-repositoriet (sjekkliste under).
2. Opprett `content/plugins/<slug>/` (slug = mappenavn = kebab-case):

```
content/plugins/mitt-plugin/
  plugin.json
  docs/overview.mdx          (påkrevd)
  docs/installation.mdx      (valgfri — uten den vises standardsteg)
  docs/usage.mdx             (valgfri)
  releases/1.0.0.json
```

3. Standard GitHub-tag er `v{version}`, standard ZIP `{slug}-{version}.zip`. Overstyr `assetPattern` i `plugin.json` bare hvis fila heter noe annet (f.eks. `{slug}-v{version}.zip`).
4. SHA-256 kopieres fra GitHubs `digest` på release-assetet (`sha256:…`). **Ikke finn den opp.** Mangler den, utelat feltet (`sha256-missing` er warning, ikke feil).
5. Plugin-`tags` er fritekst. `related.plugins` / `related.snippets` må peke på slugs som finnes.
6. `author` (påkrevd) er slug til personen som la inn dokumentasjonen. Sluggen må finnes i [`content/taxonomy/authors.json`](content/taxonomy/authors.json). Ny medarbeider: legg til `{ "slug": "…", "label": "…" }` der først, deretter `"author": "…"` i `plugin.json`. Valgfri `maintainer` er org/team (f.eks. «Bli Synlig») — ikke samme som forfatter.
7. Valgfri `changelogUrl` vises som «Se hele endringsloggen». En versjon kan overstyre med `changelog.url`.

```json
{
  "$schema": "../../../schemas/plugin.schema.json",
  "name": "Mitt plugin",
  "summary": "Kort beskrivelse.",
  "versionScheme": "semver",
  "status": "active",
  "repository": {
    "owner": "bli-synlig-plugins",
    "repo": "mitt-plugin",
    "visibility": "public"
  },
  "author": "benjamin",
  "maintainer": "Bli Synlig"
}
```

### Ny versjon av en eksisterende plugin

1. Publiser GitHub Release (sjekkliste under).
2. Scaffold — overskriver aldri en eksisterende fil:

```bash
npm run new-release -- <slug> <version>
```

Skriptet henter dato, SHA-256 og release-notes, og kopierer krav og avhengigheter fra forrige versjon. Fyll inn changelog før PR. Private repos: `$env:GITHUB_TOKEN = "…"` midlertidig i terminalen (ikke i en fil).

Alternativt: ny fil `releases/<version>.json` for hånd. **Ikke** rediger `tag`, `asset` eller `sha256` på en eksisterende versjon, og **ikke** slett den — sett `yanked: { "reason": "…" }` i stedet.

### Ny CSS-snippet

```
content/snippets/<slug>/
  snippet.json
  snippet.css                (påkrevd, ikke tom)
  notes.mdx                  (valgfri)
```

`category` (og `subcategory` hvis satt) og alle `tags` **må** finnes i `content/taxonomy/`. Ikke opprett tagger «på sparket». `placement.location` er én av: `flatsome-custom-css-all`, `flatsome-custom-css-tablet`, `flatsome-custom-css-mobile`, `child-theme-stylesheet`, `wordpress-additional-css`, `other`.

Valgfri `tokens` gir fargefelt på snippet-siden. Hvert token har `id` (kebab-case), `label` (norsk) og `replace` (eksakt streng i `snippet.css`, f.eks. `var(--fs-color-primary)`). Feltene bytter inn CSS-variabel eller hex før kopiering.

```json
{
  "$schema": "../../../schemas/snippet.schema.json",
  "name": "Forbedrer knapper",
  "summary": "Jevnere layout på Flatsome-knapper.",
  "category": "buttons",
  "tags": ["spacing", "border"],
  "placement": { "location": "flatsome-custom-css-all" },
  "updated": "2026-10-23"
}
```

## Sjekkliste for plugin-repositorier

Når du gir ut en versjon i selve plugin-repositoriet:

- [ ] Tag følger mønsteret i `plugin.json` (standard `v1.2.3`).
- [ ] ZIP-en heter `{slug}-{version}.zip` (eller `assetPattern` / `download.asset`) og har plugin-mappen øverst.
- [ ] ZIP-en er **Release asset**, ikke bare GitHubs automatiske kildearkiv.
- [ ] Ikke slett publiserte releases. Marker dem yanked her i docs-repositoriet.
- [ ] Slå på [immutable releases](https://docs.github.com/en/repositories/releasing-projects-on-github/immutable-releases) hvis planen tillater det.

## CI og deploy

GitHub Actions (`ci.yml`) kjører på PR og `main`: validering, lint, typecheck, tester, immutability, GitHub-verifisering og `next build`. En ukentlig jobb sjekker at Release-assets fortsatt finnes, og åpner et issue hvis noe er borte.

Vercel deployer forhåndsvisninger per PR. **Ingen miljøvariabler på Vercel.** Node-versjonen i prosjektinnstillingene skal være 22.

Dokumentasjonen er intern: `robots.txt` disallows alt, og alle sider sender `X-Robots-Tag: noindex`. Vercel Deployment Protection (passord / Vercel Authentication) er valgfritt for teamet og er ikke påkrevd for MVP, fordi ZIP-nedlastinger allerede er beskyttet av GitHub.
