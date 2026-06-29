# Agora V2

This repository contains a complete GenLayer Studionet project: frontend, contract source, deployment metadata and local verification scripts.

A GenLayer AI-moderated grants treasury.

## Agora Brief

This repo is organized for review: the app can be opened locally, the contract source is present, and the deployed Studionet address is pinned in `deployment.json`.

- Folder: `projects/05-agora`
- Frontend shape: static browser app
- Contract source: `contracts/agora_v2.py`
- Build status: Schema-valid (41458 bytes, 26 write + 22 view); deployed + 18 write smoke txs finalized incl 4 GenLayer reasoning calls and legacy propose/review; 40/40 read tests passed; app.js repointed.

## Protocol Mechanics

Agora V2 (# v0.2.16), 41458 bytes, 26 write + 22 view.

- Primary source: `contracts/agora_v2.py` (41,458 bytes)
- Public write/action methods: 26
- Read methods: 22
- GenLayer features: live web rendering, LLM adjudication, validator-comparative consensus, indexed storage, append-only collections

Typical flow: `open_proposal` -> `submit_challenge` -> `open_review` -> `resolve_challenge_with_genlayer` -> `open_challenge_window` -> `submit_appeal` -> `archive_proposal`

Useful reads: `get_proposal_count`, `get_charter`, `get_treasury`, `get_proposal`, `get_item_count`, `get_item`, `get_proposal_record`, `get_recent_proposals`

## Agora Chain Links

- Network: studionet (61999)
- Contract: [0xF89767Ea6e2c880CB78d268D4d4881EE4e3b536E](https://explorer-studio.genlayer.com/contracts/0xF89767Ea6e2c880CB78d268D4d4881EE4e3b536E)
- Deploy tx: [0xfc79e05d...a2c78b](https://explorer-studio.genlayer.com/tx/0xfc79e05d82bfc9b2d6fee666949bd25b694837915646f84eb7996c4c9ba2c78b)
- Deployed at: 2026-06-23T22:33:21.497Z
- Smoke writes recorded: 18

Smoke coverage:

- set_charter: [0x487eca48...27f0a7](https://explorer-studio.genlayer.com/tx/0x487eca48d6920e9af0e65d483f9116517632ab2d91ceec0f3089eacc1127f0a7)
- donate: [0x9d0f2256...ebf508](https://explorer-studio.genlayer.com/tx/0x9d0f22568e0e2fd35f30deca53167449a6c315fd16bd512c44655f17feebf508)
- draft_proposal: [0x75df80aa...aea0b3](https://explorer-studio.genlayer.com/tx/0x75df80aabe3e2c99e58ab9433c20e53eea198b027222f284186d47c8e9aea0b3)
- add_milestone: [0xb69db5c3...3a2f7e](https://explorer-studio.genlayer.com/tx/0xb69db5c31ebb623f20734ccba2b0d734627f73cde1e8adff284e2b52ce3a2f7e)
- add_evidence_docs: [0x2ef930ba...8621b4](https://explorer-studio.genlayer.com/tx/0x2ef930bad24695757fc820b151431a25df549dd16de6271067d93d85958621b4)
- add_evidence_github: [0xa871210d...dbf24c](https://explorer-studio.genlayer.com/tx/0xa871210d80c716c3f377635dce0529b72b542b2ee3dfd351d75b00afc1dbf24c)

## Run Agora Locally

```powershell
cd C:\Users\aspronim\Desktop\design-skills
npm run preview:start
npm run preview:project -- 05-agora
```

Open http://localhost:8080/05-agora/.

## Publish Agora

```powershell
cd C:\Users\aspronim\Desktop\design-skills
npm run publish:project -- -Project 05-agora -Repo https://github.com/aspro45/<repo-name>.git
```

## Keys And Boundaries

The repo is designed for public GitHub/Vercel release. Keep `.env`, `.vercel/`, wallet vaults, private keys and local dashboard state out of git. The publisher script enforces these ignore rules before it pushes.
