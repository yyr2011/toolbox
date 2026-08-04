"""自媒体类工具 API 路由."""

import re
import random
from datetime import datetime, date, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import get_conn, row_to_dict, rows_to_dicts

router = APIRouter(prefix="/api/media", tags=["media"])


# ==================== 标题生成器 ====================

class TitleRequest(BaseModel):
    topic: str
    keywords: str = ""
    style: str = "多种"  # 痛点 | 悬念 | 数字 | 对比 | 情感 | 多种


@router.post("/title-generator")
async def title_generator(req: TitleRequest):
    topic = req.topic.strip()
    if not topic:
        return {"error": "请输入话题"}

    keywords = [k.strip() for k in req.keywords.split("，") if k.strip()] if req.keywords else []
    kw = keywords[0] if keywords else topic
    kw2 = keywords[1] if len(keywords) > 1 else "干货"
    num = random.choice(["5", "7", "10", "3", "8"])

    templates = {
        "痛点": [
            f"{topic}做不好？这{num}个方法帮你少走弯路",
            f"为什么你的{topic}总是没效果？问题可能出在这里",
            f"90%的人{topic}都踩过的坑，你中了几个？",
            f"{topic}的3大误区，第2个几乎人人都犯",
            f"别再这样{topic}了！正确做法其实很简单",
        ],
        "悬念": [
            f"我靠{topic}实现了逆袭，方法竟然这么简单",
            f"看完这篇{topic}指南，我后悔没早点知道",
            f"{topic}背后的真相，可能和你想的完全不一样",
            f"做了{topic}才知道，原来之前的方法全错了",
            f"这个{topic}技巧，99%的人还不知道",
        ],
        "数字": [
            f"{num}个{topic}技巧，第{random.choice(['3','5','7'])}个最实用",
            f"关于{topic}的{num}个真相，最后一个最扎心",
            f"用{num}分钟搞懂{topic}，新手也能快速上手",
            f"{topic}入门：{num}步教你从零到精通",
            f"{num}天{topic}打卡计划，跟着做就对了",
        ],
        "对比": [
            f"同样是{topic}，为什么别人月入过万你却不行？",
            f"传统{topic} VS 新方式{topic}，差距到底在哪？",
            f"新手{topic}和老手{topic}的区别，看完就懂了",
            f"免费{topic}和付费{topic}到底差在哪？实测告诉你",
            f"{topic}：别人踩过的坑 VS 我踩过的坑",
        ],
        "情感": [
            f"从零开始{topic}，这是我走过最难也最值的路",
            f"感谢{topic}，让我重新找到了方向",
            f"给所有想入门{topic}的朋友的一封信",
            f"{topic}改变了我的人生，希望你也能试试",
            f"坚持{topic}的第100天，我悟出了这些道理",
        ],
        "多种": [
            f"{topic}完全指南：{kw}+{kw2}，一篇搞定所有问题",
            f"2025年{topic}怎么做？这份攻略帮你少走弯路",
            f"{num}个{topic}实用技巧，新手也能快速上手",
            f"为什么你的{topic}没效果？可能是这几个原因",
            f"{topic}入门到精通，只需记住这{num}点",
            f"看了这么多{topic}教程，这个方法最靠谱",
            f"从零开始做{topic}，我是这样一步步做起来的",
            f"{topic}避坑指南：这些错误千万别再犯了",
        ],
    }

    styles_to_gen = list(templates.keys()) if req.style == "多种" else [req.style]
    titles = []
    for s in styles_to_gen:
        titles.extend(random.sample(templates[s], min(3, len(templates[s]))))
    random.shuffle(titles)
    return {"titles": titles[:8]}


# ==================== 爆款结构拆解 ====================

class ArticleRequest(BaseModel):
    content: str


