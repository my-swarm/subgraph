import { store, log } from "@graphprotocol/graph-ts"
import { Token } from '../../generated/schema';
import { SRC20Removed, SRC20SupplyDecreased, SRC20SupplyIncreased } from '../../generated/Registry/SRC20Registry';

export function handleSRC20Removed(event: SRC20Removed): void {
  store.remove('Token', event.params.token.toHex());
}

export function handleSupplyIncreased(event: SRC20SupplyIncreased): void {
  let params = event.params;
  let token = Token.load(params.src20.toHex());

  log.info('Token supply {}, {}', [token.supply.toString(), token.stake.toString()]);
  log.info('Increase supply {}, {}', [params.src20Amount.toString(), params.swmAmount.toString()]);
  token.supply = token.supply.plus(params.src20Amount);
  token.stake = token.stake.plus(params.swmAmount);
  token.save();
}

export function handleSupplyDecreased(event: SRC20SupplyDecreased): void {
  let params = event.params;
  let token = Token.load(params.src20.toHex());
  token.supply = token.supply.minus(params.src20Amount);
  token.stake = token.stake.minus(params.swmAmount);
  token.save();
}

