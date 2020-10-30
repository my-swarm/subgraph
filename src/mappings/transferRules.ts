import { store } from "@graphprotocol/graph-ts"
import {
  AccountWhitelisted,
  AccountUnWhitelisted,
  AccountGreylisted,
  AccountUnGreylisted,
  TransferRequested,
  TransferApproved,
  TransferDenied,
} from '../../generated/templates/TransferRules/TransferRules';
import { TransferRules, WhitelistedAccount, GreylistedAccount, TransferRequest } from '../../generated/schema';

export function handleWhitelisted(event: AccountWhitelisted): void {
  let params = event.params;
  let tokenId = TransferRules.load(event.address.toHex()).token;
  let accountId = params.account.toHex();

  let id = tokenId + '_' + accountId;
  let item = WhitelistedAccount.load(id);
  if (item == null) {
    item = new WhitelistedAccount(id);
    item.address = params.account;
    item.token = tokenId;
    item.createdAt = event.block.timestamp;
  }
  item.save();
}

export function handleUnWhitelisted(event: AccountUnWhitelisted): void {
  let tokenId = TransferRules.load(event.address.toHex()).token;
  store.remove('WhitelistedAccount', tokenId + '_' + event.params.account.toHex());
}

export function handleGreylisted(event: AccountGreylisted): void {
  let params = event.params;
  let tokenId = TransferRules.load(event.address.toHex()).token;
  let accountId = params.account.toHex();

  let id = tokenId + '_' + accountId;
  let item = GreylistedAccount.load(id);
  if (item == null) {
    item = new GreylistedAccount(id);
    item.address = params.account;
    item.token = tokenId;
    item.createdAt = event.block.timestamp;
  }
  item.save();
}

export function handleUnGreylisted(event: AccountUnGreylisted): void {
  let tokenId = TransferRules.load(event.address.toHex()).token;
  store.remove('GreylistedAccount', tokenId + '_' + event.params.account.toHex());
}


// transfer id
// if event.params.requestId exists, <token address>_<request_id>
// else event.transaction.hash.toHex() + "-" + event.logIndex.toString()


export function handleTransferRequested(event: TransferRequested): void {
  let params = event.params;
  let tokenId = TransferRules.load(event.address.toHex()).token;
  let id = tokenId + '_' + params.requestId.toString();
  let transferRequest = new TransferRequest(id);
  transferRequest.requestId = params.requestId.toI32();
  transferRequest.token = tokenId;
  transferRequest.from = params.from.toHex() + '_' + tokenId;
  transferRequest.to = params.to.toHex() + '_' + tokenId;
  transferRequest.value = params.value;
  transferRequest.createdAt = event.block.timestamp.toI32();
  transferRequest.updatedAt = event.block.timestamp.toI32();
  transferRequest.status = 'Pending';
  transferRequest.save();
}

export function handleTransferApproved(event: TransferApproved): void {
  let params = event.params;
  let tokenId = TransferRules.load(event.address.toHex()).token;
  let id = tokenId + '_' + params.requestId.toString();
  let transferRequest = TransferRequest.load(id);
  transferRequest.updatedAt = event.block.timestamp.toI32();
  transferRequest.status = 'Approved';
  transferRequest.save();
}

export function handleTransferDenied(event: TransferDenied): void {
  let params = event.params;
  let tokenId = TransferRules.load(event.address.toHex()).token;
  let id = tokenId + '_' + params.requestId.toString();
  let transferRequest = TransferRequest.load(id);
  transferRequest.updatedAt = event.block.timestamp.toI32();
  transferRequest.status = 'Denied';
  transferRequest.save();
}


