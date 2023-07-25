// Load the pre-trained Haar Cascade classifier for face detection
const faceCascade = new cv.CascadeClassifier();
const faceCascadeFile = "haarcascade_frontalface_default.xml";

faceCascade.load(faceCascadeFile);

document.addEventListener("DOMContentLoaded", function () {
  var loginButton = document.getElementById("login_button");
  loginButton.addEventListener("click", Login);

  var registerButton = document.getElementById("register_button");
  registerButton.addEventListener("click", openRegisterPopup);

  var tryAgainButton = document.getElementById("try_again_button");
  tryAgainButton.addEventListener("click", tryAgain);

  var closeButtons = document.getElementsByClassName("close-btn");
  for (var i = 0; i < closeButtons.length; i++) {
    closeButtons[i].addEventListener("click", closePopup);
  }
});

function openRegisterPopup() {
  document.getElementById("register_popup").classList.add("active");
}

function closePopup() {
  document.getElementById("register_popup").classList.remove("active");
}

function Register() {
  var video = document.getElementById("video");
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert the canvas image to OpenCV image format
  var cvImage = new cv.Mat(canvas.height, canvas.width, cv.CV_8UC4);
  cv.imshow(canvas, cvImage);

  // Convert the OpenCV image to grayscale for face detection
  var grayImage = new cv.Mat();
  cv.cvtColor(cvImage, grayImage, cv.COLOR_RGBA2GRAY);

  // Detect faces in the grayscale image using Haar Cascade classifier
  var faces = new cv.RectVector();
  faceCascade.detectMultiScale(grayImage, faces);

  // Release memory occupied by the OpenCV images
  cvImage.delete();
  grayImage.delete();

  // Check if any faces were detected
  if (faces.size() === 0) {
    alert("No face detected. Please try again.");
    return;
  }

  var picturePreview = document.getElementById("register_image");
  picturePreview.src = canvas.toDataURL("image/jpeg");

  document.getElementById("register_popup").classList.add("active");
}

function savePicture() {
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  var picturePreview = document.getElementById("register_image");
  picturePreview.src = canvas.toDataURL("image/jpeg");

  // Convert the data URL to a base64-encoded string
  var dataURL = picturePreview.src;

  var pictureName = document.getElementById("picture_name").value.trim();

  if (!pictureName) {
    alert("Please enter a picture name.");
    return;
  }

  fetch("/save_picture", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Send the image data as base64-encoded string
    body: JSON.stringify({ picture: dataURL, name: pictureName }),
  })
    .then(function (response) {
      if (response.ok) {
        alert("Picture saved successfully!");
        closePopup();
      } else {
        alert("Failed to save the picture.");
      }
    })
    .catch(function (error) {
      alert("An error occurred while saving the picture.");
      console.error("Error:", error);
    });
}

function tryAgain() {
  var video = document.getElementById("video");
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  var picturePreview = document.getElementById("register_image");
  picturePreview.src = canvas.toDataURL("image/jpeg");
}

function Login() {
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  var picturePreview = document.getElementById("register_image");
  picturePreview.src = canvas.toDataURL("image/jpeg");

  // Convert the data URL to a base64-encoded string
  var dataURL = picturePreview.src;

  fetch("/compare_picture", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Send the image data as base64-encoded string
    body: JSON.stringify({ picture: dataURL }),
  })
    .then(function (response) {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Failed to compare the picture.");
      }
    })
    .then(function (data) {
      if (data.match) {
        alert("Welcome, " + data.name + "!");
      } else {
        alert("No match found.");
      }
    })
    .catch(function (error) {
      alert("An error occurred while comparing the picture.");
      console.error("Error:", error);
    });
}