@router.post("/article-analysis")
async def article_analysis(req: ArticleRequest):
    content = req.content.strip()
    if not content:
        return {"error": "请输入文章内容"}

    paragraphs = [p.strip() for p in content.split("\n") if p.strip()]
    if not paragraphs:
        return {"error": "未检测到有效段落"}

    total = len(paragraphs)
    sections = []

    # 开头钩子 (前 1-2 段)
    hook_end = min(2, total)
    for i in range(hook_end):
        sections.append({
            "type": "hook",
            "label": "开头钩子",
            "index": i + 1,
            "content": paragraphs[i],
            "note": "吸引注意力，引发好奇或共鸣" if i == 0 else "建立问题场景，让读者代入",
        })

    # 主体内容
    body_end = max(hook_end, total - 2)
    for i in range(hook_end, body_end):
        note = "提供信息或解决方案"
        # 检测转折
        if any(w in paragraphs[i] for w in ["但是", "然而", "不过", "可是", "其实", "实际上"]):
            note = "转折点：制造反差，深化内容"
        elif any(w in paragraphs[i] for w in ["首先", "第一", "第一步", "1."]):
            note = "结构化展开：分点论述"
        elif any(w in paragraphs[i] for w in ["比如", "例如", "举个例子", "案例"]):
            note = "案例佐证：增强说服力"
        elif any(w in paragraphs[i] for w in ["数据", "%", "万", "亿"]):
            note = "数据支撑：用数字说话"
        sections.append({
            "type": "body",
            "label": "正文内容",
            "index": i + 1,
            "content": paragraphs[i],
            "note": note,
        })

    # 结尾号召 (最后 1-2 段)
    for i in range(body_end, total):
        note = "总结升华"
        if any(w in paragraphs[i] for w in ["关注", "点赞", "收藏", "转发", "评论", "留言", "分享"]):
            note = "行动号召：引导互动转化"
        sections.append({
            "type": "cta",
            "label": "结尾号召",
            "index": i + 1,
            "content": paragraphs[i],
            "note": note,
        })

    # 统计
    word_count = len(content.replace(" ", "").replace("\n", ""))
    stats = {
        "paragraphs": total,
        "word_count": word_count,
        "estimated_read_time": f"{max(1, word_count // 300)} 分钟",
        "has_hook": total >= 2,
        "has_cta": any(w in content for w in ["关注", "点赞", "收藏", "转发", "评论", "留言", "分享"]),
    }

    return {"sections": sections, "stats": stats}


# ==================== 多平台排版转换 ====================

class FormatConvertRequest(BaseModel):
    content: str
    platform: str  # wechat | zhihu | xiaohongshu | plain


@router.post("/format-convert")
async def format_convert(req: FormatConvertRequest):
    content = req.content.strip()
    if not content:
        return {"error": "请输入内容"}

    paragraphs = [p.strip() for p in content.split("\n") if p.strip()]
    result = ""

    if req.platform == "wechat":
        # 公众号：段落间空行，加粗标题
        for i, p in enumerate(paragraphs):
            if i == 0:
                result += f"<strong>{p}</strong>\n\n"
            else:
                result += f"{p}\n\n"
        result += "\n—— 欢迎关注，获取更多干货 ——"
    elif req.platform == "zhihu":
        # 知乎：去多余空行，保持简洁
        result = "\n\n".join(paragraphs)
    elif req.platform == "xiaohongshu":
        # 小红书：短段落 + emoji + 话题标签
        emojis = ["✨", "💡", "📌", "🔥", "👍", "💪", "🎯", "⭐"]
        tagged = []
        for i, p in enumerate(paragraphs):
            if i < len(paragraphs) - 1:
                tagged.append(f"{random.choice(emojis)} {p}")
            else:
                tagged.append(p)
        result = "\n\n".join(tagged)
        result += "\n\n#自媒体 #内容创作 #干货分享"
    elif req.platform == "plain":
        result = "\n".join(paragraphs)
    else:
        return {"error": "未知平台"}

    return {"result": result, "platform": req.platform}


# ==================== 配图关键词推荐 ====================

class ImageKeywordRequest(BaseModel):
    content: str


