import { BigInt, Address } from "@graphprotocol/graph-ts"
import { Token, TransferRules } from '../../generated/schema';
import { Token as TokenTemplate, TransferRules as TransferRulesTemplate } from '../../generated/templates';
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
  token.kyaHash = params.kyaHash;
  token.kyaUrl = params.kyaUrl;
  token.deleted = false;

  let transferRulesId = params.transferRules.toHex();
  let transferRules = new TransferRules(transferRulesId);
  transferRules.token = tokenId
  token.transferRules = transferRulesId;

  token.save();
  transferRules.save();

  TokenTemplate.create(params.token as Address);
  TransferRulesTemplate.create(params.transferRules as Address);
}
