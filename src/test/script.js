const MULTION_API_KEY = '1f8bb11dc9894d62a4625bcc76c913aa'; // Manually set your API key

async function executeMultiOn(actionPrompt) {
  if (!MULTION_API_KEY) {
    throw new Error("MULTION_API_KEY not set");
  }

  console.log("Starting MultiOn session");
  const response = await fetch("https://api.multion.ai/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X_MULTION_API_KEY": MULTION_API_KEY, // Use the manually set API key
    },
    body: JSON.stringify({
      input: actionPrompt,
      url: "https://www.google.com",
    }),
  });

  const res = await response.json();

  const sessionId = res.response.data.session_id;
  let status = res.response.data.status;

  console.log("SESSION ID", sessionId);
  console.log("STATUS", status);

  const data = JSON.stringify(res.response.data, null, 2);
  console.log("DATA", data);

  while (status === "CONTINUE") {
    const response = await fetch(
      `https://api.multion.ai/session/${sessionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X_MULTION_API_KEY": MULTION_API_KEY, // Use the manually set API key
        },
        body: JSON.stringify({
          input: actionPrompt,
          url: "https://www.google.com",
        }),
      }
    );

    const res = await response.json();
    const data = JSON.stringify(res.response.data, null, 2);
    console.log("DATA", data);

    status = res.response.data.status;
  }
}

// Call the function with an example actionPrompt
executeMultiOn("Your action prompt here").then(() => {
  // Update HTML with response if needed
}).catch(error => {
  console.error("Error:", error);
});
