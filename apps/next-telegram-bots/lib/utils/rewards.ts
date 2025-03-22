export const MIN_REWARD = 0.00002;
export const MAX_REWARD = 0.005;

/**
 * Generates a random reward amount with the following distribution:
 * - 60% chance: 0 ETH
 * - 20% chance: 0.0001-0.0005 ETH
 * - 15% chance: 0.0005-0.001 ETH
 * - 4% chance: 0.002-0.005 ETH
 * - 1% chance: 0.00002 ETH(jackpot)
 * @returns {number} The reward amount with 6 decimal places
 */
export function generateRandomReward(): number {
  const rand = Math.random();

  // 60% chance of 0
  if (rand < 0.6) {
    return 0;
  }

  // 20% chance of 0.0001-0.0005
  if (rand < 0.8) {
    return Number((0.0001 + Math.random() * 0.0004).toFixed(6));
  }

  // 15% chance of 0.0005-0.001
  if (rand < 0.95) {
    return Number((0.0005 + Math.random() * 0.0005).toFixed(6));
  }

  // 4% chance of 0.002-0.005
  if (rand < 0.99) {
    return Number((0.002 + Math.random() * 0.003).toFixed(6));
  }

  // 1% chance of 0.00002 (jackpot)
  return 0.00002;
}
