"""Brands list endpoint."""
from typing import Dict

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from core.db import db
from core.helpers import _clean_many

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("")
async def list_brands(_: Dict = Depends(get_current_user)):
    return _clean_many(await db.brands.find().to_list(1000))
