#!/bin/bash

# Doc Processing Solution - Azure Deployment Script
# This script deploys the entire solution to Azure using Bicep templates

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
RESOURCE_GROUP=""
LOCATION="westus2"
AIFOUNDRY_LOCATION="swedencentral"
NAME_PREFIX="aiinvest"
ENVIRONMENT="dev"
DEBUG="false"

# Function to show usage
usage() {
    echo "Usage: $0 -g <resource-group> [options]"
    echo ""
    echo "Required:"
    echo "  -g, --resource-group       Azure Resource Group name"
    echo ""
    echo "Optional:"
    echo "  -l, --location             Azure location (default: westus2)"
    echo "  -p, --name-prefix          Resource name prefix (default: aiinvest)"
    echo "  -e, --environment          Environment name (default: dev)"
    echo "  -a, --ai-foundry-location  AI Foundry location (default: swedencentral)"
    echo "  -d, --debug                Enable debug logging"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -g my-resource-group"
    echo "  $0 -g my-rg -l westus2 -p myapp -e dev"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -p|--name-prefix)
            NAME_PREFIX="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -a|--ai-foundry-location)
            AIFOUNDRY_LOCATION="$2"
            shift 2
            ;;
        -d|--debug)
            DEBUG="true"
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option $1"
            usage
            ;;
    esac
done

# Validate required parameters
if [ -z "$RESOURCE_GROUP" ]; then
    echo -e "${RED}❌ Error: Resource Group is required${NC}"
    usage
fi

echo -e "${BLUE}🚀 Starting Azure deployment for Doc Processing Solution${NC}"
echo -e "${BLUE}Resource Group: $RESOURCE_GROUP${NC}"
echo -e "${BLUE}Location: $LOCATION${NC}"
echo -e "${BLUE}Name Prefix: $NAME_PREFIX${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo ""

# Get script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}📁 Moving to Project Root: $PROJECT_ROOT${NC}"
echo ""
# Change to project root
cd "$PROJECT_ROOT"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in to Azure
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️ You are not logged in to Azure. Please login first.${NC}"
    az login
fi

echo -e "${YELLOW}📋 Current Azure subscription:${NC}"
az account show --output table

# Ask for confirmation
echo ""
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Create resource group if it doesn't exist
echo -e "${BLUE}🏗️ Ensuring resource group exists...${NC}"
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${YELLOW}Creating resource group: $RESOURCE_GROUP${NC}"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --tags Environment="$ENVIRONMENT" Project="docproc-solution-accelerator"
    echo -e "${GREEN}✅ Resource group created${NC}"
else
    echo -e "${GREEN}✅ Resource group already exists${NC}"
fi

# Deploy full infrastructure using main Bicep template
echo -e "${BLUE}🏗️ Deploying Azure infrastructure...${NC}"
DEPLOYMENT_NAME="ai-invest-sample-$(date +%s)"

optional_args=()

if [ "$DEBUG" == "true" ]; then
  optional_args+=("--debug")
fi

az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "infra/bicep/main.bicep" \
    --parameters \
        namePrefix="$NAME_PREFIX" \
        environment="$ENVIRONMENT" \
        location="$LOCATION" \
        aiFoundryLocation="$AIFOUNDRY_LOCATION" \
    --name "$DEPLOYMENT_NAME" \
    --output table ${optional_args[@]}


if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
    
    # Get deployment outputs
    ACR_LOGIN_SERVER=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.containerRegistryLoginServer.value" \
        --output tsv)
    
    CONTAINER_APPS_ENV_ID=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.containerAppsEnvironmentId.value" \
        --output tsv)

    # APP_CONFIG_STORE_ENDPOINT=$(az deployment group show \
    #     --resource-group "$RESOURCE_GROUP" \
    #     --name "$DEPLOYMENT_NAME" \
    #     --query "properties.outputs.appConfigStoreEndpoint.value" \
    #     --output tsv)
        
    echo -e "${GREEN}Container Registry: $ACR_LOGIN_SERVER${NC}"
    echo -e "${GREEN}Container Apps Environment: $(basename "$CONTAINER_APPS_ENV_ID")${NC}"
    # echo -e "${GREEN}App Configuration Store Endpoint: $APP_CONFIG_STORE_ENDPOINT${NC}"
    echo ""
    
else
    echo -e "${RED}❌ Infrastructure deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Azure infrastructure deployment completed!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Build and push your Docker images to the Container Registry:"
echo "   ./infra/2-build-and-push-images.sh -r $ACR_LOGIN_SERVER"
echo ""
echo "2. Deploy your applications using pushed images:"
echo "   ./infra/3-deploy-apps.sh -g $RESOURCE_GROUP"
echo ""