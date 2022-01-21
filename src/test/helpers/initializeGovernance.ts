import {
  LockingVault__factory,
  MockERC20__factory,
  VestingVault__factory,
} from "elf-council-typechain";
import { MockProvider } from "ethereum-waffle";
import { ethers, Signer, Wallet } from "ethers";
import { parseEther } from "ethers/lib/utils";

import { testProvider } from "src/elf/providers/providers";

import { GovernanceContracts } from "./deployGovernance";

export async function initializeGovernance(
  governanceContracts: GovernanceContracts,
): Promise<void> {
  const signers: Wallet[] = await testProvider.getWallets();
  const [owner, signer1] = signers;
  const { elementToken, lockingVault } = governanceContracts;

  await giveVotingPowerToAccount(owner, elementToken, lockingVault);
  await giveVotingPowerToAccount(signer1, elementToken, lockingVault);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  // await giveAccountsVotingTokens(owner, accounts.slice(0, 5), elementToken);
  // await giveTreasuryVotingTokens(owner, treasury, elementToken);
  // await allocateGrants(testProvider, elementToken, vestingVault, signers);
}

export async function giveAccountsVotingTokens(
  tokenOwner: Signer,
  accounts: string[],
  votingTokenAddress: string,
): Promise<void> {
  const tokenContract = MockERC20__factory.connect(
    votingTokenAddress,
    tokenOwner,
  );
  await Promise.all(
    accounts.map((address) =>
      // seed balances
      tokenContract.setBalance(address, parseEther("50")),
    ),
  );
}

export async function giveTreasuryVotingTokens(
  tokenOwner: Signer,
  treasuryAddress: string,
  votingTokenAddress: string,
): Promise<void> {
  const tokenContract = MockERC20__factory.connect(
    votingTokenAddress,
    tokenOwner,
  );
  await tokenContract.setBalance(treasuryAddress, parseEther("5000000"));
}

// give grants to signer[2] and signer[3]
export async function allocateGrants(
  provider: MockProvider,
  grantTokenAddress: string,
  vestingVault: string,
  signers: Wallet[],
): Promise<void> {
  const tokenContract = MockERC20__factory.connect(
    grantTokenAddress,
    signers[0],
  );
  // signers[0] is the owner of the vesting vault
  const vestingVaultContract = VestingVault__factory.connect(
    vestingVault,
    signers[0],
  );

  // depsoit tokens to the vesting vault for allocating grants
  await (
    await tokenContract.setBalance(signers[0].address, parseEther("100"))
  ).wait(1);
  await (
    await tokenContract.setAllowance(
      signers[0].address,
      vestingVault,
      ethers.constants.MaxUint256,
    )
  ).wait(1);
  await (await vestingVaultContract.deposit(parseEther("100"))).wait(1);

  // grant with cliff of 50 blocks and expiration of 100 blocks
  const startBlock = await provider.getBlockNumber();
  const expiration = startBlock + 100;
  const cliff = 50;
  await (
    await vestingVaultContract.addGrantAndDelegate(
      signers[2].address,
      parseEther("50"),
      startBlock,
      expiration,
      cliff,
      signers[2].address,
    )
  ).wait(1);

  // fully vested grant
  await (
    await vestingVaultContract.addGrantAndDelegate(
      signers[3].address,
      parseEther("50"),
      startBlock,
      startBlock,
      0,
      signers[3].address,
    )
  ).wait(1);
}

async function giveVotingPowerToAccount(
  account: Wallet,
  elementToken: string,
  lockingVault: string,
) {
  const lockingVaultContract = LockingVault__factory.connect(
    lockingVault,
    account,
  );

  const elementTokenContract = MockERC20__factory.connect(
    elementToken,
    account,
  );
  const setBalTx = await elementTokenContract.setBalance(
    account.address,
    parseEther("50"),
  );
  await setBalTx.wait(1);

  const setAllowanceTx = await elementTokenContract.setAllowance(
    account.address,
    lockingVault,
    ethers.constants.MaxUint256,
  );
  await setAllowanceTx.wait(1);

  const depositTx = await lockingVaultContract.deposit(
    account.address,
    parseEther("50"),
    account.address,
  );
  await depositTx.wait(1);
}
