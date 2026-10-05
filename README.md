# Orbs trading landing page

A lightweight, responsive landing page with direct links to Orbs Spot and Perps.

## Development

```sh
npm install
npm run dev
```

The local development server runs at http://localhost:3005. Production preview uses the same port.

## Production

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to any static host. No environment variables or backend are required. A small script follows the system theme on every page load and responds to system theme changes. The toggle overrides the theme for the current visit only.

Brand colors, the original Orbs mark, and locally hosted Montserrat font were sourced from https://orbs-website-v2.vercel.app/. Primary destination URLs are defined directly in `index.html`.

The favicon is the original reference site's `favicon.ico`. The branded 1200 × 630 social image is `public/assets/orbs-social.png`, referenced by Open Graph and X card metadata. Once the public domain is finalized, replace the two root-relative social image URLs in `index.html` with absolute HTTPS URLs for sharing crawlers.

## Vercel deployment

The **Frontend Deploy** GitHub Actions workflow deploys to production manually. It targets the Vercel project configured in `vars.VERCEL_PROJECT_ID` and uses the GitHub `production` environment.

Configure these GitHub Actions settings at repository level or in the `production` environment:

- Variable `VERCEL_ORG_ID`: the Vercel team/account ID that owns this project.
- Variable `VERCEL_PROJECT_ID`: set to `prj_61TDPGewbT8bMgwNxDoCqFpgW3aJ`.
- Secret `VERCEL_TOKEN`: a Vercel token with deployment access to that project.

After the workflow is on the repository's default branch, open **Actions → Frontend Deploy → Run workflow**, select the branch to deploy, and run it. Any protection rules configured on the `production` environment apply.

The workflow installs from `package-lock.json` using Node 22, validates JavaScript syntax, pulls the production project settings, and builds with `vercel build --prod`. It publishes those artifacts with `vercel deploy --prebuilt --prod`, following the [Vercel GitHub Actions deployment flow](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel). `vercel.json` explicitly configures the Vite build and `dist` output. No RPC or partner configuration is needed.
