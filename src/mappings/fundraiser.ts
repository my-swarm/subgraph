import { BigInt, Address, store, log } from "@graphprotocol/graph-ts"
import {
  Fundraiser as FundraiserContract,
  FundraiserSetup,
  ContributionPending,
  ContributionAdded,
  PendingContributionAccepted,
  ContributorRemoved,
} from '../../generated/templates/Fundraiser/Fundraiser';
import { Fundraiser, Contributor, Contribution } from '../../generated/schema';

/*
export function handleFundraiserCreated(event: FundraiserCreated): void {
  let address = event.address;
  let params = event.params;
  let id = address.toHex();
  let fundraiser = new Fundraiser(id);
  fundraiser.label = params.label;
  fundraiser.token = params.token.toHex();
  fundraiser.supply = params.supply;
  fundraiser.startDate = params.startDate.toI32();
  fundraiser.endDate = params.endDate.toI32();
  fundraiser.softCap = params.softCap;
  fundraiser.hardCap = params.hardCap;
  fundraiser.status = 'SettingUp';
  fundraiser.save();
}
 */
export function handleFundraiserSetup(event: FundraiserSetup): void {
  let address = event.address;
  let params = event.params;
  let fundraiserId = address.toHex();
  let fundraiser = new Fundraiser(fundraiserId);
  let contract = FundraiserContract.bind(address);

  fundraiser.owner = event.transaction.from;

  fundraiser.label = contract.label();
  fundraiser.token = contract.token().toHex();
  fundraiser.supply = contract.supply();
  fundraiser.startDate = contract.startDate().toI32();
  fundraiser.endDate = contract.endDate().toI32();
  fundraiser.softCap = contract.softCap();
  fundraiser.hardCap = contract.hardCap();

  fundraiser.baseCurrency = params.baseCurrency;
  fundraiser.tokenPrice = params.tokenPrice;
  fundraiser.affiliateManager = params.affiliateManager;
  fundraiser.contributorRestrictions = params.contributorRestrictions;
  fundraiser.minter = params.minter;
  fundraiser.contributionsLocked = params.contributionsLocked;

  fundraiser.amountQualified = BigInt.fromI32(0);
  fundraiser.amountPending = BigInt.fromI32(0);
  fundraiser.amountWithdrawn = BigInt.fromI32(0);
  fundraiser.status = 'Running';
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

  let contribution = new Contribution(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  contribution.fundraiser = fundraiserId;
  contribution.contributor = contributor.id;
  contribution.type = 'Pending';
  contribution.timestamp = event.block.timestamp.toI32();
  contribution.amount = params.amount;
  contribution.save();
}

export function handleContributionAdded(event: ContributionAdded): void {
  let address = event.address;
  let params = event.params;
  let fundraiserId = address.toHex();
  let fundraiser = Fundraiser.load(fundraiserId);
  fundraiser.amountQualified = fundraiser.amountQualified.plus(params.amount);

  let contributor = createOrLoadContributor(fundraiserId, params.account);
  contributor.status = 'Qualified';
  contributor.amount = contributor.amount.plus(params.amount);
  contributor.save();

  let contribution = new Contribution(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  contribution.fundraiser = fundraiserId;
  contribution.contributor = contributor.id;
  contribution.type = 'Qualified';
  contribution.timestamp = event.block.timestamp.toI32();
  contribution.amount = params.amount;
  contribution.save();
}

// this handler basically fixes contributions added twice where the flow is
// 1. unqualified investor contributies (as a pending contribution)
// 2. investor is qualified
// 3. in the process the contribution is added again as qualified
// It's impossible to know the exact pending contribution id to remove, but we can just remove all of them
// because when this event is triggered, we are sure the investor is qualified and all contributions have been
// added again as qualified.
export function handlePendingContributionAccepted(event: PendingContributionAccepted): void {
  let address = event.address;
  let params = event.params;
  let fundraiserId = address.toHex();
  log.info('fundraiserId: {}', [fundraiserId]);
  let fundraiser = Fundraiser.load(fundraiserId);
  fundraiser.amountPending = fundraiser.amountPending.minus(params.amount);
  // amountQualified already increased, because ContributionAdded was triggered too
  fundraiser.save();

/*
  // removing double contributions (they have been converted to QUALIFIED already)
  // slave records iteration doesn't work?
  let contributor = createOrLoadContributor(fundraiserId, params.account);
  log.info('Removing pending contributions for {}', [contributor.address.toHex()]);
  let contributions = contributor.contributions as Array<string>;
  log.info('Num contributions: {}', [BigInt.fromI32(contributions.length).toString()]);
  contributor.contributions.forEach(contributionId => {
    let contribution = Contribution.load(contributionId);
    log.info('Considering contribution removal {}, {}', [contributionId, contribution.type]);
    if (contribution.type == 'Pending') {
      log.info('Removed', []);
      store.remove('Contribution', contributionId);
    } else {
      log.info('Skipped', []);
    }
  });
  contributor.save();
 */
}

export function handleContributorRemoved(event: ContributorRemoved): void {
  let address = event.address;
  let params = event.params;
  let contributor = Contributor.load(address.toHex() + '_' + params.account.toHex());
  contributor.status = params.forced ? 'Removed' : 'Refunded';
/*
  // slave records iteration doesn't work?
  contributor.contributions.forEach(contributionId => {
    let contribution = Contribution.load(contributionId);
    contribution.type = 'Refunded';
    contribution.save();
  });
 */
  contributor.save();
}
