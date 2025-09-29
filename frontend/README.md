# 设备维修知识管理系统 - 前端

## 项目简介

这是一个基于Vue 3 + TypeScript的设备维修知识管理系统前端项目，旨在收集、整理和利用同事们的维修报告，通过AI辅助分析提供故障诊断和解决方案建议。系统支持PC和移动设备访问，服务于不超过100人的团队。

## 技术栈

- **核心框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI框架**: Element Plus (PC端) + Vant (移动端)
- **状态管理**: Pinia
- **富文本编辑**: TinyMCE (轻量级配置)
- **PWA支持**: Workbox
- **HTTP请求**: Axios
- **日期处理**: Day.js
- **CSS预处理**: SCSS

## 项目结构

```
frontend/
├── public/                    # 静态资源
├── src/
│   ├── api/                  # API服务模块
│   │   └── index.ts          # API接口封装
│   ├── assets/               # 资源文件
│   ├── components/           # 公共组件
│   │   ├── AppLayout.vue     # PC端布局组件
│   │   ├── MobileLayout.vue  # 移动端布局组件
│   │   ├── ResponsiveLayout.vue # 响应式布局组件
│   │   ├── MobileNav.vue     # 移动端导航组件
│   │   ├── FileUploader.vue  # 文件上传组件
│   │   └── RichEditor.vue    # 富文本编辑器组件
│   ├── router/               # 路由配置
│   │   └── index.ts          # 路由定义和守卫
│   ├── stores/               # 状态管理
│   │   ├── user.ts           # 用户状态
│   │   ├── report.ts         # 维修报告状态
│   │   ├── tag.ts            # 故障标签状态
│   │   └── ai.ts             # AI状态
│   ├── styles/               # 样式文件
│   │   └── global.scss       # 全局样式
│   ├── types/                # 类型定义
│   │   └── index.ts          # TypeScript类型定义
│   ├── utils/                # 工具函数
│   │   ├── date.ts           # 日期处理工具
│   │   └── api.ts            # API请求工具
│   ├── views/                # 页面视图
│   │   ├── Home.vue          # 首页
│   │   ├── Reports.vue       # 维修报告列表
│   │   ├── ReportDetail.vue  # 维修报告详情
│   │   ├── CreateReport.vue  # 创建维修报告
│   │   ├── EditReport.vue    # 编辑维修报告
│   │   ├── AIDiagnose.vue    # AI诊断
│   │   ├── Tags.vue          # 故障标签管理
│   │   ├── Profile.vue       # 个人中心
│   │   ├── Login.vue         # 登录
│   │   ├── Register.vue      # 注册
│   │   └── NotFound.vue      # 404页面
│   ├── App.vue               # 根组件
│   └── main.ts               # 应用入口
├── index.html                # HTML模板
├── package.json              # 项目依赖
├── tsconfig.json             # TypeScript配置
├── vite.config.ts            # Vite配置
└── README.md                 # 项目说明
```

## 开发指南

### 环境要求

- Node.js >= 16
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 开发环境运行

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

### 代码检查

```bash
pnpm lint
```

### 代码格式化

```bash
pnpm format
```

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

## 功能特性

### 核心功能

1. **维修报告管理**
   - 创建、查看、编辑、删除维修报告
   - 支持富文本编辑和附件上传
   - 按设备名称、故障类别、标签等条件筛选
   - 分页浏览报告列表

2. **故障标签管理**
   - 创建、编辑、删除故障标签
   - 标签颜色自定义
   - 标签使用统计

3. **AI辅助诊断**
   - 基于设备名称和故障描述进行AI诊断
   - 提供置信度、诊断结果、可能原因和解决方案
   - AI使用统计

4. **用户管理**
   - 用户登录、注册
   - 个人信息管理
   - 密码修改
   - 角色权限控制（viewer/editor/admin）

### 响应式设计

- PC端使用Element Plus组件库
- 移动端使用Vant组件库
- 自适应布局，支持各种屏幕尺寸
- PWA支持，可安装到桌面

## 部署说明

### 开发环境

开发环境默认运行在`http://localhost:3000`，API请求会代理到`http://localhost:8787`。

### 生产环境

生产环境构建后的文件位于`dist`目录，可以部署到任何静态文件服务器。

### 环境变量

创建`.env`文件配置环境变量：

```
VITE_API_BASE_URL=/api
VITE_APP_TITLE=设备维修知识管理系统
```

## 常见问题

### 1. 如何添加新的页面？

1. 在`src/views`目录下创建新的Vue组件
2. 在`src/router/index.ts`中添加路由配置
3. 在导航组件中添加导航链接

### 2. 如何添加新的API接口？

1. 在`src/types/index.ts`中定义请求和响应类型
2. 在`src/api/index.ts`中添加API方法
3. 在对应的store中调用API方法

### 3. 如何添加新的状态管理？

1. 在`src/stores`目录下创建新的store文件
2. 使用Pinia定义状态、getters和actions
3. 在组件中使用`useXxxStore()`引入store

## 许可证

MIT License