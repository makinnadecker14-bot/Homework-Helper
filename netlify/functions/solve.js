exports.handler = async function(event) {

  try {

    if (event.httpMethod !== "POST") {

      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Only POST requests are allowed."
        })
      };

    }

    const body = JSON.parse(event.body || "{}");

    const question = String(body.question || "").trim();

    const subject = String(
      body.subject || "School"
    );

    if (!question) {

      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Please enter a homework question."
        })
      };

    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {

      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Gemini API key is not configured in Netlify."
        })
      };

    }

    const controller = new AbortController();

    const timeout = setTimeout(function() {
      controller.abort();
    }, 30000);

    const prompt = `
You are Homework Helper, a friendly AI tutor.

The student is asking a ${subject} homework question.

Help the student understand the answer instead of just giving a random answer.

Use simple language appropriate for a student.

For math:
- Show the steps.
- Explain how you got the answer.

For science:
- Explain the concept clearly.
- Give an example when useful.

For English:
- Help with grammar, reading, writing, vocabulary, and literature.
- Explain why the answer is correct.

For history:
- Give accurate factual information.
- Explain important dates, people, causes, and effects when relevant.

Student question:

${question}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        }),

        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    if (!response.ok) {

      const googleError =
        data?.error?.message ||
        "Gemini returned an error.";

      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: googleError
        })
      };

    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(function(part) {
          return part.text || "";
        })
        .join("")
        .trim();

    if (!answer) {

      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Gemini did not return an answer."
        })
      };

    }

    return {
      statusCode: 200,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        answer: answer
      })
    };

  } catch (error) {

    if (error.name === "AbortError") {

      return {
        statusCode: 504,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "The AI took too long to respond. Please try again."
        })
      };

    }

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: error.message || "Something went wrong."
      })
    };

  }

};
