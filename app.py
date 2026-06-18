from flask import Flask, render_template, request, jsonify, send_file
import yt_dlp
import os
import tempfile
import uuid

app = Flask(__name__)
DOWNLOAD_DIR = tempfile.mkdtemp()
FFMPEG_PATH = os.getenv("FFMPEG_PATH", "")


def format_duration(seconds):
    if not seconds:
        return "—"
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/info", methods=["POST"])
def get_info():
    data = request.json
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"error": "URL não informada."}), 400

    ydl_opts = {"quiet": True, "no_warnings": True}

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        seen_heights = set()
        video_formats = []

        for f in info.get("formats", []):
            height = f.get("height")
            vcodec = f.get("vcodec", "none")
            if height and vcodec != "none" and height not in seen_heights:
                seen_heights.add(height)
                video_formats.append({
                    "height": height,
                    "label": f"{height}p",
                    "ext": "mp4",
                })

        video_formats.sort(key=lambda x: x["height"], reverse=True)

        return jsonify({
            "title": info.get("title"),
            "thumbnail": info.get("thumbnail"),
            "duration": format_duration(info.get("duration")),
            "uploader": info.get("uploader"),
            "formats": video_formats,
        })

    except Exception as e:
        msg = str(e)
        if "Video unavailable" in msg:
            msg = "Vídeo indisponível ou privado."
        elif "Unable to extract" in msg or "Unsupported URL" in msg:
            msg = "Link inválido ou não suportado."
        return jsonify({"error": msg}), 400


@app.route("/download", methods=["POST"])
def download():
    data = request.json
    url = data.get("url", "").strip()
    fmt = data.get("format", "")

    if not url or not fmt:
        return jsonify({"error": "Parâmetros inválidos."}), 400

    download_id = str(uuid.uuid4())
    output_dir = os.path.join(DOWNLOAD_DIR, download_id)
    os.makedirs(output_dir)

    if fmt == "mp3":
        ydl_opts = {
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
            "outtmpl": os.path.join(output_dir, "%(title)s.%(ext)s"),
            "ffmpeg_location": FFMPEG_PATH,
            "quiet": True,
            "no_warnings": True,
        }
        mime = "audio/mpeg"
    else:
        ydl_opts = {
            "format": f"bestvideo[height<={fmt}]+bestaudio/best[height<={fmt}]",
            "merge_output_format": "mp4",
            "outtmpl": os.path.join(output_dir, "%(title)s.%(ext)s"),
            "ffmpeg_location": FFMPEG_PATH,
            "quiet": True,
            "no_warnings": True,
        }
        mime = "video/mp4"

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.extract_info(url, download=True)

        files = os.listdir(output_dir)
        if not files:
            return jsonify({"error": "O download falhou."}), 500

        filepath = os.path.join(output_dir, files[0])
        return send_file(filepath, as_attachment=True, download_name=files[0], mimetype=mime)

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    import socket
    try:
        local_ip = socket.gethostbyname(socket.gethostname())
    except Exception:
        local_ip = "127.0.0.1"

    print(f"\n✅  YT Downloader rodando!")
    print(f"   Computador:  http://localhost:5000")
    print(f"   Celular:     http://{local_ip}:5000  (mesma rede Wi-Fi)\n")
    app.run(host="0.0.0.0", port=5000, debug=False)