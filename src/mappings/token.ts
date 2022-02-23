import { Transfer as TransferEvent } from '../../generated/templates/Token/SRC20';
import { Token, TokenHolder, Transfer } from '../../generated/schema';
import { log } from "@graphprotocol/graph-ts/index";
import { KyaUpdated, NavUpdated, SupplyMinted, SupplyBurned } from "../../generated/templates/Token/SRC20";

export function handleTransfer(event: TransferEvent): void {
  let address = event.address;
  let params = event.params;
  let fromAddress = params.from;
  let toAddress = params.to;
  let idFrom = fromAddress.toHex() + '_' + address.toHex();
  let idTo = toAddress.toHex() + '_' + address.toHex();
  let holderFrom = TokenHolder.load(idFrom);
  let holderTo = TokenHolder.load(idTo);
  let token = Token.load(address.toHex());
  let transferRules = token.transferRules;

  if (transferRules != '0x0000000000000000000000000000000000000000' && (fromAddress.toHex() == transferRules || toAddress.toHex() == transferRules)) {
    // we don't count temporary transfers transferRules contract (create on transfer request)
    return;
  }

  if (holderFrom) {
    holderFrom.balance = holderFrom.balance.minus(params.value);
    holderFrom.save();
  }

  if (holderTo == null) {
    holderTo = new TokenHolder(idTo);
    holderTo.token = token.id;
    holderTo.address = toAddress;
    holderTo.balance = params.value;
    holderTo.createdAt = event.block.timestamp.toI32();
    holderTo.isFrozen = false;
  } else {
    holderTo.balance = holderTo.balance.plus(params.value);
  }
  holderTo.updatedAt = event.block.timestamp.toI32();

  holderTo.save();

  if (holderFrom) {
    let transferId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    let transfer = new Transfer(transferId);
    transfer.token = token.id;
    transfer.from = idFrom;
    transfer.fromAddress = fromAddress;
    transfer.to = idTo;
    transfer.toAddress = toAddress;
    transfer.value = params.value;
    transfer.createdAt = event.block.timestamp.toI32();
    transfer.save();
  }

  // track available supply
  if (token.owner == fromAddress) {
    token.availableSupply = token.availableSupply.minus(params.value);
  } else if (token.owner == toAddress) {
    token.availableSupply = token.availableSupply.plus(params.value);
  }
  token.save();
}

export function handleNavUpdated(event: NavUpdated): void {
  let params = event.params;
  let token = Token.load(event.address.toHex());
  token.nav = params.nav.toI32();
  token.save();
}

export function handleKyaUpdated(event: KyaUpdated): void {
  let params = event.params;
  let token = Token.load(event.address.toHex());
  token.kyaUri = params.kyaUri;
  token.save();
}
