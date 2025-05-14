document
  .getElementById("createUserForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const response = await fetch("/api/users", {
      method: "POST",
      body: JSON.stringify({ username }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    alert(`Usuario ${data.username} creado!`);
  });

document
  .getElementById("addExerciseForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const userId = document.getElementById("userId").value;
    const description = document.getElementById("description").value;
    const duration = document.getElementById("duration").value;
    const date = document.getElementById("date").value;

    const response = await fetch("/api/exercises", {
      method: "POST",
      body: JSON.stringify({ userId, description, duration, date }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    alert(`Ejercicio agregado: ${data.description}`);
  });

document
  .getElementById("viewExercisesForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const userId = document.getElementById("userId").value;
    const response = await fetch(`/api/exercises/${userId}/log`);
    const data = await response.json();
    const exerciseLog = document.getElementById("exerciseLog");
    exerciseLog.innerHTML = `<h3>Exercise Log for ${data.username}</h3><ul>`;
    data.log.forEach((exercise) => {
      exerciseLog.innerHTML += `<li>${exercise.description} - ${exercise.duration} minutes - ${new Date(exercise.date).toDateString()}</li>`;
    });
    exerciseLog.innerHTML += `</ul>`;
  });
