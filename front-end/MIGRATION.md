# Next.js 迁移完成

项目已成功从 Vite + React 迁移到 Next.js。

## 主要变更

### 1. 项目结构
- ✅ 创建了 `app/` 目录（Next.js App Router）
- ✅ 迁移了所有组件到 `src/` 目录
- ✅ 迁移了公共资源到 `public/` 目录
- ✅ 更新了全局样式到 `app/globals.css`

### 2. 配置文件
- ✅ 更新了 `package.json`：移除了 Vite 相关依赖，添加了 Next.js
- ✅ 创建了 `next.config.js`
- ✅ 更新了 `tsconfig.json` 以适配 Next.js
- ✅ 更新了 `tailwind.config.ts`
- ✅ 创建了 `postcss.config.js`
- ✅ 更新了 `components.json`

### 3. 路由迁移
- ✅ 从 `wouter` 迁移到 Next.js App Router
- ✅ 首页：`app/page.tsx`
- ✅ 404 页面：`app/not-found.tsx`
- ✅ 根布局：`app/layout.tsx`

### 4. 组件更新
- ✅ `Layout.tsx`：更新为使用 Next.js `Link` 和 `usePathname`
- ✅ `ThemeContext.tsx`：添加了 `"use client"` 指令
- ✅ 所有需要客户端交互的组件都已标记为客户端组件

### 5. 依赖变更
- ✅ 移除了：`vite`, `@vitejs/plugin-react`, `wouter`, `esbuild` 等
- ✅ 添加了：`next`
- ✅ 保留了所有 UI 组件和工具库

## 下一步

1. **安装依赖**：
   ```bash
   pnpm install
   ```

2. **运行开发服务器**：
   ```bash
   pnpm dev
   ```

3. **构建生产版本**：
   ```bash
   pnpm build
   ```

4. **启动生产服务器**：
   ```bash
   pnpm start
   ```

## 注意事项

- 所有页面组件需要使用 `"use client"` 如果它们使用了 React hooks 或浏览器 API
- 静态资源应该放在 `public/` 目录下
- API 路由可以创建在 `app/api/` 目录下
- 服务器组件默认，客户端组件需要明确标记

## 待清理文件（可选）

以下文件可以删除，因为它们不再需要：
- `vite.config.ts`
- `client/` 目录（如果确认所有文件已迁移）
- `server/index.ts`（如果不再需要 Express 服务器）
- `patches/wouter@3.7.1.patch`（wouter 已移除）

