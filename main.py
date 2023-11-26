import cv2
import os
import base64
import numpy as np
import io
import traceback
import random
from flask import Flask, render_template, request, Response, jsonify
from google.cloud import storage
from google.auth import compute_engine

app = Flask(__name__, static_folder='static')

camera = cv2.VideoCapture(0)

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


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

def augment_image(image):
    # Randomly apply rotation
    angle = random.uniform(-15, 15)  # Adjust the range as needed
    rows, cols, _ = image.shape
    M = cv2.getRotationMatrix2D((cols / 2, rows / 2), angle, 1)
    rotated_image = cv2.warpAffine(image, M, (cols, rows))

    # Generate random noise and add it to the image
    noise = np.random.randn(*image.shape).astype(np.uint8) * 25
    noisy_image = cv2.add(rotated_image, noise)

    # Randomly adjust brightness and contrast
    alpha = random.uniform(0.7, 1.3)  # Adjust the range as needed
    beta = random.uniform(-30, 30)     # Adjust the range as needed
    augmented_image = cv2.convertScaleAbs(noisy_image, alpha=alpha, beta=beta)
    return augmented_image


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

@app.route("/save_picture", methods=["POST"])
def save_picture():
    try:
        data = request.json
        picture_data = data.get("picture")
        picture_name = data.get("name")

        if picture_data and picture_name:
            # Decode the base64 image data
            image_data = base64.b64decode(picture_data.split(",")[1])

            # Define the folder path for the user
            user_folder = f"user_{picture_name}"

            # Save the picture to Google Cloud Storage
            bucket_name = "jeronimo4"  # Replace with your actual bucket name
            client = storage.Client()
            bucket = client.bucket(bucket_name)

            # Create the user's folder if it doesn't exist
            user_blob = bucket.blob(user_folder + "/")
            user_blob.upload_from_string("")

            # Create the augmented_images directory inside the user's folder
            augmented_images_blob = bucket.blob(f"{user_folder}/augmented_images/")
            augmented_images_blob.upload_from_string("")

            # Upload the original picture inside the user's folder
            picture_blob = bucket.blob(f"{user_folder}/{picture_name}.jpg")
            picture_blob.upload_from_string(image_data, content_type="image/jpeg")

            # Load the original image for augmentation
            nparr = np.frombuffer(image_data, np.uint8)
            original_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Perform augmentation and save the augmented images
            for i in range(5):  # Change the number of augmented images as needed
                augmented_image = augment_image(original_image)

                # Save the augmented image to "augmented_images" folder with a unique name
                augmented_blob = bucket.blob(f"{user_folder}/augmented_images/{picture_name}_augmented_{i}.jpg")
                augmented_blob.upload_from_string(cv2.imencode('.jpg', augmented_image)[1].tobytes(), content_type="image/jpeg")
            
            return "Picture saved successfully!", 200
        else:
            return "Invalid picture data or picture name received.", 400
    except Exception as e:
        print("Error saving the picture:")
        print(traceback.format_exc())
        return "Failed to save the picture.", 500
    
@app.route("/check_name", methods=["POST"])
def check_name():
    try:
        data = request.json
        picture_name = data.get("name")

        if picture_name:
            # Check if the name already exists in your database or storage
            bucket_name = "jeronimo4"  # Replace with your actual bucket name
            client = storage.Client()
            bucket = client.bucket(bucket_name)

            for blob in bucket.list_blobs():
                existing_name = blob.name.split(".")[0]
                if existing_name == picture_name:
                    return jsonify({"exists": True})

            return jsonify({"exists": False})
        else:
            return jsonify({"exists": False})

    except Exception as e:
        print("Error checking the name:")
        print(traceback.format_exc())
        return jsonify({"exists": False})

