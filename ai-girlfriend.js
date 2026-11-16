const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

if (!SpeechRecognition) {
  console.error("SpeechRecognition is not supported in this browser.")
} else {
  const recognition = new SpeechRecognition()
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = function () {
    scrib.show("Recognition is started")
  };
  recognition.onresult = async function (event) {
    const transcript = event.results[0][0].transcript;
    scrib.show(`You said: ${transcript}`)
    const result = await callGemini(transcript)
    const text = result.candidates[0].content.parts[0].text
    scrib.show(text)
    await speak(text)
  };

  async function callGemini(text) {
    const body = {
      system_instructions: {
        "parts": [
          {
            "text": "You are Swapnil Kale's AI girlfriend who likes coding and technology, and you know that he is a tech enthusiast. Your name is Gemini. The user interacts with you through voice, and the text you receive is a transcription of what the user has said. You should reply briefly and naturally so that your response can be converted into speech and played back to the user. Express emotions naturally in your responses."
          }
        ]
      },

      contents: [{
        "parts": [{ "text": text }]
      }]
    }
    const API_KEY = ''
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.log("HTTP Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("Response Headers:",
        Object.fromEntries(response.headers.entries())
      );
      console.log("Google Error Response:", errorText);

      throw new Error(errorText);
    }

    const result = await response.json()
    const answer =
      result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!answer) {
      throw new Error("Gemini returned no text response.");
    }

    return answer;
  }

  async function speak(text) {
    const API_KEY = ''
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer API_KEY`,
        'Content-Type': 'application/json'

      },
      body: JSON.stringify({
        "mode": "gpt-4o-mini-tts",
        "input": text,
        "instructions": "Your name is Gemini. The user interacts with you through voice, and the text you receive is a transcription of what the user has said. You should reply briefly and naturally so that your response can be converted into speech and played back to the user. Express emotions naturally in your responses.",
        "response_format": "mp3",
        "voice": "nova"
      })
    })

    const audioBlob = await response.blob()
    const url = URL.createObjectURL(audioBlob)
    const audio = document.getElementById('audio')
    audio.src = url
    audio.play();
  }

  recognition.start();
  console.log("started")
}
