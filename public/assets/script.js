window.addEventListener('keydown',
  function(event) {
    console.log("Tast trykket:", event.key);
    if (event.key === "Escape") {
      console.log("Escape blev trykket!")
  }
})

let input = document.querySelector("input")
input.addEventListener("input", function(event) {
    console.log("Value:", event.target.value)
})
let form = document.querySelector("form")
form.addEventListener("submit", function(event) {
    // event.preventDefault() // Stopper form submission
    console.log("Form blev submitted")
    console.log("Form data:", new FormData(form))
})

let messageInput = document.getElementById('message-input')
let counter = document.getElementById("char-count")
let container = document.querySelector(".char-counter")

input.addEventListener("input", function(event) {
    let length = event.target.value.length
    counter.innerText = length

    //Fjern alle klasser
    container.classList.remove("warning", "danger")

    // Tilføj passende klasser baseret på længde
    if (length > 200) {
        container.classList.add("danger")
    } else if (length > 150) {
        container.classList.add("warning")
    }
})