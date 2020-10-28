import { BigInt, Address } from "@graphprotocol/graph-ts"
import { Token, TransferRules, Features } from '../../generated/schema';
import { Token as TokenTemplate, TransferRules as TransferRulesTemplate, Features as FeaturesTemplate } from '../../generated/templates';
import { SRC20Created } from '../../generated/Factory/SRC20Factory';

export function handleSRC20Created(event: SRC20Created): void {
  let params = event.params;
  let tokenId = params.token.toHex();
  let token = new Token(tokenId);
  token.owner = params.owner;
  token.address = params.token;
  token.name = params.name;
  token.symbol = params.symbol;
  token.decimals = params.decimals;
  token.supply = BigInt.fromI32(0);
  token.maxSupply = params.maxTotalSupply;
  token.availableSupply = BigInt.fromI32(0);
  token.stake = BigInt.fromI32(0);

  token.isFrozen = false;

  let transferRulesId = params.transferRules.toHex();
  let transferRules = new TransferRules(transferRulesId);
  transferRules.token = tokenId
  token.transferRules = transferRulesId;

  let featuresId = params.features.toHex();
  let features = new Features(featuresId);

  features.forceTransfer = false;
  features.tokenFreeze = false;
  features.accountFreeze = false;
  features.accountBurn = false;

  features.token = tokenId;
  token.features = featuresId;

  transferRules.save();
  features.save();
  token.save();

  TokenTemplate.create(params.token as Address);
  TransferRulesTemplate.create(params.transferRules as Address);
  FeaturesTemplate.create(params.transferRules as Address);
}
