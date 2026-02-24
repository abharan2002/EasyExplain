export interface Annotation {
  id: number;
  x: number;
  y: number;
  time_sec: number;
  duration_sec: number;
  text: string;
  marker_type: 'dot' | 'arrow' | 'pin';
  text_style: 'label' | 'callout' | 'headline';
  color: string;
  text_color: string;
  marker_size: number;
  label_always_visible: boolean;
}

export interface VideoMetadata {
  filename: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  url: string;
}
