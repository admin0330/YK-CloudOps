# ym1r

`ym1r` is an ops-first personal website. The homepage acts as an operations introduction page with server status and an AI ops assistant, while profile and project content live in a secondary entry page.

Live site:
- [https://ym3861.cn](https://ym3861.cn)
- [https://www.ym3861.cn](https://www.ym3861.cn)

ICP filing:
- [湘ICP备2026017602号](https://beian.miit.gov.cn/)

## Product Focus

- The homepage highlights server operations, permission auditing, log analysis, and AI-assisted troubleshooting
- Profile, projects, and GitHub are moved into a separate secondary entry
- AI stays in an assistant role rather than becoming the main entry
- The visual style follows a restrained Apple / Liquid Glass direction

## Page Map

### `/`

- Ops introduction page
- Shows the main operations-focused identity of the site

### `/portal`

- Secondary entry page for profile and project content

### `/cloudops`

- AI ops assistant for logs, troubleshooting, and command suggestions

### `/admin`

- Management interface for users, files, servers, and backend data

## Design Notes

- Apple-like spacing and hierarchy
- Liquid Glass buttons and cards
- Immediate bilingual switching
- Mobile and desktop layouts are both tuned for production use

## Deployment Notes

- The site is deployed on `ym3861.cn`
- The footer includes the ICP link
- The repository is intentionally concise and easy to reproduce
