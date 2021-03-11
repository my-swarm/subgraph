import { store, log } from "@graphprotocol/graph-ts"
import {Token, Minter, Registry, TransferRules, Features} from '../../generated/schema';
import {
  SRC20Registered,
  Deployed,
  TreasuryUpdated,
  RewardPoolUpdated,
  MinterAdded,
  MinterRemoved, SRC20Unregistered,
} from '../../generated/Registry/SRC20Registry';

import { SRC20 as TokenContract } from '../../generated/templates/Token/SRC20';
import {Address, BigInt} from "@graphprotocol/graph-ts/index";
import {
  Features as FeaturesTemplate,
  Token as TokenTemplate,
  TransferRules as TransferRulesTemplate
} from "../../generated/templates";
import {Features as FeaturesContract} from "../../generated/templates/Features/Features";

export function handleDeployed(event: Deployed): void {
  let registry = new Registry(event.address.toHex());
  let params = event.params;
  registry.address = event.address;
  registry.treasury = params.treasury;
  registry.rewardPool = params.rewardPool;
  registry.numTokens = 0;
  registry.numTokensActive = 0;
  registry.numTokensFundraising = 0;
  registry.save();
}

export function handleTreasuryUpdated(event: TreasuryUpdated): void {
  let registryId = event.address.toHex();
  let registry = Registry.load(registryId);
  registry.treasury = event.params.treasury;
  registry.save();
}

export function handleRewardPoolUpdated(event: RewardPoolUpdated): void {
  let registryId = event.address.toHex();
  let registry = Registry.load(registryId);
  registry.rewardPool = event.params.rewardPool;
  registry.save();
}

export function handleMinterAdded(event: MinterAdded): void {
  let registryId = event.address.toHex();
  let address = event.params.minter;
  let minter = new Minter(address.toHex())
  minter.address = address;
  minter.createdAt = event.block.timestamp;
  minter.registry = registryId;
  minter.save();
}

export function handleMinterRemoved(event: MinterRemoved): void {
  store.remove('Minter', event.params.minter.toHex())
}

export function handleSRC20Registered(event: SRC20Registered): void {
  let params = event.params;
  let tokenId = params.token.toHex();
  let token = new Token(tokenId);
  let tokenContract = TokenContract.bind(params.token);

  token.owner = tokenContract.owner();
  token.address = params.token;
  token.name = tokenContract.name()
  token.symbol = tokenContract.symbol();
  token.decimals = tokenContract.decimals();
  token.supply = BigInt.fromI32(0);
  token.maxSupply = tokenContract.maxTotalSupply();
  token.availableSupply = BigInt.fromI32(0);
  token.fee = BigInt.fromI32(0);

  token.isFrozen = false;

  let transferRulesAddress = tokenContract.transferRules();
  let transferRulesId = transferRulesAddress.toHex();
  let transferRules = new TransferRules(transferRulesId);
  transferRules.address = transferRulesAddress;
  transferRules.token = tokenId;

  let featuresAddress = tokenContract.features();
  let featuresId = featuresAddress.toHex();
  let features = new Features(featuresId);
  features.address = featuresAddress;
  features.token = tokenId;

  let featuresContract = FeaturesContract.bind(featuresAddress);
  let featuresBitmap = featuresContract.features();
  features.forceTransfer = (featuresBitmap & 0x01) !== 0;
  features.tokenFreeze = (featuresBitmap & 0x02) !== 0;
  features.accountBurn = (featuresBitmap & 0x04) !== 0;
  features.accountFreeze = (featuresBitmap & 0x08) !== 0;
  features.transferRules = (featuresBitmap & 0x10) !== 0;
  features.token = tokenId;

  token.transferRules = transferRulesId;
  token.features = featuresId;

  transferRules.save();
  features.save();
  token.save();

  TokenTemplate.create(params.token as Address);
  TransferRulesTemplate.create(transferRulesAddress);
  FeaturesTemplate.create(featuresAddress);

  token.save();
}

export function handleSRC20Unregistered(event: SRC20Unregistered): void {
  store.remove('Token', event.params.token.toHex());
}
