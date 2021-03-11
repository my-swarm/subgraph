import { store } from "@graphprotocol/graph-ts"
import {
  FeaturesUpdated,
  AccountFrozen,
  AccountUnfrozen,
  Paused,
  Unpaused,
} from '../../generated/templates/Features/Features';
import { Token, TokenHolder, Features } from '../../generated/schema';

export function handleFeaturesUpdated(event: FeaturesUpdated): void {
  let params = event.params;
  let features = Features.load(event.address.toHex());

  features.forceTransfer = params.forceTransfer;
  features.tokenFreeze = params.tokenFreeze;
  features.accountFreeze = params.accountFreeze;
  features.accountBurn = params.accountBurn;
  features.transferRules = params.transferRules;

  features.save();
}

export function handleAccountFrozen(event: AccountFrozen): void {
  let tokenId = Features.load(event.address.toHex()).token;
  let holder = TokenHolder.load(event.params.account.toHex() + '_' + tokenId);
  holder.isFrozen = true;
  holder.save();
}

export function handleAccountUnfrozen(event: AccountUnfrozen): void {
  let tokenId = Features.load(event.address.toHex()).token;
  let holder = TokenHolder.load(event.params.account.toHex() + '_' + tokenId);
  holder.isFrozen = false;
  holder.save();
}

export function handleTokenFrozen(event: Paused): void {
  let tokenId = Features.load(event.address.toHex()).token;
  let token = Token.load(tokenId);
  token.isFrozen = true;
  token.isFrozenBy = event.params.account
  token.save();
}

export function handleTokenUnfrozen(event: Unpaused): void {
  let tokenId = Features.load(event.address.toHex()).token;
  let token = Token.load(tokenId);
  token.isFrozen = false;
  token.isFrozenBy = null;
  token.save();
}


