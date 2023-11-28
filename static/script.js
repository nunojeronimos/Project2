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
});

var isMeetingActive = false;

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

function startMeeting() {
  isMeetingActive = true;
  // Additional logic to handle starting the meeting (e.g., face recognition)
  // You can use setInterval for continuous face recognition
  setInterval(recognizeParticipants, 5000); // Adjust the interval as needed
}

function stopMeeting() {
  isMeetingActive = false;
  // Additional logic to handle stopping the meeting
  clearInterval(); // Clear the interval for face recognition
}

function recognizeParticipants() {
  if (isMeetingActive) {
    // Additional logic for face recognition
    // You can use the /compare_picture endpoint or a similar method
    // Update the participants table with the recognized participants
    updateParticipantsTable();
  }
}

function updateParticipantsTable() {
  // Fetch and update the participants table with the latest data
  // You can use AJAX or fetch to update the table asynchronously
  // Sample code (adjust as needed):
  fetch("/get_participants_data")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      // Update the participants table with the received data
      var table = document.getElementById("participantsTable");
      // Clear existing rows
      while (table.rows.length > 1) {
        table.deleteRow(1);
      }
      // Add new rows based on the received data
      data.forEach(function (participant) {
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        cell1.innerHTML = participant.name;
        cell2.innerHTML = participant.entryTime;
        cell3.innerHTML = participant.leavingTime;

        // Add buttons for entry and leaving
        var entryButton = document.createElement("button");
        entryButton.innerHTML = "Mark Entry";
        entryButton.onclick = function () {
          sendParticipantStatus("entry");
        };
        cell4.appendChild(entryButton);

        var leavingButton = document.createElement("button");
        leavingButton.innerHTML = "Mark Leaving";
        leavingButton.onclick = function () {
          sendParticipantStatus("leaving");
        };
        cell5.appendChild(leavingButton);
      });
    })
    .catch(function (error) {
      console.error("Error:", error);
    });
}

function sendParticipantStatus(status) {
  var participantName = prompt("Enter your name:");
  if (!participantName) {
    alert("Please enter your name.");
    return;
  }

  fetch("/update_participant_status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: participantName, status: status }),
  })
    .then(function (response) {
      if (response.ok) {
        alert("Participant status updated successfully!");
      } else {
        throw new Error("Failed to update participant status.");
      }
    })
    .catch(function (error) {
      alert("An error occurred while updating participant status.");
      console.error("Error:", error);
    });
}
