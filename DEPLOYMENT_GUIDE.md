# FHE Voting Platform - Deployment & Testing Guide

## 📋 Overview

This guide explains how to deploy and test the FHE Voting Platform. The platform can be deployed to:
- **Sepolia Testnet**: For UI demonstration (with mock FHE)
- **Zama Devnet**: For full FHE functionality
- **Local Hardhat**: For development and testing

## 🏗️ Architecture Comparison

| Network | FHE Support | Use Case | Status |
|---------|------------|----------|---------|
| **Sepolia** | Mock FHE only | UI Demo, Public Testing | ✅ Ready |
| **Zama Devnet** | Full FHE | Production Testing | ✅ Ready |
| **Local** | Mock FHE | Development | ✅ Ready |

## 📦 Prerequisites

1. **Install Dependencies**:
```bash
cd /Users/songsu/Desktop/zama/fhe-voting/contracts
npm install
```

2. **Setup Environment**:
```bash
cp .env.example .env
# Edit .env with your private key and API keys
```

## 🚀 Deployment Options

### Option 1: Deploy to Sepolia (Recommended for Demo)

**Note**: Sepolia deployment uses mock FHE values since Sepolia doesn't have native FHE support.

```bash
# Deploy contracts
cd contracts
npm run deploy:sepolia

# Expected output:
# - FHEBallot deployed to: 0x...
# - FHEQuadraticVoting deployed to: 0x...
```

### Option 2: Deploy to Zama Devnet (Full FHE)

```bash
# Deploy contracts with real FHE
cd contracts
npm run deploy:devnet

# This provides full FHE functionality
```

### Option 3: Local Development

```bash
# Start local node
npx hardhat node

# Deploy locally
npm run deploy:local
```

## 🎨 Frontend Configuration

1. **Configure Environment**:
```bash
cd ../frontend
cp .env.example .env
```

2. **Update .env with Contract Addresses**:
```env
VITE_FHE_BALLOT_ADDRESS=0x... # From deployment
VITE_FHE_QUADRATIC_VOTING_ADDRESS=0x... # From deployment
VITE_USE_MOCK_FHE=true # For Sepolia
```

3. **Start Frontend**:
```bash
npm install
npm run dev
# Access at http://localhost:3001
```

## 🧪 Testing the Platform

### 1. **Access the Frontend**
- Open http://localhost:3001
- Connect MetaMask to Sepolia network

### 2. **Test Voting Flow**
1. **Create Voting** (Admin):
   - Navigate to "Create Voting"
   - Fill in voting details
   - Submit transaction

2. **Cast Vote**:
   - Browse active votings
   - Select a voting
   - Submit encrypted vote
   - Note: On Sepolia, encryption is simulated

3. **View Results**:
   - After voting ends
   - Navigate to Results page
   - Decrypt and view tallies

### 3. **Test Quadratic Voting**
- Select quadratic voting option
- Allocate credits across options
- Submit weighted votes

## 🔍 Network Differences

### Sepolia Deployment
- ✅ Full UI functionality
- ✅ Transaction processing
- ⚠️ Mock FHE (no real encryption)
- ✅ Public accessibility
- ✅ Etherscan verification

### Zama Devnet Deployment
- ✅ Real FHE encryption
- ✅ Homomorphic operations
- ✅ Privacy preservation
- ⚠️ Limited to Zama network
- ⚠️ Requires Zama faucet tokens

## 📊 Current Status

| Component | Status | Network | URL |
|-----------|--------|---------|-----|
| **Smart Contracts** | ✅ Ready | Sepolia/Zama | - |
| **Frontend** | ✅ Running | Local | http://localhost:3001 |
| **FHE Integration** | ⚠️ Mock on Sepolia | Sepolia | - |
| **Sample Votings** | ✅ Created | All | - |

## 🛠️ Troubleshooting

### Issue: "FHE operations failing on Sepolia"
**Solution**: This is expected. Sepolia uses mock FHE. Deploy to Zama Devnet for real FHE.

### Issue: "Transaction failing"
**Solution**: 
- Check wallet balance
- Ensure correct network
- Verify gas settings

### Issue: "Frontend not connecting"
**Solution**:
- Update contract addresses in .env
- Check MetaMask network
- Clear browser cache

## 📝 Next Steps

1. **For Production Demo**:
   - Deploy to Sepolia ✅
   - Configure frontend ✅
   - Share public URL

2. **For FHE Testing**:
   - Deploy to Zama Devnet
   - Test encryption/decryption
   - Verify privacy preservation

3. **For Development**:
   - Use local Hardhat network
   - Run tests: `npm test`
   - Check coverage: `npm run coverage`

## 🔗 Resources

- **Frontend**: http://localhost:3001
- **Sepolia Explorer**: https://sepolia.etherscan.io
- **Zama Docs**: https://docs.zama.ai
- **Project Repo**: /Users/songsu/Desktop/zama/fhe-voting

## 📞 Support

For issues or questions:
1. Check this guide
2. Review contract logs
3. Inspect browser console
4. Contact development team

---

**Note**: This platform demonstrates privacy-preserving voting using FHE technology. Full FHE functionality requires deployment to Zama-compatible networks.