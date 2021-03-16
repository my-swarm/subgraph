import {Address, BigInt} from "@graphprotocol/graph-ts"
import {
  ContributionAdded,
  ContributionPending,
  ContributorAccepted,
  ContributorRemoved,
  FundraiserCanceled,
  FundraiserFinished,
  PendingContributionAccepted
} from '../../generated/templates/Fundraiser/Fundraiser';
import {Contribution, Contributor, Fundraiser} from '../../generated/schema';

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
