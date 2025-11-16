# 运行说明（Windows cmd）

本文件说明如何在本地运行和构建本项目（UFCT_frontend - 学术网络可视化前端）。内容以 Windows cmd 为主，同时给出 PowerShell / Unix 的备选命令。

## 前提条件

- Node.js（建议 14+ 或 16+）已安装（包含 npm）
- 推荐安装 Git（用于获取仓库及子模块）
- 推荐使用 VS Code 编辑器

在命令行中检查 Node 与 npm：

Windows cmd:
```cmd
node -v
npm -v
```

PowerShell / Unix:
```bash
node -v
npm -v
```

## 获取代码（如果尚未）

在合适的目录下 clone 仓库：

Windows cmd / PowerShell / bash:
```cmd
git clone https://github.com/YangRuakaka/UFCT_frontend.git
cd UFCT_frontend\ufct
```

## 安装依赖

使用 npm 安装项目依赖：

Windows cmd:
```cmd
npm install
```

PowerShell / bash:
```bash
npm install
```

## 配置环境变量（可选）

项目使用 `VUE_APP_API_URL` 来指定后端 API 基础地址。可以通过 `.env` 文件或在命令行临时设置。

- 使用 .env 文件（推荐）
  在项目根（`ufct/`）下创建 `.env.local` 或 `.env`，示例：
  ```text
  VUE_APP_API_URL=http://localhost:5000/api
  ```

- 临时在 Windows cmd 中运行（只对当前命令有效）
  ```cmd
  set VUE_APP_API_URL=http://localhost:5000/api
  npm run serve
  ```

- 临时在 PowerShell 中运行：
  ```powershell
  $env:VUE_APP_API_URL = "http://localhost:5000/api"
  npm run serve
  ```

> 注意：如果没有后端服务，本项目有集成的模拟数据，因此可以正常演示大多数功能。

## 启动开发服务器（热重载）

Windows cmd:
```cmd
npm run serve
```

PowerShell / bash:
```bash
npm run serve
```

默认会在 http://localhost:8080 （或终端输出的端口）启动。打开浏览器访问并验证页面。

## 构建生产包

Windows cmd:
```cmd
npm run build
```

构建完成后，产物会输出到 `dist/` 目录，可直接部署到静态服务器或 CDN。

## 代码检查 / Lint

项目包含 ESLint（若 package.json 已配置）：

Windows cmd:
```cmd
npm run lint
```

如果需要格式化代码，可使用 Prettier（如配置）：
```cmd
npm run format
```

## 常见问题与排查

1. 端口被占用
   - 如果 `npm run serve` 报端口占用，修改命令或关闭占用进程。

2. API 请求 CORS 错误
   - 本地开发时如果后端未配置 CORS，会出现跨域错误。可以：
     - 在后端启用 CORS
     - 使用代理（在 `vue.config.js` 中配置 devServer.proxy）

3. 环境变量未生效
   - 确认 `.env` 文件放在项目根并重启 `npm run serve`。
   - Windows cmd 设置变量时请使用 `set`，PowerShell 使用 `$env:`。

4. 运行后页面缺少数据 / 空白
   - 检查浏览器控制台错误（F12）
   - 如果与 API 相关，检查 `VUE_APP_API_URL` 是否正确指向后端或是否使用模拟数据

5. 构建失败或依赖错误
   - 删除 `node_modules` 与 lock 文件后重装：
     ```cmd
     rd /s /q node_modules
     del package-lock.json
     npm install
     ```

## 项目结构（简要）

- `src/` - 源码
  - `components/` - Vue 组件
  - `views/` - 页面（路由入口）
  - `utils/` - 工具函数与渲染模块
  - `services/` - 后端 API 封装（`api.js`）
  - `styles/` - 全局样式
  - `config/` - 配置（如优化预设）
- `public/` - 公共静态文件

## 开发建议

- 在开发时避免在生产代码中留下 `console.log`。
- 测试脚本与示例应放在 `tests/` 或 `examples/` 目录，而不是 `src/`。
- 如需调试复杂的 D3 绘图，建议在浏览器控制台查看 SVG 元素和数据。

## 额外说明

- 我已在仓库中清理了一些开发时遗留的 `console.log` 与测试示例（如将 `apiResponseTest.js`、`dataComparisonExample.js` 从 `src/utils` 中删除），以保持 `src/` 的整洁。

---

如果你希望我把 README 写回到 `README.md`（覆盖）或放到其它路径（例如 `docs/RUNNING.md`），告诉我我会调整并提交。需要的话我也可以添加调试/部署脚本示例（Dockerfile、Nginx 配置）。
