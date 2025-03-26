import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core';
import { FeeAmount, Pool, Route, SwapRouter, Trade } from '@uniswap/v3-sdk';
import { tool } from 'ai';
import { http, type Address, createPublicClient, erc20Abi } from 'viem';
import { base } from 'viem/chains';
import { z } from 'zod';
import { mainnetWalletClient } from '../wallet';
import { POOL_ABI } from './constants';

// Uniswap V3 router address
const SWAP_ROUTER_ADDRESS =
  '0xE592427A0AEce92De3Edee1F18E0157C05861564' as const;

// Public client for reading from the blockchain
const mainnetPublicClient = createPublicClient({
  chain: base,
  transport: http(
    `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
  ),
});

/**
 * Fetches pool data (price, tick, liquidity) from Uniswap pool
 */
async function fetchPoolData(poolAddress: Address) {
  // Fetch slot0 data (current price, tick, etc.)
  const slot0 = (await mainnetPublicClient.readContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: 'slot0',
  })) as [bigint, number, number, number, number, number, boolean];

  // Fetch liquidity
  const liquidity = await mainnetPublicClient.readContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: 'liquidity',
  });

  return {
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
    liquidity,
  };
}

export const swapTokensUniswapV3 = tool({
  description: 'Swap tokens using Uniswap V3 on Base Mainnet',
  parameters: z.object({
    fromToken: z
      .string()
      .describe('The token to swap from (e.g., "WETH", "USDC")'),
    toToken: z.string().describe('The token to swap to (e.g., "WETH", "USDC")'),
    amount: z
      .number()
      .describe('The amount of tokens to swap as a decimal whole token amount'),
    poolAddress: z
      .string()
      .describe('The Uniswap V3 pool address for the token pair'),
    slippageTolerance: z
      .number()
      .optional()
      .default(3)
      .describe('Slippage tolerance in percentage (default: 3%)'),
  }),
  execute: async ({
    fromToken,
    toToken,
    amount,
    poolAddress,
    slippageTolerance = 3,
  }) => {
    try {
      const chainId = await mainnetPublicClient.getChainId();

      const [fromTokenDecimals, toTokenDecimals] = await Promise.all([
        // get token info from the token address
        mainnetPublicClient.readContract({
          address: fromToken as `0x${string}`,
          abi: erc20Abi,
          functionName: 'decimals',
        }),

        mainnetPublicClient.readContract({
          address: toToken as `0x${string}`,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
      ]);

      // Define token details
      const tokenFrom = new Token(chainId, fromToken, fromTokenDecimals);

      const tokenTo = new Token(chainId, toToken, toTokenDecimals);

      // Convert amount to rawAmount (considering decimals)
      const amountInWei = BigInt(Math.floor(amount * 10 ** fromTokenDecimals));

      // Fetch pool data from Uniswap
      const poolData = await fetchPoolData(poolAddress as Address);

      // Create the Uniswap pool
      const pool = new Pool(
        tokenFrom,
        tokenTo,
        FeeAmount.MEDIUM,
        poolData.sqrtPriceX96.toString(),
        poolData.liquidity.toString(),
        poolData.tick
      );

      // Create route
      const swapRoute = new Route([pool], tokenFrom, tokenTo);

      // Create trade
      const uncheckedTrade = Trade.createUncheckedTrade({
        tradeType: TradeType.EXACT_INPUT,
        route: swapRoute,
        inputAmount: CurrencyAmount.fromRawAmount(
          tokenFrom,
          amountInWei.toString()
        ),
        outputAmount: CurrencyAmount.fromRawAmount(tokenTo, '0'),
      });

      // Swap options
      const options = {
        slippageTolerance: new Percent(Math.floor(slippageTolerance), 100), // Convert to bips
        deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
        recipient: mainnetWalletClient.account.address,
      };

      // Generate swap parameters
      const methodParameters = SwapRouter.swapCallParameters(
        [uncheckedTrade],
        options
      );

      // Execute approve transaction
      const approveHash = await mainnetWalletClient.writeContract({
        address: fromToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [SWAP_ROUTER_ADDRESS, amountInWei],
      });

      await mainnetPublicClient.waitForTransactionReceipt({
        hash: approveHash,
      });

      // Execute swap transaction using sendTransaction
      const swapHash = await mainnetWalletClient.sendTransaction({
        to: SWAP_ROUTER_ADDRESS,
        value: BigInt(methodParameters.value || '0'),
        data: methodParameters.calldata as `0x${string}`,
      });

      await mainnetPublicClient.waitForTransactionReceipt({ hash: swapHash });

      return {
        success: true,
        approveTransaction: approveHash,
        swapTransaction: swapHash,
        inputAmount: `${amount} ${fromToken}`,
        outputToken: toToken,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during swap';
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