@router.post("/image-keywords")
async def image_keywords(req: ImageKeywordRequest):
    content = req.content.strip()
    if not content:
        return {"error": "请输入文案内容"}

    # 简单关键词提取：频率统计 + 场景推断
    # 停用词
    stopwords = set("的了是在我有和就不人都一个上也很到说要去你会着没有看好自己这那他她它们与及和或但是然而所以因为如果虽然然后而且并且"
                    "什么怎么为什么如何可以应该需要这个那个这些那些非常特别真的真的其实其实")
    # 清洗文本
    cleaned = re.sub(r"[^\u4e00-\u9fa5a-zA-Z0-9\s]", "", content)
    # 简单分词（按2-4字滑窗统计频率）
    freq = {}
    for length in [2, 3, 4]:
        for i in range(len(cleaned) - length + 1):
            word = cleaned[i:i + length]
            if word[0] in stopwords or word[-1] in stopwords:
                continue
            if re.match(r"^[\u4e00-\u9fa5]+$", word):
                freq[word] = freq.get(word, 0) + 1

    # 过滤子词重叠
    sorted_words = sorted(freq.items(), key=lambda x: -x[1])
    keywords = []
    seen = set()
    for word, count in sorted_words:
        if count < 2 and len(keywords) >= 5:
            break
        # 跳过已选词的子串
        is_sub = False
        for sw in seen:
            if word in sw or sw in word:
                if len(word) < len(sw):
                    is_sub = True
                    break
        if not is_sub:
            keywords.append(word)
            seen.add(word)
        if len(keywords) >= 10:
            break

    # 场景关键词
    scene_keywords = []
    if any(w in content for w in ["美食", "吃", "餐厅", "菜", "做饭", "食谱"]):
        scene_keywords.extend(["美食摄影", "食物特写", "餐桌摆盘", "暖色调"])
    if any(w in content for w in ["旅行", "旅游", "风景", "打卡", "出游"]):
        scene_keywords.extend(["旅行风景", "城市地标", "自然风光", "旅拍"])
    if any(w in content for w in ["办公", "工作", "职场", "效率", "会议"]):
        scene_keywords.extend(["办公场景", "桌面俯拍", "职场人物", "极简风格"])
    if any(w in content for w in ["产品", "商品", "购物", "推荐", "测评"]):
        scene_keywords.extend(["产品白底图", "场景实拍", "细节特写", "使用场景"])
    if any(w in content for w in ["人物", "穿搭", "美妆", "自拍"]):
        scene_keywords.extend(["人像摄影", "街拍风格", "自然光人像", "时尚穿搭"])

    # 通用补充
    if not scene_keywords:
        scene_keywords = ["极简背景", "高清素材", "扁平插画", "渐变色背景"]

    return {"content_keywords": keywords, "scene_keywords": scene_keywords}


# ==================== 敏感词检测 ====================

SENSITIVE_WORDS = [
    # 广告营销类
    "最", "第一", "顶级", "极品", "万能", "绝杀", "神器", "爆款", "销量冠军",
    "永久免费", "零风险", "包过", "稳赚", "日赚", "月入百万",
    # 绝对化用语
    "国家级", "世界级", "最高级", "最佳", "最新", "最先进", "最强", "最好",
    "最便宜", "最低价", "最优惠", "最值得", "最专业", "最权威",
    # 医疗保健类
    "治愈", "根除", "药到病除", "有效率", "疗效", "偏方", "祖传",
    # 金融类
    "保本", "保收益", "稳赚不赔", "零风险投资", "高回报", "快速致富",
    # 违规类
    "代购", "代开", "办证", "刷单", "水军", "代刷", "买卖账号",
]

SENSITIVE_SUGGESTIONS = {
    "最": "较为/比较", "第一": "领先/前列", "顶级": "优质/高级", "极品": "优质",
    "万能": "多功能/通用", "爆款": "热门/畅销", "神器": "利器/好物",
    "永久免费": "免费试用", "零风险": "低风险", "包过": "助力通过",
    "稳赚": "有机会盈利", "日赚": "有机会获得收益", "月入百万": "收入可观",
    "国家级": "行业级", "世界级": "国际水平", "最高级": "高级",
    "最佳": "优质/良好", "最新": "较新", "最先进": "先进",
    "最强": "强劲", "最好": "优良", "最便宜": "实惠/性价比高",
    "最低价": "优惠价", "最优惠": "实惠", "最专业": "专业",
    "最权威": "权威", "治愈": "改善/缓解", "根除": "改善",
    "药到病除": "有助于恢复", "疗效": "效果", "偏方": "传统方法",
    "保本": "稳健", "保收益": "有机会获得收益", "稳赚不赔": "有风险",
    "高回报": "有机会获得回报", "快速致富": "逐步提升收入",
}


class SensitiveCheckRequest(BaseModel):
    content: str


@router.post("/sensitive-check")
async def sensitive_check(req: SensitiveCheckRequest):
    content = req.content
    found = []
    for word in SENSITIVE_WORDS:
        start = 0
        while True:
            idx = content.find(word, start)
            if idx == -1:
                break
            found.append({
                "word": word,
                "position": idx,
                "context": content[max(0, idx - 5):idx + len(word) + 5],
                "suggestion": SENSITIVE_SUGGESTIONS.get(word, "建议修改表述"),
            })
            start = idx + len(word)

    found.sort(key=lambda x: x["position"])
    return {
        "found": found,
        "count": len(found),
        "is_safe": len(found) == 0,
        "summary": f"检测到 {len(found)} 个敏感词" if found else "未检测到敏感词，内容安全",
    }


# ==================== 内容排期日历 ====================

class ScheduleItemRequest(BaseModel):
    title: str
    platform: str = ""
    stage: str = "选题"  # 选题 | 写作 | 编辑 | 发布
    scheduled_date: str  # YYYY-MM-DD
    status: str = "pending"  # pending | in_progress | done
    note: str = ""


