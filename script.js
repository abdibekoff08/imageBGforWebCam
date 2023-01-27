let video = document.querySelector("#webcam");
let webcamCanvas = document.querySelector("#canvas");
let webcamCanvasCtx = webcamCanvas.getContext('2d');

const tempCanvas = document.createElement('canvas');
const tempCanvasCtx = tempCanvas.getContext('2d');

let previousSegmentationComplete = true;

let segmentationProperties = {
    segmentationThreshold: 0.7,
    internalResolution: 'low'
}

let model;
bodyPix.load().then(function (loadedModel) {
  model = loadedModel;
});

function main() {
    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({video: true})
            .then(stream => {
                video.srcObject = stream;
            })
            .catch(e => {
                console.log("Error occurred while getting the video stream");
            });
    }
    
    video.onloadedmetadata = () => {
        webcamCanvas.width = video.videoWidth;
        webcamCanvas.height = video.videoHeight;
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
    };
    
    video.addEventListener("loadeddata", segmentPersons);
}

async function segmentPersons() {
    tempCanvasCtx.drawImage(video, 0, 0);
    if (previousSegmentationComplete) {
        previousSegmentationComplete = false;
        await model.segmentPerson(tempCanvas, segmentationProperties)
            .then(segmentation => {
                    processSegmentation(segmentation);
                    previousSegmentationComplete = true;
            });
    }
    window.requestAnimationFrame(segmentPersons);
}

function processSegmentation(segmentation) {
    const imgData = tempCanvasCtx.getImageData(0, 0, webcamCanvas.width, webcamCanvas.height);
    for(let i = 0; i < imgData.data.length; i+=4) {
        let pixelIndex = i/4;
        if(segmentation.data[pixelIndex] == 0) {
          imgData.data[i + 3] = 0;
        }
      }
      webcamCanvasCtx.putImageData(imgData, 0.5, 0);
}

main();