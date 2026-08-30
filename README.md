# AxoAdmin

Axolotl 统一管理中心，独立于旧遥测 Dashboard，使用 Next.js、React、Tailwind CSS、shadcn/ui，部署到 Vercel，并由 Cloudflare Access 保护。

## 本地开发

复制 `.env.example` 为 `.env.local`，仅在本地开发时设置 `AXOADMIN_MOCK_AUTH=true`，然后运行 `pnpm dev`。Mock 身份只在 `NODE_ENV=development` 且该变量显式为 `true` 时生效。

## 生产部署

在 Vercel 项目环境变量中设置：

- `CF_ACCESS_TEAM_DOMAIN`：Cloudflare Zero Trust team domain（不含协议和 `.cloudflareaccess.com`）。
- `CF_ACCESS_AUDIENCE`：Cloudflare Access 应用的唯一 audience/tag。
- `SPONSOR_GATEWAY_ORIGIN`、`TELEMETRY_ADMIN_ORIGIN`：服务端可访问的上游 origin，分别提供 `/api/admin/*` 对应 API。
- `SPONSOR_GATEWAY_ADMIN_TOKEN`：Sponsor Gateway 管理令牌，仅作为 Vercel Secret 配置，不提交代码或 `.env.local`。

Cloudflare Access 应用必须覆盖 `admin.axlmc.org/*`，包括 `/api/*`，并使用 GitHub `axolotl-launcher` 组织策略。Access 到 Vercel 的请求必须保留 `CF-Access-Jwt-Assertion`；应用会在服务端校验 issuer、audience 和 RS256 签名。仓库不包含 Vercel、Cloudflare 或 Verso 的远端配置，平台配置需要在对应控制台完成。

未认证请求返回 401，缺少生产配置或上游不可达返回 503；这些状态不会再伪装成“已认证”。应用内 `/login` 通过 `/api/auth/login` 启动登录：服务端请求当前域名的受保护入口并捕获 Cloudflare Access 动态 challenge；如果入口返回 Vercel 200，则明确报告 Access 未接管，而不是把用户带回根目录。退出使用 Cloudflare Team 域名的 logout endpoint。

## 模块

- 工作台
- 遥测中心
- 赞助与权益
- CDK 管理
- API 运营
- 审计日志

Sponsor Gateway、CDK、权益账本和遥测数据仍由各自服务负责，AxoAdmin 通过服务端 API 进行聚合。当前未接入的模块会显示明确空状态，不使用伪造数据。
