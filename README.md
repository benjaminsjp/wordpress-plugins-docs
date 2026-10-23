# Plugin- og CSS-dokumentasjon

Intern, statisk dokumentasjon for byråets WordPress-plugins og Flatsome CSS-snippets. Siden er `noindex` og tillater ingen roboter. Nedlastinger peker på ZIP-er som ligger som GitHub Release-assets i plugin-repositoriene — dette repositoriet inneholder ingen ZIP-filer.

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
npm run check-immutability
```

## GitHub-token (kun CI)

**Ikke lim inn tokenet i repositoriet, i Vercel, eller i chat.** Bygget på Vercel trenger ingen hemmeligheter.

CI sjekker at dokumenterte plugin-versjoner faktisk finnes som GitHub Releases, også i **private** repositorier. Derfor trengs et **read-only** token som hemmelighet i *dette* docs-repositoriet:

1. Lag et [fine-grained personal access token](https://github.com/settings/personal-access-tokens) (eller en GitHub App-installasjonstoken) med **Read** på Contents og Metadata for plugin-repositoriene i `bli-synlig-plugins` (inkludert private, f.eks. `kafra-datablad`).
2. I docs-repositoriet: **Settings → Secrets and variables → Actions → New repository secret**.
3. Navn: `PLUGIN_GITHUB_TOKEN` (ikke `GITHUB_TOKEN` — det navnet er reservert av GitHub Actions).
4. Lim inn tokenet der, og ingen andre steder.

Lokalt er tokenet valgfritt. Uten det hopper `npm run verify-github` over sjekken. For å kjøre den selv:

```powershell
$env:GITHUB_TOKEN = "…"   # midlertidig i terminalen, ikke i en committet fil
npm run verify-github
```

`.env*`-filer er gitignore-t. Ikke commit tokenet.

## Slik legger du til en plugin, versjon eller snippet

Alt innhold ligger under `content/`. Du trenger ikke å endre applikasjonskode.

### Plugin

Opprett `content/plugins/<slug>/`:

```
content/plugins/mitt-plugin/
  plugin.json
  docs/overview.mdx          (påkrevd)
  docs/installation.mdx      (valgfri)
  docs/usage.mdx             (valgfri)
  releases/1.0.0.json
```

`plugin.json`-eksempel:

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
    "visibility": "private"
  }
}
```

Slug = mappenavn (kebab-case). Standard GitHub-tag er `v{version}`, standard ZIP-navn er `{slug}-{version}.zip`.

Kjør `npm run validate` før du åpner PR.

### Ny versjon

1. Publiser GitHub Release i plugin-repositoriet (se sjekklisten under).
2. Legg til **en ny fil** `content/plugins/<slug>/releases/<version>.json`. Ikke rediger `tag`, `asset` eller `sha256` på en eksisterende versjonsfil, og ikke slett den — marker den `yanked` i stedet.

```json
{
  "$schema": "../../../../schemas/release.schema.json",
  "releaseDate": "2026-10-23",
  "channel": "stable",
  "requirements": {
    "wordpress": { "min": "6.4" },
    "php": { "min": "8.1" }
  },
  "changelog": {
    "added": ["Ny funksjon."]
  }
}
```

### CSS-snippet

```
content/snippets/<slug>/
  snippet.json
  snippet.css
  notes.mdx                  (valgfri)
```

Kategori og tagger må finnes i `content/taxonomy/`.

## Sjekkliste for plugin-repositorier

Når du gir ut en versjon i selve plugin-repositoriet:

- [ ] Tag følger mønsteret i `plugin.json` (standard `v1.2.3`, uten andre avvik).
- [ ] ZIP-en heter `{slug}-{version}.zip` (eller det overstyrte `asset`-navnet) og har plugin-mappen øverst.
- [ ] ZIP-en er lastet opp som **Release asset**, ikke bare som GitHubs automatiske kildearkiv.
- [ ] Ikke slett publiserte releases. Marker dem yanked her i docs-repositoriet.
- [ ] Slå på [immutable releases](https://docs.github.com/en/repositories/releasing-projects-on-github/immutable-releases) på plugin-repositoriet hvis planen tillater det.

## CI og deploy

GitHub Actions (`ci.yml`) kjører på PR og `main`: validering, lint, typecheck, tester, immutability, GitHub-verifisering og `next build`. En ukentlig jobb sjekker at Release-assets fortsatt finnes, og åpner et issue hvis noe er borte.

Vercel deployer forhåndsvisninger per PR. **Ingen miljøvariabler på Vercel.** Node-versjonen i prosjektinnstillingene skal være 22.

Dokumentasjonen er intern: `robots.txt` disallows alt, og alle sider sender `X-Robots-Tag: noindex`. Vercel Deployment Protection (passord / Vercel Authentication) er valgfritt for teamet og er ikke påkrevd for MVP, fordi ZIP-nedlastinger allerede er beskyttet av GitHub.
