import { BigInt, Address, store, log, ethereum } from "@graphprotocol/graph-ts"
import {
  Fundraiser as FundraiserContract,
  FundraiserSetup,
  ContributionPending,
  ContributionAdded,
  PendingContributionAccepted,
  ContributorAccepted,
  ContributorRemoved,
  FundraiserFinished,
  FundraiserCanceled
} from '../../generated/templates/Fundraiser/Fundraiser';
import { ERC20 as ERC20Contract } from '../../generated/templates/Fundraiser/ERC20';
import { Fundraiser, Contributor, Contribution, Erc20Token, AffiliateManager } from '../../generated/schema';
import { AffiliateManager as AffiliateManagerTemplate } from '../../generated/templates';


export function handleFundraiserSetup(event: FundraiserSetup): void {
  let address = event.address;
  let params = event.params;
  let fundraiserId = address.toHex();
  let fundraiser = new Fundraiser(fundraiserId);
  let contract = FundraiserContract.bind(address);

  let affiliateManagerId = params.affiliateManager.toHex();
  if (affiliateManagerId != '0x0000000000000000000000000000000000000000') {
    AffiliateManagerTemplate.create(params.affiliateManager as Address)
    let affiliateManager = new AffiliateManager(affiliateManagerId);
    affiliateManager.address = params.affiliateManager;
    affiliateManager.fundraiser = fundraiserId;
    affiliateManager.save();
  } else {
    affiliateManagerId = null;
  }

  fundraiser.owner = event.transaction.from;
  fundraiser.address = address;

  fundraiser.label = contract.label();
  fundraiser.token = contract.token().toHex();
  fundraiser.supply = contract.supply();
  fundraiser.startDate = contract.startDate().toI32();
  fundraiser.endDate = contract.endDate().toI32();
  fundraiser.softCap = contract.softCap();
  fundraiser.hardCap = contract.hardCap();

  let erc20 = ERC20Contract.bind(params.baseCurrency);
  let baseCurrencyId = params.baseCurrency.toHex();
  let baseCurrency = new Erc20Token(baseCurrencyId)
  baseCurrency.address = params.baseCurrency;
  baseCurrency.name = erc20.name();
  baseCurrency.symbol = erc20.symbol();
  baseCurrency.decimals = erc20.decimals();
  baseCurrency.save();

  fundraiser.baseCurrency = baseCurrencyId;
  fundraiser.tokenPrice = params.tokenPrice;
  fundraiser.affiliateManager = affiliateManagerId;
  fundraiser.contributorRestrictions = params.contributorRestrictions;
  fundraiser.fundraiserManager = params.fundraiserManager;
  fundraiser.minter = params.minter;
  fundraiser.contributionsLocked = params.contributionsLocked;

  fundraiser.amountQualified = BigInt.fromI32(0);
  fundraiser.amountPending = BigInt.fromI32(0);
  fundraiser.amountRefunded = BigInt.fromI32(0);
  fundraiser.amountWithdrawn = BigInt.fromI32(0);
  fundraiser.status = 'Running';
  fundraiser.numContributors = 0;
  fundraiser.save();
}

export function handleFundraiserFinished(event: FundraiserFinished): void {
  let fundraiser = Fundraiser.load(event.address.toHex());
  fundraiser.status = 'Finished';
  fundraiser.save();
}

export function handleFundraiserCanceled(event: FundraiserCanceled): void {
  let fundraiser = Fundraiser.load(event.address.toHex());
  fundraiser.status = 'Finished';
  fundraiser.save();
}

function createOrLoadContributor(fundraiserId: string, address: Address): Contributor {
  let contributorId = fundraiserId + '_' + address.toHex();
  let contributor = Contributor.load(contributorId);
  if (!contributor) {
    contributor = new Contributor(contributorId);
    contributor.address = address;
    contributor.fundraiser = fundraiserId;
    contributor.amount = BigInt.fromI32(0);
  }
  return contributor as Contributor; // cast from Contributor | NULL
}

function saveContribution(id: string, contributor: Contributor, timestamp: BigInt, amount: BigInt): void {
  let contribution = new Contribution(id);
  // contribution.fundraiser = fundraiserId;
  contribution.contributor = contributor.id;
  contribution.type = contributor.status;
  contribution.timestamp = timestamp.toI32();
  contribution.amount = amount;
  contribution.save();
}

export function handleContributionPending(event: ContributionPending): void {
  let address = event.address;
  let params = event.params;
  let fundraiserId = address.toHex();
  let fundraiser = Fundraiser.load(fundraiserId);
  fundraiser.amountPending = fundraiser.amountPending.plus(params.amount);
  fundraiser.save();

  let contributor = createOrLoadContributor(fundraiserId, params.account);
  contributor.status = 'Pending';
  contributor.amount = contributor.amount.plus(params.amount);
  contributor.save();

  saveContribution(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    contributor,
    event.block.timestamp,
    params.amount
  );
}

export function handleContributionAdded(event: ContributionAdded): void {
  let address = event.address;
  let params = event.params;
  let fundraiserId = address.toHex();
  let fundraiser = Fundraiser.load(fundraiserId);
  fundraiser.amountQualified = fundraiser.amountQualified.plus(params.amount);
  fundraiser.save();

  let contributor = createOrLoadContributor(fundraiserId, params.account);
  contributor.status = 'Qualified';
  contributor.amount = contributor.amount.plus(params.amount);
  contributor.save();

  saveContribution(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
    contributor,
    event.block.timestamp,
    params.amount
  );
}

// this handler basically fixes contributions added twice where the flow is
// 1. unqualified investor contributies (as a pending contribution)
// 2. investor is qualified
// 3. in the process the contribution is added again as qualified
export function handlePendingContributionAccepted(event: PendingContributionAccepted): void {
  let address = event.address;
  let params = event.params;
  let fundraiser = Fundraiser.load(address.toHex());
  fundraiser.amountPending = fundraiser.amountPending.minus(params.amount);
  // amountQualified already increased, because ContributionAdded was triggered too
  fundraiser.save();

  let contributor = Contributor.load(address.toHex() + '_' + params.account.toHex());
  contributor.amount = contributor.amount.minus(params.amount);
  contributor.save();
}

export function handleContributorAccepted(event: ContributorAccepted): void {
  let params = event.params;
  let fundraiserId = event.address.toHex();

  let contributor = createOrLoadContributor(fundraiserId, params.account);
  contributor.status = 'Qualified';
  contributor.save();

  let fundraiser = Fundraiser.load(fundraiserId);
  fundraiser.numContributors++;
  fundraiser.save();
}

export function handleContributorRemoved(event: ContributorRemoved): void {
  let address = event.address;
  let params = event.params;

  let contributor = Contributor.load(address.toHex() + '_' + params.account.toHex());
  if (contributor) {

    let fundraiser = Fundraiser.load(address.toHex());
    if (contributor.status == 'Pending') {
      fundraiser.amountPending = fundraiser.amountPending.minus(contributor.amount);
    } else if (contributor.status == 'Qualified') {
      fundraiser.amountQualified = fundraiser.amountQualified.minus(contributor.amount);
    }
    fundraiser.amountRefunded = fundraiser.amountRefunded.plus(contributor.amount);
    fundraiser.numContributors++;
    fundraiser.save();

    fundraiser.save();

    contributor.status = params.forced ? 'Removed' : 'Refunded';

    saveContribution(
      event.transaction.hash.toHex() + "-" + event.logIndex.toString(),
      contributor as Contributor,
      event.block.timestamp,
      contributor.amount
    );

    contributor.amount = BigInt.fromI32(0);
    contributor.save();

  }
}
