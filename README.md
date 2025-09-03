# HAPI - Human API

A machine-readable interface for human coordination. Query my availability, energy levels, and communication preferences in real-time.

## Try it

Tell any AI that can access the internet:
```
Check if Phill is available at hapi.phillipclapham.com
```

## Endpoints

- `/` - Gateway with instructions for AI agents
- `/.well-known/hapi.json` - Discovery document
- `/public/status.json` - Current energy levels and availability
- `/public/professional.json` - Professional information
- `/public/availability.json` - Meeting availability and response times
- `/public/comms.json` - Communication preferences
- `/public/policy.json` - Usage boundaries and consent
- `/inbox` - Send async messages (POST)

## Update Status

Edit `src/status.yaml` then run:
```bash
npm run update
```

## Local Development

```bash
npm install
npm run build  # Convert YAML to JSON
```

## Deploy Worker

```bash
npx wrangler deploy
```

## Philosophy

HAPI is an experiment in radical transparency and sustainable communication. Instead of AIs pretending to remember us, we become actively queryable. It's a membrane between human complexity and machine needs.

## License

Human Usage Only (HUO) v1.0 - See `/public/policy.json`
