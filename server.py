"""Rozgaar application API and static server. Uses Python 3.10+ and SQLite."""
import base64
import contextlib
import datetime as dt
import hashlib
import hmac
import json
import mimetypes
import os
import re
import secrets
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get("ROZGAAR_DATA_DIR", ROOT / ".data")).resolve()
DATA.mkdir(parents=True, exist_ok=True, mode=0o700)
DB = DATA / "rozgaar.sqlite3"
DEMO = os.environ.get("ROZGAAR_DEMO", "1") == "1"
SECURE_COOKIES = os.environ.get("ROZGAAR_SECURE_COOKIES", "0") == "1"
COOKIE = "rozgaar_session"
MAX_BODY = 9_000_000
SESSION_AGE = 7 * 86400
DEMO_PASSWORD = "RozgaarDemo2026"
OCR_LOCK = threading.Lock()

class ApiError(Exception):
    def __init__(self, code, message):
        self.code, self.message = code, message


@contextlib.contextmanager
def db():
    con = sqlite3.connect(DB, timeout=8, isolation_level=None)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    try:
        yield con
    finally:
        con.close()


def password_hash(password, salt):
    return hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1, maxmem=64*1024*1024).hex()


def encode(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def trimmed(obj, key, limit=120, default=""):
    value = obj.get(key, default)
    if not isinstance(value, str) or len(value) > limit:
        raise ApiError(400, f"Invalid {key}.")
    return value.strip()


def array(obj, key):
    value = obj.get(key, [])
    if not isinstance(value, list) or len(value) > 15 or any(not isinstance(v, str) or len(v)>60 for v in value):
        raise ApiError(400, f"Invalid {key}.")
    return list(dict.fromkeys(v.strip() for v in value if v.strip()))


def integer(obj, key):
    try:
        return int(obj.get(key, ""))
    except (ValueError, TypeError, OverflowError):
        raise ApiError(400, f"Enter a valid {key}.")


def local_day(offset=0):
    return (dt.datetime.now(dt.timezone(dt.timedelta(hours=5, minutes=30))).date() + dt.timedelta(days=offset)).isoformat()


EXAMPLES = [
    ("Warehouse picker", "Northgate Logistics", "Peenya", "Warehouse", "Day", 16000, 19500, 25),
    ("Packing associate", "BoxRoute Supply", "Yeshwanthpur", "Warehouse", "Evening", 16500, 20500, 18),
    ("Inventory assistant", "MetroStock Services", "Hoskote", "Warehouse", "Day", 17500, 22000, 12),
    ("Dispatch coordinator", "ParcelDock", "Electronic City", "Warehouse", "Day", 18000, 24000, 8),
    ("Garment quality checker", "Threadline Studio", "Bommanahalli", "Manufacturing", "Day", 16500, 20500, 40),
    ("Assembly line associate", "Mitra Components", "Peenya", "Manufacturing", "Day", 17000, 23500, 32),
    ("Machine shop helper", "Mitra Components", "Jigani", "Manufacturing", "Evening", 16500, 21000, 15),
    ("Textile finisher", "CottonArc", "Bommasandra", "Manufacturing", "Day", 15500, 19500, 20),
    ("Site security assistant", "Westfork Facilities", "Whitefield", "Security", "Night", 18000, 22500, 14),
    ("Visitor desk associate", "Gatehouse Services", "Hebbal", "Security", "Day", 17000, 23000, 7),
    ("Store floor associate", "Cedar Market", "Indiranagar", "Retail", "Evening", 16000, 21000, 9),
    ("Grocery replenishment assistant", "DailyMart Local", "HSR Layout", "Retail", "Day", 15800, 19500, 16),
    ("Counter assistant", "Roti & Grain", "Jayanagar", "Retail", "Day", 16000, 20500, 8),
    ("Parcel delivery rider", "CityRun Transport", "Malleswaram", "Delivery", "Day", 19000, 26000, 21),
    ("Last-mile sorting assistant", "CityRun Transport", "Kengeri", "Delivery", "Night", 17000, 22500, 19),
    ("Kitchen prep assistant", "Canteen Collective", "Koramangala", "Hospitality", "Day", 16000, 22500, 11),
    ("Hotel housekeeping associate", "Juniper Stays", "Whitefield", "Hospitality", "Day", 17000, 23100, 12),
    ("Banquet setup assistant", "Juniper Stays", "Yelahanka", "Hospitality", "Evening", 17500, 23000, 6),
]
SKILLS = {
    "Warehouse":["Barcode scanning","Order picking","Packing"],
    "Manufacturing":["Quality checks","Part sorting","Team handoff"],
    "Security":["Visitor check-in","Record keeping","Shift handoff"],
    "Retail":["Stock checks","Customer service","Shelf replenishment"],
    "Delivery":["Route planning","Parcel checks","App navigation"],
    "Hospitality":["Clean work habits","Guest service","Task checklists"],
}
TASKS = {
    "Warehouse":["Check in at the site reception.","Read the order and verify item code and quantity.","Flag any mismatch before packing.","Label the parcel and hand it to the shift lead."],
    "Manufacturing":["Meet the shift supervisor for the work briefing.","Inspect sample items against the team's checklist.","Separate items that need a second check.","Record quantities at handoff."],
    "Security":["Report to the designated reception desk.","Confirm visitor entries against site instructions.","Maintain a clear visitor record.","Brief the incoming shift on pending visits."],
    "Retail":["Confirm the assigned section with the store lead.","Check labels and shelf stock against the list.","Help customers find items.","Report shortages at the end of the shift."],
    "Delivery":["Check in at the dispatch point.","Confirm the parcel label and destination.","Follow the dispatch team's delivery process.","Report incomplete drops to the shift lead."],
    "Hospitality":["Report to the floor supervisor.","Read the workstation checklist.","Prepare your assigned area for the shift.","Check your handoff with the supervisor."],
}
TIMES = {"Day":"8:00 AM – 4:00 PM","Evening":"2:00 PM – 10:00 PM","Night":"10:00 PM – 6:00 AM"}


def create_user(con, name, phone, password, role="worker"):
    salt = secrets.token_hex(16)
    return con.execute(
        "INSERT INTO users(name,phone,salt,secret,role,profile) VALUES(?,?,?,?,?,?)",
        (name,phone,salt,password_hash(password,salt),role,"{}")
    ).lastrowid


def initialize():
    with db() as con:
        con.execute("PRAGMA journal_mode=WAL")
        con.executescript("""
          CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,phone TEXT UNIQUE NOT NULL,
            salt TEXT NOT NULL,secret TEXT NOT NULL,role TEXT NOT NULL,profile TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS sessions(digest TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),
            expires INTEGER NOT NULL);
          CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY,owner INTEGER NOT NULL REFERENCES users(id),
            name TEXT NOT NULL,company TEXT NOT NULL,location TEXT NOT NULL,category TEXT NOT NULL,shift TEXT NOT NULL,
            low INTEGER NOT NULL,high INTEGER NOT NULL,openings INTEGER NOT NULL,deadline TEXT NOT NULL,
            summary TEXT NOT NULL,tasks TEXT NOT NULL,skills TEXT NOT NULL,status TEXT NOT NULL,sample INTEGER NOT NULL,
            created INTEGER NOT NULL, work_hours TEXT NOT NULL DEFAULT '', bring TEXT NOT NULL DEFAULT '',
            site_steps INTEGER NOT NULL DEFAULT 0);
          CREATE TABLE IF NOT EXISTS saved(worker INTEGER REFERENCES users(id),job INTEGER REFERENCES jobs(id),
            PRIMARY KEY(worker,job));
          CREATE TABLE IF NOT EXISTS practice(worker INTEGER REFERENCES users(id),job INTEGER REFERENCES jobs(id),
            passed INTEGER NOT NULL,attempts INTEGER NOT NULL,PRIMARY KEY(worker,job));
          CREATE TABLE IF NOT EXISTS applications(id INTEGER PRIMARY KEY,worker INTEGER REFERENCES users(id),
            job INTEGER REFERENCES jobs(id),status TEXT NOT NULL,created INTEGER NOT NULL,updated INTEGER NOT NULL,
            invite TEXT NOT NULL,UNIQUE(worker,job));
          CREATE INDEX IF NOT EXISTS jobs_owner ON jobs(owner);
          CREATE INDEX IF NOT EXISTS app_job ON applications(job);
        """)
        columns = {row["name"] for row in con.execute("PRAGMA table_info(jobs)")}
        for name, definition in (("work_hours", "TEXT NOT NULL DEFAULT ''"), ("bring", "TEXT NOT NULL DEFAULT ''"),
                                 ("site_steps", "INTEGER NOT NULL DEFAULT 0")):
            if name not in columns:
                con.execute(f"ALTER TABLE jobs ADD COLUMN {name} {definition}")
        if DEMO and not con.execute("SELECT 1 FROM users WHERE phone='0000000002'").fetchone():
            con.execute("BEGIN IMMEDIATE")
            try:
                worker = create_user(con,"Anu Rao","0000000001",DEMO_PASSWORD)
                owner = create_user(con,"Northgate Hiring Desk","0000000002",DEMO_PASSWORD,"employer")
                con.execute("UPDATE users SET profile=? WHERE id=?", (encode({
                    "roles":["Warehouse","Manufacturing"],"locality":"Peenya","shifts":["Day"],
                    "skills":["Packing"],"language":"English"
                }),worker))
                for i, (name,company,where,category,shift,low,high,openings) in enumerate(EXAMPLES):
                    con.execute("""INSERT INTO jobs(owner,name,company,location,category,shift,low,high,openings,
                       deadline,summary,tasks,skills,status,sample,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                       (owner,name,company,where,category,shift,low,high,openings,local_day(7+i%8),
                        f"Work with the {company} site team on the {shift.lower()} shift. Review the duties and schedule before applying.",
                        encode(TASKS[category]),encode(SKILLS[category]),"Open",1,int(time.time())-i*3600))
                con.execute("INSERT INTO saved VALUES(?,?)",(worker,2))
                now = int(time.time())
                for job, status, invite in [
                    (5,"Applied",{}),
                    (2,"Invited",{"mode":"In person","date":local_day(2),"time":"10:00","place":"Main reception","duration":20}),
                    (11,"Confirmed",{"mode":"Phone","date":local_day(3),"time":"14:00","place":"Recruiter will call your registered number","duration":15})
                ]:
                    con.execute("INSERT INTO applications(worker,job,status,created,updated,invite) VALUES(?,?,?,?,?,?)",
                                (worker,job,status,now-86400,now,encode(invite)))
                con.commit()
            except Exception:
                con.rollback()
                raise
        elif not DEMO:
            owner_phone = os.environ.get("ROZGAAR_EMPLOYER_PHONE","")
            owner_password = os.environ.get("ROZGAAR_EMPLOYER_PASSWORD","")
            if re.fullmatch(r"[6-9]\d{9}",owner_phone) and 8<=len(owner_password)<=100 and not con.execute(
                "SELECT 1 FROM users WHERE phone=?", (owner_phone,)).fetchone():
                create_user(con,os.environ.get("ROZGAAR_EMPLOYER_NAME","Hiring Desk"),owner_phone,owner_password,"employer")
        con.execute("DELETE FROM sessions WHERE expires<?", (int(time.time()),))


def compile_ocr():
    target = DATA / "ocr-vision"
    source = ROOT / "tools" / "ocr.swift"
    if target.is_file() and target.stat().st_mtime >= source.stat().st_mtime:
        return target
    with OCR_LOCK:
        if target.is_file() and target.stat().st_mtime >= source.stat().st_mtime:
            return target
        cache = DATA / "swift-cache"
        cache.mkdir(exist_ok=True)
        temp = DATA / "ocr-vision-building"
        subprocess.run(["swiftc","-module-cache-path",str(cache),str(source),"-o",str(temp)],
                       check=True,timeout=180,capture_output=True)
        temp.replace(target)
    return target


def extract_document(upload):
    raw = upload.get("data")
    if not isinstance(raw, str) or len(raw)>8_100_000:
        raise ApiError(400,"Choose a PDF or image under 6 MB.")
    try:
        content = base64.b64decode(raw,validate=True)
    except ValueError:
        raise ApiError(400,"The upload could not be decoded.")
    signatures = [(b"%PDF-","pdf"),(b"\x89PNG\r\n\x1a\n","png"),(b"\xff\xd8\xff","jpg")]
    extension = next((ext for prefix,ext in signatures if content.startswith(prefix)),None)
    if not extension or len(content)>6_000_000:
        raise ApiError(400,"Choose a PDF, PNG or JPEG under 6 MB.")
    try:
        with tempfile.TemporaryDirectory(prefix="rozgaar-ocr-") as directory:
            file = Path(directory)/f"document.{extension}"
            file.write_bytes(content)
            if extension=="pdf" and shutil.which("pdftotext"):
                output = subprocess.run(["pdftotext","-f","1","-l","3",str(file),"-"],check=True,timeout=25,capture_output=True).stdout
                if not output.strip() and shutil.which("pdftoppm") and shutil.which("tesseract"):
                    prefix = Path(directory)/"page"
                    subprocess.run(["pdftoppm","-f","1","-l","3","-scale-to","1900","-png",str(file),str(prefix)],
                                   check=True,timeout=25,capture_output=True)
                    output = b"\n\n".join(subprocess.run(["tesseract",str(page),"stdout"],check=True,timeout=20,
                                                      capture_output=True).stdout for page in sorted(Path(directory).glob("page-*.png")))
            elif extension!="pdf" and shutil.which("tesseract"):
                output = subprocess.run(["tesseract",str(file),"stdout"],check=True,timeout=25,capture_output=True).stdout
            elif sys.platform == "darwin" and shutil.which("swiftc"):
                output = subprocess.run([str(compile_ocr()),str(file)],check=True,timeout=45,capture_output=True).stdout
            else:
                raise ApiError(503,"Document scanning is unavailable. Install Swift on macOS or Tesseract and Poppler on Linux.")
    except (subprocess.SubprocessError,OSError):
        raise ApiError(422,"This document could not be read. Try a clearer image or an unlocked PDF.")
    recognized = output.decode("utf8",errors="replace").strip()[:12000]
    if not recognized:
        raise ApiError(422,"No readable text found. Try a sharper, well-lit image.")
    matches = list(dict.fromkeys(skill for values in SKILLS.values() for skill in values
                                 if re.search(r"\b"+re.escape(skill)+r"\b",recognized,re.I)))
    return {"text":recognized,"skills":matches}


def job_dict(row):
    item = dict(row)
    item["tasks"] = json.loads(item["tasks"])
    item["skills"] = json.loads(item["skills"])
    item["hours"] = item.pop("work_hours") or TIMES[item["shift"]]
    item["status"] = "Closed" if item["deadline"] < local_day() else item["status"]
    return item


def application_dict(row):
    a = dict(row)
    a["invite"] = json.loads(a["invite"])
    if "profile" in a:
        a["profile"] = json.loads(a["profile"])
    return a


class Handler(BaseHTTPRequestHandler):
    def send_data(self,code,content,mime="application/json; charset=utf-8",cookie=None,headers=None):
        self.send_response(code)
        self.send_header("Content-Type",mime)
        self.send_header("Content-Length",str(len(content)))
        self.send_header("X-Content-Type-Options","nosniff")
        self.send_header("Cache-Control","no-store")
        for key, value in (headers or {}).items():
            self.send_header(key,value)
        if cookie:
            self.send_header("Set-Cookie",cookie)
        self.end_headers()
        self.wfile.write(content)

    def result(self,value,code=200,cookie=None):
        self.send_data(code,encode(value).encode(),cookie=cookie)

    def body(self):
        if self.headers.get("Content-Type","").split(";")[0]!="application/json":
            raise ApiError(415,"Send JSON.")
        origin = self.headers.get("Origin")
        if origin and urlsplit(origin).netloc.lower()!=self.headers.get("Host","").lower():
            raise ApiError(403,"Cross-site request denied.")
        try:
            length=int(self.headers.get("Content-Length","0"))
            if not 0<length<=MAX_BODY:
                raise ApiError(413,"Request is too large.")
            value=json.loads(self.rfile.read(length))
            if not isinstance(value,dict):
                raise ValueError()
            return value
        except (ValueError,UnicodeError):
            raise ApiError(400,"Could not read the request.")

    def token(self):
        try:
            jar=SimpleCookie(self.headers.get("Cookie",""))
            return jar[COOKIE].value
        except (KeyError,ValueError):
            return ""

    def cookie(self,value,age):
        return f"{COOKIE}={value}; Path=/; Max-Age={age}; HttpOnly; SameSite=Strict" + ("; Secure" if SECURE_COOKIES else "")

    def user(self,con,required=None):
        row=None
        token=self.token()
        if token:
            row=con.execute("SELECT u.* FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.digest=? AND s.expires>?",
                            (hashlib.sha256(token.encode()).hexdigest(),int(time.time()))).fetchone()
        if row and not DEMO and row["phone"] in ("0000000001","0000000002"):
            row=None
        if required and not row:
            raise ApiError(401,"Sign in to continue.")
        if required not in (None,"any") and row["role"]!=required:
            raise ApiError(403,"This action requires a "+required+" account.")
        return row

    def public_user(self,row):
        if row:
            return {"id":row["id"],"name":row["name"],"role":row["role"],"profile":json.loads(row["profile"])}
        return None

    def sign_in(self,con,row):
        old=self.token()
        if old:
            con.execute("DELETE FROM sessions WHERE digest=?",(hashlib.sha256(old.encode()).hexdigest(),))
        token=secrets.token_urlsafe(32)
        con.execute("INSERT INTO sessions VALUES(?,?,?)",(hashlib.sha256(token.encode()).hexdigest(),row["id"],int(time.time())+SESSION_AGE))
        self.result({"user":self.public_user(row)},cookie=self.cookie(token,SESSION_AGE))

    def route(self,method,path):
        with db() as con:
            if method=="GET" and path=="/api/session":
                return self.result({"user":self.public_user(self.user(con)),"demo":DEMO})
            if method=="GET" and path=="/api/jobs":
                rows=con.execute("SELECT * FROM jobs WHERE status='Open' AND deadline>=? AND (sample=0 OR ?) ORDER BY created DESC,id",
                                 (local_day(),int(DEMO)))
                return self.result([job_dict(r) for r in rows])
            if method=="GET" and (match:=re.fullmatch(r"/api/jobs/(\d+)",path)):
                row=con.execute("SELECT * FROM jobs WHERE id=? AND (sample=0 OR ?)",(int(match[1]),int(DEMO))).fetchone()
                if not row:
                    raise ApiError(404,"Job not found.")
                return self.result(job_dict(row))
            data=self.body() if method in ("POST","PATCH") else {}
            if method=="POST" and path in ("/api/login","/api/register","/api/demo"):
                if path=="/api/demo":
                    if not DEMO:
                        raise ApiError(404,"Demo accounts are disabled.")
                    role=trimmed(data,"role")
                    if role not in ("worker","employer"):
                        raise ApiError(400,"Choose a demo account.")
                    row=con.execute("SELECT * FROM users WHERE phone=?",("0000000001" if role=="worker" else "0000000002",)).fetchone()
                    return self.sign_in(con,row)
                phone=re.sub(r"[\s-]", "",trimmed(data,"phone",25)).removeprefix("+91")
                password=trimmed(data,"password",100)
                if path=="/api/register":
                    name=trimmed(data,"name",70)
                    if not name or not re.fullmatch(r"[6-9]\d{9}",phone) or len(password)<8:
                        raise ApiError(400,"Use a name, a valid Indian mobile number and at least 8 password characters.")
                    try:
                        id=create_user(con,name,phone,password)
                    except sqlite3.IntegrityError:
                        raise ApiError(409,"An account already exists for that number.")
                    row=con.execute("SELECT * FROM users WHERE id=?",(id,)).fetchone()
                else:
                    row=con.execute("SELECT * FROM users WHERE phone=? AND phone NOT IN ('0000000001','0000000002')",(phone,)).fetchone()
                    if not row or not hmac.compare_digest(password_hash(password,row["salt"]),row["secret"]):
                        raise ApiError(401,"Mobile number or password is incorrect.")
                return self.sign_in(con,row)
            if method=="POST" and path=="/api/logout":
                con.execute("DELETE FROM sessions WHERE digest=?",(hashlib.sha256(self.token().encode()).hexdigest(),))
                return self.result({"ok":True},cookie=self.cookie("",0))
            if path=="/api/profile" and method=="PATCH":
                worker=self.user(con,"worker")
                name=trimmed(data,"name",70) or worker["name"]
                profile={key:array(data,key) for key in ("roles","shifts","skills")}
                profile.update({key:trimmed(data,key,70) for key in ("locality","language","education","experience")})
                con.execute("UPDATE users SET name=?,profile=? WHERE id=?",(name,encode(profile),worker["id"]))
                return self.result({"user":self.public_user(con.execute("SELECT * FROM users WHERE id=?",(worker["id"],)).fetchone())})
            if path=="/api/ocr" and method=="POST":
                self.user(con,"worker")
                return self.result(extract_document(data))
            if path=="/api/saved" and method=="GET":
                worker=self.user(con,"worker")
                return self.result([r["job"] for r in con.execute("SELECT job FROM saved WHERE worker=?",(worker["id"],))])
            if (match:=re.fullmatch(r"/api/jobs/(\d+)/(save|practice|apply)",path)) and method=="POST":
                worker=self.user(con,"worker")
                id,action=int(match[1]),match[2]
                row=con.execute("SELECT * FROM jobs WHERE id=? AND (sample=0 OR ?)",(id,int(DEMO))).fetchone()
                if not row:
                    raise ApiError(404,"Job not found.")
                if action=="save":
                    if data.get("saved") is True:
                        con.execute("INSERT OR IGNORE INTO saved VALUES(?,?)",(worker["id"],id))
                    else:
                        con.execute("DELETE FROM saved WHERE worker=? AND job=?",(worker["id"],id))
                    return self.result({"ok":True})
                if action=="practice":
                    questions={
                        "Warehouse":("B17","B24"),"Manufacturing":("Mark for recheck","Mark for recheck"),
                        "Security":("Check the visitor record","Check the visitor record"),
                        "Retail":("Check the shelf label","Check the shelf label"),
                        "Delivery":("Confirm the parcel label","Confirm the parcel label"),
                        "Hospitality":("Read the checklist","Read the checklist")
                    }
                    variant=int(data.get("variant")==1)
                    correct=trimmed(data,"answer",100)==questions[row["category"]][variant]
                    con.execute("""INSERT INTO practice VALUES(?,?,?,1) ON CONFLICT(worker,job)
                       DO UPDATE SET passed=max(practice.passed,excluded.passed),attempts=practice.attempts+1""",
                       (worker["id"],id,int(correct)))
                    return self.result({"correct":correct})
                if data.get("age") is not True or data.get("availability") is not True:
                    raise ApiError(400,"Confirm that you are 18 or older and can take the listed shift.")
                con.execute("BEGIN IMMEDIATE")
                try:
                    existing=con.execute("SELECT id,status FROM applications WHERE worker=? AND job=?",(worker["id"],id)).fetchone()
                    if existing is None:
                        gate=con.execute("SELECT status,deadline FROM jobs WHERE id=?",(id,)).fetchone()
                        if gate["status"]!="Open" or gate["deadline"]<local_day():
                            raise ApiError(409,"This hiring drive is closed.")
                        now=int(time.time())
                        aid=con.execute("INSERT INTO applications(worker,job,status,created,updated,invite) VALUES(?,?,?,?,?,?)",
                                        (worker["id"],id,"Applied",now,now,"{}")).lastrowid
                        value={"id":aid,"status":"Applied"}
                    else:
                        value=dict(existing)
                    con.commit()
                except Exception:
                    con.rollback()
                    raise
                return self.result(value)
            if path=="/api/applications" and method=="GET":
                worker=self.user(con,"worker")
                rows=con.execute("""SELECT a.*,j.name,j.company,j.location,j.shift,j.sample FROM applications a
                                    JOIN jobs j ON a.job=j.id WHERE a.worker=? ORDER BY a.updated DESC,a.id DESC""",(worker["id"],))
                return self.result([application_dict(r) for r in rows])
            if (match:=re.fullmatch(r"/api/applications/(\d+)/response",path)) and method=="POST":
                worker=self.user(con,"worker")
                next_status=trimmed(data,"status")
                if next_status not in ("Confirmed","Declined"):
                    raise ApiError(400,"Choose confirm or decline.")
                changed=con.execute("UPDATE applications SET status=?,updated=? WHERE id=? AND worker=? AND status='Invited'",
                                    (next_status,int(time.time()),int(match[1]),worker["id"])).rowcount
                if not changed:
                    raise ApiError(409,"This invitation is no longer awaiting a response.")
                return self.result({"status":next_status})
            if path=="/api/employer" and method=="GET":
                owner=self.user(con,"employer")
                jobs=[job_dict(r) for r in con.execute("SELECT * FROM jobs WHERE owner=? ORDER BY created DESC,id",(owner["id"],))]
                candidates=[application_dict(r) for r in con.execute("""SELECT a.*,u.name AS worker_name,u.profile,j.name,j.company,
                        coalesce(p.passed,0) AS practiced FROM applications a JOIN jobs j ON a.job=j.id
                        JOIN users u ON u.id=a.worker LEFT JOIN practice p ON p.worker=a.worker AND p.job=a.job
                        WHERE j.owner=? ORDER BY a.updated DESC,a.id DESC""",(owner["id"],))]
                return self.result({"jobs":jobs,"candidates":candidates})
            if path=="/api/employer/jobs" and method=="POST":
                owner=self.user(con,"employer")
                name=trimmed(data,"name")
                company=trimmed(data,"company")
                location=trimmed(data,"location")
                category=trimmed(data,"category")
                shift=trimmed(data,"shift")
                summary=trimmed(data,"summary",850)
                work_hours=trimmed(data,"work_hours",60)
                bring=trimmed(data,"bring",120)
                steps=[step.strip() for step in trimmed(data,"preview_steps",650).splitlines() if step.strip()]
                if steps and (not 2<=len(steps)<=4 or any(len(step)>150 for step in steps)):
                    raise ApiError(400,"Add two to four worksite steps, one per line, up to 150 characters each.")
                low,high,openings=(integer(data,key) for key in ("low","high","openings"))
                deadline=trimmed(data,"deadline",10)
                try:
                    day=dt.date.fromisoformat(deadline).isoformat()
                except ValueError:
                    raise ApiError(400,"Choose a valid closing date.")
                if not all((name,company,location,summary)) or category not in SKILLS or shift not in TIMES or not (
                   1<=low<=high<=1_000_000 and 1<=openings<=10000 and day>=local_day()):
                    raise ApiError(400,"Check the role, site, shift, pay range, openings and end date.")
                id=con.execute("""INSERT INTO jobs(owner,name,company,location,category,shift,low,high,openings,
                       deadline,summary,tasks,skills,status,sample,created,work_hours,bring,site_steps)
                       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                       (owner["id"],name,company,location,category,shift,low,high,openings,day,summary,
                        encode(steps or TASKS[category]),encode(array(data,"skills") or SKILLS[category]),"Open",
                        int(owner["phone"]=="0000000002"),int(time.time()),work_hours,bring,int(bool(steps)))).lastrowid
                return self.result({"id":id},201)
            if (match:=re.fullmatch(r"/api/employer/jobs/(\d+)/close",path)) and method=="POST":
                owner=self.user(con,"employer")
                count=con.execute("UPDATE jobs SET status='Closed' WHERE id=? AND owner=?",(int(match[1]),owner["id"])).rowcount
                if not count:
                    raise ApiError(404,"Hiring drive not found.")
                return self.result({"status":"Closed"})
            if (match:=re.fullmatch(r"/api/employer/applications/(\d+)/(invite|attend)",path)) and method=="POST":
                owner=self.user(con,"employer")
                id, action=int(match[1]),match[2]
                if action=="invite":
                    invite={key:trimmed(data,key,150) for key in ("mode","date","time","place")}
                    invite["duration"]=integer(data,"duration")
                    try:
                        schedule=dt.datetime.fromisoformat(invite["date"]+"T"+invite["time"])
                    except ValueError:
                        raise ApiError(400,"Choose a valid invitation date and time.")
                    if invite["mode"] not in ("Phone","In person","Video") or not invite["place"] or not 5<=invite["duration"]<=120 or schedule.date().isoformat()<local_day():
                        raise ApiError(400,"Check the invitation date, duration and joining instructions.")
                    count=con.execute("""UPDATE applications SET status='Invited',invite=?,updated=? WHERE id=?
                         AND status='Applied' AND job IN (SELECT id FROM jobs WHERE owner=?)""",
                         (encode(invite),int(time.time()),id,owner["id"])).rowcount
                else:
                    count=con.execute("""UPDATE applications SET status='Attended',updated=? WHERE id=?
                         AND status='Confirmed' AND job IN (SELECT id FROM jobs WHERE owner=?)""",(int(time.time()),id,owner["id"])).rowcount
                if not count:
                    raise ApiError(409,"This application has already moved to another stage or is outside your drives.")
                return self.result({"ok":True})
            raise ApiError(404,"This endpoint does not exist.")

    def handle_request(self,method):
        path=urlsplit(self.path).path
        try:
            if path.startswith("/api/"):
                return self.route(method,path)
            if method!="GET":
                raise ApiError(405,"Method not allowed.")
            if path in ("/","/index.html","/jobs","/learn","/applications","/profile","/employer"):
                file=ROOT/"index.html"
            elif path in ("/app.js","/styles.css","/assets/logo.webp","/assets/warehouse.webp","/assets/warehouse-poster.webp","/assets/resume-sample.png") or re.fullmatch(r"/assets/(warehouse|garment)-walkthrough\.(mp4|jpg|vtt)",path):
                file=ROOT/path.lstrip("/")
            else:
                raise ApiError(404,"Page not found.")
            if not file.is_file():
                raise ApiError(404,"File not found.")
            mime=mimetypes.guess_type(file.name)[0] or "application/octet-stream"
            if file.suffix==".vtt":
                mime="text/vtt; charset=utf-8"
            if file.suffix==".mp4":
                content=file.read_bytes()
                length=len(content)
                requested=self.headers.get("Range")
                headers={"Accept-Ranges":"bytes"}
                if requested:
                    match=re.fullmatch(r"bytes=(\d*)-(\d*)",requested)
                    if match and (match[1] or match[2]):
                        start=int(match[1]) if match[1] else max(0,length-int(match[2]))
                        end=min(int(match[2]),length-1) if match[1] and match[2] else length-1
                        if start<=end:
                            headers["Content-Range"]=f"bytes {start}-{end}/{length}"
                            return self.send_data(206,content[start:end+1],mime,headers=headers)
                    headers["Content-Range"]=f"bytes */{length}"
                    return self.send_data(416,b"",mime,headers=headers)
                return self.send_data(200,content,mime,headers=headers)
            return self.send_data(200,file.read_bytes(),mime+("; charset=utf-8" if file.suffix in (".html",".js",".css") else ""))
        except ApiError as error:
            self.result({"error":error.message},error.code)
        except (BrokenPipeError,ConnectionResetError):
            pass
        except Exception as error:
            print(f"{method} {path}: {type(error).__name__}",file=sys.stderr,flush=True)
            self.result({"error":"Something went wrong. Try again."},HTTPStatus.INTERNAL_SERVER_ERROR)

    def do_GET(self):
        self.handle_request("GET")

    def do_POST(self):
        self.handle_request("POST")

    def do_PATCH(self):
        self.handle_request("PATCH")


if __name__ == "__main__":
    initialize()
    if "--prepare-ocr" in sys.argv:
        print(compile_ocr())
    else:
        host=os.environ.get("HOST","127.0.0.1")
        port=int(os.environ.get("PORT","8000"))
        print(f"Rozgaar · http://{host}:{port}",flush=True)
        ThreadingHTTPServer((host,port),Handler).serve_forever()

