const form = document.querySelector("#form");
const fileData = form.querySelector("#file-data");
const folderData = form.querySelector("#verify-data");
const dataExport = document.querySelector("#data-exported");

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
}

function processVerifyData(e) {
  e.preventDefault();
  if (!isExcelFile(fileData.files[0]))
    alertError("The File Fomart Is Not Correct!!!");
  if (!isfolderImage(folderData.files))
    alertError("The Folder Data Fomart Is Not Correct!!!");

  const pathFileData = fileData.files[0].path;
  const pathFolderData = folderData.files[0].path.substring(
    0,
    folderData.files[0].path.length - (folderData.files[0].name.length + 1)
  );
  ipcRenderer.send("data:verify", {
    pathFileData,
    pathFolderData,
  });
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
    element.innerHTML = data.message;
    dataExport.appendChild(element);
    updateScroll();
    return 0;
  }, 500);
  return 0;
});

ipcRenderer.on("process:done", (data) => alertSuccess(data));

ipcRenderer.on("process:error", (data) => alertError(data));

function alertSuccess(message) {
  Toastify.toast({
    text: message,
    duration: 100,
    close: false,
    style: {
      background: "green",
      color: "white",
      textAlign: "center",
    },
  });
}

function alertError(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: "red",
      color: "white",
      textAlign: "center",
    },
  });
}

// Form submit listener
form.addEventListener("submit", processVerifyData);

form.addEventListener("click", (e) => {
  if (e.target.matches("#verify")) dataExport.innerHTML = "";
});
