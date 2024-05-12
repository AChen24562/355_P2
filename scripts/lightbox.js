let lightboxTitle = "Top Market Movers";

// Name of the image files shown in the slideshow
let imgFiles = ["../images/stocks-img1.jpg", "../images/stocks-img2.png", "../images/stocks-img3.jpg",
  "../images/stocks-img4.jpg", "../images/stocks-img5.jpg", "../images/stocks-img6.jpg"];

// Captions associated with each image
let imgCaptions = new Array(12);
imgCaptions[0]="Nvidia Corp. (NVDA)";
imgCaptions[1]="Alphabet Inc. (GOOG, GOOGL)";
imgCaptions[2]="Meta Platforms Inc. (META)";
imgCaptions[3]="JPMorgan Chase & Co. (JPM)";
imgCaptions[4]="Tesla Inc. (TSLA)";
imgCaptions[5]="Apple Inc. (AAPL)";

// Count of images in the slideshow
let imgCount = imgFiles.length;

window.addEventListener("load", createLightbox);

function createLightbox() {
  // Lightbox Container
  let lightBox = document.getElementById("lightbox");

  // Parts of the lightbox
  let lbTitle = document.createElement("h1");
  let lbCounter = document.createElement("div");
  let lbPrev = document.createElement("div");
  let lbNext = document.createElement("div");
  let lbPlay = document.createElement("div");
  let lbImages = document.createElement("div");

  // Design the lightbox title
  lightBox.appendChild(lbTitle);
  lbTitle.id = "lbTitle";
  lbTitle.textContent = lightboxTitle;

  // Design the lightbox slide counter
  lightBox.appendChild(lbCounter);
  lbCounter.id = "lbCounter";
  let currentImg = 1;
  lbCounter.textContent = currentImg + "/" + imgCount;

  // Design the lightbox previous slide button
  lightBox.appendChild(lbPrev);
  lbPrev.id = "lbPrev";
  lbPrev.className = "lbButtons";
  lbPrev.innerHTML = "&#9664";
  lbPrev.onclick = showPrev;

  // Design the lightbox next slide button
  lightBox.appendChild(lbNext);
  lbNext.id = "lbNext";
  lbNext.className = "lbButtons";
  lbNext.innerHTML = "&#9654";
  lbNext.onclick = showNext;

  // Design the lightbox image container
  lightBox.appendChild(lbImages);
  lbImages.id = "lbImages";
  // Add images from the imgFiles array to the container
  for (let i = 0; i < imgCount; i++) {
    let image = document.createElement("img");
    image.src = imgFiles[i];
    image.alt = imgCaptions[i];
    image.onclick = createOverlay;
    lbImages.appendChild(image);
  }

  // Design the lightbox Play-Pause button
  lightBox.appendChild(lbPlay);
  lbPlay.id = "lbPlay";
  lbPlay.className = "lbButtons";
  lbPlay.innerHTML = "&#9658;&#10074;&#10074;";
  let timeID;
  lbPlay.onclick = function() {
    if (timeID) {
      // Stop the slideshow
      window.clearInterval(timeID);
      timeID = undefined;
      lbPlay.innerHTML = "&#9658;";
    } else {
      // Start the slideshow
      showNext();
      timeID = window.setInterval(showNext, 1500);
      lbPlay.innerHTML = "&#10074;&#10074;";
    }
  }

  function showNext() {
    lbImages.appendChild(lbImages.firstElementChild);
    (currentImg < imgCount) ? currentImg++ : currentImg = 1;
    lbCounter.textContent = currentImg + "/" + imgCount;
  }

  function showPrev() {
    lbImages.insertBefore(lbImages.lastElementChild, lbImages.firstElementChild);
    (currentImg > 1) ? currentImg-- : currentImg = imgCount;
    lbCounter.textContent = currentImg + "/" + imgCount;
  }
}

function createOverlay() {
  let overlay = document.createElement("div");
  overlay.id = "lbOverlay";

  // Add the figure box to the overlay
  let figureBox = document.createElement("figure");
  overlay.appendChild(figureBox);

  // Add the image to the figure box
  let overlayImage = this.cloneNode("true");
  figureBox.appendChild(overlayImage);

  // Add the caption to the figure box
  let overlayCaption = document.createElement("figcaption");
  overlayCaption.textContent = this.alt;
  figureBox.appendChild(overlayCaption);

  // Add a close button to the overlay
  let closeBox = document.createElement("div");
  closeBox.id = "lbOverlayClose";
  closeBox.className = "lbButtons";
  closeBox.innerHTML = "&times;";
  closeBox.onclick = function() {
    document.body.removeChild(overlay);
  }
  overlay.appendChild(closeBox);

  document.body.appendChild(overlay);
}
