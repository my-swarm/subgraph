import { BigInt } from "@graphprotocol/graph-ts"
import {
  Fundraiser as FundraiserContract,
  FundraiserSetup,
  ContributionPending,
  ContributionAdded,
  PendingContributionAccepted,
} from '../../generated/templates/Fundraiser/Fundraiser';
import { Fundraiser } from '../../generated/schema';

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
  let id = address.toHex();
  let fundraiser = new Fundraiser(id);
  let contract = FundraiserContract.bind(address);

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
  fundraiser.amountPending = BigInt.fromI32(0);;
  fundraiser.amountWithdrawn = BigInt.fromI32(0);;
  fundraiser.status = 'Running';
  fundraiser.save();
}

export function handleContributionPending(event: ContributionPending): void {
  let address = event.address;
  let params = event.params;
  let id = address.toHex();
  let fundraiser = Fundraiser.load(id);
  fundraiser.amountPending = fundraiser.amountPending.plus(params.amount);
  fundraiser.save();
}

export function handleContributionAdded(event: ContributionAdded): void {
  let address = event.address;
  let params = event.params;
  let id = address.toHex();
  let fundraiser = Fundraiser.load(id);
  fundraiser.amountQualified = fundraiser.amountQualified.plus(params.amount);
  fundraiser.save();
}

export function handlePendingContributionAccepted(event: PendingContributionAccepted): void {
  let address = event.address;
  let params = event.params;
  let id = address.toHex();
  let fundraiser = Fundraiser.load(id);
  fundraiser.amountPending = fundraiser.amountPending.minus(params.amount);
  fundraiser.amountQualified = fundraiser.amountQualified.plus(params.amount);
  fundraiser.save();
}
