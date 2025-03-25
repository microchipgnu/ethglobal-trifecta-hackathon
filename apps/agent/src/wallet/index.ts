import { http } from "viem";
import { createWalletClient } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(
    process.env.PRIVATE_KEY! as `0x${string}`
);

const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
});

export default walletClient;