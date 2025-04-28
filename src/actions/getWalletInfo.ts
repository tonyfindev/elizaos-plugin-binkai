import {
  composeContext,
  elizaLogger,
  generateObjectDeprecated,
  type HandlerCallback,
  ModelClass,
  type IAgentRuntime,
  type Memory,
  type State,
  UUID,
} from "@elizaos/core";
import { JsonRpcProvider } from "ethers";
import OpenAI from "openai";
import { initWalletProvider, walletInfoProvider } from "../providers/wallet";
import { walletInfoTemplate } from "../templates";
import { BirdeyeProvider } from "@binkai/birdeye-provider";
import { AlchemyProvider } from "@binkai/alchemy-provider";
import { BinkProvider } from "@binkai/bink-provider";
import { BnbProvider } from "@binkai/rpc-provider";
import {
  Agent,
  Wallet,
  NetworkType,
  NetworksConfig,
  NetworkName,
} from "@binkai/core";

import { TokenPlugin } from "@binkai/token-plugin";
import { KnowledgePlugin } from "@binkai/knowledge-plugin";
import { WalletPlugin } from "@binkai/wallet-plugin";

import { getConfig, validateBnbConfig } from "../environment";
import { v4 as uuidv4 } from "uuid";

export class GetWalletInfoAction {
  private openai: OpenAI;
  private networks: NetworksConfig["networks"];
  private birdeyeApi: BirdeyeProvider;
  private alchemyApi: AlchemyProvider;
  private binkProvider: BinkProvider;
  private bnbProvider: BnbProvider;
  private bscProvider: JsonRpcProvider;
  private config: ReturnType<typeof getConfig>;

  constructor(private wallet: Wallet) {
    this.config = getConfig();
    this.openai = new OpenAI({
      apiKey: this.config.OPENAI_API_KEY,
    });
    this.networks = {
      bnb: {
        type: "evm" as NetworkType,
        config: {
          chainId: 56,
          rpcUrl: this.config.BSC_RPC_URL,
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
          rpcUrl: this.config.ETHEREUM_RPC_URL,
          name: "Ethereum",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
        },
      },
      solana: {
        type: "solana" as NetworkType,
        config: {
          rpcUrl: this.config.SOLANA_RPC_URL,
          name: "Solana",
          nativeCurrency: {
            name: "Solana",
            symbol: "SOL",
            decimals: 9,
          },
        },
      },
    };
    this.birdeyeApi = new BirdeyeProvider({
      apiKey: this.config.BIRDEYE_API_KEY,
    });
    this.alchemyApi = new AlchemyProvider({
      apiKey: this.config.ALCHEMY_API_KEY,
    });
    this.binkProvider = new BinkProvider({
      apiKey: this.config.BINK_API_KEY,
      baseUrl: this.config.BINK_API_URL,
      imageApiUrl: this.config.BINK_IMAGE_API_URL,
    });

    this.bnbProvider = new BnbProvider({
      rpcUrl: this.config.BSC_RPC_URL,
    });

    this.bscProvider = new JsonRpcProvider(this.config.BSC_RPC_URL);
  }

  async getWalletInfo(content: string): Promise<string> {
    try {
      console.log("🚀 ~ getWalletInfo ~ content:", content);

      const agent = await this.initializeAgent(this.wallet);

      const result = await this.executeAgent(agent, content);
      console.log("🚀 ~ getWalletInfo ~ execute ~ result:", result);

      elizaLogger.debug(`Get wallet info successful with result: ${result}`);

      return result;
    } catch (error) {
      elizaLogger.error(`Error during execution:`, error);
      throw error;
    }
  }

