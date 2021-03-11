import { Transfer as TransferEvent } from '../../generated/templates/Token/SRC20';
import { Token, TokenHolder, Transfer } from '../../generated/schema';
import { log } from "@graphprotocol/graph-ts/index";
import { KyaUpdated, NavUpdated, SupplyMinted, SupplyBurned } from "../../generated/templates/Token/SRC20";

export function handleTransfer(event: TransferEvent): void {
  let address = event.address;
  let params = event.params;
  let idFrom = params.from.toHex() + '_' + address.toHex();
  let idTo = params.to.toHex() + '_' + address.toHex();
  let holderFrom = TokenHolder.load(idFrom);
  let holderTo = TokenHolder.load(idTo);
  let token = Token.load(address.toHex());

  if (holderFrom) {
    holderFrom.balance = holderFrom.balance.minus(params.value);
    holderFrom.save();
  }

  if (holderTo == null) {
    holderTo = new TokenHolder(idTo);
    holderTo.token = token.id;
    holderTo.address = params.to;
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
    transfer.fromAddress = params.from;
    transfer.to = idTo;
    transfer.toAddress = params.to;
    transfer.value = params.value;
    transfer.createdAt = event.block.timestamp.toI32();
    transfer.save();
  }

  // track available supply
  if (token.owner == params.from) {
    token.availableSupply = token.availableSupply.minus(params.value);
  } else if (token.owner == params.to) {
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

export function handleSupplyMinted(event: SupplyMinted): void {
  let params = event.params;
  let token = Token.load(event.address.toHex());

  token.supply = token.supply.plus(params.amount);
  token.save();
}

export function handleSupplyBurned(event: SupplyBurned): void {
  let params = event.params;
  let token = Token.load(event.address.toHex());
  token.supply = token.supply.minus(params.amount);
  token.save();
}
