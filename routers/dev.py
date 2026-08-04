"""软件开发类工具 API 路由."""

import re
import json
import uuid as uuid_lib
import random
import string
import base64
import urllib.parse
import colorsys
import difflib
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from croniter import croniter

router = APIRouter(prefix="/api/dev", tags=["dev"])


# ==================== JSON 格式化 / 校验 ====================

class JsonFormatRequest(BaseModel):
    text: str
    indent: int = 2


@router.post("/json-format")
async def json_format(req: JsonFormatRequest):
    try:
        data = json.loads(req.text)
        return {"valid": True, "formatted": json.dumps(data, indent=req.indent, ensure_ascii=False)}
    except json.JSONDecodeError as e:
        return {"valid": False, "error": f"第 {e.lineno} 行, 第 {e.colno} 列: {e.msg}", "raw": str(e)}


# ==================== 正则表达式测试器 ====================

class RegexTestRequest(BaseModel):
    pattern: str
    flags: str = ""
    text: str


@router.post("/regex-test")
async def regex_test(req: RegexTestRequest):
    flag_map = {"g": 0, "i": re.IGNORECASE, "m": re.MULTILINE, "s": re.DOTALL, "x": re.VERBOSE}
    flags_val = 0
    for f in req.flags:
        flags_val |= flag_map.get(f, 0)
    try:
        pattern = re.compile(req.pattern, flags_val)
    except re.error as e:
        return {"valid": False, "error": str(e)}

    matches = []
    for m in pattern.finditer(req.text):
        match_info = {
            "match": m.group(0),
            "span": [m.start(), m.end()],
            "groups": list(m.groups()),
        }
        try:
            match_info["named_groups"] = {k: v for k, v in m.groupdict().items() if v is not None}
        except Exception:
            match_info["named_groups"] = {}
        matches.append(match_info)

    return {"valid": True, "match_count": len(matches), "matches": matches}


# ==================== 时间戳转换 ====================

class TimestampRequest(BaseModel):
    value: str
    direction: str = "to_date"  # to_date | to_ts
    unit: str = "s"  # s | ms
    timezone_offset: int = 8  # UTC+8


@router.post("/timestamp-convert")
async def timestamp_convert(req: TimestampRequest):
    try:
        if req.direction == "to_date":
            ts = float(req.value)
            if req.unit == "ms":
                ts = ts / 1000
            from datetime import timedelta
            tz = timezone(timedelta(hours=req.timezone_offset))
            dt = datetime.fromtimestamp(ts, tz=tz)
            return {
                "result": dt.strftime("%Y-%m-%d %H:%M:%S"),
                "iso": dt.isoformat(),
                "timestamp_s": int(ts),
                "timestamp_ms": int(ts * 1000),
                "weekday": ["周一","周二","周三","周四","周五","周六","周日"][dt.weekday()],
            }
        else:
            value = req.value.strip()
            # 支持多种格式
            for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d", "%Y/%m/%d %H:%M:%S", "%Y/%m/%d"]:
                try:
                    dt = datetime.strptime(value, fmt)
                    ts = int(dt.timestamp())
                    return {"result": str(ts) if req.unit == "s" else str(ts * 1000)}
                except ValueError:
                    continue
            # 尝试 ISO 格式
            try:
                dt = datetime.fromisoformat(value)
                ts = int(dt.timestamp())
                return {"result": str(ts) if req.unit == "s" else str(ts * 1000)}
            except Exception:
                return {"error": f"无法解析日期: {value}"}
    except Exception as e:
        return {"error": str(e)}


# ==================== Base64 / URL 编解码 ====================

class EncodeDecodeRequest(BaseModel):
    text: str
    operation: str  # base64_encode | base64_decode | url_encode | url_decode | html_encode | html_decode


@router.post("/encode-decode")
async def encode_decode(req: EncodeDecodeRequest):
    try:
        if req.operation == "base64_encode":
            return {"result": base64.b64encode(req.text.encode("utf-8")).decode("ascii")}
        elif req.operation == "base64_decode":
            return {"result": base64.b64decode(req.text).decode("utf-8")}
        elif req.operation == "url_encode":
            return {"result": urllib.parse.quote(req.text, safe="")}
        elif req.operation == "url_decode":
            return {"result": urllib.parse.unquote(req.text)}
        elif req.operation == "html_encode":
            import html
            return {"result": html.escape(req.text)}
        elif req.operation == "html_decode":
            import html
            return {"result": html.unescape(req.text)}
        else:
            return {"error": f"未知操作: {req.operation}"}
    except Exception as e:
        return {"error": str(e)}


# ==================== 颜色格式转换 ====================

class ColorConvertRequest(BaseModel):
    color: str  # #RRGGBB or rgb(r,g,b) or hsl(h,s%,l%)


