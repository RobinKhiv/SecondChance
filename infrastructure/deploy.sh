#!/bin/bash
set -e

# Set AWS Profile
export AWS_PROFILE=secondchance

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi
source .env

# Check if environment is provided
ENVIRONMENT=${1:-prod}
STACK_NAME="secondchance-${ENVIRONMENT}"
REGION="us-east-1"

echo "🚀 Deploying SecondChance to ${ENVIRONMENT}..."

# Package backend code
echo "📦 Packaging backend code..."
cd ../backend
zip -r ../infrastructure/backend.zip ./* -x "node_modules/*"
cd ../infrastructure

# Create or update Supabase credentials in Secrets Manager
echo "🔐 Setting up Supabase credentials..."
aws secretsmanager create-secret \
    --name "${STACK_NAME}-supabase-credentials" \
    --secret-string "{\"url\":\"${SUPABASE_URL}\",\"key\":\"${SUPABASE_ANON_KEY}\"}" \
    --region ${REGION} 2>/dev/null || \
aws secretsmanager update-secret \
    --secret-id "${STACK_NAME}-supabase-credentials" \
    --secret-string "{\"url\":\"${SUPABASE_URL}\",\"key\":\"${SUPABASE_ANON_KEY}\"}" \
    --region ${REGION}

# Deploy CloudFormation stack
echo "🏗️ Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file template.yml \
    --stack-name ${STACK_NAME} \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        Stage=${ENVIRONMENT} \
        DomainName="secondchance.robinkhiv.com" \
        SupabaseURL="${SUPABASE_URL}" \
        SupabaseAnonKey="${SUPABASE_ANON_KEY}" \
    --region ${REGION}

# Get outputs
echo "📝 Getting stack outputs..."
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
    --output text \
    --region ${REGION})

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name ${STACK_NAME} \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomain`].OutputValue' \
    --output text \
    --region ${REGION})

# Clean up
echo "🧹 Cleaning up..."
rm backend.zip

echo "✅ Deployment complete!"
echo "API Endpoint: ${API_ENDPOINT}"
echo "CloudFront Domain: ${CLOUDFRONT_DOMAIN}" 