import { describe, expect, test } from 'bun:test';
import { generateRandomReward } from './rewards';

describe('generateRandomReward', () => {
  test('should generate rewards within specified bounds or zero', () => {
    const reward = generateRandomReward();
    expect(reward === 0 || (reward >= 0.00002 && reward <= 0.005)).toBe(true);
  });

  test('should generate different values on subsequent calls', () => {
    const rewards = new Set();
    for (let i = 0; i < 20; i++) {
      rewards.add(generateRandomReward());
    }
    expect(rewards.size).toBeGreaterThan(1);
  });

  test('should analyze 1000 rewards with expected distribution', async () => {
    const NUM_REQUESTS = 1000;
    const distributions: { [key: string]: number } = {
      '0': 0,
      '0.0001-0.0005': 0,
      '0.0005-0.001': 0,
      '0.002-0.005': 0,
      '0.00002': 0,
    };

    const rewards: number[] = [];
    let totalETH = 0;
    let nonZeroCount = 0;

    // Generate exactly 1000 rewards
    for (let i = 0; i < NUM_REQUESTS; i++) {
      const reward = generateRandomReward();
      rewards.push(reward);

      if (reward === 0) {
        distributions['0']++;
      } else {
        totalETH += reward;
        nonZeroCount++;

        // Categorize the non-zero reward
        if (reward === 0.00002) distributions['0.00002']++;
        else if (reward >= 0.0001 && reward <= 0.0005)
          distributions['0.0001-0.0005']++;
        else if (reward > 0.0005 && reward <= 0.001)
          distributions['0.0005-0.001']++;
        else if (reward >= 0.002 && reward <= 0.005)
          distributions['0.002-0.005']++;
      }
    }

    // Calculate statistics
    const avgNonZeroReward = totalETH / nonZeroCount;
    const sortedNonZeroRewards = rewards
      .filter((r) => r > 0)
      .sort((a, b) => a - b);
    const medianNonZeroReward =
      sortedNonZeroRewards[Math.floor(nonZeroCount / 2)];

    // Create a visual representation of the distribution
    console.log('\nReward Distribution Analysis for 1000 Requests:');
    console.log('----------------------------------------');
    console.log(`Total ETH distributed: ${totalETH.toFixed(6)}`);
    console.log(`Number of rewards given: ${NUM_REQUESTS}`);
    console.log(`Number of non-zero rewards: ${nonZeroCount}`);
    console.log(`Average non-zero reward: ${avgNonZeroReward.toFixed(6)} ETH`);
    console.log(
      `Median non-zero reward: ${medianNonZeroReward.toFixed(6)} ETH`
    );
    console.log(
      `Minimum non-zero reward: ${Math.min(...sortedNonZeroRewards).toFixed(
        6
      )} ETH`
    );
    console.log(`Maximum reward: ${Math.max(...rewards).toFixed(6)} ETH`);
    console.log('\nDistribution by range:');

    for (const [range, count] of Object.entries(distributions)) {
      const percentage = ((count / NUM_REQUESTS) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(Number(percentage) / 2));
      console.log(`${range} ETH: ${bar} ${count} (${percentage}%)`);
    }

    // Basic assertions
    expect(rewards.length).toBe(NUM_REQUESTS);
    expect(Math.min(...sortedNonZeroRewards)).toBeGreaterThanOrEqual(0.00002);
    expect(Math.max(...rewards)).toBeLessThanOrEqual(0.005);

    // Distribution assertions with 5% margin of error
    const marginOfError = 5;

    // Zero rewards: 60% ± 5%
    const zeroPercentage = (distributions['0'] / NUM_REQUESTS) * 100;
    expect(zeroPercentage).toBeGreaterThan(55);
    expect(zeroPercentage).toBeLessThan(65);

    // Calculate percentages of total requests for each range
    const smallRewardsPercent =
      (distributions['0.0001-0.0005'] / NUM_REQUESTS) * 100;
    const mediumRewardsPercent =
      (distributions['0.0005-0.001'] / NUM_REQUESTS) * 100;
    const largeRewardsPercent =
      (distributions['0.002-0.005'] / NUM_REQUESTS) * 100;
    const jackpotRewardsPercent =
      (distributions['0.00002'] / NUM_REQUESTS) * 100;

    // 20% ± 5% for 0.0001-0.0005 range
    expect(smallRewardsPercent).toBeGreaterThan(15);
    expect(smallRewardsPercent).toBeLessThan(25);

    // 15% ± 5% for 0.0005-0.001 range
    expect(mediumRewardsPercent).toBeGreaterThan(10);
    expect(mediumRewardsPercent).toBeLessThan(20);

    // 4% ± 2% for 0.002-0.005 range
    expect(largeRewardsPercent).toBeGreaterThan(2);
    expect(largeRewardsPercent).toBeLessThan(6);

    // 1% ± 1% for 0.00002 (jackpot)
    expect(jackpotRewardsPercent).toBeGreaterThan(0);
    expect(jackpotRewardsPercent).toBeLessThan(2);
  });
});
