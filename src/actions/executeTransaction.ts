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
import { systemPromptTemplate } from "../templates";
import { BirdeyeProvider } from "@binkai/birdeye-provider";
import { AlchemyProvider } from "@binkai/alchemy-provider";
import { BinkProvider } from "@binkai/bink-provider";
import { BnbProvider } from "@binkai/rpc-provider";
import {
  Agent,
  Wallet,
  Network,
  NetworkType,
  NetworksConfig,
  NetworkName,
} from "@binkai/core";
import { PancakeSwapProvider } from "@binkai/pancakeswap-provider";
import { FourMemeProvider } from "@binkai/four-meme-provider";
import { VenusProvider } from "@binkai/venus-provider";
import { OkuProvider } from "@binkai/oku-provider";
import { KyberProvider } from "@binkai/kyber-provider";
import { SwapPlugin } from "@binkai/swap-plugin";
import { TokenPlugin } from "@binkai/token-plugin";
import { KnowledgePlugin } from "@binkai/knowledge-plugin";
import { deBridgeProvider } from "@binkai/debridge-provider";
import { BridgePlugin } from "@binkai/bridge-plugin";
import { WalletPlugin } from "@binkai/wallet-plugin";
import { StakingPlugin } from "@binkai/staking-plugin";
import { ThenaProvider } from "@binkai/thena-provider";
import { getConfig, validateBnbConfig } from "../environment";
import { v4 as uuidv4 } from "uuid";

export class ExecuteTransactionAction {
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

  async execute(content: string): Promise<string> {
    try {
      console.log("🚀 ~ ExecuteTransactionAction ~ content:", content);

      const agent = await this.initializeAgent(this.wallet);

      const result = await this.executeAgent(agent, content);
      console.log("🚀 ~ ExecuteTransactionAction ~ execute ~ result:", result);

      elizaLogger.debug(`Swap successful with result: ${result}`);

      return result;
    } catch (error) {
      elizaLogger.error(`Error during execution:`, error);
      throw error;
    }
  }

  async initializeAgent(wallet: Wallet) {
    try {
      const bscChainId = 56;
      const pancakeswap = new PancakeSwapProvider(this.bscProvider, bscChainId);
      const fourMeme = new FourMemeProvider(this.bscProvider, bscChainId);
      const venus = new VenusProvider(this.bscProvider, bscChainId);
      const oku = new OkuProvider(this.bscProvider, bscChainId);
      const kyber = new KyberProvider(this.bscProvider, bscChainId);
      const swapPlugin = new SwapPlugin();
      const tokenPlugin = new TokenPlugin();
      const knowledgePlugin = new KnowledgePlugin();
      const bridgePlugin = new BridgePlugin();
      const walletPlugin = new WalletPlugin();
      const stakingPlugin = new StakingPlugin();
      const thena = new ThenaProvider(this.bscProvider, bscChainId);

      // Initialize the swap plugin with supported chains and providers
      await Promise.all([
        swapPlugin.initialize({
          defaultSlippage: 0.5,
          defaultChain: "bnb",
          providers: [pancakeswap, fourMeme, thena, oku, kyber],
          supportedChains: ["bnb", "ethereum", "solana"],
        }),
        tokenPlugin.initialize({
          defaultChain: "bnb",
          providers: [this.birdeyeApi, fourMeme as any],
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
        await stakingPlugin.initialize({
          defaultSlippage: 0.5,
          defaultChain: "bnb",
          providers: [venus],
          supportedChains: ["bnb", "ethereum"],
        }),
      ]);

      const agent = new Agent(
        {
          model: "gpt-4.1",
          temperature: 0,
          systemPrompt: `${systemPromptTemplate}
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
      await agent.registerPlugin(swapPlugin);
      await agent.registerPlugin(tokenPlugin);
      await agent.registerPlugin(walletPlugin);
      await agent.registerPlugin(stakingPlugin);

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

export const executeTransactionAction = {
  name: "EXECUTE_TRANSACTION",
  description:
    "Execute blockchain transactions across multiple networks (BNB Chain, Ethereum, Solana) with support for various operations including token swaps, staking, and bridging. The tool integrates with multiple DEXs and protocols to provide the best execution routes and prices.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: Record<string, unknown>,
    callback?: HandlerCallback,
  ) => {
    elizaLogger.log("Starting execute transaction action...");
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

    // PRIORITY ORDER FOR TOKEN DETERMINATION:
    // 1. Direct match from prompt text (most reliable)
    // 2. Tokens specified in model-generated content
    // 3. Fallback based on token mentions

    const walletProvider = initWalletProvider(runtime);
    console.log("🚀 ~ walletProvider:", walletProvider);

    const action = new ExecuteTransactionAction(walletProvider);
    console.log("🚀 ~ action:", action);
    try {
      elizaLogger.debug(
        "Calling execute transaction with content:",
        promptText,
      );

      const result = await action.execute(promptText);
      console.log("🚀 ~ result:", result);

      callback?.({
        text: `${result}`,
      });

      return true;
    } catch (error) {
      elizaLogger.error("Error during swap:", error.message);

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

      // Provide more user-friendly error messages
      //   let errorMessage = error.message;

      //   if (error.message.includes("No routes found")) {
      //     errorMessage = `No swap route found from ${swapOptions.fromToken} to ${swapOptions.toToken}. Please check that both tokens exist and have liquidity.`;
      //   } else if (error.message.includes("insufficient funds")) {
      //     errorMessage = `Insufficient funds for the swap. Please check your balance and try with a smaller amount.`;
      //   } else if (error.message.includes("high slippage")) {
      //     errorMessage = `Swap failed due to high price impact. Try reducing the amount or using a different token pair.`;
      //   }

      //   callback?.({
      //     text: `Swap failed: ${errorMessage}`,
      //     content: {
      //       error: errorMessage,
      //       fromToken: swapOptions.fromToken,
      //       toToken: swapOptions.toToken,
      //     },
      //   });
      //   return false;
    }
  },
  template: systemPromptTemplate,
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
          text: "Swap 0.001 BNB for USDC on BSC",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Swap 0.001 BNB for USDC on BSC",
          action: "EXECUTE_TRANSACTION",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Buy 0x1234 using 0.001 USDC on BSC. The slippage should be no more than 5%",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Swap 0.001 USDC for token 0x1234 on BSC",
          action: "EXECUTE_TRANSACTION",
        },
      },
    ],
  ],
};