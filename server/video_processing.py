import cv2
import numpy as np
import textwrap
from typing import List, Dict, Tuple
from pathlib import Path
import subprocess
import shutil

# --- UTILS ---
def _hex_to_bgr(hex_color: str) -> Tuple[int, int, int]:
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (4, 2, 0))

def _blend_rect(frame: np.ndarray, x1: int, y1: int, x2: int, y2: int, color: Tuple[int, int, int], alpha: float):
    h, w = frame.shape[:2]
    x1, x2 = max(0, min(w, x1)), max(0, min(w, x2))
    y1, y2 = max(0, min(h, y1)), max(0, min(h, y2))
    if x2 <= x1 or y2 <= y1:
        return
    overlay = frame.copy()
    cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)
    cv2.addWeighted(overlay, alpha, frame, 1.0 - alpha, 0.0, frame)

# --- DRAWING ---
def draw_annotation(frame: np.ndarray, ann: Dict, active_rank: int):
    h, w = frame.shape[:2]
    
    x, y = int(ann['x']), int(ann['y'])
    
    # Clamp
    x = max(0, min(w - 1, x))
    y = max(0, min(h - 1, y))

    marker_type = ann.get("marker_type", "dot")
    text_style = ann.get("text_style", "label")
    text = str(ann.get("text", "")).strip() or f"#{ann.get('id', '?')}"
    
    # Colors
    color = _hex_to_bgr(ann.get("color", "#3b82f6"))
    text_color = _hex_to_bgr(ann.get("text_color", "#ffffff"))
    
    size = int(ann.get("marker_size", 16))
    
    # Draw Marker
    if marker_type == "arrow":
        start_pt = (max(0, x - size * 3), max(0, y - size * 2))
        cv2.arrowedLine(frame, start_pt, (x, y), color, 3, cv2.LINE_AA, tipLength=0.2)
        cv2.circle(frame, (x, y), 5, color, -1, cv2.LINE_AA)
    elif marker_type == "pin":
        cv2.drawMarker(frame, (x, y), color, cv2.MARKER_DIAMOND, size * 2, 2)
        cv2.circle(frame, (x, y), 4, (255, 255, 255), -1, cv2.LINE_AA)
    else:  # dot
        cv2.circle(frame, (x, y), size, color, 2, cv2.LINE_AA)
        cv2.circle(frame, (x, y), max(4, int(size * 0.3)), (255, 255, 255), -1, cv2.LINE_AA)

    # Draw Text
    wrapped_text = textwrap.shorten(text, width=60, placeholder="...")
    
    # Calculate adaptive background color based on text color luminance
    # text_color is (B, G, R)
    lum = (0.299 * text_color[2] + 0.587 * text_color[1] + 0.114 * text_color[0]) / 255
    is_dark_text = lum < 0.5
    
    if text_style == "headline":
        # Cinematic lower-third style
        y_base = h - 60 - (active_rank * 50)
        bg_color = (245, 245, 245) if is_dark_text else (10, 10, 10)
        _blend_rect(frame, 20, y_base - 30, w // 2, y_base + 10, bg_color, 0.7)
        cv2.rectangle(frame, (20, y_base - 30), (24, y_base + 10), color, -1) # Accent bar
        cv2.putText(frame, wrapped_text, (34, y_base), cv2.FONT_HERSHEY_SIMPLEX, 0.8, text_color, 2, cv2.LINE_AA)

    elif text_style == "callout":
        # Box with line to marker
        box_w, box_h = 240, 60
        bx = max(20, min(w - box_w - 20, x + 40))
        by = max(20, min(h - box_h - 20, y - 40))
        
        bg_color = (240, 240, 240) if is_dark_text else (20, 20, 20)
        _blend_rect(frame, bx, by, bx + box_w, by + box_h, bg_color, 0.8)
        cv2.rectangle(frame, (bx, by), (bx + box_w, by + box_h), color, 2)
        cv2.line(frame, (bx, by + box_h // 2), (x, y), color, 2, cv2.LINE_AA)
        
        cv2.putText(frame, wrapped_text, (bx + 10, by + 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, text_color, 1, cv2.LINE_AA)

    else: # label (floating near marker)
        (tw, th), _ = cv2.getTextSize(wrapped_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
        tx = max(10, min(w - tw - 10, x + size + 10))
        ty = max(th + 10, min(h - 10, y))
        
        bg_color = (245, 245, 245) if is_dark_text else (10, 10, 10)
        _blend_rect(frame, tx - 5, ty - th - 5, tx + tw + 5, ty + 5, bg_color, 0.7)
        cv2.putText(frame, wrapped_text, (tx, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.7, text_color, 2, cv2.LINE_AA)

def render_video(input_path: str, output_path: str, annotations: List[Dict], keep_audio: bool = True):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise ValueError("Could not open video")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Temporary render path (no audio)
    temp_render = output_path.replace(".mp4", "_temp.mp4")
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_render, fourcc, fps, (width, height))

    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        current_time = frame_idx / fps
        
        # Filter active annotations
        active = []
        for ann in annotations:
            start = ann['time_sec']
            end = start + ann['duration_sec']
            if start <= current_time <= end:
                active.append(ann)
        
        for i, ann in enumerate(active):
            draw_annotation(frame, ann, i)
            
        out.write(frame)
        frame_idx += 1
        
    cap.release()
    out.release()
    
    # Merge Audio
    if keep_audio and shutil.which("ffmpeg"):
        cmd = [
            "ffmpeg", "-y",
            "-i", temp_render,
            "-i", input_path,
            "-map", "0:v", "-map", "1:a?",
            "-c:v", "copy", "-c:a", "aac",
            "-shortest", output_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        Path(temp_render).unlink(missing_ok=True)
    else:
        shutil.move(temp_render, output_path)

    return output_path