@app.route("/compare_picture", methods=["POST"])
def compare_picture():
    try:
        data = request.json
        picture_data = data.get("picture")

        if picture_data:
            # Decode the base64 image data
            image_data = base64.b64decode(picture_data.split(",")[1])

            # Convert the image data to a NumPy array
            nparr = np.frombuffer(image_data, np.uint8)
            input_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Check if the input image is valid and not empty
            if input_image is None or input_image.size == 0:
                return jsonify({"error": "Invalid image data received."}), 400

            # Compare the input image with the original and augmented images in the Google Cloud Storage bucket
            bucket_name = "jeronimo4"  # Replace with your actual bucket name
            client = storage.Client()
            bucket = client.bucket(bucket_name)

            best_match = None
            best_match_distance = float('inf')

            for blob in bucket.list_blobs(prefix="user_"):  # Iterate through user directories
                # Extract the user's name from the directory name
                user_name = blob.name.split("/")[0].replace("user_", "")

                # Download the known image from the user's directory
                known_image_data = blob.download_as_bytes()

                # Check if the known_image_data is empty or invalid
                if not known_image_data:
                    continue

                known_image_nparr = np.frombuffer(known_image_data, np.uint8)
                known_image = cv2.imdecode(known_image_nparr, cv2.IMREAD_COLOR)

                # Check if the known_image is valid and not empty
                if known_image is None or known_image.size == 0:
                    continue

                # Compute the Euclidean distance between the face regions for the original image
                distance_original = np.sqrt(np.sum((input_image - known_image) ** 2))
                print('Original Distance: ' + distance_original)

                # Update the best match if the current user is closer with the original image
                if distance_original < best_match_distance:
                    best_match_distance = distance_original
                    best_match = user_name
                    print('Best match in original: ' + str(distance_original))

                # Now, let's compare with the augmented images
                augmented_folder_blobs = []
                augmented_folder_prefix = f"{blob.name}"
                augmented_blob = bucket.get_blob(augmented_folder_prefix)
                print("Folder Prefix: " + augmented_folder_prefix)

                if augmented_blob:
                    print(f"Blob Name: {augmented_blob.name}")
                    augmented_folder_blobs = list(bucket.list_blobs(prefix=augmented_folder_prefix))
                    print(f"Number of blobs in augmented_images folder: {len(augmented_folder_blobs)}")
                else:
                    print("No blobs found in augmented_images folder.")
                
                for augmented_blob in augmented_folder_blobs:  # Iterate through augmented images
                    augmented_image_data = augmented_blob.download_as_bytes()
                    print("Blob Name:", augmented_blob.name)

                    if not augmented_image_data:
                        continue

                    augmented_image_nparr = np.frombuffer(augmented_image_data, np.uint8)
                    augmented_image = cv2.imdecode(augmented_image_nparr, cv2.IMREAD_COLOR)

                    # Check if the augmented_image is valid and not empty
                    if augmented_image is None or augmented_image.size == 0:
                        continue

                    # Compute the Euclidean distance between the face regions for the augmented image
                    distance_augmented = np.sqrt(np.sum((input_image - augmented_image) ** 2))
                    print('Augmented image distance:' + distance_augmented)

                    # Update the best match if the current user is closer with the augmented image
                    if distance_augmented < best_match_distance:
                        best_match_distance = distance_augmented
                        best_match = user_name
                        print('Best match in aug_data: ' + str(distance_augmented))

            if best_match is not None:
                return jsonify({"match": True, "name": best_match})
            else:
                return jsonify({"match": False, "error": "No face detected or no matching user."})
        else:
            return jsonify({"error": "Invalid picture data received."}), 400
    except Exception as e:
        print("Error comparing the picture:")
        print(traceback.format_exc())
        return jsonify({"error": "Failed to compare the picture."}), 500


@app.route("/profile")
def profile():
    user_name = request.args.get("name")
    return render_template("profile.html", user_name=user_name)

@app.route("/meetings")
def meetings():
    user_name = request.args.get("name")
    return render_template("meetings.html", user_name=user_name)

@app.route("/votation")
def votation():
    user_name = request.args.get("name")
    return render_template("votation.html", user_name=user_name)    

if __name__ == '__main__':
    app.run(debug=True)