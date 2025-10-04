#!/bin/bash

# 部署 HushVote 到 Vercel 的脚本
# 使用方法: ./deploy-vercel.sh YOUR_VERCEL_TOKEN

if [ -z "$1" ]; then
    echo "❌ 请提供 Vercel Token"
    echo "使用方法: ./deploy-vercel.sh YOUR_VERCEL_TOKEN"
    echo ""
    echo "获取 Token 的步骤："
    echo "1. 访问 https://vercel.com/account/tokens"
    echo "2. 点击 'Create Token'"
    echo "3. 命名为 'HushVote Deployment'"
    echo "4. 选择 'Full Account' 权限"
    echo "5. 复制生成的 Token"
    exit 1
fi

echo "🚀 开始部署 HushVote 到 Vercel..."

# 设置 Token
export VERCEL_TOKEN=$1

# 部署到生产环境
echo "📦 正在部署到生产环境..."
npx vercel --prod --yes

echo "✅ 部署完成！"