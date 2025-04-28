import { walletInfoProvider } from "./providers/wallet";
import { Plugin, Action } from "@elizaos/core";
import { executeTransactionAction } from "./actions/executeTransaction";
import { getWalletInfoAction } from "./actions/getWalletInfo";

export * from "./actions/executeTransaction";
export * from "./actions/getWalletInfo";
export * from "./providers/wallet";

// Create plugin object directly matching the Binance plugin pattern

// Define actions with the required similes property
const actions: Action[] = [
  {
    ...executeTransactionAction,
    similes: [],
  },
  {
    ...getWalletInfoAction,
    similes: [],
  },
];

export const binkPlugin: Plugin = {
  name: "bink",
  description: "BinkAI plugin for blockchain operations",
  providers: [walletInfoProvider],
  services: [],
  actions,
  evaluators: [],
};

export default binkPlugin;