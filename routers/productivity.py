"""个人效率提升类工具 API 路由."""

import io
import base64
import random
import string
from datetime import datetime, date, timedelta
from typing import Optional

import qrcode
from fastapi import APIRouter
from pydantic import BaseModel

from database import get_conn, rows_to_dicts

router = APIRouter(prefix="/api/productivity", tags=["productivity"])


# ==================== 番茄钟计时器 ====================

class PomodoroRequest(BaseModel):
    action: str  # start | complete | stats
    task: str = ""
    duration: int = 25
    session_id: Optional[int] = None


@router.post("/pomodoro")
async def pomodoro(req: PomodoroRequest):
    conn = get_conn()
    if req.action == "start":
        cur = conn.execute(
            "INSERT INTO pomodoro_sessions (task, duration, completed, started_at) VALUES (?, ?, 0, ?)",
            (req.task, req.duration, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        )
        conn.commit()
        session_id = cur.lastrowid
        conn.close()
        return {"session_id": session_id, "message": "番茄钟已开始", "duration": req.duration}

    elif req.action == "complete":
        if not req.session_id:
            conn.close()
            return {"error": "缺少 session_id"}
        conn.execute(
            "UPDATE pomodoro_sessions SET completed=1, finished_at=? WHERE id=?",
            (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), req.session_id)
        )
        conn.commit()
        conn.close()
        return {"message": "番茄钟已完成 🍅", "session_id": req.session_id}

    elif req.action == "stats":
        today = date.today().isoformat()
        total = conn.execute("SELECT COUNT(*) as c FROM pomodoro_sessions WHERE completed=1").fetchone()["c"]
        today_count = conn.execute(
            "SELECT COUNT(*) as c FROM pomodoro_sessions WHERE completed=1 AND date(started_at)=?", (today,)
        ).fetchone()["c"]
        total_minutes = conn.execute(
            "SELECT COALESCE(SUM(duration),0) as s FROM pomodoro_sessions WHERE completed=1"
        ).fetchone()["s"]

        # 最近7天趋势
        trend = []
        for i in range(6, -1, -1):
            d = (date.today() - timedelta(days=i)).isoformat()
            count = conn.execute(
                "SELECT COUNT(*) as c FROM pomodoro_sessions WHERE completed=1 AND date(started_at)=?", (d,)
            ).fetchone()["c"]
            trend.append({"date": d, "count": count})

        recent = conn.execute(
            "SELECT * FROM pomodoro_sessions ORDER BY started_at DESC LIMIT 10"
        ).fetchall()
        conn.close()
        return {
            "total_sessions": total,
            "today_sessions": today_count,
            "total_minutes": total_minutes,
            "trend": trend,
            "recent": rows_to_dicts(recent),
        }

    conn.close()
    return {"error": "未知操作"}


# ==================== 待办清单 ====================

class TodoRequest(BaseModel):
    title: str
    priority: str = "normal"  # high | normal | low
    due_date: Optional[str] = None


@router.get("/todos")
async def get_todos():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM todos ORDER BY completed ASC, created_at DESC").fetchall()
    conn.close()
    return {"todos": rows_to_dicts(rows)}


@router.post("/todos")
async def add_todo(req: TodoRequest):
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO todos (title, priority, due_date) VALUES (?,?,?)",
        (req.title, req.priority, req.due_date)
    )
    conn.commit()
    conn.close()
    return {"id": cur.lastrowid, "message": "待办已添加"}


@router.put("/todos/{todo_id}")
async def update_todo(todo_id: int, req: TodoRequest):
    conn = get_conn()
    conn.execute(
        "UPDATE todos SET title=?, priority=?, due_date=? WHERE id=?",
        (req.title, req.priority, req.due_date, todo_id)
    )
    conn.commit()
    conn.close()
    return {"message": "待办已更新"}


@router.put("/todos/{todo_id}/toggle")
async def toggle_todo(todo_id: int):
    conn = get_conn()
    row = conn.execute("SELECT completed FROM todos WHERE id=?", (todo_id,)).fetchone()
    if not row:
        conn.close()
        return {"error": "待办不存在"}
    new_val = 0 if row["completed"] else 1
    conn.execute("UPDATE todos SET completed=? WHERE id=?", (new_val, todo_id))
    conn.commit()
    conn.close()
    return {"id": todo_id, "completed": new_val}


@router.delete("/todos/{todo_id}")
async def delete_todo(todo_id: int):
    conn = get_conn()
    conn.execute("DELETE FROM todos WHERE id=?", (todo_id,))
    conn.commit()
    conn.close()
    return {"message": "待办已删除"}


# ==================== 习惯打卡 ====================

class HabitRequest(BaseModel):
    name: str
    color: str = "#4C7A57"


