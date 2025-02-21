#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MarketplaceStack } from '../lib/marketplace-stack';

const app = new cdk.App();
new MarketplaceStack(app, 'MarketplaceStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
}); 