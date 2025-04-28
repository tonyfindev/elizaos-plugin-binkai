import { walletInfoProvider } from "./providers/wallet";
import { Plugin } from "@elizaos/core";
import { executeTransactionAction } from "./actions/executeTransaction";
import { getWalletInfoAction } from "./actions/getWalletInfo";
import chalk from "chalk";
import { Table } from "cli-table3";
import { getConfig } from "./environment";

export * from "./actions/executeTransaction";
export * from "./actions/getWalletInfo";
export * from "./providers/wallet"; 


// Create plugin object directly matching the Binance plugin pattern

const actions: any = [
    executeTransactionAction,
    getWalletInfoAction
];



export const binkPlugin: Plugin = {
    name: "bink",
    description: "BinkAI plugin for blockchain operations",
    providers: [walletInfoProvider],
    services: [],
    actions,
    evaluators: []
};

export default binkPlugin;