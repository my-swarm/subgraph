import { Token } from '../../generated/schema';
import { SRC20Removed, SRC20SupplyDecreased, SRC20SupplyIncreased } from '../../generated/Registry/SRC20Registry';

export function handleSRC20Removed(event: SRC20Removed): void {
  let id = event.params.token.toHex();
  let token = Token.load(id);
  token.deleted = true;
  token.save();
}

export function handleSupplyIncreased(event: SRC20SupplyIncreased): void {
  let params = event.params;
  let id = params.src20.toHex();
  let token = Token.load(id);
  token.supply = token.supply.plus(params.src20Value);
  token.stake = token.stake.plus(params.swmValue);
  token.save();
}

export function handleSupplyDecreased(event: SRC20SupplyDecreased): void {
  let params = event.params;
  let id = params.src20.toHex();
  let token = Token.load(id);
  token.supply = token.supply.minus(params.src20Value);
  token.stake = token.stake.minus(params.swmValue);
  token.save();
}

