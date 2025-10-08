# OrgContact

OrgContact is an Okta-backed people directory and org chart built with Next.js 14. It delivers fast search, filterable lists, and an interactive React Flow org chart suitable for Azure App Service deployment via a standalone build.

## Environment variables

Create a `.env` file based on `.env.example`:

```
OKTA_ORG_URL=your-okta-domain
OKTA_API_TOKEN=api-token
NODE_ENV=production
# REDIS_URL=redis://user:pass@host:6379
```

## Local development

```bash
npm install
npm run dev
```

The development server runs on [http://localhost:3000](http://localhost:3000).

## Build and run

```bash
npm run build
npm start
```

The build generates a Next.js standalone output and `npm start` serves it from `.next/standalone/server.js`.

## Azure App Service deployment

1. Configure a publish profile secret `AZUREAPPSERVICE_PUBLISHPROFILE` and the `AZURE_APP_NAME` setting in GitHub.
2. Ensure the App Service is set to Node 20 with **Always On** enabled.
3. Set the startup command to:
   ```
   node .next/standalone/server.js
   ```
4. Configure application settings for `NODE_ENV=production`, `OKTA_ORG_URL`, `OKTA_API_TOKEN`, and optionally `REDIS_URL`.

The CI workflow builds the standalone bundle and deploys it using the publish profile without relying on Oryx.

## Okta data assumptions

* Users are read from `GET /api/v1/users`.
* Manager relationships use `profile.managerId`. Update the attribute name in `app/api/org/[id]/route.ts` if your Okta tenant differs.

## Notes

* No secrets are exposed client-side; all Okta calls are routed through server API handlers with 8s timeouts and a single retry on transient errors.
* A lightweight in-memory cache is enabled by default. Provide `REDIS_URL` to swap in the Redis adapter stub for future expansion.
