import { BigInt } from "@graphprotocol/graph-ts"
import { Transfer as TransferEvent, FundraiserAdded } from '../../generated/templates/Token/SRC20';
import { Token, TokenHolder, Transfer } from '../../generated/schema';
import {Address} from "@graphprotocol/graph-ts/index";
import { Fundraiser as FundraiserTemplate } from '../../generated/templates';

/*
export function handleSRC20SupplyMinted(event: SRC20SupplyMinted): void {
  let id = event.params.src20.toHex();
  let token = Token.load(id);
  token.supply = token.supply.plus(event.params.src20Amount);
  token.stake = token.stake.plus(event.params.swmAmount);
}
 */

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
    transfer.to = idTo;
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

export function handleFundraiserAdded(event: FundraiserAdded): void {
  let params = event.params;
  let address = event.address;
  FundraiserTemplate.create(params.fundraiser as Address);
  let token = Token.load(address.toHex());
  token.currentFundraiser = params.fundraiser.toHex();
  token.save();

}
