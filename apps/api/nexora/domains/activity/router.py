"""REST and WebSocket router for Realtime Organizational Activity."""

import asyncio
import json
import uuid
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from nexora.domains.activity.broadcaster import activity_broadcaster
from nexora.domains.activity.schemas import ActivityEvent, ActivityEventType, ActivitySeverity

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/companies/{company_id}/activity", tags=["Realtime Activity"])


@router.get("", response_model=list[ActivityEvent])
async def get_recent_activity(
    company_id: str,
    agent: str | None = Query(None, description="Filter by agent name substring"),
    department: str | None = Query(None, description="Filter by department name substring"),
    project: str | None = Query(None, description="Filter by project name substring"),
    event: str | None = Query(None, description="Filter by event type"),
    severity: str | None = Query(None, description="Filter by severity level"),
    limit: int = Query(50, ge=1, le=200),
):
    """Retrieve recent activity events with server-side filtering."""
    return activity_broadcaster.get_recent_events(
        company_id=company_id,
        agent=agent,
        department=department,
        project=project,
        event_type=event,
        severity=severity,
        limit=limit,
    )


@router.post("/emit", response_model=ActivityEvent)
async def emit_activity_event(
    company_id: str,
    event: ActivityEvent,
):
    """Emit an activity event into the organization's realtime stream."""
    event.company_id = company_id
    await activity_broadcaster.broadcast(company_id, event)
    return event


@router.websocket("/ws")
async def activity_websocket(
    websocket: WebSocket,
    company_id: str,
):
    """Realtime WebSocket endpoint streaming organizational activity events live as they occur."""
    await activity_broadcaster.connect_ws(company_id, websocket)
    try:
        # Send initial recent events to hydrate client immediately upon connect
        recent = activity_broadcaster.get_recent_events(company_id=company_id, limit=20)
        for ev in reversed(recent):
            await websocket.send_text(json.dumps(ev.model_dump(mode="json")))

        # Keep connection open & handle incoming client messages (e.g. heartbeat ping/pong)
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        await activity_broadcaster.disconnect_ws(company_id, websocket)
    except Exception as e:
        logger.warning("websocket_error", company_id=company_id, error=str(e))
        await activity_broadcaster.disconnect_ws(company_id, websocket)


@router.get("/stream")
async def activity_sse_stream(
    company_id: str,
):
    """Server-Sent Events (SSE) fallback transport streaming live organizational activity events."""
    queue = await activity_broadcaster.connect_sse(company_id)

    async def event_generator():
        try:
            # Yield initial recent events
            recent = activity_broadcaster.get_recent_events(company_id=company_id, limit=20)
            for ev in reversed(recent):
                data = json.dumps(ev.model_dump(mode="json"))
                yield f"data: {data}\n\n"

            while True:
                ev = await queue.get()
                data = json.dumps(ev.model_dump(mode="json"))
                yield f"data: {data}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            await activity_broadcaster.disconnect_sse(company_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
