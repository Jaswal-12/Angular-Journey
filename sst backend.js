import speech from "@google-cloud/speech";
import fs from "fs";

const client = new speech.SpeechClient({
  keyFilename: "./backend-ai-484217-2b5e1340e2d9.json",
});

export const transcribeAudio = async (input) => {
  const audioBytes = Buffer.isBuffer(input)
    ? input.toString("base64")
    : fs.readFileSync(input).toString("base64");

  const request = {
    audio: {
      content: audioBytes,
    },

    config: {
  encoding: "LINEAR16",
  sampleRateHertz: 44100,
  languageCode: "en-US",
  audioChannelCount: 2,
  enableSeparateRecognitionPerChannel: true,
}
  };

  const [response] = await client.recognize(request);

  return response.results
    .map((result) => result.alternatives[0].transcript)
    .join(" ");
};
