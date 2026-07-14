# 全站共享导航设计

## 目标

让 AI Know 的所有页面通过同一个 Hugo partial 输出顶部导航，彻底删除旧 checkbox 导航、内联点击逻辑和静态页面内复制的导航 HTML，同时保持现有 URL、内容和功能不变。

## 已确认的根因

- Hugo 页面使用 `layouts/partials/nav.html`，但 `static/search/index.html` 和 `static/kb/write.html` 各自复制了导航 HTML。
- 线上 `/kb/` 和 `/kb/blog/` 仍使用已废弃的 checkbox 导航，而 `site-nav.css` 已删除对应的 `:checked` 展开规则。
- `static/` 文件由 Hugo 原样复制，不能调用 partial，因此修改 `nav.html` 无法覆盖这些页面。
- 本地 `public/` 中可能保留已无对应源码的历史文件；未清理的构建会把旧导航继续带入部署产物。

## 架构

### 单一 HTML 模板

`layouts/partials/nav.html` 是顶部导航 HTML 的唯一来源。所有需要顶部导航的页面必须由 Hugo layout 渲染，并调用该 partial。导航项、当前页面状态、按钮语义和可访问性属性均在该文件维护。

### 单一行为模块

`static/assets/js/mobile-nav.js` 是导航交互的唯一来源。它负责：

- 点击按钮切换 `.open` 状态；
- 同步 `aria-expanded`；
- 按 Escape 关闭；
- 点击导航链接后关闭；
- 跨越桌面断点时清理移动端状态。

模板中不允许使用导航相关的内联 `onclick`，也不再使用 checkbox/label 技巧。

### 单一样式模块

`static/assets/css/site-nav.css` 是顶部导航样式的唯一来源。移动端默认隐藏链接区，通过 `.site-nav-links.open` 展开。桌面端保持现有横向导航体验。

### 静态页面迁移

- 将搜索页从 `static/search/index.html` 迁移为 Hugo content/layout，继续输出 `/search/`。
- 将论坛写作页从 `static/kb/write.html` 迁移为 Hugo content/layout，继续输出 `/kb/write.html`。
- 将知识库和论坛索引的本地可恢复内容迁入 Hugo 管理；若某个线上页面的完整源码只存在于历史产物，则以本地历史产物为迁移输入，保留其业务脚本和页面主体，只替换页面外壳。
- 删除或停止发布对应的静态 HTML 源，避免同一路径存在两个生产者。

现有未提交的“逛逛 GitHub”、统计脚本和其他内容改动必须保留，不得被回滚或覆盖。

## 构建与旧产物处理

正式验证使用干净的临时输出目录，不依赖现有 `public/`。部署构建必须清理目标目录或使用新的原子构建目录，防止已删除源码的旧页面残留。

## 测试策略

先增加失败的构建产物审计测试，再修改生产代码。测试至少验证：

- 代表性路径 `/`、`/search/`、`/kb/`、`/kb/write.html` 均由 Hugo 构建成功；
- 每个 HTML 页面至多包含一个 `.site-nav`；
- 使用顶部导航的页面包含统一的菜单按钮、链接容器和 `mobile-nav.js`；
- 构建产物中不存在 `site-nav-toggle` checkbox、导航内联 `onclick` 或复制的旧导航结构；
- 导航链接集合由共享 partial 统一输出。

浏览器回归在 390×844 视口验证：首页、搜索、知识库和论坛页均能展开与关闭菜单，`aria-expanded` 与可见状态一致；桌面视口验证导航保持可见。

## 非目标

- 不重新设计导航视觉风格。
- 不改变页面 URL、正文内容、搜索逻辑或论坛发布接口。
- 不重构侧边栏导航；本次只统一顶部 `.site-nav`。
- 不在本次工作中部署到阿里云，除非用户另行授权并提供可用连接。

## 完成标准

干净 Hugo 构建通过，产物审计测试通过，四条代表性路径的移动端交互验证通过，且源代码中不再存在第二份顶部导航 HTML。
