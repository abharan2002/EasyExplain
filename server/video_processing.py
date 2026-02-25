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
    radius = size // 2
    text_size_px = int(ann.get("text_size", 16))
    font_weight = str(ann.get("font_weight", "700"))
    thickness = 2 if int(font_weight) >= 600 else 1
    font_scale = text_size_px / 22.0 # Approximation for HERSHEY_SIMPLEX

    # Draw Marker
    if marker_type == "arrow":
        start_pt = (max(0, x - size * 2), max(0, y - size * 2))
        cv2.arrowedLine(frame, start_pt, (x, y), color, 3, cv2.LINE_AA, tipLength=0.3)
    elif marker_type == "pin":
        cv2.circle(frame, (x, y - radius), radius, color, -1, cv2.LINE_AA)
        cv2.drawMarker(frame, (x, y), color, cv2.MARKER_TILTED_CROSS, radius, 2)
    else:  # dot
        # White border
        cv2.circle(frame, (x, y), radius + 2, (255, 255, 255), -1, cv2.LINE_AA)
        # Colored center
        cv2.circle(frame, (x, y), radius, color, -1, cv2.LINE_AA)

    # Draw Text
    wrapped_text = textwrap.shorten(text, width=60, placeholder="...")
    (tw, th), _ = cv2.getTextSize(wrapped_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)
    
    # Calculate adaptive background color based on text color luminance
    lum = (0.299 * text_color[2] + 0.587 * text_color[1] + 0.114 * text_color[0]) / 255
    is_dark_text = lum < 0.5
    bg_color = (245, 245, 245) if is_dark_text else (15, 15, 15)
    
    if text_style == "headline":
        # Cinematic lower-third style
        y_base = h - 100 - (active_rank * 60)
        _blend_rect(frame, 40, y_base - th - 20, 40 + tw + 40, y_base + 20, bg_color, 0.8)
        cv2.rectangle(frame, (40, y_base - th - 20), (46, y_base + 20), color, -1) # Side accent
        cv2.putText(frame, wrapped_text, (60, y_base), cv2.FONT_HERSHEY_SIMPLEX, font_scale * 1.5, text_color, thickness + 1, cv2.LINE_AA)

    elif text_style == "callout":
        # Box with line to marker
        box_w, box_h = int(tw + 40), int(th + 40)
        bx = max(20, min(w - box_w - 20, x + 40))
        by = max(20, min(h - box_h - 20, y - 60))
        
        _blend_rect(frame, bx, by, bx + box_w, by + box_h, bg_color, 0.9)
        cv2.rectangle(frame, (bx, by), (bx + box_w, by + box_h), color, 2)
        cv2.line(frame, (bx, by + box_h), (x, y), color, 2, cv2.LINE_AA)
        
        cv2.putText(frame, wrapped_text, (bx + 20, by + th + 20), cv2.FONT_HERSHEY_SIMPLEX, font_scale, text_color, thickness, cv2.LINE_AA)

    else: # label (floating near marker)
        tx = max(10, min(w - tw - 40, x + radius + 20))
        ty = max(th + 20, min(h - 20, y + th // 2))
        
        _blend_rect(frame, tx - 15, ty - th - 15, tx + tw + 15, ty + 15, bg_color, 0.8)
        cv2.rectangle(frame, (tx - 15, ty - th - 15), (tx - 11, ty + 15), color, -1) # Side accent
        cv2.putText(frame, wrapped_text, (tx, ty), cv2.FONT_HERSHEY_SIMPLEX, font_scale, text_color, thickness, cv2.LINE_AA)

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
