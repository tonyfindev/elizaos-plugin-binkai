# ElizaOS Plugin: BINK AI

## Overview
This plugin integrates BINK AI with ElizaOS, enabling advanced blockchain data querying, wallet management, and cross-chain operations. It supports actions such as token swaps, balance queries, transfers, bridging, and more across multiple networks (BNB, Ethereum, Solana, etc.).

## Features
- Query blockchain data across multiple networks
- Perform swaps and transfers on supported chains
- Retrieve wallet balances and token information
- Bridge assets between chains
- Staking and DeFi operations
- Integration with Birdeye, Alchemy, Bink, and other providers
- AI-powered interactions (OpenAI integration)

## Installation
```bash
pnpm install @elizaos/plugin-bink
```

## Usage
Import the plugin and use the provided actions in your ElizaOS agent:

```typescript
import { getWalletInfo, executeTransaction, /* other actions */ } from '@elizaos/plugin-bink';

// Example: Get wallet info
const walletInfo = await getWalletInfo({ address: '0x...' });

// Example: Execute a transaction
const txResult = await executeTransaction({ /* params */ });
```

## Configuration
Set the following environment variables in your `.env` file:

- `BNB_SEED_PHRASE`: Your seed phrase for BNB Chain (optional, but required for wallet actions)
- `BSC_RPC_URL`: Custom RPC URL for BSC (optional)
- `ETHEREUM_RPC_URL`: Custom RPC URL for Ethereum (optional)
- `SOLANA_RPC_URL`: Custom RPC URL for Solana (optional)
- `BIRDEYE_API_KEY`: API key for Birdeye (optional)
- `ALCHEMY_API_KEY`: API key for Alchemy (optional)
- `OPENAI_API_KEY`: API key for OpenAI (optional)
- `BINK_API_KEY`: API key for Bink (optional)
- `BINK_BASE_URL`: Base URL for Bink (optional)
- `BINK_IMAGE_API_URL`: Image API URL for Bink (optional)
- `BINK_IMAGE_API_KEY`: Image API key for Bink (optional)

## Scripts
- `pnpm build` — Build the plugin
- `pnpm dev` — Development mode with watch
- `pnpm test` — Run tests
- `pnpm lint` — Lint codebase

## Development
- Source code is in the `src/` directory
- Actions are in `src/actions/`
- Providers are in `src/providers/`
- Smart contract ABIs are in `src/contracts/`
- Types are in `src/types/`
- Templates are in `src/templates/`

## License
MIT

## Acknowledgements
- [ElizaOS](https://github.com/elizaos)
- [BINK AI](https://github.com/binkai)
- [Birdeye](https://birdeye.so)
- [Alchemy](https://www.alchemy.com)
- [OpenAI](https://openai.com)