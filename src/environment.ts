import type { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

// Default RPC URLs as fallbacks
const DEFAULT_BSC_RPC_URL =
  "https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3";
const DEFAULT_ETHEREUM_RPC_URL =
  "https://eth-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3";
const DEFAULT_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";

export const binkEnvSchema = z.object({
  // Wallet Configuration
  SEED_PHRASE: z.string().min(1, "SEED_PHRASE is required"),
  // RPC URLs
  BSC_RPC_URL: z.string().default(DEFAULT_BSC_RPC_URL),
  ETHEREUM_RPC_URL: z.string().default(DEFAULT_ETHEREUM_RPC_URL),
  SOLANA_RPC_URL: z.string().default(DEFAULT_SOLANA_RPC_URL),
  // API Keys
  BIRDEYE_API_KEY: z.string().min(1, "BIRDEYE_API_KEY is required"),
  ALCHEMY_API_KEY: z.string().min(1, "ALCHEMY_API_KEY is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  BINK_API_KEY: z.string().min(1, "BINK_API_KEY is required"),
  BINK_BASE_URL: z.string().min(1, "BINK_BASE_URL is required"),
  BINK_IMAGE_API_URL: z.string().min(1, "BINK_IMAGE_API_URL is required"),
  BINK_API_URL: z.string().min(1, "BINK_API_URL is required"),

  // Database
  // POSTGRES_AI_POSTGRES_URL: z
  //   .string()
  //   .min(1, "POSTGRES_AI_POSTGRES_URL is required"),
});

export type BinkConfig = z.infer<typeof binkEnvSchema>;

/**
 * Get configuration with defaults
 */
export function getConfig(): BinkConfig {
  return {
    // Wallet Configuration
    SEED_PHRASE: process.env.SEED_PHRASE || "",

    // RPC URLs
    BSC_RPC_URL: process.env.BSC_RPC_URL || DEFAULT_BSC_RPC_URL,
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || DEFAULT_ETHEREUM_RPC_URL,
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC_URL,
    // API Keys
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY || "",
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY || "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    BINK_API_KEY: process.env.BINK_API_KEY || "",
    BINK_BASE_URL: process.env.BINK_BASE_URL || "",
    BINK_IMAGE_API_URL: process.env.BINK_IMAGE_API_URL || "",
    BINK_API_URL: process.env.BINK_API_URL || "",


  };
}

/**
 * Validate BNB configuration using runtime settings or environment variables
 */
export async function validateBnbConfig(
  runtime: IAgentRuntime,
): Promise<BinkConfig> {
  try {
    const config = {
      // Wallet Configuration
      SEED_PHRASE:
        runtime.getSetting("SEED_PHRASE") || process.env.SEED_PHRASE,

      // RPC URLs
      BSC_RPC_URL:
        runtime.getSetting("BSC_RPC_URL") ||
        process.env.BSC_RPC_URL ||
        DEFAULT_BSC_RPC_URL,
      ETHEREUM_RPC_URL:
        runtime.getSetting("ETHEREUM_RPC_URL") ||
        process.env.ETHEREUM_RPC_URL ||
        DEFAULT_ETHEREUM_RPC_URL,
      SOLANA_RPC_URL:
        runtime.getSetting("SOLANA_RPC_URL") ||
        process.env.SOLANA_RPC_URL ||
        DEFAULT_SOLANA_RPC_URL,

      // API Keys
      BIRDEYE_API_KEY:
        runtime.getSetting("BIRDEYE_API_KEY") || process.env.BIRDEYE_API_KEY,
      ALCHEMY_API_KEY:
        runtime.getSetting("ALCHEMY_API_KEY") || process.env.ALCHEMY_API_KEY,
      OPENAI_API_KEY:
        runtime.getSetting("OPENAI_API_KEY") || process.env.OPENAI_API_KEY,
      BINK_API_KEY:
        runtime.getSetting("BINK_API_KEY") || process.env.BINK_API_KEY,
      BINK_BASE_URL:
        runtime.getSetting("BINK_BASE_URL") || process.env.BINK_BASE_URL,
      BINK_IMAGE_API_URL:
        runtime.getSetting("BINK_IMAGE_API_URL") ||
        process.env.BINK_IMAGE_API_URL,
      BINK_API_URL:
        runtime.getSetting("BINK_API_URL") || process.env.BINK_API_URL,
    };

    return binkEnvSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(`BNB configuration validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Check if a wallet is configured (seed phrase)
 */
export function hasWalletConfigured(config: BinkConfig): boolean {
  return !!config.SEED_PHRASE;
}
