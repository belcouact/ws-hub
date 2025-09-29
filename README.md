# 设备维修知识管理系统

基于Cloudflare免费服务构建的设备维修知识管理系统，旨在收集、整理和利用同事们的维修报告，通过AI辅助分析提供故障诊断和解决方案建议。

## 项目结构

```
repair-knowledge-system/
├── frontend/ # Vue 3 前端项目
│ ├── public/
│ ├── src/
│ │ ├── components/ # 公共组件
│ │ ├── views/ # 页面视图
│ │ ├── stores/ # Pinia状态管理
│ │ ├── utils/ # 工具函数
│ │ ├── types/ # TypeScript类型定义
│ │ └── assets/ # 静态资源
│ ├── package.json
│ └── vite.config.ts
│
├── backend/ # Workers 后端项目
│ ├── src/
│ │ ├── routes/ # API路由
│ │ ├── db/ # 数据库操作
│ │ ├── middleware/ # 中间件
│ │ ├── utils/ # 工具函数
│ │ └── ai/ # AI相关逻辑
│ ├── wrangler.toml # Workers配置
│ └── package.json
│
├── shared/ # 共享类型定义
│ └── types/
│
└── docs/ # 项目文档
├── api.md
└── deployment.md
```

## 技术栈

### 前端技术
- **核心框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI框架**: Element Plus (PC端) + Vant (移动端)
- **状态管理**: Pinia
- **富文本编辑**: TinyMCE (轻量级配置)
- **PWA支持**: Workbox

### 后端技术
- **运行环境**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **文件存储**: Cloudflare R2
- **缓存**: Cloudflare KV
- **ORM**: Drizzle ORM
- **AI服务**: GLM-4.5 API

### 开发工具
- **包管理**: pnpm
- **代码规范**: ESLint + Prettier + Husky
- **API文档**: OpenAPI 3.0
- **版本控制**: Git + GitHub

## 核心功能

1. **维修报告管理**
   - 创建、查看、编辑和删除维修报告
   - 报告包含设备名称、故障标签、故障类别、描述和附件

2. **故障标签系统**
   - 管理故障标签
   - 标签分类和颜色标记

3. **AI辅助分析**
   - 故障诊断建议
   - 解决方案推荐
   - 使用统计和限制

4. **用户管理**
   - 用户角色和权限控制
   - 查看者、编辑者和管理员角色

## 开发规范

- 使用TypeScript严格模式
- Vue 3 Composition API和`<script setup>`语法
- RESTful API设计
- 统一错误处理
- 响应式设计优先移动端