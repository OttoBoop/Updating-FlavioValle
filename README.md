# Wix Registration System

Automated registration gate for WhatsApp contact at flaviovalle.com

## Project Structure

```
flaviovalle/
├── .claude/
│   ├── clarify-session.md          # Requirements discovery Q&A
│   └── plans/
│       └── wix-registration-system.md  # Implementation specification
├── scripts/
│   └── setup-credentials.js        # Secure credential collection
├── form-discovery/
│   ├── package.json
│   ├── discover-gabineteonline-fields.js
│   ├── utils/
│   │   ├── browser-setup.js
│   │   ├── form-inspector.js
│   │   └── schema-generator.js
│   └── output/
│       ├── gabineteonline-schema.json  (generated)
│       └── form-screenshot.png         (generated)
└── README.md                       # This file
```

## Phase 1: Setup & Credentials

### Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

### Installation

```bash
cd form-discovery
npm install
```

### Secure Credential Setup

Run the interactive credential collection script:

```bash
node scripts/setup-credentials.js
```

This will prompt you for:
- Wix account email/password
- gabineteonline email/password

Credentials are encrypted with AES-256 and stored in `.env` file (gitignored).

## Implementation Phases

- **Phase 1** (P1): Setup & Credentials ← Current
- **Phase 2A** (P2A): Form Discovery (parallel with P2B)
- **Phase 2B** (P2B): Wix Environment & Frontend (parallel with P2A)
- **Phase 3** (P3): Integration & Backend Sync
- **Phase 4** (P4): Testing
- **Phase 5** (P5): Deployment

## Commands

See [.claude/plans/wix-registration-system.md](.claude/plans/wix-registration-system.md) for complete implementation spec.

### TDD Workflow Commands

```bash
# Continue Phase 1
/tdd-workflow P1

# Run specific phase
/tdd-workflow P2A
/tdd-workflow P2B

# Run specific steps
/tdd-workflow P1-S1 P1-S2
```

## Security Notes

- Never commit `.env` file
- Never commit `credentials.encrypted` file
- Encryption keys are stored in `.env` (AES-256)
- Use Wix Secrets Manager for production credentials

## Support

For issues or questions, refer to the clarify session or implementation plan in `.claude/` directory.
