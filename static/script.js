document.addEventListener("DOMContentLoaded", function () {
  var loginButton = document.getElementById("login_button");
  loginButton.addEventListener("click", Login);

  var registerButton = document.getElementById("register_button");
  registerButton.addEventListener("click", openRegisterPopup);

  var tryAgainButton = document.getElementById("try_again_button");
  tryAgainButton.addEventListener("click", tryAgain);

  var saveButton = document.getElementById("save_button");
  saveButton.addEventListener("click", savePicture); // Call savePicture function when the Save Picture button is clicked

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

async function savePicture() {
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  var picturePreview = document.getElementById("register_image");
  picturePreview.src = canvas.toDataURL("image/jpeg");

  // Convert the data URL to a base64-encoded string
  var dataURL = picturePreview.src;

  try {
    if (response.ok) {
      const data = await response.json();
      if (data.match) {
        // Face detected, proceed with saving the picture
        var pictureName = document.getElementById("picture_name").value.trim();

        if (!pictureName) {
          alert("Please enter a picture name.");
          return;
        }

        const saveResponse = await fetch("/save_picture", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // Send the image data as base64-encoded string
          body: JSON.stringify({ picture: dataURL, name: pictureName }),
        });

        if (saveResponse.ok) {
          alert("Picture saved successfully!");
          closePopup();
        } else {
          const saveData = await saveResponse.json();
          if (saveData.error) {
            alert(saveData.error); // Handle specific error response
          } else {
            alert("Failed to save the picture.");
          }
        }
      } else {
        // No face detected
        alert("No face detected. Please try again.");
      }
    } else {
      throw new Error("Failed to compare the picture.");
    }
  } catch (error) {
    alert("An error occurred while comparing or saving the picture.");
    console.error("Error:", error);
  }
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
