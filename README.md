![Pixel Eyes cover](./readme-cover.png)

# Pixel Eyes

![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/davidyen1124/pixel-eyes/deploy-pages.yml?branch=main&style=for-the-badge&label=pages%20ritual)
![GitHub stars](https://img.shields.io/github/stars/davidyen1124/pixel-eyes?style=for-the-badge&label=ego%20boost)
![GitHub last commit](https://img.shields.io/github/last-commit/davidyen1124/pixel-eyes?style=for-the-badge&label=latest%20regret)
![GitHub top language](https://img.shields.io/github/languages/top/davidyen1124/pixel-eyes?style=for-the-badge&label=mostly%20javascript)
![GitHub repo size](https://img.shields.io/github/repo-size/davidyen1124/pixel-eyes?style=for-the-badge&label=surprisingly%20small)
![Webcam](https://img.shields.io/badge/webcam-observing%20you-1f6feb?style=for-the-badge)
![Privacy Theater](https://img.shields.io/badge/privacy-theater-111111?style=for-the-badge)
![Cyberpunk Witness](https://img.shields.io/badge/vibe-suspicious%20cyberpunk-df1463?style=for-the-badge)
![Monkey Approved Probably](https://img.shields.io/badge/monkey-approved%20probably-8b5e3c?style=for-the-badge)
![Face Tracking](https://img.shields.io/badge/face-tracked%20with%20mild%20judgment-f2c94c?style=for-the-badge)

[Live Demo](https://davidyen1124.github.io/pixel-eyes/)

A very serious computer vision project for the modern age: open your webcam, detect your face, and slap a pixelated censor bar across your eyes in real time.

Because apparently "just seeing your face normally" was leaving performance on the table.

## What This Does

- Starts your webcam in the browser.
- Uses MediaPipe face landmarks to find both eyes.
- Draws a chunky pixelated strip across them.
- Rotates the strip so it follows your face instead of giving up immediately.

So yes, it is basically live privacy theater, but with decent tracking.

## Files

- `src/index.html`: one page, no drama
- `src/app.js`: webcam startup, face landmark detection, and the all-important eye obfuscation pipeline

## Technical Notes

- The app uses `@mediapipe/tasks-vision` from a CDN.
- The face landmarker model is also loaded remotely.
- It tracks one face at a time, which feels judgmental but keeps things simple.
- The effect is drawn on a fullscreen canvas over mirrored webcam video.

## Why

Unknown.

But if you needed a browser demo that makes everyone look like they are either under investigation or starring in the lowest-budget cyberpunk film ever made, this is surprisingly effective.
