# 漫画人生 (Manga Life)

将你的照片变成漫画的 AI 创作工具。

基于 Convex 全栈框架构建，使用 GPT 图像模型将用户上传的照片转化为日式漫画风格的图像，
支持多种漫画风格（日常治愈风、暗黑剧情风等）、色彩模式和对话框文字生成。

## 技术栈

- **前端**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **后端**: [Convex](https://convex.dev/) — 实时数据库 + 服务端逻辑
- **认证**: [Convex Auth](https://labs.convex.dev/auth) — 邮箱/密码登录
- **AI**: OpenAI GPT 图像与文本模型

## 快速开始

```bash
npm install
npm run dev
```

开发服务器启动后访问 `http://localhost:5173`。

## 环境变量

复制 `.env.example` 为 `.env.local` 并填入配置：

```
CONVEX_DEPLOYMENT=
VITE_CONVEX_URL=
VITE_CONVEX_SITE_URL=
OPENAI_API_KEY=sk-...
```

## 项目结构

```
web/
├── src/
│   ├── components/   # 可复用 UI 组件
│   ├── pages/        # 页面组件
│   ├── hooks/        # 自定义 Hooks
│   └── lib/          # 工具函数与常量
├── convex/           # Convex 后端（schema、mutation、action）
└── public/           # 静态资源
```

## 许可证

[Apache 2.0](LICENSE.txt)