  async initializeAgent(wallet: Wallet) {
    try {
      const tokenPlugin = new TokenPlugin();
      const knowledgePlugin = new KnowledgePlugin();
      const walletPlugin = new WalletPlugin();

      // Initialize the swap plugin with supported chains and providers
      await Promise.all([
        tokenPlugin.initialize({
          defaultChain: "bnb",
          providers: [this.birdeyeApi],
          supportedChains: ["solana", "bnb", "ethereum"],
        }),
        await knowledgePlugin.initialize({
          providers: [this.binkProvider],
        }),
        await walletPlugin.initialize({
          defaultChain: "bnb",
          providers: [this.bnbProvider, this.birdeyeApi, this.alchemyApi],
          supportedChains: ["bnb", "solana", "ethereum"],
        }),
      ]);

      const agent = new Agent(
        {
          model: "gpt-4.1",
          temperature: 0,
          systemPrompt: `${walletInfoTemplate}
            Wallet BNB: ${
              (await wallet.getAddress(NetworkName.BNB)) || "Not available"
            }
            Wallet ETH: ${
              (await wallet.getAddress(NetworkName.ETHEREUM)) || "Not available"
            }
            Wallet SOL: ${
              (await wallet.getAddress(NetworkName.SOLANA)) || "Not available"
            }
                        `,
        },
        wallet,
        this.networks,
      );
      await agent.initialize();
      await agent.registerPlugin(tokenPlugin as any);
      await agent.registerPlugin(knowledgePlugin as any);
      await agent.registerPlugin(walletPlugin as any);

      return agent;
    } catch (error) {
      console.error("Error in initializeAgent:", error);
      throw error;
    }
  }

  async executeAgent(agent: Agent, input: string): Promise<string> {
    try {
      const threadId = uuidv4() as UUID;

      const executeData = {
        input,
        threadId,
      };

      console.log("🚀 ~ AiService ~ executeData:", executeData);

      const inputResult = await agent.execute(executeData);

      let result;
      if (inputResult && inputResult.length > 0) {
        result =
          inputResult
            .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
            .replace(/<b>(.*?)<\/b>/g, "<b>$1</b>")
            .replace(/<i>(.*?)<\/i>/g, "<i>$1</i>")
            .replace(/<ul>(.*?)<\/ul>/g, "$1")
            .replace(/<li>(.*?)<\/li>/g, "<li>$1</li>") ||
          "⚠️ System is currently experiencing high load. Our AI models are working overtime! Please try again in a few moments.";
      }

      return result;
    } catch (error) {
      console.error("Error in executeAgent:", error.message);
      return "⚠️ System is currently experiencing high load. Our AI models are working overtime! Please try again in a few moments.";
    }
  }
}

export const getWalletInfoAction = {
  name: "GET_WALLET_INFO",
  description:
    "This tool use for retrieve comprehensive wallet information and get token info across multiple networks (BNB Chain, Ethereum, Solana) including balances, transaction history, and token holdings.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: Record<string, unknown>,
    callback?: HandlerCallback,
  ) => {
    elizaLogger.log("Starting get wallet info action...");
    elizaLogger.debug(
      "Message content:",
      JSON.stringify(message.content, null, 2),
    );

    // Extract prompt text for token detection
    const promptText =
      typeof message.content.text === "string"
        ? message.content.text.trim()
        : "";
    elizaLogger.debug(`Raw prompt text: "${promptText}"`);

    const walletProvider = initWalletProvider(runtime);

    console.log("🚀 ~ walletProvider:", walletProvider);

    const action = new GetWalletInfoAction(walletProvider);
    console.log("🚀 ~ action:", action);
    try {
      const walletInfo = await action.getWalletInfo(promptText);
      console.log("🚀 ~ walletInfo:", walletInfo);

      return true;
    } catch (error) {
      elizaLogger.error("Error during get wallet info:", error.message);

      // Log the entire error object for diagnosis
      try {
        elizaLogger.error(
          "Full error details:",
          JSON.stringify(error, null, 2),
        );
      } catch (e) {
        elizaLogger.error(
          "Error object not serializable, logging properties individually:",
        );
        for (const key in error) {
          try {
            elizaLogger.error(`${key}:`, error[key]);
          } catch (e) {
            elizaLogger.error(`${key}: [Error serializing property]`);
          }
        }
      }
    }
  },
  template: walletInfoTemplate,
  validate: async (runtime: IAgentRuntime) => {
    const config = getConfig();
    const seedPhrase = runtime.getSetting("SEED_PHRASE") || config.SEED_PHRASE;

    if (!seedPhrase || typeof seedPhrase !== "string") {
      elizaLogger.error("Missing or invalid seed phrase");
      return false;
    }

    const words = seedPhrase.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      elizaLogger.error(
        `Invalid seed phrase length: ${words.length} (expected 12 or 24 words)`,
      );
      return false;
    }

    try {
      validateBnbConfig(runtime);
      return true;
    } catch (error) {
      elizaLogger.error(
        "Blockchain configuration validation failed:",
        error.message,
      );
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Get wallet info",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Get wallet info",
          action: "GET_WALLET_INFO",
        },
      },
    ],
  ],
};