@router.get("/schedule")
async def get_schedule(month: Optional[str] = None):
    """获取排期列表，可按月份过滤 YYYY-MM"""
    conn = get_conn()
    if month:
        rows = conn.execute(
            "SELECT * FROM schedule_items WHERE scheduled_date LIKE ? ORDER BY scheduled_date",
            (f"{month}%",)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM schedule_items ORDER BY scheduled_date DESC").fetchall()
    conn.close()
    return {"items": rows_to_dicts(rows)}


@router.post("/schedule")
async def add_schedule(req: ScheduleItemRequest):
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO schedule_items (title, platform, stage, scheduled_date, status, note) VALUES (?,?,?,?,?,?)",
        (req.title, req.platform, req.stage, req.scheduled_date, req.status, req.note)
    )
    conn.commit()
    item_id = cur.lastrowid
    conn.close()
    return {"id": item_id, "message": "排期已添加"}


@router.put("/schedule/{item_id}")
async def update_schedule(item_id: int, req: ScheduleItemRequest):
    conn = get_conn()
    conn.execute(
        "UPDATE schedule_items SET title=?, platform=?, stage=?, scheduled_date=?, status=?, note=? WHERE id=?",
        (req.title, req.platform, req.stage, req.scheduled_date, req.status, req.note, item_id)
    )
    conn.commit()
    conn.close()
    return {"message": "排期已更新"}


@router.delete("/schedule/{item_id}")
async def delete_schedule(item_id: int):
    conn = get_conn()
    conn.execute("DELETE FROM schedule_items WHERE id=?", (item_id,))
    conn.commit()
    conn.close()
    return {"message": "排期已删除"}


# ==================== 多平台数据看板 ====================

class PlatformDataRequest(BaseModel):
    platform: str
    date: str  # YYYY-MM-DD
    views: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0


@router.get("/dashboard")
async def get_dashboard(days: int = 7):
    """获取最近 N 天的多平台数据汇总"""
    conn = get_conn()
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)

    rows = conn.execute(
        "SELECT * FROM platform_data WHERE date >= ? AND date <= ? ORDER BY date, platform",
        (start_date.isoformat(), end_date.isoformat())
    ).fetchall()

    # 如果没有数据，生成演示数据
    if not rows:
        platforms = ["公众号", "知乎", "小红书"]
        for d in range(days):
            cur_date = (start_date + timedelta(days=d)).isoformat()
            for p in platforms:
                base = random.randint(100, 5000)
                conn.execute(
                    "INSERT OR IGNORE INTO platform_data (platform, date, views, likes, comments, shares) VALUES (?,?,?,?,?,?)",
                    (p, cur_date, base, int(base * random.uniform(0.02, 0.1)),
                     int(base * random.uniform(0.005, 0.03)), int(base * random.uniform(0.01, 0.05)))
                )
        conn.commit()
        rows = conn.execute(
            "SELECT * FROM platform_data WHERE date >= ? AND date <= ? ORDER BY date, platform",
            (start_date.isoformat(), end_date.isoformat())
        ).fetchall()

    # 按平台分组
    by_platform = {}
    dates = sorted(set(r["date"] for r in rows))
    for r in rows:
        p = r["platform"]
        if p not in by_platform:
            by_platform[p] = {"dates": [], "views": [], "likes": [], "comments": [], "shares": []}
        by_platform[p]["dates"].append(r["date"])
        by_platform[p]["views"].append(r["views"])
        by_platform[p]["likes"].append(r["likes"])
        by_platform[p]["comments"].append(r["comments"])
        by_platform[p]["shares"].append(r["shares"])

    # 汇总统计
    total_views = sum(r["views"] for r in rows)
    total_likes = sum(r["likes"] for r in rows)
    total_comments = sum(r["comments"] for r in rows)
    total_shares = sum(r["shares"] for r in rows)

    conn.close()
    return {
        "dates": dates,
        "platforms": by_platform,
        "summary": {
            "total_views": total_views,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_shares": total_shares,
            "platform_count": len(by_platform),
            "days": days,
        },
    }


@router.post("/dashboard")
async def add_dashboard_data(req: PlatformDataRequest):
    conn = get_conn()
    conn.execute(
        "INSERT OR REPLACE INTO platform_data (platform, date, views, likes, comments, shares) VALUES (?,?,?,?,?,?)",
        (req.platform, req.date, req.views, req.likes, req.comments, req.shares)
    )
    conn.commit()
    conn.close()
    return {"message": "数据已录入"}
