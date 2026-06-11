from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from datetime import datetime
from typing import Dict, List
import os, json, random, string

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://chat:chat@db:5432/chatdb")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(8), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String(8), nullable=False, index=True)
    username = Column(String(50), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Chat API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# --- WebSocket connection manager ---
class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_code: str, ws: WebSocket):
        await ws.accept()
        self.rooms.setdefault(room_code, []).append(ws)

    def disconnect(self, room_code: str, ws: WebSocket):
        if room_code in self.rooms:
            self.rooms[room_code].discard(ws) if hasattr(self.rooms[room_code], 'discard') else None
            try:
                self.rooms[room_code].remove(ws)
            except ValueError:
                pass

    async def broadcast(self, room_code: str, message: dict):
        for ws in list(self.rooms.get(room_code, [])):
            try:
                await ws.send_text(json.dumps(message, ensure_ascii=False, default=str))
            except Exception:
                pass


manager = ConnectionManager()


def gen_code(n=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=n))


# --- REST ---
class RoomCreate(BaseModel):
    name: str


@app.post("/api/rooms", status_code=201)
def create_room(body: RoomCreate):
    db = SessionLocal()
    try:
        code = gen_code()
        while db.query(Room).filter(Room.code == code).first():
            code = gen_code()
        room = Room(code=code, name=body.name.strip() or "Без названия")
        db.add(room)
        db.commit()
        db.refresh(room)
        return {"code": room.code, "name": room.name, "created_at": room.created_at}
    finally:
        db.close()


@app.get("/api/rooms/{code}")
def get_room(code: str):
    db = SessionLocal()
    try:
        room = db.query(Room).filter(Room.code == code.upper()).first()
        if not room:
            raise HTTPException(status_code=404, detail="Комната не найдена")
        return {"code": room.code, "name": room.name, "created_at": room.created_at}
    finally:
        db.close()


@app.get("/api/rooms/{code}/messages")
def get_messages(code: str, limit: int = 50):
    db = SessionLocal()
    try:
        msgs = (
            db.query(Message)
            .filter(Message.room_code == code.upper())
            .order_by(Message.created_at.desc())
            .limit(limit)
            .all()
        )
        return [
            {"id": m.id, "username": m.username, "text": m.text, "created_at": m.created_at}
            for m in reversed(msgs)
        ]
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}


# --- WebSocket ---
@app.websocket("/ws/{room_code}/{username}")
async def websocket_endpoint(ws: WebSocket, room_code: str, username: str):
    room_code = room_code.upper()
    db = SessionLocal()
    try:
        room = db.query(Room).filter(Room.code == room_code).first()
        if not room:
            await ws.close(code=4004)
            return
    finally:
        db.close()

    await manager.connect(room_code, ws)
    # Уведомить всех о входе
    await manager.broadcast(room_code, {
        "type": "system",
        "text": f"{username} вошёл в чат",
        "created_at": datetime.utcnow().isoformat(),
    })
    try:
        while True:
            data = await ws.receive_text()
            payload = json.loads(data)
            text = payload.get("text", "").strip()
            if not text:
                continue
            # Сохранить в БД
            db = SessionLocal()
            try:
                msg = Message(room_code=room_code, username=username, text=text)
                db.add(msg)
                db.commit()
                db.refresh(msg)
                msg_id = msg.id
                created = msg.created_at
            finally:
                db.close()
            # Разослать всем
            await manager.broadcast(room_code, {
                "type": "message",
                "id": msg_id,
                "username": username,
                "text": text,
                "created_at": created.isoformat(),
            })
    except WebSocketDisconnect:
        manager.disconnect(room_code, ws)
        await manager.broadcast(room_code, {
            "type": "system",
            "text": f"{username} покинул чат",
            "created_at": datetime.utcnow().isoformat(),
        })
