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
- `UPDATE_SERVER_ORIGIN`、`UPDATE_SERVER_ADMIN_TOKEN`：Axolotl Update Server 的 origin 与 `/api/admin/*` 管理令牌；令牌仅作为 Vercel Secret 配置，不要与 Sponsor Gateway 令牌复用。上游不可达时可另配 `UPDATE_SERVER_DIRECT_ORIGIN` 直连入口。

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

## 更新服务

“更新”模块通过 `app/api/admin/updates/**` 代理 Axolotl Update Server（`https://update.axlmc.org`），并复用 Cloudflare Access 会话做鉴权。代理层使用显式路径白名单（`lib/api/update-server.ts`），未列出的路径与查询参数一律拒绝；版本号强制校验为规范化 SemVer。

浏览器只访问 AxoAdmin 同源的 `/api/admin/updates/*`；Next.js 在服务端请求 Update Server，所以不需要为 Update Server 开放 CORS，也不会把管理令牌发送给浏览器。公开读取不携带令牌；统计、强制更新、删除/清理、撤销/恢复及发布审计注入 `UPDATE_SERVER_ADMIN_TOKEN`。operator 从登录会话取得，不接受浏览器传入，成功后同时写平台审计。

代理保留 Go 服务的具体错误码和请求 ID，区分统计繁忙、查询超时、版本忙、清单缺失和已重新发布的版本。204 是合法无更新结果；写操作不自动向另一个 origin 重试，以免网络超时后重复执行。统计代理超时为 30 秒，普通请求 15 秒。

版本列表和详情支持启用/关闭强制更新、撤销/恢复、删除版本；删除需输入版本号。操作成功后先读回最新数据，再关闭确认框；刷新失败时只重试读取。清理未完成的版本在当前浏览器会话保留重试入口，调用独立 `POST /api/admin/versions/:version/cleanup`，不会重复 DELETE 已重新发布的版本。

制品采用元数据发布，安装包由独立分发服务器提供，不再按最近三个版本清理元数据。面板显示 target_platforms，支持通用 macOS 更新器。旧上传接口已退役，不提供手动上传入口。

“更新 → 数据分析”接入统计 API v2 的 dashboard、meta、status、breakdown 和 requests。提供 1 小时～14 天范围、白名单精确筛选、指标趋势、状态与延迟百分位、客户端/来源分布、明细分页和 JSON 导出。仅统计 `/latest` 和 `/api/*`，不是下载服务器流量；独立 IP 不是用户人数；GeoIP 未配置时展示未知，历史缺失的字节/耗时也不补成零。切换筛选、范围或分析页签时使用对应区域的 skeleton，不继续展示上次查询的数据；失败显示错误与重试入口。

新版无筛选预设范围使用 `scheduled=true` 读取 Update Server 每小时维护的统计快照，标明生成时间和更新延迟；响应 window 为实际统计时间范围。首次准备中返回 202 时，每 5 秒自动重新读取，最多等待十分钟，切换查询会取消等待；等待期间显示 skeleton，不把准备中当成空数据。点击分布下钻沿用已显示快照的范围，精确筛选和请求明细仍实时查询。需要服务端迁移 `00006_stats_snapshots` 并升级后端。

Update Server 需运行统计 API v2 并应用 `00003_statistics`。14 天游标分页和安全清理需包含后续修复 `3b5f6c5`，无需增加数据库迁移。其他赞助、遥测和身份认证服务不受本次更新影响。

统计维度修正需与新版 Update Server 一同部署，并执行 `db migrate`、`analytics reclassify` 重算历史 UA 字典。应用统一显示“应用”，版本保留于客户端版本；来源区分应用直接访问/其他直接访问，响应格式区分无响应体，错误区分无错误与 HTTP 错误，下载目录参数在其他接口上显示不适用。API 使用 `@application`、`@direct`、`@empty`、`@none`、`@http_error`、`@not_applicable`、`@not_provided` 作为对应维度的计算值，点击分布行将原值传给后端精确筛选。没有采集的旧数据仍显示未知，不能从空值反推系统或默认布尔值。

## 模块

- 工作台
- 遥测中心
- 更新
- 赞助与权益
- CDK 管理
- API 运营
- 审计日志

Sponsor Gateway、CDK、权益账本和遥测数据仍由各自服务负责，AxoAdmin 通过服务端 API 进行聚合。当前未接入的模块会显示明确空状态，不使用伪造数据。
