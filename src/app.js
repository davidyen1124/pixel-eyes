import {
  FaceLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.mjs";

const TASKS_VISION_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
const FACE_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const LEFT_IRIS = [468, 469, 470, 471, 472];
const RIGHT_IRIS = [473, 474, 475, 476, 477];
const LEFT_LIDS = [159, 145];
const RIGHT_LIDS = [386, 374];

const video = document.getElementById("camera");
const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d", { alpha: false });
const stripCanvas = document.createElement("canvas");
const stripCtx = stripCanvas.getContext("2d", { alpha: false });
const pixelCanvas = document.createElement("canvas");
const pixelCtx = pixelCanvas.getContext("2d", { alpha: false });

let faceLandmarker;
let coverCrop;
let eyeStrip = null;
let lastDetectionAt = 0;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(window.innerWidth * dpr);
  const height = Math.floor(window.innerHeight * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function getCoverCrop(videoWidth, videoHeight, canvasWidth, canvasHeight) {
  const videoAspect = videoWidth / videoHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  if (videoAspect > canvasAspect) {
    const width = videoHeight * canvasAspect;
    return {
      sx: (videoWidth - width) * 0.5,
      sy: 0,
      sw: width,
      sh: videoHeight,
    };
  }

  const height = videoWidth / canvasAspect;
  return {
    sx: 0,
    sy: (videoHeight - height) * 0.5,
    sw: videoWidth,
    sh: height,
  };
}

function drawVideo() {
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(
    video,
    coverCrop.sx,
    coverCrop.sy,
    coverCrop.sw,
    coverCrop.sh,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  ctx.restore();
}

function pointFromLandmark(landmark) {
  const videoX = landmark.x * video.videoWidth;
  const videoY = landmark.y * video.videoHeight;
  const cropX = (videoX - coverCrop.sx) / coverCrop.sw;
  const cropY = (videoY - coverCrop.sy) / coverCrop.sh;

  return {
    x: (1 - cropX) * canvas.width,
    y: cropY * canvas.height,
  };
}

function averagePoint(landmarks, indices) {
  let x = 0;
  let y = 0;

  for (const index of indices) {
    const point = pointFromLandmark(landmarks[index]);
    x += point.x;
    y += point.y;
  }

  return {
    x: x / indices.length,
    y: y / indices.length,
  };
}

function eyeHeight(landmarks, indices) {
  const a = pointFromLandmark(landmarks[indices[0]]);
  const b = pointFromLandmark(landmarks[indices[1]]);
  return Math.abs(a.y - b.y);
}

function isVisible(point) {
  return point.x >= 0
    && point.x <= canvas.width
    && point.y >= 0
    && point.y <= canvas.height;
}

function detectEyeStrip() {
  if (!faceLandmarker) {
    eyeStrip = null;
    return;
  }

  const now = performance.now();
  if (now - lastDetectionAt < 33) {
    return;
  }

  const results = faceLandmarker.detectForVideo(video, now);
  const landmarks = results?.faceLandmarks?.[0];

  if (!landmarks) {
    eyeStrip = null;
    lastDetectionAt = now;
    return;
  }

  const leftEye = averagePoint(landmarks, LEFT_IRIS);
  const rightEye = averagePoint(landmarks, RIGHT_IRIS);

  if (!isVisible(leftEye) || !isVisible(rightEye)) {
    eyeStrip = null;
    lastDetectionAt = now;
    return;
  }

  const interEyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  if (!Number.isFinite(interEyeDistance) || interEyeDistance < canvas.width * 0.04) {
    eyeStrip = null;
    lastDetectionAt = now;
    return;
  }
  const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

  const stripHeight = clamp(
    Math.max(eyeHeight(landmarks, LEFT_LIDS), eyeHeight(landmarks, RIGHT_LIDS)) * 2.8,
    canvas.height * 0.035,
    canvas.height * 0.18,
  );
  const padding = stripHeight * 0.55;
  const x = clamp(Math.min(leftEye.x, rightEye.x) - padding, 0, canvas.width);
  const right = clamp(Math.max(leftEye.x, rightEye.x) + padding, 0, canvas.width);
  const centerY = (leftEye.y + rightEye.y) * 0.5;
  const y = clamp(centerY - stripHeight * 0.55, 0, canvas.height);
  const bottom = clamp(centerY + stripHeight * 0.55, 0, canvas.height);

  eyeStrip = {
    x,
    y,
    width: right - x,
    height: bottom - y,
    interEyeDistance,
    angle,
  };
  lastDetectionAt = now;
}

function drawPixelStrip() {
  if (!eyeStrip) {
    return;
  }

  const stripWidth = Math.max(1, Math.round(eyeStrip.width));
  const stripHeight = Math.max(1, Math.round(eyeStrip.height));
  const centerX = eyeStrip.x + eyeStrip.width * 0.5;
  const centerY = eyeStrip.y + eyeStrip.height * 0.5;
  const blockSize = clamp(eyeStrip.interEyeDistance / 18, 14, 38);

  stripCanvas.width = stripWidth;
  stripCanvas.height = stripHeight;
  stripCtx.save();
  stripCtx.clearRect(0, 0, stripWidth, stripHeight);
  stripCtx.translate(stripWidth * 0.5, stripHeight * 0.5);
  stripCtx.rotate(-eyeStrip.angle);
  stripCtx.drawImage(canvas, -centerX, -centerY);
  stripCtx.restore();

  pixelCanvas.width = Math.max(1, Math.round(stripWidth / blockSize));
  pixelCanvas.height = Math.max(1, Math.round(stripHeight / blockSize));
  pixelCtx.drawImage(
    stripCanvas,
    0,
    0,
    stripWidth,
    stripHeight,
    0,
    0,
    pixelCanvas.width,
    pixelCanvas.height,
  );

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(centerX, centerY);
  ctx.rotate(eyeStrip.angle);
  ctx.drawImage(
    pixelCanvas,
    -stripWidth * 0.5,
    -stripHeight * 0.5,
    stripWidth,
    stripHeight,
  );
  ctx.restore();
}

function render() {
  resizeCanvas();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    coverCrop = getCoverCrop(
      video.videoWidth,
      video.videoHeight,
      canvas.width,
      canvas.height,
    );
    drawVideo();
    detectEyeStrip();
    drawPixelStrip();
  }

  requestAnimationFrame(render);
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: "user" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });

  video.srcObject = stream;

  await new Promise((resolve) => {
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      resolve();
      return;
    }

    video.onloadedmetadata = resolve;
  });

  await video.play();
}

async function startTracking() {
  const vision = await FilesetResolver.forVisionTasks(`${TASKS_VISION_ROOT}/wasm`);
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: FACE_LANDMARKER_MODEL,
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
}

async function init() {
  render();
  await startCamera();
  await startTracking();
}

init().catch((error) => {
  console.error(error);
});
