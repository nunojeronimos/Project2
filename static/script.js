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

  var submitVotationButton = document.getElementById("submit_votation_button");
  submitVotationButton.addEventListener("click", submitVotation);

  // Logic to check if the current page is the votation page
  var isVotationPage = window.location.pathname.includes("/votation");

  if (isVotationPage) {
    setInterval(function () {
      performFaceRecognition("{{ user_name }}");
    }, 2000);
  }
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
        return response.json().then(function (data) {
          if (data.error && data.error.includes("No face detected")) {
            alert("No face detected. Please try again.");
          } else {
            throw new Error(data.error || "Failed to compare the picture.");
          }
        });
      }
    })
    .then(function (data) {
      if (data.match) {
        alert("Welcome, " + data.name + "!");
        window.location.href = `/profile?name=${data.name}`;
      } else if (
        data &&
        data.error &&
        data.error.includes("No face detected")
      ) {
        // Handle the case where no face is detected
        alert("No face detected. Please try again.");
      } else {
        // Handle other cases
        alert("An error occurred while comparing the picture.");
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

function performFaceRecognition(userName) {
  var video = document.getElementById("video");

  // Create a temporary canvas element
  var tempCanvas = document.createElement("canvas");
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  var context = tempCanvas.getContext("2d");
  context.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

  // Capture the current video frame
  var picturePreview = document.createElement("img");
  picturePreview.src = tempCanvas.toDataURL("image/jpeg");

  // Convert the data URL to a base64-encoded string
  var dataURL = picturePreview.src;

  fetch("/compare_picture", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // Send the image data and user name as base64-encoded strings
    body: JSON.stringify({ picture: dataURL, name: userName }),
  })
    .then(function (response) {
      if (response.ok) {
        return response.json();
      } else {
        return response.json().then(function (data) {
          if (data.error && data.error.includes("No face detected")) {
            alert("No face detected. You will be logged out.");
            window.location.href = "/";
          } else {
            window.location.href = "/";
            throw new Error(data.error || "Failed to compare the picture.");
          }
        });
      }
    })
    .then(function (data) {
      if (data.match) {
        // Handle the result as needed
        console.log("Face recognized:", data.name);
      } else {
        if (data.error && data.error.includes("No face detected")) {
          alert("No face detected. You will be logged out.");
          window.location.href = "/";
        } else {
          alert("Your face does not correspond to the user");
          console.log("No match found.");
          window.location.href = "/";
        }
      }
    })
    .catch(function (error) {
      alert("Error during face recognition:");
      window.location.href = "/";
      console.error("Error during face recognition:", error);
    });
}

// Call performFaceRecognition with the logged-in user's name every 20 seconds
/*
setInterval(function () {
  performFaceRecognition("{{ user_name }}");
}, 20000);
*/

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
        console.log("submited!");
      } else {
        throw new Error("Failed to submit votation.");
      }
    })
    .catch(function (error) {
      alert("An error occurred while submitting the votation.");
      console.error("Error:", error);
    });
}

let participant = [];
let participantTimes = {};
let faceRecognitionInterval;

function startMeeting() {
  console.log("startMeeting");
  const video = document.getElementById("video");
  const participantList = document.getElementById("participantList");

  // Set up the face recognition interval
  faceRecognitionInterval = setInterval(() => {
    // Capture the current video frame
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const context = tempCanvas.getContext("2d");
    context.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    // Convert the data URL to a base64-encoded string
    const dataURL = tempCanvas.toDataURL("image/jpeg");

    // Perform face recognition for the current frame
    fetch("/compare_picture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Send the image data as a base64-encoded string
      body: JSON.stringify({ picture: dataURL }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.match) {
          console.log("Meeting:", data.name);
          // Check if the participant is not already in the list
          if (!participant.includes(data.name)) {
            // Add the recognized name to the participant list
            participant.push(data.name);

            // Record the join time for the participant
            participantTimes[data.name] = {
              joinTime: new Date().toLocaleTimeString(),
              leaveTime: null,
            };

            // Update the HTML list of participants
            updateParticipantList(participantList);
          }
        } else {
          console.log("No match was found");
          // Update the leave time for participants who haven't left yet
          participant.forEach((participantName) => {
            if (!participantTimes[participantName].leaveTime) {
              // Record the leave time for participants who haven't left yet
              participantTimes[participantName].leaveTime =
                new Date().toLocaleTimeString();
            }
          });

          // Remove participants who have left from the array
          participant = participant.filter(
            (participantName) => !!participantTimes[participantName].leaveTime
          );

          // Update the HTML list of participants
          updateParticipantList(participantList);
        }
      })
      .catch((error) => {
        console.error("Error during face recognition:", error);
      });
    console.log("Performing face recognition every 20 seconds");
  }, 20000); // Adjust the interval as needed
}

function stopMeeting() {
  console.log("stopMeeting");
  // Clear the face recognition interval
  clearInterval(faceRecognitionInterval);

  // Update the leave time for participants who haven't left yet
  participant.forEach((participantName) => {
    if (!participantTimes[participantName].leaveTime) {
      // Record the leave time for participants who haven't left yet
      participantTimes[participantName].leaveTime =
        new Date().toLocaleTimeString();
    }
  });

  // Update the HTML list of participants
  const participantList = document.getElementById("participantList");
  updateParticipantList(participantList);
}

function updateParticipantList(participantList) {
  // Clear the existing participant list
  participantList.innerHTML = "";

  // Add each participant to the HTML list
  participant.forEach((participant) => {
    const participantItem = document.createElement("li");
    participantItem.textContent = participant;
    participantList.appendChild(participantItem);
  });
}

function leaveMeeting(participantName) {
  // Check if the participant is in the list
  if (participant.includes(participantName)) {
    console.log(`Leaving meeting: ${participantName}`);
    // Record the leave time for the participant
    participantTimes[participantName].leaveTime =
      new Date().toLocaleTimeString();

    // Update the HTML list of participants
    const participantList = document.getElementById("participantList");
    updateParticipantList(participantList);
  }
}

function updateParticipantList(participantList) {
  // Clear the existing participant list
  participantList.innerHTML = "";

  // Add each participant to the HTML list with join and leave times
  participant.forEach((participant) => {
    const participantItem = document.createElement("li");
    participantItem.textContent = `${participant} (Joined: ${
      participantTimes[participant].joinTime
    }, Left: ${participantTimes[participant].leaveTime || "Not left yet"})`;
    participantList.appendChild(participantItem);
  });
}
