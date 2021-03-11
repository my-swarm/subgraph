import { BigInt, Address } from "@graphprotocol/graph-ts"
import { Token, TransferRules, Features, Roles } from '../../generated/schema';
import { Token as TokenTemplate, TransferRules as TransferRulesTemplate, Features as FeaturesTemplate } from '../../generated/templates';
import { SRC20Created } from '../../generated/Factory/SRC20Factory';
import { Features as FeaturesContract } from '../../generated/templates/Features/Features'

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
  transferRules.address = params.transferRules;
  transferRules.token = tokenId
  token.transferRules = transferRulesId;

  let featuresId = params.features.toHex();
  let features = new Features(featuresId);
  let contract = FeaturesContract.bind(params.features);

  let featuresBitmap = contract.features();
  features.forceTransfer = (featuresBitmap & 0x01) !== 0;
  features.tokenFreeze = (featuresBitmap & 0x02) !== 0;
  features.accountBurn = (featuresBitmap & 0x04) !== 0;
  features.accountFreeze = (featuresBitmap & 0x08) !== 0;

  features.token = tokenId;
  features.address = params.features;
  token.features = featuresId;

  transferRules.save();
  features.save();
  token.save();

  TokenTemplate.create(params.token as Address);
  TransferRulesTemplate.create(params.transferRules as Address);
  FeaturesTemplate.create(params.features as Address);
}
