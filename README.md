# Table Resize / 表格尺寸调整

[中文](#中文) | [English](#english)

Table Resize 允许在 Obsidian 的阅读模式和编辑模式中拖动表格边缘，调整列宽与行高，并保存每个表格的尺寸。

> 本项目未上架 Obsidian 社区插件市场，请使用手动安装。

## 功能

- 拖动列边缘调整列宽
- 拖动行边缘调整行高
- 阅读模式与编辑模式均可使用
- 根据表格结构和内容识别表格，并保存尺寸
- 设置页可调整显示与清理选项

## 安装

1. 从本仓库下载 `main.js`、`manifest.json` 和 `styles.css`。
2. 在 Vault 中创建目录 `.obsidian/plugins/table-resize/`。
3. 将三个文件放入该目录。
4. 重启 Obsidian，在“设置 > 第三方插件”中启用 `Table Resize`。

## 开发

```bash
npm install
npm run dev
npm run build
```

## English

Table Resize adds draggable column and row handles to Obsidian tables. It works in both reading and editing modes and stores dimensions for each table.

### Features

- Drag column edges to resize columns
- Drag row edges to resize rows
- Works in reading and editing modes
- Recognizes tables by structure and content
- Persists table dimensions
- Settings for display and cleanup options

### Installation

1. Download `main.js`, `manifest.json`, and `styles.css`.
2. Create `.obsidian/plugins/table-resize/` in your vault.
3. Put the three files in that directory.
4. Restart Obsidian and enable `Table Resize` under **Settings > Community plugins**.

This plugin is not currently listed in the Obsidian Community Plugins directory.
