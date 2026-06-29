# Agora

Agora is a GenLayer governance and treasury review protocol for proposals, milestones, charter alignment and disputes.

This repository is a public proof package: it includes the product UI, the deployed GenLayer Studionet contract source, deployment metadata, finalized smoke transactions, and test evidence. Local wallet secrets are not included.

## Live System

| Surface | Link |
| --- | --- |
| App | https://agora-ochre-alpha.vercel.app |
| GitHub | https://github.com/thorbh2/agora |
| Contract | https://explorer-studio.genlayer.com/contracts/0xF89767Ea6e2c880CB78d268D4d4881EE4e3b536E |
| Deploy tx | https://explorer-studio.genlayer.com/tx/0xfc79e05d82bfc9b2d6fee666949bd25b694837915646f84eb7996c4c9ba2c78b |
| Vercel inspect | https://vercel.com/aspros-projects-07dbbeb8/agora/6QpUv9DDMkmZPSwFMJ5RBfyQAYck |

## Why Agora Exists

A GenLayer AI-moderated grants treasury. A charter defines what the community funds, builders submit proposals with milestones and evidence, validator-agreed web/LLM review scores charter alignment, and the treasury pays or rejects with challenge, appeal, archive, reputation and audit trails.

The frontend keeps the original product experience, while the contract adds a reviewable on-chain lifecycle: source records, GenLayer reasoning, challenge and appeal paths, indexed reads, and an audit trail that can be inspected after deployment.

## Contract Architecture

| Area | Detail |
| --- | --- |
| Contract | `contracts/agora_v2.py` |
| Size | 41458 bytes |
| Network | GenLayer Studionet, chain id `61999` |
| Write methods | 26 |
| Read methods | 22 |
| GenLayer features | live web rendering, LLM execution, validator-comparative consensus |
| Deployment wallet | 0x8FAFc873ff8c29a18f90f1dCb7fE6E587aDA5F76 |
| Contract address | 0xF89767Ea6e2c880CB78d268D4d4881EE4e3b536E |

Architecture note:

> Agora V2 (# v0.2.16), 41458 bytes, 26 write + 22 view. Objects: Proposal, Milestone, Evidence, Review, Challenge, Appeal, Reputation/Profile + AuditEntry. Lifecycle OPEN->REVIEWING->REVIEWED->CHALLENGE_WINDOW->APPEALED->SETTLED/VOIDED->ARCHIVED, with charter and treasury compatibility. GenLayer nondet (web.render + exec_prompt inside eq_principle.prompt_comparative) for charter-alignment review, challenge rulings and appeal rulings; strict JSON normalization, confidence/alignment bps, URL validation and prompt-injection guardrails. Backward-compatible payable set_charter, donate, propose, review, get_charter/get_treasury/get_proposal/get_proposal_count keep the static Agora app intact.

Core smoke flow:

```text
set_charter
  -> donate
  -> draft_proposal
  -> add_milestone
  -> add_evidence_docs
  -> add_evidence_github
  -> open_review
  -> review
  -> open_challenge_window
  -> submit_challenge
  -> resolve_challenge
  -> submit_appeal
  -> resolve_appeal
```

## Verification Trail

| Step | Transaction |
| --- | --- |
| Set Charter | https://explorer-studio.genlayer.com/tx/0x487eca48d6920e9af0e65d483f9116517632ab2d91ceec0f3089eacc1127f0a7 |
| Donate | https://explorer-studio.genlayer.com/tx/0x9d0f22568e0e2fd35f30deca53167449a6c315fd16bd512c44655f17feebf508 |
| Draft Proposal | https://explorer-studio.genlayer.com/tx/0x75df80aabe3e2c99e58ab9433c20e53eea198b027222f284186d47c8e9aea0b3 |
| Add Milestone | https://explorer-studio.genlayer.com/tx/0xb69db5c31ebb623f20734ccba2b0d734627f73cde1e8adff284e2b52ce3a2f7e |
| Add Evidence Docs | https://explorer-studio.genlayer.com/tx/0x2ef930bad24695757fc820b151431a25df549dd16de6271067d93d85958621b4 |
| Add Evidence Github | https://explorer-studio.genlayer.com/tx/0xa871210d80c716c3f377635dce0529b72b542b2ee3dfd351d75b00afc1dbf24c |
| Open Review | https://explorer-studio.genlayer.com/tx/0x393492ab6235c5d2b38c7caa437c468d4f9adfb419b882485ab8ebf9f996e5c0 |
| Review | https://explorer-studio.genlayer.com/tx/0x8a1a4af7a14385d430b34b80498291075a1afc4f2fc58c9f3e5037d6a9238d68 |
| Open Challenge Window | https://explorer-studio.genlayer.com/tx/0x4ad66bd945874e373cedf30a5fdb9680ad44ba247ff5fa0e5ba2e2768d173ffd |
| Submit Challenge | https://explorer-studio.genlayer.com/tx/0x782e362743a6c808f72c59dec378cf58017c5492a9387905fa7482e33eece7ac |
| Resolve Challenge | https://explorer-studio.genlayer.com/tx/0x85906bbd2ac3a0356c9e18f99b336bacc2f2ec1e235c3ace0a2a84263a90a48e |
| Submit Appeal | https://explorer-studio.genlayer.com/tx/0xeb48c0f4c7a0ac8daccca7da4a64b79ed803d4db9c7bacdfd22587379869c02e |
| Resolve Appeal | https://explorer-studio.genlayer.com/tx/0x0e5fe645e6d4c718b0b2594da0020d4f41e0d2890e9e96f9c454e5ec82712c6f |
| Settle | https://explorer-studio.genlayer.com/tx/0xa4b3663e061013b489e41593ab986c0f17e76e57bc812074fac01e707dbaccc8 |

Test result:

```text
Schema valid
18 smoke writes finalized
40/40
Static frontend bundled for standalone Vercel deployment
```

## Frontend

Agora ships as a standalone static app:

- wallet connection through the bundled browser client
- GenLayer reads through `genlayer-js`
- writes routed through the connected EVM wallet
- local `shared/` client files included so Vercel does not depend on the private workspace router
- deployed contract address pinned in `app.js` and `deployment.json`

## Run Locally

From the private workspace:

```powershell
cd <private-workspace-root>
npm run preview:start
npm run preview:project -- 05-agora
```

Open:

```text
http://localhost:8080/05-agora/
```

## Publish / Redeploy

```powershell
cd <private-workspace-root>
npm run publish:project -- -Project 05-agora -Repo https://github.com/thorbh2/agora.git
```

Vercel production redeploy from a clean project folder:

```powershell
npx --yes vercel@latest --prod --yes
```

## Repository Safety

This public repository intentionally excludes local secrets:

- no private keys
- no vault files
- no `.env` files
- no `.vercel` project state
- no local dashboard data

Public files include frontend code, contract source, deployment metadata, tests, and non-sensitive proof links.
