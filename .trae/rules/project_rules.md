# 设备维修知识管理系统 - 项目规则

## 项目概述

本项目是一个基于Cloudflare免费服务构建的设备维修知识管理系统，旨在收集、整理和利用同事们的维修报告，通过AI辅助分析提供故障诊断和解决方案建议。系统支持PC和移动设备访问，服务于不超过100人的团队。

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

## 项目结构
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

## 开发规范

### 代码规范
1. **TypeScript**: 所有代码必须使用TypeScript，启用严格模式
2. **组件规范**:
   - 使用Vue 3 Composition API和`<script setup>`语法
   - 组件名使用PascalCase
   - Props必须定义类型
3. **样式规范**:
   - 使用SCSS预处理器
   - 采用BEM命名规范
   - 响应式设计优先移动端
4. **API规范**:
   - RESTful API设计
   - 统一错误处理
   - 请求/响应使用JSON格式

### Git工作流
1. **分支策略**:
   - `main`: 主分支，始终保持可部署状态
   - `develop`: 开发分支
   - `feature/*`: 功能分支
   - `hotfix/*`: 紧急修复分支
2. **提交规范**:
- type: feat, fix, docs, style, refactor, test, chore
- scope: 模块名称
- subject: 简短描述
3. **代码审查**:
- 所有PR必须经过至少一人审查
- 必须通过所有自动化测试
- 代码符合项目规范

### 测试规范
1. **单元测试**: 核心功能必须包含单元测试
2. **集成测试**: API端点必须有集成测试
3. **E2E测试**: 关键用户流程必须有端到端测试
4. **测试覆盖率**: 核心模块测试覆盖率不低于80%

## 数据库设计

### 核心表结构

```sql
-- 维修报告表
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  reporter TEXT NOT NULL,
  device_name TEXT NOT NULL,
  fault_tags TEXT,                      -- JSON数组
  duration_minutes INTEGER,
  fault_category TEXT NOT NULL,
  description TEXT,                     -- 合并描述/原因/解决方案
  attachments TEXT,                     -- JSON数组
  is_deleted INTEGER DEFAULT 0,
  author_id INTEGER
);

-- 故障标签表
CREATE TABLE fault_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#409EFF',
  usage_count INTEGER DEFAULT 0
);

-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'viewer',           -- viewer/editor/admin
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- AI分析记录表
CREATE TABLE ai_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  analysis_type TEXT NOT NULL,          -- 'summary'/'diagnosis'/'solution'
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (report_id) REFERENCES reports(id)
);

-- 用户AI使用记录表
CREATE TABLE ai_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  usage_date TEXT NOT NULL,             -- YYYY-MM-DD
  request_count INTEGER DEFAULT 0,
  last_request_at TEXT,
  UNIQUE(user_id, usage_date)
);

API设计规范
通用规范
基础URL: /api/v1
认证方式: Bearer Token (JWT)
响应格式:
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2023-07-20T12:00:00Z"
}

错误处理:
400: 请求参数错误
401: 未授权
403: 权限不足
404: 资源不存在
429: 请求过于频繁
500: 服务器内部错误
核心API端点
方法        路径         描述            权限
GET	    /reports	    获取报告列表	viewer
POST	/reports	    创建新报告	    editor
GET	    /reports/:id	获取报告详情	viewer
PUT	    /reports/:id	更新报告	editor
DELETE	/reports/:id	删除报告	admin
GET	    /tags	        获取标签列表	viewer
POST	/ai/diagnose	AI故障诊断	viewer
GET	    /ai/usage	    获取AI使用统计	admin
