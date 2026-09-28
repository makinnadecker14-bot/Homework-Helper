exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const question = body.question;
    const subject = body.subject || "school";

    if (!question || !question.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Please enter a question."
        })
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    `You are Homework Helper, a friendly AI tutor.

The student's subject is ${subject}.

Help the student understand their homework.
Explain your steps clearly using simple language.
Do not just give an answer when an explanation would help.

Student's question:
${question}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "The AI could not answer right now."
        })
      };
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "No answer was returned."
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer: answer
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong."
      })
    };
  }
};