@router.get("/habits")
async def get_habits():
    conn = get_conn()
    habits = conn.execute("SELECT * FROM habits ORDER BY created_at DESC").fetchall()
    result = []
    today = date.today().isoformat()
    for h in habits:
        h_dict = dict(h)
        # 连续天数
        streak = 0
        check_date = today
        while True:
            exists = conn.execute(
                "SELECT 1 FROM habit_checkins WHERE habit_id=? AND check_date=?", (h["id"], check_date)
            ).fetchone()
            if exists:
                streak += 1
                d = datetime.strptime(check_date, "%Y-%m-%d").date() - timedelta(days=1)
                check_date = d.isoformat()
            else:
                break
        # 今日是否已打卡
        checked_today = conn.execute(
            "SELECT 1 FROM habit_checkins WHERE habit_id=? AND check_date=?", (h["id"], today)
        ).fetchone() is not None
        # 总打卡天数
        total_days = conn.execute(
            "SELECT COUNT(*) as c FROM habit_checkins WHERE habit_id=?", (h["id"],)
        ).fetchone()["c"]
        # 最近30天打卡记录
        checkins = conn.execute(
            "SELECT check_date FROM habit_checkins WHERE habit_id=? AND check_date >= ? ORDER BY check_date",
            (h["id"], (date.today() - timedelta(days=30)).isoformat())
        ).fetchall()
        h_dict["streak"] = streak
        h_dict["checked_today"] = checked_today
        h_dict["total_days"] = total_days
        h_dict["recent_checkins"] = [c["check_date"] for c in checkins]
        result.append(h_dict)
    conn.close()
    return {"habits": result}


@router.post("/habits")
async def add_habit(req: HabitRequest):
    conn = get_conn()
    cur = conn.execute("INSERT INTO habits (name, color) VALUES (?,?)", (req.name, req.color))
    conn.commit()
    conn.close()
    return {"id": cur.lastrowid, "message": "习惯已创建"}


@router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: int):
    conn = get_conn()
    conn.execute("DELETE FROM habit_checkins WHERE habit_id=?", (habit_id,))
    conn.execute("DELETE FROM habits WHERE id=?", (habit_id,))
    conn.commit()
    conn.close()
    return {"message": "习惯已删除"}


@router.post("/habits/{habit_id}/checkin")
async def habit_checkin(habit_id: int):
    today = date.today().isoformat()
    conn = get_conn()
    existing = conn.execute(
        "SELECT 1 FROM habit_checkins WHERE habit_id=? AND check_date=?", (habit_id, today)
    ).fetchone()
    if existing:
        conn.execute("DELETE FROM habit_checkins WHERE habit_id=? AND check_date=?", (habit_id, today))
        conn.commit()
        conn.close()
        return {"checked": False, "message": "已取消今日打卡"}
    else:
        conn.execute("INSERT INTO habit_checkins (habit_id, check_date) VALUES (?,?)", (habit_id, today))
        conn.commit()
        conn.close()
        return {"checked": True, "message": "今日打卡成功！"}


# ==================== 闪念笔记 ====================

class NoteRequest(BaseModel):
    content: str
    tag: str = ""


