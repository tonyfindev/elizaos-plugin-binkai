import { describe, it, expect, beforeAll } from "vitest";
import { GetWalletInfoAction } from "../actions/getWalletInfo";
// import { WalletProvider } from "../providers/wallet";
// import { initWalletProvider } from "../providers/wallet";
import {
  NetworkName,
  NetworksConfig,
  Wallet,
  NetworkType,
  Network,
} from "@binkai/core";

describe("Get Wallet Info", () => {
  let getWalletInfoAction: GetWalletInfoAction;

  beforeAll(async () => {
    // Initialize with a test seed phrase
    const seedPhrase = process.env.BNB_SEED_PHRASE || "";
    if (!seedPhrase) {
      throw new Error("BNB_SEED_PHRASE is not set");
    }
    const networks: NetworksConfig["networks"] = {
      bnb: {
        type: "evm" as NetworkType,
        config: {
          chainId: 56,
          rpcUrl: process.env.BSC_RPC_URL || "",
          name: "BNB Chain",
          nativeCurrency: {
            name: "BNB",
            symbol: "BNB",
            decimals: 18,
          },
        },
      },
      ethereum: {
        type: "evm" as NetworkType,
        config: {
          chainId: 1,
          rpcUrl: process.env.ETHEREUM_RPC_URL || "",
          name: "Ethereum",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
        },
      },
      [NetworkName.SOLANA]: {
        type: "solana" as NetworkType,
        config: {
          rpcUrl: process.env.SOLANA_RPC_URL || "",
          name: "Solana",
          nativeCurrency: {
            name: "Solana",
            symbol: "SOL",
            decimals: 9,
          },
        },
      },
    };

    const network = new Network({ networks });

    const wallet = new Wallet(
      {
        seedPhrase,
        index: 0,
      },
      network,
    );
    console.log(
      "🚀 ~ beforeAll ~ wallet:",
      await wallet.getAddress(NetworkName.BNB),
    );

    getWalletInfoAction = new GetWalletInfoAction(wallet);
  });
  describe("Get Wallet Info", () => {
    it("should get wallet info", async () => {
      const content = "Get my balance";
      const result = await getWalletInfoAction.getWalletInfo(content);
      console.log("🚀 ~ it ~ result:", result);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    }, 1000000);
  });
});