@router.post("/color-convert")
async def color_convert(req: ColorConvertRequest):
    color = req.color.strip()
    r = g = b = 0

    try:
        if color.startswith("#"):
            hex_str = color.lstrip("#")
            if len(hex_str) == 3:
                hex_str = "".join(c * 2 for c in hex_str)
            r = int(hex_str[0:2], 16)
            g = int(hex_str[2:4], 16)
            b = int(hex_str[4:6], 16)
        elif color.lower().startswith("rgb"):
            nums = re.findall(r"[\d.]+", color)
            r, g, b = int(float(nums[0])), int(float(nums[1])), int(float(nums[2]))
        elif color.lower().startswith("hsl"):
            nums = re.findall(r"[\d.]+", color)
            h, s, l = float(nums[0]) / 360, float(nums[1]) / 100, float(nums[2]) / 100
            r, g, b = colorsys.hls_to_rgb(h, l, s)
            r, g, b = int(r * 255), int(g * 255), int(b * 255)
        else:
            return {"error": "无法识别的颜色格式，支持 #HEX / rgb(r,g,b) / hsl(h,s%,l%)"}
    except (IndexError, ValueError) as e:
        return {"error": f"颜色解析失败: {e}"}

    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)

    return {
        "hex": f"#{r:02X}{g:02X}{b:02X}",
        "rgb": f"rgb({r}, {g}, {b})",
        "hsl": f"hsl({int(h * 360)}, {int(s * 100)}%, {int(l * 100)}%)",
        "preview": f"#{r:02X}{g:02X}{b:02X}",
    }


# ==================== Diff 对比工具 ====================

class DiffRequest(BaseModel):
    text1: str
    text2: str
    mode: str = "unified"  # unified | side_by_side


@router.post("/diff")
async def diff_tool(req: DiffRequest):
    lines1 = req.text1.splitlines(keepends=False)
    lines2 = req.text2.splitlines(keepends=False)

    if req.mode == "unified":
        diff_lines = list(difflib.unified_diff(lines1, lines2, fromfile="文本1", tofile="文本2", lineterm=""))
        return {"diff": "\n".join(diff_lines), "html": None, "same": len(diff_lines) == 0}
    else:
        # side by side
        sm = difflib.SequenceMatcher(None, lines1, lines2)
        left_lines = []
        right_lines = []
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag == "equal":
                for i in range(i1, i2):
                    left_lines.append({"text": lines1[i], "type": "equal"})
                    right_lines.append({"text": lines2[i], "type": "equal"})
            elif tag == "replace":
                max_len = max(i2 - i1, j2 - j1)
                for k in range(max_len):
                    l = lines1[i1 + k] if i1 + k < i2 else ""
                    r = lines2[j1 + k] if j1 + k < j2 else ""
                    left_lines.append({"text": l, "type": "del" if l else "empty"})
                    right_lines.append({"text": r, "type": "add" if r else "empty"})
            elif tag == "delete":
                for i in range(i1, i2):
                    left_lines.append({"text": lines1[i], "type": "del"})
                    right_lines.append({"text": "", "type": "empty"})
            elif tag == "insert":
                for j in range(j1, j2):
                    left_lines.append({"text": "", "type": "empty"})
                    right_lines.append({"text": lines2[j], "type": "add"})

        same = all(l["type"] == "equal" for l in left_lines)
        return {"diff": None, "side": {"left": left_lines, "right": right_lines}, "same": same}


# ==================== Cron 表达式解析 ====================

class CronRequest(BaseModel):
    expression: str
    count: int = 5


@router.post("/cron-parse")
async def cron_parse(req: CronRequest):
    expr = req.expression.strip()
    try:
        cron = croniter(expr, datetime.now())
    except Exception as e:
        return {"valid": False, "error": str(e)}

    # 人话描述
    description = _describe_cron(expr)

    next_runs = []
    for _ in range(req.count):
        next_dt = cron.get_next(datetime)
        next_runs.append(next_dt.strftime("%Y-%m-%d %H:%M:%S %A"))

    return {"valid": True, "description": description, "next_runs": next_runs}


def _describe_cron(expr: str) -> str:
    parts = expr.split()
    if len(parts) != 5:
        return f"表达式: {expr}"

    minute, hour, day, month, weekday = parts
    descs = []

    if minute == "*" and hour == "*":
        descs.append("每分钟执行一次")
    elif minute == "*":
        descs.append(f"每小时的每分钟执行")
    elif hour == "*":
        descs.append(f"每小时的第 {minute} 分钟执行")
    elif "," in minute and "," in hour:
        descs.append(f"在指定时间点 {hour}时{minute}分 执行")
    elif minute != "*" and hour != "*":
        descs.append(f"每天 {hour}:{minute.zfill(2)} 执行")
    elif minute.startswith("*/"):
        descs.append(f"每隔 {minute[2:]} 分钟执行一次")
    elif hour.startswith("*/"):
        descs.append(f"每隔 {hour[2:]} 小时执行一次")

    if day != "*":
        if day.startswith("*/"):
            descs.append(f"每 {day[2:]} 天")
        else:
            descs.append(f"每月 {day} 日")

    if month != "*":
        descs.append(f"仅在 {month} 月")

    if weekday != "*":
        names = {"0": "周日", "1": "周一", "2": "周二", "3": "周三", "4": "周四", "5": "周五", "6": "周六", "7": "周日"}
        if "," in weekday:
            descs.append("在 " + "、".join(names.get(w, w) for w in weekday.split(",")))
        else:
            descs.append(f"仅在{names.get(weekday, weekday)}")

    return "，".join(descs) if descs else f"表达式: {expr}"


