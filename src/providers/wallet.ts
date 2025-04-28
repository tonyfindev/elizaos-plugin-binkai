import type { NetworksConfig, NetworkConfig } from "@binkai/core";
import { NetworkName, Network, Wallet, NetworkType } from "@binkai/core";
import type { Chain, PrivateKeyAccount } from "viem";
import * as viemChains from "viem/chains";
import { IAgentRuntime, Memory, Provider, State } from "@elizaos/core";

export class WalletProvider {
  chains: Record<string, Chain> = { bsc: viemChains.bsc };
  account: PrivateKeyAccount;
  wallet: Wallet;

  constructor(seedPhrase: string, chains?: Record<string, Chain>) {
    this.setWallet(seedPhrase);
    this.setChains(chains);
  }

  private setWallet = (seedPhrase: string) => {
    console.log("🚀 ~ WalletProvider ~ seedPhrase:", seedPhrase);
    const networks: NetworksConfig = {
      networks: {
        [NetworkName.BNB]: {
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
        [NetworkName.ETHEREUM]: {
          type: "evm" as NetworkType,
          config: {
            chainId: 1,
            rpcUrl: process.env.ETH_RPC_URL || "",
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
            rpcUrl: process.env.SOL_RPC_URL || "",
            name: "Solana",
            nativeCurrency: {
              name: "Solana",
              symbol: "SOL",
              decimals: 9,
            },
          },
        },
      },
    };

    this.wallet = new Wallet(
      {
        seedPhrase,
        index: 0,
      },
      networks as any,
    );

    console.log("🚀 ~ WalletProvider ~ this.wallet:", this.wallet);
  };

  private setChains = (chains?: Record<string, Chain>) => {
    if (!chains) {
      return;
    }
    for (const chain of Object.keys(chains)) {
      this.chains[chain] = chains[chain];
    }
  };
}

export const initWalletProvider = (runtime: IAgentRuntime) => {
  const networks: NetworksConfig["networks"] = {
    bnb: {
      type: "evm" as NetworkType,
      config: {
        chainId: 56,
        rpcUrl: runtime.getSetting("BSC_RPC_URL") || "",
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
        rpcUrl: runtime.getSetting("ETHEREUM_RPC_URL") || "",
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
        rpcUrl: runtime.getSetting("SOLANA_RPC_URL") || "",
        name: "Solana",
        nativeCurrency: {
          name: "Solana",
          symbol: "SOL",
          decimals: 9,
        },
      },
    },
  };
  const seedPhrase = runtime.getSetting("SEED_PHRASE");


  if (!seedPhrase) {

    throw new Error("SEED_PHRASE is missing");
  }
  const network = new Network({ networks });
  const wallet = new Wallet(
    {
      seedPhrase,
      index: 0,
    },
    network,
  );
  return wallet;
};

export const walletInfoProvider: Provider = {
  async get(
    runtime: IAgentRuntime,
    _message: Memory,
    _state?: State,
  ): Promise<string | null> {
    try {
      const wallet = initWalletProvider(runtime);
      console.log("🤖 Wallet BNB:", await wallet.getAddress(NetworkName.BNB));
      console.log(
        "🤖 Wallet ETH:",
        await wallet.getAddress(NetworkName.ETHEREUM),
      );
      console.log(
        "🤖 Wallet SOL:",
        await wallet.getAddress(NetworkName.SOLANA),
      );
      const bnbAddress = wallet.getAddress(NetworkName.BNB);
      const ethereumAddress = wallet.getAddress(NetworkName.ETHEREUM);
      const solanaAddress = wallet.getAddress(NetworkName.SOLANA);
      return `BNB chain Wallet Address: ${bnbAddress}\n Name: ${NetworkName.BNB}
      Ethereum chain Wallet Address: ${ethereumAddress}\n Name: ${NetworkName.ETHEREUM}
      Solana chain Wallet Address: ${solanaAddress}\n Name: ${NetworkName.SOLANA}
      `;
    } catch (error) {
      console.error("Error in BNB chain wallet provider:", error);
      return null;
    }
  },
};
