const form = document.querySelector("#form");
const fileData = form.querySelector("#file-data");
const folderData = form.querySelector("#verify-data");
const dataExport = document.querySelector("#data-exported");
const toastContainer = document.querySelector("#toast-container");
const toastMessage = document.querySelector("#toast-message");

// Make sure file is an image
function isExcelFile(file) {
  const acceptedImageTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  return file && acceptedImageTypes.includes(file["type"]);
}

function isfolderImage(folder) {
  const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png"];
  return (
    folder &&
    Object.values(folder).every((e) => acceptedImageTypes.includes(e["type"]))
  );
}

function updateScroll(scrolled) {
  if (!scrolled) {
    const element = document.querySelector("#data-exported");
    element.scrollTop = element.scrollHeight;
  }
  return;
}

function processVerifyData(e) {
  e.preventDefault();
  
  if (!isExcelFile(fileData.files[0])) {
    showToast(
      "The File Fomart Is Not Correct!!!",
      "bg-danger"
    );
    return;
  }

  if (!isfolderImage(folderData.files)){
    showToast(
      "The Folder Data Fomart Is Not Correct!!!",
      "bg-danger"
    );
    return;
  }


  const pathFileData = fileData.files[0].path;
  const pathFolderData = folderData.files[0].path.substring(
    0,
    folderData.files[0].path.length - (folderData.files[0].name.length + 1)
  );
  ipcRenderer.send("data:verify", {
    pathFileData,
    pathFolderData,
  });

  dataExport.textContent = '';

  return;
}

// When done, show message
ipcRenderer.on("data:done", (data) => {
  if (dataExport.values) {
    updateScroll();
  }
  setTimeout(function () {
    const element = document.createElement("li");
    data.status
      ? element.classList.add("mb-2", "text-success")
      : element.classList.add("mb-2", "text-danger");
    element.textContent = data.message;
    dataExport.appendChild(element);
    updateScroll();
    return 0;
  }, 100);
  return 0;
});

ipcRenderer.on("process:done", (data) => showToast(data, "background-success"));

ipcRenderer.on("process:error", (data) => showToast(data, "background-error"));

ipcRenderer.on("process:warning", (data) => showToast(data, "background-warning"));

function showToast(message, color) {
  toastContainer.classList.add(color);
  toastMessage.textContent = message;

  setTimeout(function(){
    toastContainer.style.width = "300px";
  }, 500);
  
  setTimeout(function(){
    toastContainer.style.width = "0";
    toastContainer.classList.remove(color)
  }, 3000);
  return; 
}

// Form submit listener
form.addEventListener("submit", processVerifyData);

toastContainer.addEventListener("click", (e)=>{
  if (e.target.matches("button")){
    toastContainer.style.width = "0";
  } 
})