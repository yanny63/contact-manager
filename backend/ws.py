from fastapi import WebSocket, WebSocketException, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    async def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id not in self.active_connections:
            return
        self.active_connections[user_id].discard(websocket)
        if not self.active_connections[user_id]:
            del self.active_connections[user_id]

    async def sendToUser(self, user_id: str, payload: dict):
        sockets = self.active_connections.get(user_id)
        if not sockets:
            return
        for socket in sockets:
            try:
                await socket.send_json(payload)
            except Exception:
                self.disconnect(user_id, socket)

    async def broadcast(self, user_ids: list[str], payload):
        for user_id in user_ids:
            await self.sendToUser(user_id, payload)