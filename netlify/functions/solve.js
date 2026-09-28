exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const question = body.question;
    const subject = body.subject || "school";

    if (!question || !question.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Please enter a question." })
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are Homework Helper, a friendly AI tutor.

The subject is ${subject}.

Help the student understand their homework. Explain clearly using simple language.

Student question:
${question}`
            }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "The AI could not answer right now." })
      };
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      statusCode: 200,
      body: JSON.stringify({ answer: answer || "No answer was returned." })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong." })
    };
  }
};
