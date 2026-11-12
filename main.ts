import { Plugin, PluginSettingTab, App, Setting, MarkdownView } from 'obsidian';

interface TableResizePluginSettings {
    enableColumnResize: boolean;
    enableRowResize: boolean;
    tableStyles: { [key: string]: { columns: number[], rows: number[] } };
}

const DEFAULT_SETTINGS: TableResizePluginSettings = {
    enableColumnResize: true,
    enableRowResize: true,
    tableStyles: {}
}

export default class TableResizePlugin extends Plugin {
    settings: TableResizePluginSettings;
    private dragOverlay: HTMLElement | null = null;
    private activeTable: HTMLElement | null = null;
    private resizeHandle: HTMLElement | null = null;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new TableResizeSettingTab(this.app, this));
        
        // 创建拖动覆盖层
        this.createDragOverlay();
        
        // 使用事件委托处理表格交互
        this.registerDomEvent(document, 'mouseover', this.handleTableHover.bind(this));
        this.registerDomEvent(document, 'mousedown', this.handleResizeStart.bind(this));
        
        // 监听编辑器切换事件，确保样式在模式切换时保持一致
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.applyStylesToAllTables();
            })
        );
        
        // 初始应用样式到所有表格
        this.applyStylesToAllTables();
    }
    
    // 添加新方法来应用样式到所有可见表格
    private applyStylesToAllTables() {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            this.applyTableStyles(table as HTMLElement);
        });
    }

    private createDragOverlay() {
        this.dragOverlay = document.createElement('div');
        this.dragOverlay.className = 'table-resize-overlay';
        this.dragOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 9999;
            display: none;
        `;
        document.body.appendChild(this.dragOverlay);
    }

    private handleTableHover(event: MouseEvent) {
        if (!this.settings.enableColumnResize && !this.settings.enableRowResize) return;
        
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        // 同时支持预览模式和编辑模式
        if (!activeView) return;

        const target = event.target as HTMLElement;
        const table = target.closest('table');
        if (!table) return;

        if (this.activeTable !== table) {
            this.activeTable = table;
            this.setupTableHandles(table);
        }
    }

    private setupTableHandles(table: HTMLElement) {
        // 清除现有的调整手柄
        table.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
        
        // 应用保存的样式
        this.applyTableStyles(table);
        
        if (this.settings.enableColumnResize) {
            this.setupColumnHandles(table);
        }
        if (this.settings.enableRowResize) {
            this.setupRowHandles(table);
        }
    }

    // 添加新方法来应用保存的表格样式
    private applyTableStyles(table: HTMLElement) {
        const tableId = this.getTableId(table);
        const savedStyles = this.settings.tableStyles[tableId];
        
        if (!savedStyles) return;
        
        // 应用列宽
        if (savedStyles.columns && savedStyles.columns.length > 0) {
            table.querySelectorAll('tr:first-child > *').forEach((cell, index) => {
                if (index < savedStyles.columns.length) {
                    (cell as HTMLElement).style.width = `${savedStyles.columns[index]}px`;
                }
            });
            
            // 对所有行应用相同的列宽
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td, th');
                cells.forEach((cell, index) => {
                    if (index < savedStyles.columns.length) {
                        (cell as HTMLElement).style.width = `${savedStyles.columns[index]}px`;
                    }
                });
            });
        }
        
        // 应用行高
        if (savedStyles.rows && savedStyles.rows.length > 0) {
            table.querySelectorAll('tr').forEach((row, index) => {
                if (index < savedStyles.rows.length) {
                    (row as HTMLElement).style.height = `${savedStyles.rows[index]}px`;
                }
            });
        }
    }

 
	private setupColumnHandles(table: HTMLElement) {
        const rows = table.querySelectorAll('tr');
        
        // 获取表格的列数（基于第一行）
        const firstRow = table.querySelector('tr:first-child');
        if (!firstRow) return;
        
        const columnCount = firstRow.children.length;
        
        // 为每一行的每个单元格添加调整手柄（除了最后一列）
        rows.forEach((row) => {
            const cells = row.querySelectorAll('td, th');
            cells.forEach((cell, index) => {
                //if (index === columnCount - 1) return; // 跳过最后一列
                
                const handle = document.createElement('div');
                handle.className = 'resize-handle column-handle';
                handle.dataset.index = index.toString();
                handle.style.cssText = `
                    position: absolute;
                    top: 0;
                    right: -3px;
                    width: 6px;
                    height: 100%;
                    cursor: col-resize;
                    background: transparent;
                    transition: background-color 0.2s;
                    z-index: 1000;
                `;
                
                // 设置单元格为相对定位，确保手柄正确定位
                (cell as HTMLElement).style.position = 'relative';
                
                // 添加悬停效果
                handle.addEventListener('mouseenter', () => {
                    handle.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
                });
                handle.addEventListener('mouseleave', () => {
                    handle.style.backgroundColor = 'transparent';
                });
                
                cell.appendChild(handle);
            });
        });
    }
	private setupRowHandles(table: HTMLElement) {
		const rows = table.querySelectorAll('tr');
		rows.forEach((row, index) => {
			//if (index === rows.length - 1) return; // 跳过最后一行

			const handle = document.createElement('div');
			handle.className = 'resize-handle row-handle';
			handle.dataset.index = index.toString();
			handle.style.cssText = `
                position: absolute;
                left: 0;
                bottom: -3px;
                width: 100%;
                height: 6px;
                cursor: row-resize;
                background: transparent;
                transition: background-color 0.2s;
                z-index: 1000;
            `;

			// 设置行为相对定位
			(row as HTMLElement).style.position = 'relative';

			// 添加悬停效果
			handle.addEventListener('mouseenter', () => {
				handle.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
			});
			handle.addEventListener('mouseleave', () => {
				handle.style.backgroundColor = 'transparent';
			});

			row.appendChild(handle);
		});
	}

	private handleResizeStart(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.matches('.resize-handle')) return;

		event.preventDefault(); // 防止文本选择
		event.stopPropagation(); // 阻止事件冒泡

		this.resizeHandle = target;
		const isColumn = target.classList.contains('column-handle');
		const table = target.closest('table');
		if (!table) return;

		const index = parseInt(target.dataset.index || '0');
		const cells = isColumn
			? Array.from(table.querySelectorAll(`tr > *:nth-child(${index + 1})`))
			: Array.from(table.querySelectorAll('tr')).slice(index, index + 1);

		let startPos = isColumn ? event.clientX : event.clientY;
		let startSize = isColumn
			? (cells[0] as HTMLElement).offsetWidth
			: (cells[0] as HTMLElement).offsetHeight;

		// 创建调整处理函数并立即绑定事件
		const handleResize = (e: MouseEvent) => {
			const currentPos = isColumn ? e.clientX : e.clientY;
			const delta = currentPos - startPos;
			const newSize = Math.max(20, startSize + delta);

			if (isColumn) {
				// 调整同一列的所有单元格宽度
				cells.forEach(element => {
					(element as HTMLElement).style.width = `${newSize}px`;
				});
				
				// 同时调整表头单元格宽度，确保所有行的列宽一致
				const headerCell = table.querySelector(`tr:first-child > *:nth-child(${index + 1})`);
				if (headerCell) {
					(headerCell as HTMLElement).style.width = `${newSize}px`;
				}
			} else {
				cells.forEach(element => {
					(element as HTMLElement).style.height = `${newSize}px`;
				});
			}
		};

		const cleanup = () => {
			this.dragOverlay!.style.display = 'none';
			document.removeEventListener('mousemove', handleResize);

			if (this.resizeHandle && this.activeTable) {
				this.saveTableStyles(this.activeTable);
			}

			this.resizeHandle = null;
		};

		this.dragOverlay!.style.display = 'block';
		document.addEventListener('mousemove', handleResize);
		document.addEventListener('mouseup', cleanup, { once: true });
	}
    private saveTableStyles(table: HTMLElement) {
        const tableId = this.getTableId(table);
        const styles = { columns: [] as number[], rows: [] as number[] };

        // 保存列宽
        table.querySelectorAll('tr:first-child > *').forEach((cell) => {
            styles.columns.push((cell as HTMLElement).offsetWidth);
        });

        // 保存行高
        table.querySelectorAll('tr').forEach((row) => {
            styles.rows.push((row as HTMLElement).offsetHeight);
        });

        this.settings.tableStyles[tableId] = styles;
        this.saveSettings();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    private getTableId(table: HTMLElement): string {
        // 生成表格的唯一标识，使用更可靠的方法
        const tableContent = table.textContent || '';
        const tableElement = table as HTMLTableElement;
        
        // 获取表格的行列结构信息，用于更准确地识别表格
        const rowCount = tableElement.rows.length;
        const colCount = tableElement.rows[0]?.cells.length || 0;
        
        // 获取表格内容的哈希值
        const contentHash = this.hashString(tableContent);
        
        // 使用表格结构和内容哈希作为标识
        return `table-${rowCount}x${colCount}-${contentHash}`;
    }
    
    // 添加辅助方法计算字符串哈希值
    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(16);
    }
}

class TableResizeSettingTab extends PluginSettingTab {
    plugin: TableResizePlugin;

    constructor(app: App, plugin: TableResizePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('启用列宽调整')
            .setDesc('允许通过拖动来调整表格列的宽度')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableColumnResize)
                .onChange(async (value) => {
                    this.plugin.settings.enableColumnResize = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('启用行高调整')
            .setDesc('允许通过拖动来调整表格行的高度')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableRowResize)
                .onChange(async (value) => {
                    this.plugin.settings.enableRowResize = value;
                    await this.plugin.saveSettings();
                }));
    }
}
