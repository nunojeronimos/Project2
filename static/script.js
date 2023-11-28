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

  var meetingLink = document.getElementById("meeting_link");
  meetingLink.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent the default behavior of the anchor tag
    loadMeetingsPage(); // Implement a function to load meetings dynamically
  });

  var votationLink = document.getElementById("meeting_link");
  votationLink.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent the default behavior of the anchor tag
    loadVotationPage(); // Implement a function to load meetings dynamically
  });

  setInterval(performFaceRecognition, 5000); // Perform face recognition every 5 seconds
});

function openRegisterPopup() {
  document.getElementById("register_popup").classList.add("active");
}

function closePopup() {
  document.getElementById("register_popup").classList.remove("active");
}

function Register() {
  captureImage();
  document.getElementById("register_popup").classList.add("active");
}

function captureImage() {
  var video = document.getElementById("video");
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  var picturePreview = document.getElementById("register_image");
  picturePreview.src = canvas.toDataURL("image/jpeg");
}

function savePicture() {
  var picturePreview = document.getElementById("register_image");
  var dataURL = picturePreview.src;

  var pictureName = document.getElementById("picture_name").value.trim();

  if (!pictureName) {
    alert("Please enter a picture name.");
    return;
  }

  // Create an image element to perform face detection
  var img = new Image();
  img.src = dataURL;

  img.onload = function () {
    // Create a canvas to draw the image and perform face detection
    var tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    var context = tempCanvas.getContext("2d");
    context.drawImage(img, 0, 0);

    // Perform face detection using the canvas image data
    var faceData = tempCanvas.toDataURL("image/jpeg");

    fetch("/check_name", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: pictureName }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.exists) {
          alert("That name already exists. Please choose another.");
        } else {
          fetch("/compare_picture", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ picture: faceData }),
          })
            .then(function (response) {
              return response.json();
            })
            .then(function (data) {
              if (data.match) {
                if (!data.error) {
                  // If a face is detected and there's no error, proceed to save the picture
                  fetch("/save_picture", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      picture: dataURL,
                      name: pictureName,
                    }),
                  })
                    .then(function (response) {
                      if (response.ok) {
                        alert("Picture saved successfully!");
                        closePopup();
                      } else {
                        throw new Error("Failed to save the picture.");
                      }
                    })
                    .catch(function (error) {
                      alert("An error occurred while saving the picture.");
                      console.error("Error:", error);
                    });
                } else {
                  alert("An error occurred: " + data.error);
                }
              } else {
                alert("No face detected. Please try again.");
              }
            });
        }
      })
      .catch(function (error) {
        alert("An error occurred while comparing the picture.");
        console.error("Error:", error);
      });
  };
}

function tryAgain() {
  var video = document.getElementById("video");
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  var picturePreview = document.getElementById("register_image");
  picturePreview.src = canvas.toDataURL("image/jpeg");

  console.log("por favor funciona");
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
        window.location.href = `/profile?name=${data.name}`;
      } else {
        alert("No match found.");
      }
    })
    .catch(function (error) {
      alert("An error occurred while comparing the picture.");
      console.error("Error:", error);
    });
}

function loadMeetingsPage() {
  // Use AJAX or other methods to load content dynamically
  // You can use fetch or other libraries to fetch the content and update the DOM
  // For simplicity, you can redirect to the meetings page directly
  window.location.href = "/meatings";
}

function loadVotationPage() {
  // Use AJAX or other methods to load content dynamically
  // You can use fetch or other libraries to fetch the content and update the DOM
  // For simplicity, you can redirect to the meetings page directly
  window.location.href = "/votation";
}

function performFaceRecognition() {
  console.log("performFaceRecognition started");
  var video = document.getElementById("video");
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
        console.log("mach is being found " + data.match);
        return response.json();
      } else {
        throw new Error("Failed to compare the picture.");
      }
    })
    .then(function (data) {
      if (!data.match) {
        console.log("mach wasnr found");
        // Redirect to the home page if no match is found
        window.location.href = "/";
      }
    })
    .catch(function (error) {
      console.error("Error:", error);
    });
}

function submitVotation() {
  var rating = document.getElementById("votationRating").value;

  fetch("/submit_votation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "{{ user_name }}", // Pass the logged-in user's name
      rating: rating,
    }),
  })
    .then(function (response) {
      if (response.ok) {
        alert("Votation submitted successfully!");
      } else {
        throw new Error("Failed to submit votation.");
      }
    })
    .catch(function (error) {
      alert("An error occurred while submitting the votation.");
      console.error("Error:", error);
    });
}
