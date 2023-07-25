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

  // Create a new Image object for face detection
  var img = new Image();
  img.onload = function () {
    var imageWidth = img.width;
    var imageHeight = img.height;

    // Create a new canvas for face detection
    var detectionCanvas = document.createElement("canvas");
    detectionCanvas.width = imageWidth;
    detectionCanvas.height = imageHeight;
    var detectionContext = detectionCanvas.getContext("2d");
    detectionContext.drawImage(img, 0, 0, imageWidth, imageHeight);

    // Convert the detection canvas to a data URL
    var detectionDataURL = detectionCanvas.toDataURL("image/jpeg");

    // Send the data URL for face detection to the server
    fetch("/compare_picture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ picture: detectionDataURL }),
    })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Failed to compare the picture.");
        }
      })
      .then(function (data) {
        if (data.error) {
          // Error occurred during face comparison, inform the user
          alert(data.error);
        } else if (data.match) {
          // Face detected, proceed with saving the picture
          var pictureName = document
            .getElementById("picture_name")
            .value.trim();
          if (!pictureName) {
            alert("Please enter a picture name.");
            return;
          }

          // Save the picture
          fetch("/save_picture", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
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
        } else {
          // No face detected, inform the user
          alert("No face detected. Please try again.");
        }
      })
      .catch(function (error) {
        alert("An error occurred while comparing the picture.");
        console.error("Error:", error);
      });
  };
  img.src = dataURL;
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
