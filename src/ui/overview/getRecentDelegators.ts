import {
  lockingVaultContract as lockingVault,
  vestingContract as vestingVault,
} from "src/elf/contracts";

const STARTING_BLOCK_NUMBER = 14496292;

// Fetches the number of unique delegators from both locking and vesting vaults
// This function should be used within NextJs getStaticProps with a TTL to cache this result
export async function getRecentDelegators(): Promise<string[]> {
  // Query for all events
  const lockingFilter = lockingVault.filters.VoteChange(null, null, null);
  const vestingFilter = vestingVault.filters.VoteChange(null, null, null);

  const lockingEvents = await lockingVault.queryFilter(
    lockingFilter,
    STARTING_BLOCK_NUMBER,
  );
  const vestingEvents = await vestingVault.queryFilter(
    vestingFilter,
    STARTING_BLOCK_NUMBER,
  );

  const delegators = new Set<string>([]);

  lockingEvents.forEach((event) => {
    const value = event.args[2];
    const from = event.args[0];
    if (value.gt(0)) {
      delegators.add(from);
    }
  });

  vestingEvents.forEach((event) => {
    const value = event.args[2];
    const from = event.args[0];
    if (value.gt(0)) {
      delegators.add(from);
    }
  });

  return Array.from(delegators);
}
