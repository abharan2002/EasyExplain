from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import shutil
import os
from pathlib import Path
import uuid
from typing import List
import cv2

from models import Annotation, VideoMetadata, RenderRequest
from video_processing import render_video

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Mount static files for serving uploads directly
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

@app.post("/upload", response_model=VideoMetadata)
async def upload_video(file: UploadFile = File(...)):
    file_ext = Path(file.filename).suffix
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Get Metadata
    cap = cv2.VideoCapture(str(file_path))
    if not cap.isOpened():
        file_path.unlink()
        raise HTTPException(status_code=400, detail="Invalid video file")
        
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = cap.get(cv2.CAP_PROP_FRAME_COUNT) / fps if fps > 0 else 0
    cap.release()
    
    return VideoMetadata(
        filename=filename,
        duration=duration,
        width=width,
        height=height,
        fps=fps
    )

@app.post("/render")
async def render(request: RenderRequest):
    input_path = UPLOAD_DIR / request.filename
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
        
    output_filename = f"render_{Path(request.filename).stem}.mp4"
    output_path = OUTPUT_DIR / output_filename
    
    try:
        # Convert Pydantic models to dicts for processing
        anns_dict = [ann.dict() for ann in request.annotations]
        final_path = render_video(str(input_path), str(output_path), anns_dict, request.keep_audio)
        return {"url": f"/outputs/{output_filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Video Instructional AI Backend Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
