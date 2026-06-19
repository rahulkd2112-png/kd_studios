# Security notes

No internet-facing application can be guaranteed impossible to compromise. Keep
these controls in place for production:

- Serve frontend and API only over HTTPS.
- Keep `.env`, database exports, backups, and logs out of public/static folders.
- Rotate any credential shared in chat, screenshots, tickets, or commits.
- Use unique random values for `JWT_SECRET` and `ADMIN_PASSWORD`.
- Keep Gmail Two-Step Verification enabled and use only a dedicated App Password.
- Set `FRONTEND_ORIGIN` to the exact deployed frontend origin.
- Set `TRUST_PROXY=true` only behind a trusted reverse proxy that overwrites
  `X-Forwarded-For`.
- Run `npm audit --omit=dev` and authentication smoke tests before every release.
- Enable Neon backups/restore protection and restrict database credentials to the
  backend service.
- For multiple backend instances, replace the in-memory rate limiter with a shared
  Redis-backed limiter or an equivalent managed edge/WAF rate limit.
- Monitor authentication failures, admin actions, and unusual traffic.

Report suspected exposure immediately and rotate affected credentials before
investigating further.
