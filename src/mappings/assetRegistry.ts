import { Token } from '../../generated/schema';
import { AssetAdded, NavUpdated, KyaUpdated } from '../../generated/AssetRegistry/AssetRegistry';

export function handleAssetAdded(event: AssetAdded): void {
  let params = event.params;
  let token = Token.load(params.src20.toHex());
  token.kyaHash = params.kyaHash;
  token.kyaUrl = params.kyaUrl;
  token.nav = params.nav.toI32();
}

export function handleNavUpdated(event: NavUpdated): void {
  let params = event.params;
  let token = Token.load(params.src20.toHex());
  token.nav = params.nav.toI32();
}

export function handleKyaUpdated(event: KyaUpdated): void {
  let params = event.params;
  let token = Token.load(params.src20.toHex());
  token.kyaHash = params.kyaHash;
  token.kyaUrl = params.kyaUrl;
}

