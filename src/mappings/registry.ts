import { store, log } from "@graphprotocol/graph-ts";
import {
  Token,
  Minter,
  Registry,
  TransferRules,
  Features,
  Fundraiser,
  AffiliateManager,
  Erc20Token
} from "../../generated/schema";
import {
  SRC20Registered,
  Deployed,
  TreasuryUpdated,
  RewardPoolUpdated,
  MinterAdded,
  MinterRemoved,
  SRC20Unregistered,
  FundraiserRegistered
} from "../../generated/Registry/SRC20Registry";
import { SRC20 as TokenContract } from "../../generated/Registry/SRC20";
import { Features as FeaturesContract } from "../../generated/Registry/Features";
import { Fundraiser as FundraiserContract } from "../../generated/Registry/Fundraiser";
import { ERC20 as ERC20Contract } from "../../generated/Registry/ERC20";

import { Address, BigInt } from "@graphprotocol/graph-ts/index";
import {
  Features as FeaturesTemplate,
  Token as TokenTemplate,
  Minter as MinterTemplate,
  Fundraiser as FundraiserTemplate,
  TransferRules as TransferRulesTemplate,
  AffiliateManager as AffiliateManagerTemplate
} from "../../generated/templates";

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
  let minter = new Minter(address.toHex());
  minter.address = address;
  minter.createdAt = event.block.timestamp;
  minter.registry = registryId;
  minter.feeTotal = BigInt.fromI32(0);
  minter.feeTreasury = BigInt.fromI32(0);
  minter.feeRewardPool = BigInt.fromI32(0);
  minter.save();

  MinterTemplate.create(address);
}

export function handleMinterRemoved(event: MinterRemoved): void {
  store.remove("Minter", event.params.minter.toHex());
}

export function handleSRC20Registered(event: SRC20Registered): void {
  let params = event.params;
  let tokenId = params.token.toHex();
  let token = new Token(tokenId);
  let tokenContract = TokenContract.bind(params.token);

  token.deployedAt = event.block.timestamp.toI32();
  token.owner = tokenContract.owner();
  token.address = params.token;
  token.name = tokenContract.name();
  token.symbol = tokenContract.symbol();
  token.decimals = tokenContract.decimals();
  token.supply = BigInt.fromI32(0);
  token.maxSupply = tokenContract.maxTotalSupply();
  token.availableSupply = BigInt.fromI32(0);
  token.fee = BigInt.fromI32(0);
  token.nav = tokenContract.nav().toI32();
  token.kyaUri = tokenContract.kyaUri();

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
  features.autoburn = (featuresBitmap & 0x20) !== 0;
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
  store.remove("Token", event.params.token.toHex());
}

export function handleFundraiserRegistered(event: FundraiserRegistered): void {
  let params = event.params;

  let fundraiserAddress = params.fundraiser;
  let fundraiserId = fundraiserAddress.toHex();
  let fundraiser = new Fundraiser(fundraiserId);
  let contract = FundraiserContract.bind(fundraiserAddress);

  let affiliateManagerAddress = contract.affiliateManager();
  let affiliateManagerId = affiliateManagerAddress.toHex();
  if (affiliateManagerId != "0x0000000000000000000000000000000000000000") {
    AffiliateManagerTemplate.create(affiliateManagerAddress as Address);
    let affiliateManager = new AffiliateManager(affiliateManagerId);
    affiliateManager.address = affiliateManagerAddress;
    affiliateManager.fundraiser = fundraiserId;
    affiliateManager.save();
  } else {
    affiliateManagerId = null;
  }

  fundraiser.owner = contract.owner();
  fundraiser.address = fundraiserAddress;

  fundraiser.label = contract.label();
  fundraiser.token = params.token.toHex();
  fundraiser.supply = contract.supply();
  fundraiser.startDate = contract.startDate().toI32();
  fundraiser.endDate = contract.endDate().toI32();
  fundraiser.createdAt = event.block.timestamp.toI32();
  fundraiser.softCap = contract.softCap();
  fundraiser.hardCap = contract.hardCap();

  let baseCurrencyAddress = contract.baseCurrency();
  let baseCurrencyId = baseCurrencyAddress.toHex();
  let baseCurrency = Erc20Token.load(baseCurrencyId);
  if (!baseCurrency) {
    let baseCurrency = new Erc20Token(baseCurrencyId);
    let erc20 = ERC20Contract.bind(baseCurrencyAddress);
    let wrongBaseCurrency = erc20.try_name().reverted || (erc20.try_symbol().reverted && erc20.try_decimals().reverted);
    if (wrongBaseCurrency) {
      // todo: this is not the best solution, should figure out something more generic
      return;
      // someone passed an incorrect base currency.
    }
    baseCurrency.address = baseCurrencyAddress;
    baseCurrency.name = erc20.name();
    baseCurrency.symbol = erc20.symbol();
    baseCurrency.decimals = erc20.decimals();
    baseCurrency.save();
  }

  fundraiser.baseCurrency = baseCurrencyId;

  fundraiser.tokenPrice = contract.tokenPrice();
  fundraiser.affiliateManager = affiliateManagerId;
  fundraiser.contributorRestrictions = contract.contributorRestrictions();
  fundraiser.fundraiserManager = contract.fundraiserManager();
  fundraiser.minter = contract.minter();
  fundraiser.contributionsLocked = contract.contributionsLocked();

  fundraiser.amountQualified = BigInt.fromI32(0);
  fundraiser.amountPending = BigInt.fromI32(0);
  fundraiser.amountRefunded = BigInt.fromI32(0);
  fundraiser.amountWithdrawn = BigInt.fromI32(0);
  fundraiser.status = "Running";
  let token = Token.load(fundraiser.token);
  fundraiser.search = fundraiser.label + " " + token.name + " " + token.symbol + " " + fundraiser.id + " " + token.id;
  fundraiser.save();
  token.currentFundraiser = fundraiserId;
  token.save();

  FundraiserTemplate.create(fundraiserAddress as Address);
}
