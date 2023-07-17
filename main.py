import cv2
import os
import base64
import numpy as np
import io

from flask import Flask, render_template, request, Response, jsonify
from google.cloud import storage

app = Flask(__name__, static_folder='static')

camera = cv2.VideoCapture(0)

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

_BUCKET_NAME = 'jeronimo2'

def generate_frames():
    cap = cv2.VideoCapture(0)  # Change the argument to the camera index if necessary

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        # Convert the processed frame to JPEG format
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

def compare_faces(image1, image2):
    # Convert images to grayscale
    gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)

    # Detect faces in the images
    faces1 = face_cascade.detectMultiScale(gray1, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    faces2 = face_cascade.detectMultiScale(gray2, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    # Iterate over the detected faces in image1
    for (x1, y1, w1, h1) in faces1:
        # Iterate over the detected faces in image2
        for (x2, y2, w2, h2) in faces2:
            # Compute the Euclidean distance between the face regions
            distance = np.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

            # If the distance is below a certain threshold, consider it a match
            if distance < 50:
                return True

    return False
        
@app.route("/try_again", methods=["POST"])
def try_again():
    try:
        picture_data = request.get_data()
        picture_name = request.args.get("name")

        if picture_data and picture_name:
            picture_path = os.path.join("db", f"{picture_name}.jpg")
            with open(picture_path, "wb") as f:
                f.write(base64.b64decode(picture_data.split(",")[1]))
            return "New picture saved successfully!", 200
        else:
            return "Invalid picture data or picture name received.", 400
    except Exception as e:
        print("Error saving the new picture:")
        print(traceback.format_exc())
        return "Failed to save the new picture.", 500

@app.route("/")
def home():
    return render_template("index.html")

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

import traceback

def save_picture():
    try:
        data = request.json
        picture_data = data.get("picture")
        picture_name = data.get("name")

        if picture_data and picture_name:
            # Create a client to interact with Google Cloud Storage
            client = storage.Client()

            # Get the "jeronimo" bucket (replace "jeronimo" with your actual bucket name)
            bucket = client.bucket("jeronimo")

            # Convert the base64 image to bytes
            image_bytes = base64.b64decode(picture_data.split(",")[1])

            # Upload the image to the bucket
            blob = bucket.blob(f"{picture_name}.jpg")
            blob.upload_from_file(
                io.BytesIO(image_bytes),
                content_type="image/jpeg"
            )

            return "Picture saved successfully!", 200
        else:
            return "Invalid picture data or picture name received.", 400
    except Exception as e:
        print("Error saving the picture:")
        print(traceback.format_exc())
        return "Failed to save the picture.", 500

@app.route("/compare_picture", methods=["POST"])
def compare_picture():
    try:
        data = request.json
        picture_data = data.get("picture")

        if picture_data:
            # Convert the base64 image to NumPy array
            nparr = np.frombuffer(base64.b64decode(picture_data.split(",")[1]), np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Compare the image with the pictures in the database
            db_folder = "db"
            match = False
            name = ""

            for file_name in os.listdir(db_folder):
                file_path = os.path.join(db_folder, file_name)
                known_image = cv2.imread(file_path)

                # Compare the images using the face recognition algorithm
                if compare_faces(image, known_image):
                    match = True
                    name = file_name.split(".")[0]
                    break

            if match:
                return jsonify({"match": True, "name": name})
            else:
                return jsonify({"match": False})
        else:
            return jsonify({"error": "Invalid picture data received."}), 400
    except Exception as e:
        print("Error comparing the picture:")
        print(traceback.format_exc())
        return jsonify({"error": "Failed to compare the picture."}), 500



if __name__ == '__main__':
    app.run(debug=True)