# ==================== UUID / 随机数据生成 ====================

class UuidRequest(BaseModel):
    version: int = 4
    count: int = 5
    uppercase: bool = False


@router.post("/uuid-generate")
async def uuid_generate(req: UuidRequest):
    uuids = []
    for _ in range(req.count):
        if req.version == 1:
            u = str(uuid_lib.uuid1())
        elif req.version == 4:
            u = str(uuid_lib.uuid4())
        else:
            u = str(uuid_lib.uuid4())
        if req.uppercase:
            u = u.upper()
        uuids.append(u)
    return {"uuids": uuids}


class PasswordGenRequest(BaseModel):
    length: int = 16
    uppercase: bool = True
    lowercase: bool = True
    digits: bool = True
    symbols: bool = True
    exclude_ambiguous: bool = False  # 排除 0O1lI


@router.post("/random-password")
async def random_password(req: PasswordGenRequest):
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
    # 确保每种选中类型至少出现一次
    for pool in pools:
        if req.exclude_ambiguous:
            pool = pool.replace("0", "").replace("O", "").replace("1", "").replace("l", "").replace("I", "")
        pwd.append(random.choice(pool))
    # 填充剩余
    pwd.extend(random.choice(all_chars) for _ in range(length - len(pwd)))
    random.shuffle(pwd)
    return {"password": "".join(pwd)}


class FakeDataRequest(BaseModel):
    data_type: str  # name | email | phone | address | id_card | company | date | number | lorem
    count: int = 5


@router.post("/fake-data")
async def fake_data(req: FakeDataRequest):
    import random as rnd

    first_names = ["张","王","李","赵","刘","陈","杨","黄","周","吴","徐","孙","马","朱","胡","郭","何","高","林","罗"]
    last_names = ["伟","芳","娜","秀英","敏","静","磊","强","洋","艳","勇","军","杰","娟","涛","明","超","秀兰","霞","平"]
    domains = ["qq.com","163.com","gmail.com","outlook.com","126.com","sina.com","foxmail.com"]
    cities = ["北京","上海","广州","深圳","杭州","成都","武汉","西安","南京","重庆","苏州","天津"]
    streets = ["中山路","解放路","人民路","建设路","和平路","幸福路","光明大道","文化路"]
    companies = ["科技","网络","信息","智能","数据","云服","数字","互联","软件","通讯"]

    results = []
    for _ in range(req.count):
        if req.data_type == "name":
            results.append(rnd.choice(first_names) + rnd.choice(last_names))
        elif req.data_type == "email":
            name = "".join(rnd.choice(string.ascii_lowercase) for _ in range(rnd.randint(4, 8)))
            results.append(f"{name}@{rnd.choice(domains)}")
        elif req.data_type == "phone":
            prefixes = ["138","139","135","136","150","158","188","186","177","159","151","152","153","180","189"]
            results.append(rnd.choice(prefixes) + "".join(rnd.choice(string.digits) for _ in range(8)))
        elif req.data_type == "address":
            results.append(rnd.choice(cities) + "市" + rnd.choice(streets) + str(rnd.randint(1, 999)) + "号")
        elif req.data_type == "id_card":
            # 生成格式正确的测试身份证号
            area = "".join(rnd.choice(string.digits) for _ in range(6))
            year = str(rnd.randint(1960, 2005))
            month = str(rnd.randint(1, 12)).zfill(2)
            day = str(rnd.randint(1, 28)).zfill(2)
            seq = "".join(rnd.choice(string.digits) for _ in range(3))
            results.append(f"{area}{year}{month}{day}{seq}X")
        elif req.data_type == "company":
            results.append(rnd.choice(cities) + rnd.choice(companies) + "有限公司")
        elif req.data_type == "date":
            year = rnd.randint(2000, 2025)
            month = rnd.randint(1, 12)
            day = rnd.randint(1, 28)
            results.append(f"{year}-{month:02d}-{day:02d}")
        elif req.data_type == "number":
            results.append(rnd.randint(0, 999999))
        elif req.data_type == "lorem":
            words = ["产品","设计","开发","测试","上线","迭代","用户","体验","增长","数据","策略","运营","内容","社区","平台","生态","智能","效率","创新","价值"]
            results.append("。".join("".join(rnd.choice(words) for _ in range(rnd.randint(3, 6))) for _ in range(3)) + "。")
        else:
            results.append("未知类型")

    return {"data": results}
