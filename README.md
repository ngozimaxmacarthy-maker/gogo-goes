# Gogo Goes

A modular, personalized group travel app for the road less traveled.

See [docs/PRODUCT.md](docs/PRODUCT.md) for the product shape and decisions.

```bash
npm install
npm run dev        # app
npm test           # recommender, planner and split tests
npm run typecheck
```

Database: copy `.env.example` to `.env.local`, set `DATABASE_URL`, then `npm run db:migrate`.
