from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from ultralytics import YOLO
import cv2
import math
import base64
import time
import socketio
from threading import Thread

print("Python script has started running")
app = Flask(__name__)


# Flask SocketIO initialization
flask_socketio = SocketIO(app, cors_allowed_origins="*")

# Set up a client to connect to the Node.js WebSocket server
sio = socketio.Client()

@sio.event
def connect():
    print("Connected to Node.js server")

@sio.event
def disconnect():
    print("Disconnected from Node.js server")

# Handle client connection to Flask-SocketIO server
@flask_socketio.on('connect')
def handle_connect():
    print("Client connected")

# Handle client disconnection from Flask-SocketIO server
@flask_socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

# List of RTSP streams
rtsp_streams = [
    "rtsp://192.168.1.28:5543/c09aa8be6a70054108fb66336c2b82c9/live/channel0",
    0
]

# Load the YOLO model
model = YOLO("./best.pt")

# Object classes
classNames = [
    "person", "Kartik", "kriti", "kiara", "govind", "tabu", "ronit", "baddy"
]

def object_detection(img):
    detections = []
    results = model(img, stream=True)

    for r in results:
        boxes = r.boxes

        for box in boxes:
            # Bounding box
            x1, y1, x2, y2 = box.xyxy[0]
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)  # Convert to int values

            # Draw bounding box
            cv2.rectangle(img, (x1, y1), (x2, y2), (255, 0, 255), 3)

            # Confidence
            confidence = math.ceil((box.conf[0] * 100)) / 100

            # Class name
            cls = int(box.cls[0])
            class_name = classNames[cls]
            detections.append({
                "class_name": class_name,
                "confidence": confidence,
                "bounding_box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
            })

            # Object details
            org = [x1, y1]
            font = cv2.FONT_HERSHEY_SIMPLEX
            fontScale = 1
            color = (255, 0, 0)
            thickness = 2

            cv2.putText(img, class_name, org, font, fontScale, color, thickness)
    
    return img, detections

def process_stream(rtsp_url, stream_id):
    print("Processing stream")
    cap = None  # Initialize cap with None
    
    try:
        # Initialize the VideoCapture object only if the rtsp_url is valid or if it's set to 0 for the webcam
        if rtsp_url == 0 or rtsp_url.startswith("rtsp://"):
            cap = cv2.VideoCapture(rtsp_url, cv2.CAP_DSHOW)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 10)
        else:
            print(f"Invalid RTSP URL or webcam index: {rtsp_url}")
            return

        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"Failed to capture frame from stream {stream_id}. Reconnecting...")
                cap.release()
                time.sleep(2)
                cap.open(rtsp_url)
                continue

            frame, detections = object_detection(frame)

            if detections:
                _, buffer = cv2.imencode('.jpg', frame)
                frame_data = base64.b64encode(buffer).decode('utf-8')

                sio.emit(f'detections', {'image': frame_data, 'detections': detections, 'rtsp_url': rtsp_url, 'stream_id': stream_id})

    except Exception as e:
        print(f"Error processing stream {stream_id}: {e}")
        time.sleep(5)  # Brief pause before retrying to avoid continuous error loops
    finally:
        if cap is not None:
            cap.release()  # Ensure resources are released when done



def start_streams():
    print("Starting streams")
    threads = []
    for i, rtsp_url in enumerate(rtsp_streams):
        thread = Thread(target=process_stream, args=(rtsp_url, i))
        print("thread started", thread)
        thread.daemon = True  # Ensures the thread exits when the main program does
        threads.append(thread)
        print("thread appended")
        thread.start()

if __name__ == '__main__':
    # Connect to the Node.js server
    sio.connect('http://localhost:3000')

    # Start processing streams in separate threads
    for rtsp_url in rtsp_streams:
        print('rtsp_url:', rtsp_url)
        start_streams()
        # flask_socketio.start_background_task(target=generate_frames, rtsp_url=rtsp_url)

    # Run Flask app
    flask_socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
