# SignalOne by VIBEBUILDERS

**Live demo:** https://signalone-sd55.vercel.app

**Team:** VibeBuilders · Vibe Coding Hackathon, Code//Connect'26, UBIT, University of Karachi

- **Team Lead:** Ayesha Rafique Bhatti
- **Team Member:** Wasfah Khalil

**Problem:** Threat Prevention. Cameras and sensors record theft, violence, accidents and fires, but by the time a human notices, it may be too late. How can technology detect a developing threat and act early enough to prevent or reduce harm?

## What SignalOne does
SignalOne spots danger before anyone has to notice it. It watches up to four cameras and a set of sensors together, warns early, and responds in proportion to the threat.

- **Warns early.** Each camera has a risk score (0-100) that rises as signals build: a person lingering, a crowd, a bag left alone, flickering flame, or a person who falls and stays down. Alerts show how many seconds before the alarm the risk first rose.
- **Responds in proportion.** Emergencies (fire, accident, violence) get a loud siren and a team sent straight away. A person who suddenly falls and stays down triggers the alarm and sends a medic team. Suspected threats like theft get a softer alert that an operator can dismiss. Unusual activity (for example a vehicle parked for too long) is only a notice: no alarm and no team.
- **Acts quickly.** Every alert creates a dispatch ticket automatically: time, location, what happened, which team is notified, and a timeline (alert sent, acknowledged, on route, arrived, working, problem resolved). The siren stops when the team arrives.
- **Limits false alarms.** The app learns the normal scene for a few seconds before alerting, needs flame colour to flicker before it counts as fire, and combines camera and sensor signals. One source alone keeps the response more cautious.
- **Protects privacy.** People and objects are detected on the device. A privacy mode blurs the video. No video is stored and there is no face recognition. It flags behaviour, never identity.

## Try it without a camera
Click the red **▶ Guide** button at the top. It runs four simulated scenes one after another: fire (Camera 1), theft (Camera 2), accident (Camera 3) and violence (Camera 4). In each scene you see the risk rise, the alert, the siren, the right team arriving, and the problem being resolved before the next camera starts. Captions explain each step. Turn your sound on to hear the sirens.

You can also start a single scene with the scene buttons. Finished tickets are listed in the **History** tab.

## Sensors
Each camera has simulated sensors for temperature, smoke and sound level. They feed the same risk score as the camera and can raise alerts on their own. Use the **Smoke sensor**, **Heat spike** and **Loud noise** buttons to try them. When a camera and a sensor agree (for example flames on camera plus rising smoke and heat), confidence goes up.

## Camera sources
Use your webcam, upload a video file, or paste a stream link (HLS `.m3u8`, `.mp4`, or an image or MJPEG snapshot link). `rtsp://` links cannot play in a browser.

## How detection works
| Layer | What it finds | Runs |
|---|---|---|
| COCO-SSD (TensorFlow.js) | people, bags, vehicles (a vehicle parked too long is logged as a notice), knives and bats | on the device |
| Image analysis | flickering flame colour, motion, rapid movement, person-down posture | on the device |
| Sensors (simulated) | smoke, heat, loud noise, and agreement with the camera | simulated readings in the page |
| Gemini vision (optional) | guns and other weapons, fights, theft, accidents, fire, smoke, people who have fainted, unusual behaviour | small frames sent to Google Gemini, automatically when the AI layer is configured |

Without the optional Gemini layer, only the first two layers run. That means guns, fights, theft and accidents in real footage need the Gemini layer; the on-device layers handle fire, people, falls, bags, vehicles and knives.

## Honest notes
- Sensor readings are simulated. No real hardware is connected.
- Dispatch is simulated. The teams and their arrival are a demo, and no real emergency service is contacted.
- Fire and motion checks use simple image analysis. They are good for a demo, not a certified alarm.
- The optional Gemini check runs automatically for uploaded videos, webcam and stream links when a key is configured. Judges do not need to click anything or add a key.
- The AI layer can be wrong, which is why suspected threats can be dismissed by an operator.
- Video of a fire shown on a phone or monitor is treated as real only while **Demo mode** is on.

## Tech stack
Plain HTML, CSS and JavaScript in one file. TensorFlow.js and COCO-SSD for people and object detection, hls.js for streams, the Web Audio API for sirens, and Canvas for the simulated scenes. Google Gemini (optional) for scene analysis through a small Vercel serverless function that keeps the API key on the server. Hosted on Vercel.

## AI usage
We chose the problem and designed the solution ourselves, then built it with AI coding tools and tested it. See the AI usage disclosure in our submission.

## Run and deploy
1. Open `index.html` through any web server (the camera needs `https://` or `localhost`).
2. To deploy, import this repo into Vercel. No build step is needed.
3. For the optional Gemini analysis, add `GEMINI_API_KEY` (from aistudio.google.com) and optionally `GEMINI_MODEL` in Vercel, under Settings, Environment Variables, then redeploy.
4. Never commit an API key.

## Files
- `index.html`: the whole app
- `api/analyze.js`: serverless function that keeps the API key off the client
- `README.md`: this file
