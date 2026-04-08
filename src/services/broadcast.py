import asyncio
import logging
from typing import Any

logger = logging.getLogger(__name__)


class BroadcastService:
    def __init__(self) -> None:
        self._broadcast_queue: asyncio.Queue | None = None
        self._subscribers: list[asyncio.Queue] = []

    def initialize(self) -> None:
        self._broadcast_queue = asyncio.Queue()
        self._subscribers = []

    async def subscribe(self) -> asyncio.Queue:
        if self._broadcast_queue is None:
            raise RuntimeError("BroadcastService not initialized")
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(queue)
        logger.info(f"SSE client subscribed (total: {len(self._subscribers)})")
        return queue

    async def unsubscribe(self, queue: asyncio.Queue) -> None:
        if queue in self._subscribers:
            self._subscribers.remove(queue)
            logger.info(f"SSE client unsubscribed (total: {len(self._subscribers)})")

    async def broadcast(self, data: list[dict[str, Any]]) -> None:
        if not self._subscribers:
            return
        for queue in self._subscribers:
            try:
                queue.put_nowait(data)
            except asyncio.QueueFull:
                logger.warning("SSE queue full, dropping message")
        logger.debug(f"Broadcast to {len(self._subscribers)} subscribers")


broadcast_service = BroadcastService()


__all__ = [
    "BroadcastService",
    "broadcast_service",
]
