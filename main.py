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
from scipy.spatial import distance
from tqdm import tqdm

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

def calculate_euclidean_distance(image1, image2):
    # Flatten the 3-D arrays to 1-D arrays
    flat_image1 = image1.flatten()
    flat_image2 = image2.flatten()
    # Calculate the Euclidean distance
    return distance.euclidean(flat_image1, flat_image2)

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
                distance_original = calculate_euclidean_distance(input_image, known_image)
                print(f'Original Distance for {user_name}: {distance_original}')

                # Update the best match if the current user is closer with the original image
                if distance_original < best_match_distance:
                    best_match_distance = distance_original
                    best_match = user_name

                # Now, let's compare with the augmented images
                augmented_folder_blobs = list(bucket.list_blobs(prefix=f"{blob.name}"))

                for augmented_blob in augmented_folder_blobs:  # Iterate through augmented images
                    augmented_image_data = augmented_blob.download_as_bytes()

                    if not augmented_image_data:
                        continue

                    augmented_image_nparr = np.frombuffer(augmented_image_data, np.uint8)
                    augmented_image = cv2.imdecode(augmented_image_nparr, cv2.IMREAD_COLOR)

                    # Check if the augmented_image is valid and not empty
                    if augmented_image is None or augmented_image.size == 0:
                        continue

                    # Compute the Euclidean distance between the face regions for the augmented image
                    distance_augmented = calculate_euclidean_distance(input_image, augmented_image)
                    print(f'Augmented image distance for {user_name} ({augmented_blob.name}): {distance_augmented}')

                    # Update the best match if the current user is closer with the augmented image
                    if distance_augmented < best_match_distance:
                        best_match_distance = distance_augmented
                        best_match = user_name
                        print('Best match in aug_data: ' + str(distance_augmented))

            # Print the final best match for this user
            print(f'Best match for {user_name}: {best_match} (Distance: {best_match_distance}')

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

@app.route("/submit_votation", methods=["POST"])
def submit_votation():
    try:
        data = request.json
        user_name = data.get("name")
        rating = data.get("rating")

        # Add logic to store the votation data in your database or perform any other actions

        return "Votation submitted successfully!", 200
    except Exception as e:
        print("Error submitting votation:")
        print(traceback.format_exc())
        return "Failed to submit votation.", 500  

if __name__ == '__main__':
    app.run(debug=True)