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

Cloudflare Access 必须保护管理页面及 `/api/admin/*`，并使用 GitHub `axolotl-launcher` 组织策略。仅公开公告读取路径 `/api/public/announcements` 需要允许启动器匿名读取，不能被 Access 或 Vercel 登录页拦截；不要放开管理 API。Access 到 Vercel 的请求必须保留 `CF-Access-Jwt-Assertion`；应用会在服务端校验 issuer、audience 和 RS256 签名。仓库不包含 Vercel、Cloudflare 或 Verso 的远端配置，平台配置需要在对应控制台完成。

未认证请求返回 401，缺少生产配置或上游不可达返回 503；这些状态不会再伪装成“已认证”。应用内 `/login` 仅作为兼容入口，会直接重定向到受 Cloudflare Access 保护的 `/`；由 Cloudflare edge 生成动态登录 challenge、处理身份提供商回调并写入授权 Cookie，应用不猜测或伪造 `/cdn-cgi/access/login`。退出使用 Cloudflare Team 域名的 logout endpoint。

## Supabase 与公告

在本地环境及部署平台配置以下变量：

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL。
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`：供浏览器和 SSR 客户端使用的公开密钥。
- `SUPABASE_SERVICE_ROLE_KEY`：公告 API 专用的服务端密钥，禁止添加 `NEXT_PUBLIC_` 前缀或提交到仓库。
- `SUPABASE_URL`：可选的服务端 URL 覆盖；未配置时使用公开项目 URL。两种密钥必须属于同一项目。

目标数据库需要先应用 `supabase/migrations/20260905130646_create_announcements.sql`。公开密钥不能代替 service-role 密钥；公告表不允许浏览器直接访问，管理操作仍通过 Cloudflare Access 保护的服务端 API 完成。

Supabase registry 生成的 `lib/client.ts`、`lib/server.ts` 可用于浏览器及 SSR 客户端。`lib/middleware.ts` 是未启用的 Supabase Auth 示例，不应直接注册为项目中间件：本项目使用 Cloudflare Access，而不是 Supabase Auth 登录。

公告管理页使用列表查看公告，通过弹窗创建或编辑内容，并通过行操作菜单发布、撤回、归档或删除。保存现有公告不会自动改变发布状态。

正文支持 Markdown，可点击“预览正文”实时查看渲染结果。`lib/announcements/markdown.ts` 对齐启动器 `packages/utils/parse.ts` 的 Markdown 配置和 HTML 安全过滤规则，升级时应同步检查；管理面板只预览正文，不承诺复刻启动器主题、字体与弹窗尺寸。Popup 展示纯文本摘要，点击“查看公告”后才显示完整 Markdown 正文。

“可选外部链接按钮”的文字和 URL 应同时填写；均留空时不增加额外按钮。启动器仍自带关闭和查看公告操作。启动器开发者设置提供启动弹窗和 Popup 两种本地样式预览，可切换是否包含额外链接按钮，不改变真实公告的缓存及已读状态。此入口仅用于开发者调试，不加入首次使用引导。

Vercel 项目 Settings → Environment Variables 中应为 Production 配置公告变量及现有 Access 变量，按需另配 Preview；修改后重新部署。生产环境不要启用 `AXOADMIN_MOCK_AUTH`。启动器若不使用默认公告域名，可在启动器构建环境配置 `VITE_AXO_ANNOUNCEMENTS_URL`；它不是 AxoAdmin 的 Vercel 环境变量。

## 模块

- 工作台
- 遥测中心
- 赞助与权益
- CDK 管理
- API 运营
- 审计日志

Sponsor Gateway、CDK、权益账本和遥测数据仍由各自服务负责，AxoAdmin 通过服务端 API 进行聚合。当前未接入的模块会显示明确空状态，不使用伪造数据。
