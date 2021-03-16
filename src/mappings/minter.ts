import {Token, Fee, Minter} from '../../generated/schema';
import { Minted, Burned, FeeApplied } from '../../generated/templates/Minter/Minter';

export function handleMinted(event: Minted): void {
  let params = event.params;
  let tokenId = params.token.toHex();
  let token = Token.load(tokenId)
  token.supply = token.supply.plus(params.amount);
  token.fee = token.fee.plus(params.fee);
  token.save();
}

export function handleBurned(event: Burned): void {
  let params = event.params;
  let tokenId = params.token.toHex();
  let token = Token.load(tokenId);
  token.supply = token.supply.minus(params.amount);
  token.save();
}

export function handleFeeApplied(event: FeeApplied): void {
  let params = event.params;
  let feeId = event.block.timestamp.toString();
  let fee = new Fee(feeId);
  fee.total = params.treasury.plus(params.rewardPool);
  fee.treasury = params.treasury;
  fee.rewardPool = params.rewardPool;

  let minter = Minter.load(event.address.toHex());
  minter.feeTotal = minter.feeTotal.plus(fee.total);
  minter.feeTreasury = minter.feeTreasury.plus(fee.treasury);
  minter.feeRewardPool = minter.feeRewardPool.plus(fee.rewardPool);
  minter.save();
}
