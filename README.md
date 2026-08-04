# 多面手工具箱

基于 Python + FastAPI 的常用小工具合集，前端基于原型界面改造，已实现全部 22 个工具的后端功能并完成对接。

## 技术栈

- **后端**: Python 3.10+ / FastAPI / SQLite
- **前端**: 原生 HTML + CSS + JavaScript（无框架依赖）
- **依赖**: fastapi, uvicorn, qrcode, Pillow, croniter, python-multipart

## 快速启动

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动服务
python main.py
# 或: uvicorn main:app --host 0.0.0.0 --port 8000

# 3. 打开浏览器
# 访问 http://localhost:8000
```

## 工具清单

### 自媒体（7 件）
| 编号 | 工具 | 说明 |
|------|------|------|
| M-01 | 标题生成器 | 输入话题+关键词，多风格标题生成 |
| M-02 | 爆款结构拆解 | 分析文章结构，标注钩子/正文/号召 |
| M-03 | 多平台排版转换 | 适配公众号/知乎/小红书排版 |
| M-04 | 配图关键词推荐 | 提取内容关键词+场景搜索词 |
| M-05 | 敏感词检测 | 扫描违规词+替换建议 |
| M-06 | 内容排期日历 | 选题到发布的排期管理 |
| M-07 | 多平台数据看板 | 多平台数据汇总+趋势图 |

### 软件开发（8 件）
| 编号 | 工具 | 说明 |
|------|------|------|
| D-01 | JSON 格式化/校验 | 格式化+错误定位 |
| D-02 | 正则表达式测试器 | 实时匹配+分组高亮 |
| D-03 | 时间戳转换 | 时间戳⇄日期互转 |
| D-04 | Base64/URL 编解码 | 6种编解码操作 |
| D-05 | 颜色格式转换 | HEX/RGB/HSL互转+预览 |
| D-06 | Diff 对比工具 | 并排/统一格式对比 |
| D-07 | Cron 表达式解析 | 人话解释+下次触发预测 |
| D-08 | UUID/随机数据生成 | UUID+密码+假数据 |

### 个人效率提升（7 件）
| 编号 | 工具 | 说明 |
|------|------|------|
| P-01 | 番茄钟计时器 | 25分钟专注+统计 |
| P-02 | 待办清单 | 优先级+完成归档 |
| P-03 | 习惯打卡 | 连续天数+月度统计 |
| P-04 | 闪念笔记 | 快速记录+标签 |
| P-05 | 单位换算器 | 7大类单位互转 |
| P-06 | 密码生成器 | 自定义长度+字符类型 |
| P-07 | 二维码生成器 | 自定义颜色+尺寸+下载 |

## API 接口

所有接口前缀 `/api`，POST 请求体为 JSON 格式。

- `GET /api/health` - 健康检查
- `POST /api/dev/*` - 软件开发类工具
- `POST /api/media/*` - 自媒体类工具
- `POST /api/productivity/*` - 效率提升类工具
- `GET/POST/PUT/DELETE /api/productivity/todos` - 待办 CRUD
- `GET/POST/DELETE /api/productivity/habits` - 习惯 CRUD
- `GET/POST/DELETE /api/productivity/notes` - 笔记 CRUD
- `GET/POST/PUT/DELETE /api/media/schedule` - 排期 CRUD
- `GET/POST /api/media/dashboard` - 数据看板

## 项目结构

```
toolbox/
├── main.py              # FastAPI 入口
├── database.py          # SQLite 数据库
├── requirements.txt     # 依赖
├── routers/
│   ├── dev.py           # 软件开发工具 API
│   ├── media.py         # 自媒体工具 API
│   └── productivity.py  # 效率提升工具 API
├── static/
│   ├── index.html       # 前端页面
│   └── app.js           # 前端逻辑
└── toolbox.db           # SQLite 数据库（自动创建）
```
