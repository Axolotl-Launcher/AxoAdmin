# AxoAdmin

Axolotl 统一管理中心，独立于旧遥测 Dashboard，使用 Next.js、React、Tailwind CSS、shadcn/ui，最终部署到 Vercel。

## 本地开发

复制 .env.example 为 .env.local，并设置 AXOADMIN_MOCK_AUTH=true 后运行 pnpm dev。生产环境必须使用 Cloudflare Access JWT。

## 模块

- 工作台
- 遥测中心
- 赞助与权益
- CDK 管理
- API 运营
- 审计日志

Sponsor Gateway、CDK、权益账本和遥测数据仍由各自服务负责，AxoAdmin 通过服务端 API 进行聚合。