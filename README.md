# EasyExplain 🎥✨

**EasyExplain** is a premium, high-fidelity video annotation studio designed to create professional instructional content with ease. Featuring a world-class "dark mode" interface, cinematic controls, and an intelligent timeline, it allows creators to overlay precise markers and instructions onto footage in minutes.

![Redesign Preview](https://via.placeholder.com/1200x600/020202/FFFFFF?text=EasyExplain+Studio+Interface)

## ✨ Features

- **Professional Studio UI:** A sleek, high-end dark interface built with Radix UI and Framer Motion.
- **Precision Annotation:** Place Dot, Arrow, or Pin markers with pixel-perfect accuracy.
- **Adaptive Typography:** Smart label backgrounds that adjust based on text luminance for perfect legibility.
- **Cinematic Timeline:** A pro-grade editing track with draggable clips and a high-fidelity playhead.
- **Glassmorphism Controls:** Floating "Island" controls with real-time scrubbing and volume management.
- **Production Export:** Render and download your final MP4 with all annotations baked in.

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** (for the backend engine)
- **Node.js 18+** (for the frontend studio)
- **FFmpeg** (required for video rendering and audio merging)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/easyexplain.git
   cd easyexplain
   ```

2. **Setup the Backend:**
   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../client
   npm install
   ```

### Running the App

1. **Start the Backend (Port 8000):**
   ```bash
   cd server
   python main.py
   ```

2. **Start the Frontend (Dev Mode):**
   ```bash
   cd client
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

## 🛠️ Usage

1. **Import:** Drag and drop an MP4 or MOV file into the studio.
2. **Annotate:** Scrub to a timestamp, choose your marker style, and click anywhere on the video.
3. **Configure:** Use the Inspector sidebar to adjust text, colors, size, and display duration.
4. **Sequence:** Move clips on the timeline to synchronize instructions perfectly with the footage.
5. **Export:** Click "Export Production" to render the final master file.

## 🤝 Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Built with ❤️ for creators everywhere.
