from typing import List, Optional
from pydantic import BaseModel

class Annotation(BaseModel):
    id: int
    x: float
    y: float
    time_sec: float
    duration_sec: float = 3.0
    text: str
    marker_type: str = "dot"  # dot, arrow, pin
    text_style: str = "label" # label, callout, headline
    color: str = "#3b82f6"
    text_color: str = "#ffffff"
    marker_size: int = 16
    label_always_visible: bool = True
    
class VideoMetadata(BaseModel):
    filename: str
    duration: float
    width: int
    height: int
    fps: float

class RenderRequest(BaseModel):
    filename: str
    annotations: List[Annotation]
    keep_audio: bool = True
