import { BigInt } from "@graphprotocol/graph-ts"
import { Transfer as TransferEvent } from '../../generated/templates/Token/SRC20';
import { Token, TokenHolder, Transfer } from '../../generated/schema';

/*
export function handleSRC20SupplyMinted(event: SRC20SupplyMinted): void {
  let id = event.params.src20.toHex();
  let token = Token.load(id);
  token.supply = token.supply.plus(event.params.src20Value);
  token.stake = token.stake.plus(event.params.swmValue);
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
  } else {
    holderTo.balance = holderTo.balance.plus(params.value);
  }

  holderTo.save();

  if (holderFrom) {
    let transferId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    let transfer = new Transfer(transferId);
    transfer.token = token.id;
    transfer.from = idFrom;
    transfer.to = idTo;
    transfer.value = params.value;
    transfer.save();
  }
}