@router.get("/notes")
async def get_notes(tag: Optional[str] = None):
    conn = get_conn()
    if tag:
        rows = conn.execute("SELECT * FROM notes WHERE tag=? ORDER BY created_at DESC", (tag,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM notes ORDER BY created_at DESC").fetchall()
    conn.close()
    return {"notes": rows_to_dicts(rows)}


@router.post("/notes")
async def add_note(req: NoteRequest):
    conn = get_conn()
    cur = conn.execute("INSERT INTO notes (content, tag) VALUES (?,?)", (req.content, req.tag))
    conn.commit()
    conn.close()
    return {"id": cur.lastrowid, "message": "笔记已保存"}


@router.delete("/notes/{note_id}")
async def delete_note(note_id: int):
    conn = get_conn()
    conn.execute("DELETE FROM notes WHERE id=?", (note_id,))
    conn.commit()
    conn.close()
    return {"message": "笔记已删除"}


# ==================== 单位换算器 ====================

# 换算基准表（所有单位转成基准单位）
UNIT_TABLES = {
    "长度": {
        "base": "米",
        "units": {
            "千米": 1000, "米": 1, "分米": 0.1, "厘米": 0.01, "毫米": 0.001,
            "微米": 1e-6, "英里": 1609.344, "码": 0.9144, "英尺": 0.3048, "英寸": 0.0254,
            "里": 500, "丈": 3.333, "尺": 0.3333, "寸": 0.03333,
        }
    },
    "重量": {
        "base": "千克",
        "units": {
            "吨": 1000, "千克": 1, "克": 0.001, "毫克": 1e-6,
            "磅": 0.453592, "盎司": 0.0283495, "斤": 0.5, "两": 0.05, "钱": 0.005,
        }
    },
    "温度": {
        "base": "摄氏度",
        "units": {"摄氏度": "c", "华氏度": "f", "开尔文": "k"}
    },
    "面积": {
        "base": "平方米",
        "units": {
            "平方千米": 1e6, "公顷": 10000, "平方米": 1, "平方分米": 0.01,
            "平方厘米": 0.0001, "亩": 666.667, "英亩": 4046.86, "平方英尺": 0.092903, "平方英寸": 0.00064516,
        }
    },
    "体积": {
        "base": "升",
        "units": {
            "立方米": 1000, "升": 1, "毫升": 0.001, "加仑(美)": 3.78541,
            "品脱(美)": 0.473176, "立方英寸": 0.0163871, "立方英尺": 28.3168,
        }
    },
    "速度": {
        "base": "米/秒",
        "units": {
            "米/秒": 1, "千米/时": 0.277778, "英里/时": 0.44704, "节": 0.514444,
        }
    },
    "数据存储": {
        "base": "字节",
        "units": {
            "比特": 0.125, "字节": 1, "KB": 1024, "MB": 1048576,
            "GB": 1073741824, "TB": 1099511627776, "PB": 1125899906842624,
        }
    },
}


class UnitConvertRequest(BaseModel):
    category: str
    value: float
    from_unit: str
    to_unit: str


@router.post("/unit-convert")
async def unit_convert(req: UnitConvertRequest):
    cat = req.category
    if cat not in UNIT_TABLES:
        return {"error": f"不支持分类: {cat}"}

    table = UNIT_TABLES[cat]
    units = table["units"]

    if req.from_unit not in units or req.to_unit not in units:
        return {"error": "不支持的单位"}

    if cat == "温度":
        # 温度特殊处理
        val = req.value
        # 先转摄氏度
        if req.from_unit == "摄氏度":
            c = val
        elif req.from_unit == "华氏度":
            c = (val - 32) * 5 / 9
        else:  # 开尔文
            c = val - 273.15
        # 再从摄氏度转目标
        if req.to_unit == "摄氏度":
            result = c
        elif req.to_unit == "华氏度":
            result = c * 9 / 5 + 32
        else:  # 开尔文
            result = c + 273.15
    else:
        # 通用：转基准再转目标
        base_val = req.value * units[req.from_unit]
        result = base_val / units[req.to_unit]

    # 格式化结果
    if abs(result) >= 1000000 or (abs(result) < 0.001 and result != 0):
        result_str = f"{result:.6e}"
    else:
        result_str = f"{result:.6f}".rstrip("0").rstrip(".")

    return {
        "result": result,
        "result_str": result_str,
        "expression": f"{req.value} {req.from_unit} = {result_str} {req.to_unit}",
    }


@router.get("/unit-categories")
async def get_unit_categories():
    cats = {}
    for cat, table in UNIT_TABLES.items():
        cats[cat] = list(table["units"].keys())
    return {"categories": cats}


# ==================== 密码生成器 ====================

class PasswordRequest(BaseModel):
    length: int = 16
    uppercase: bool = True
    lowercase: bool = True
    digits: bool = True
    symbols: bool = True
    exclude_ambiguous: bool = False


@router.post("/password-generate")
async def password_generate(req: PasswordRequest):
    pools = []
    if req.uppercase:
        pools.append(string.ascii_uppercase)
    if req.lowercase:
        pools.append(string.ascii_lowercase)
    if req.digits:
        pools.append(string.digits)
    if req.symbols:
        pools.append("!@#$%^&*()-_=+[]{}|;:,.<>?")

    if not pools:
        return {"error": "至少选择一种字符类型"}

    all_chars = "".join(pools)
    if req.exclude_ambiguous:
        all_chars = all_chars.replace("0", "").replace("O", "").replace("1", "").replace("l", "").replace("I", "")

    length = max(req.length, 4)
    pwd = []
    for pool in pools:
        if req.exclude_ambiguous:
            pool = pool.replace("0", "").replace("O", "").replace("1", "").replace("l", "").replace("I", "")
        pwd.append(random.choice(pool))
    pwd.extend(random.choice(all_chars) for _ in range(length - len(pwd)))
    random.shuffle(pwd)
    return {"password": "".join(pwd)}


# ==================== 二维码生成器 ====================

class QrCodeRequest(BaseModel):
    text: str
    size: int = 10  # pixel size per module
    fg_color: str = "#000000"
    bg_color: str = "#FFFFFF"
    border: int = 2


def _hex_to_rgb(hex_color: str):
    hex_color = hex_color.lstrip("#")
    if len(hex_color) == 3:
        hex_color = "".join(c * 2 for c in hex_color)
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))


@router.post("/qrcode")
async def qrcode_generate(req: QrCodeRequest):
    if not req.text.strip():
        return {"error": "请输入二维码内容"}

    try:
        fg = _hex_to_rgb(req.fg_color)
        bg = _hex_to_rgb(req.bg_color)
    except Exception:
        fg, bg = (0, 0, 0), (255, 255, 255)

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=req.size,
        border=req.border,
    )
    qr.add_data(req.text)
    qr.make(fit=True)
    img = qr.make_image(fill_color=fg, back_color=bg)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    return {"image": f"data:image/png;base64,{b64}", "raw_base64": b64}
