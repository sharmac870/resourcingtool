# Techzick Resource Manager

A lightweight, no-cost browser-based resource management tool for startup teams.

## What it supports

- Add, edit, and delete resources
- Track resource level (L1-L4, Lead)
- Track referral source (`Referred By`)
- Track resource type: Permanent, Freelancer, Contractor, Intern
- Track allocation percentage and delivery status
- Store contracted monthly payment and payment details
- Capture contract/offer metadata and attach contract/offer files
- Maintain payment cycle, method, status, and next payment date
- Mark exits with exit date and keep historical records
- Filter by resource type and status, and search by name/role
- Summary cards for total count, active resources, freelancer count, and total active contract value
- Placeholder tabs and section for future resourcing companies management

## Run

1. Open `index.html` in your browser.
2. Start adding resources.

Data is stored in browser `localStorage`, so it persists on the same machine/browser.

## Publish To Azure (Static Website)

This project is already static and ready to host.

Files to publish:
- `index.html`
- `styles.css`
- `app.js`
- `404.html`
- `staticwebapp.config.json`

### Option 1: Azure Static Web Apps (recommended)

1. Push this folder to a GitHub repository.
2. In Azure Portal, create a **Static Web App**.
3. Choose your GitHub repo and branch.
4. Build preset:
   - App location: `/`
   - API location: *(leave blank)*
   - Output location: `/`
5. Complete creation and let GitHub Actions deploy.

### Option 2: Azure Storage Static Website

1. Create a Storage Account in Azure.
2. Enable **Static website** under Data management.
3. Set:
   - Index document: `index.html`
   - Error document path: `404.html`
4. Upload the files to `$web` container.
5. Open the primary endpoint URL from the static website section.

## Branding

This UI is branded for **Techzick** (`https://www.techzick.com`) with:
- Techzick title and brand header
- Techzick visual color scheme
- Branded footer message
