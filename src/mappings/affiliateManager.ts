import { store } from "@graphprotocol/graph-ts"
import { AffiliateManager, Affiliate } from '../../generated/schema';
import { AffiliateAddedOrUpdated, AffiliateRemoved } from "../../generated/templates/AffiliateManager/AffiliateManager";

export function affiliateAddedOrUpdated(event: AffiliateAddedOrUpdated): void {
  let params = event.params;
  let affiliateManagerId = event.address.toHex();
  let affiliateManager = AffiliateManager.load(affiliateManagerId);
  let affiliateId = affiliateManagerId + '_' + params.account.toHex();
  let affiliate = Affiliate.load(affiliateId);
  if (affiliate == null) {
    affiliate = new Affiliate(affiliateId);
  }
  affiliate.address = params.account;
  affiliate.referral = params.referral;
  affiliate.percentage = params.percentage;
  affiliate.affiliateManager = affiliateManagerId;
  affiliate.fundraiser = affiliateManager.fundraiser;
  affiliate.save();
}

export function affiliateRemoved(event: AffiliateRemoved): void {
  let params = event.params;
  let affiliateManagerId = event.address.toHex();
  let affiliateId = affiliateManagerId + '_' + params.account.toHex();
  store.remove('Affiliate', affiliateId);
}
