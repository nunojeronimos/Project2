/*document.addEventListener("DOMContentLoaded", function () {
  var button = document.getElementById("login_button");
  button.addEventListener("click", function () {
    alert("Login");
  });
});

document.addEventListener("DOMContentLoaded", function () {
  var button = document.getElementById("register_button");
  button.addEventListener("click", function () {
    alert("Register");
  });
});
*/

document.addEventListener("DOMContentLoaded", function () {
  var loginButton = document.getElementById("login_button");
  loginButton.addEventListener("click", Login);

  var registerButton = document.getElementById("register_button");
  registerButton.addEventListener("click", openRegisterPopup);

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
  var picturePreview = document.getElementById("register_image");
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

// Add event listener for "Try Again" button
var tryAgainButton = document.getElementById("try_again_button");
tryAgainButton.addEventListener("click", tryAgain);

function Login() {
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  var dataURL = canvas.toDataURL("image/jpeg");

  fetch("/compare_picture", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

/*this is do delete again +çs work*/
