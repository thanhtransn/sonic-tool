const form = document.querySelector("form");
const input = document.querySelector("#floatingInput");
const button = document.querySelector(".button")
const singIn = document.querySelector("#signIn")

form.addEventListener('submit', (e) =>{
    e.preventDefault();
    ipcRenderer.send("signin", input.value.trim());
    loading();
    return;
})

ipcRenderer.on("process:error", (data) => {
  alertError(data);
  setTimeout(function(){
    button.lastChild.remove();
    singIn.style.display = "block";
  },500)
});

function loading(){
  const wrap = document.createElement("div");
  wrap.classList.add("d-flex", "justify-content-center", "align-items-center")
  button.appendChild(wrap);
  for(let i = 0; i < 3; i++){
    setTimeout(function(){
      const div = document.createElement("div");
      const span = document.createElement("span");
      div.classList.add("spinner-grow", "text-primary");
      div.style.width = `${i+0.5}rem`;
      div.style.height = `${i+0.5}rem`;
      div.setAttribute("role", "status");
      span.classList.add("visually-hidden");
      span.textContent = "Loading...";
      div.appendChild(span);
      singIn.style.display = "none";
      wrap.appendChild(div);
      return
    }, i * 100);
  }
  return;
}
function alertSuccess(message) {
    Toastify.toast({
      text: message,
      duration: 500,
      close: false,
      style: {
        background: "linear-gradient(to right, #00b09b, #96c93d)",
        color: "white",
        textAlign: "center",
      },
    });
  }

  function alertError(message) {
    Toastify.toast({
      text: message,
      duration: 1000,
      close: false,
      style: {
        background: "linear-gradient(to right, #fc3d03, #fc4903)",
        color: "white",
        textAlign: "center",
      },
    });
  };