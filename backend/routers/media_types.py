"""Media type CRUD — admin-managed list of OOH ad formats."""
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user, require_admin
from core.db import db
from core.helpers import _clean, _clean_many

router = APIRouter(prefix="/media-types", tags=["media-types"])


class MediaTypeCreate(BaseModel):
    label: str
    category: str = "Custom"


@router.get("")
async def list_media_types(_: Dict = Depends(get_current_user)):
    return _clean_many(await db.media_types.find().to_list(1000))


@router.post("")
async def create_media_type(body: MediaTypeCreate, _: Dict = Depends(require_admin)):
    key = body.label.lower().replace(" ", "_")
    if await db.media_types.find_one({"key": key}):
        raise HTTPException(status_code=409, detail="Media type already exists")
    doc = {"key": key, "label": body.label, "category": body.category}
    await db.media_types.insert_one(doc)
    return _clean(doc)


@router.delete("/{mkey}")
async def delete_media_type(mkey: str, _: Dict = Depends(require_admin)):
    res = await db.media_types.delete_one({"key": mkey})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media type not found")
    return {"ok": True}
