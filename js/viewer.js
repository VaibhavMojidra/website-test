let imageWidth = 4;
let imageHeight = 3;
let imageObjectUrl = null;
let imageURL = "";
let mediaId = null;
let mediaType = null;
let zoomFactor = 1;

document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setResizeListenerForLoader();
    initializeMedia();
    setShortcuts(goBackOnError);
    setOnUnload();
});

function initializeMedia() {
    const params = new URLSearchParams(window.location.search);
    mediaId = params.get('id');
    mediaType = params.get('type');
    if (mediaId == null || mediaType == null) {
        showErrorDialog();
        return;
    }
    if (mediaId.trim() == "" || mediaType.trim() == "") {
        showErrorDialog();
        return;
    }
    imageURL = generateImageUrl();
    if (imageURL == "") {
        showErrorDialog();
        return;
    }
    setTitle();
    setTimeout(() => {
        fetch(imageURL, { signal: signal }).then(response => {
            if (!response.ok) {
                throw new Error('');
            }
            return response.blob();
        }).then(blob => {
            const objectUrl = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = function () {
                imageWidth = img.width;
                imageHeight = img.height;
                imageObjectUrl = objectUrl;
                window.removeEventListener('resize', onSizeChangeForLoader);
                getId('loader-viewer').style.display = "none";
                getId('viewer').style.display = "block";
                getId('open-in-tab-icon').style.display = "block";
                setResizeListenerForViewer();
            };
            img.onerror = function () {
                showErrorDialog()
            }
            img.src = objectUrl;
        }).catch(error => {
            showErrorDialog();
            trackError("Viewer", `Load ${mediaId}`, error.message);
        })
    }, DELAY);

}

function setResizeListenerForLoader() {
    onSizeChangeForLoader();
    window.addEventListener('resize', onSizeChangeForLoader);
}

function setResizeListenerForViewer() {
    onSizeChangeForViewer();
    window.addEventListener('resize', onSizeChangeForViewer);
}

function onSizeChangeForLoader() {
    zoomFactor = 1;
    if (window.innerWidth >= BIG_SCREEN_WIDTH_BREAKPOINT) {
        zoomFactor = getZoomFactorForBigScreen(window.innerWidth);
    }
    document.body.style.zoom = zoomFactor;

    const windowInnerHeight = (window.innerHeight / zoomFactor);
    const windowInnerWidth = (window.innerWidth / zoomFactor);

    const certicateContainer = document.querySelector('.viewer-container');
    const navHeight = 60;
    certicateContainer.style.height = `calc(${windowInnerHeight}px - ${navHeight}px)`;
    let screenHeight = (windowInnerHeight - navHeight);
    let isImageLandscape = (imageWidth >= imageHeight);
    let isOrientationLandscape = (windowInnerWidth >= screenHeight);

    let imageWidthAfterResize = ((imageWidth * screenHeight) / imageHeight);
    let imageHeightAfterResize = ((windowInnerWidth * imageHeight) / imageWidth);

    if (isOrientationLandscape && isImageLandscape) {
        if (imageWidthAfterResize < windowInnerWidth) {
            let divElement = getId("loader-viewer");
            divElement.style.height = "100%";
            divElement.style.width = `${imageWidthAfterResize}px`;
        } else {
            let divElement = getId("loader-viewer");
            divElement.style.height = `${imageHeightAfterResize}px`;
            divElement.style.width = "100%";
        }
        return;
    }

    if (!isOrientationLandscape && isImageLandscape) {
        let imgElement = getId("loader-viewer");
        imgElement.style.height = `${imageHeightAfterResize}px`;
        imgElement.style.width = "100%";
        return;
    }
}

function onSizeChangeForViewer() {
    zoomFactor = 1;
    if (window.innerWidth >= BIG_SCREEN_WIDTH_BREAKPOINT) {
        zoomFactor = getZoomFactorForBigScreen(window.innerWidth);
    }
    document.body.style.zoom = zoomFactor;

    const windowInnerHeight = (window.innerHeight / zoomFactor);
    const windowInnerWidth = (window.innerWidth / zoomFactor);

    const certicateContainer = document.querySelector('.viewer-container');
    const navHeight = 60;
    certicateContainer.style.height = `calc(${windowInnerHeight}px - ${navHeight}px)`;
    let screenHeight = (windowInnerHeight - navHeight);

    let isImageLandscape = (imageWidth >= imageHeight);
    let isOrientationLandscape = (windowInnerWidth >= screenHeight);
    if (isOrientationLandscape && isImageLandscape) {
        let imageWidthAfterResize = ((imageWidth * screenHeight) / imageHeight);
        if (imageWidthAfterResize < windowInnerWidth) {
            let imgElement = getId("viewer");
            imgElement.style.height = "100%";
            imgElement.style.width = "auto";
            imgElement.src = imageObjectUrl;
        } else {
            let imgElement = getId("viewer");
            imgElement.style.height = "auto";
            imgElement.style.width = "100%";
            imgElement.src = imageObjectUrl;
        }
        return;
    }

    if (!isOrientationLandscape && isImageLandscape) {
        let imgElement = getId("viewer");
        imgElement.style.height = "auto";
        imgElement.style.width = "100%";
        imgElement.src = imageObjectUrl;
        return;
    }

    if (isOrientationLandscape && !isImageLandscape) {
        let imgElement = getId("viewer");
        imgElement.style.height = "100%";
        imgElement.style.width = "auto";
        imgElement.src = imageObjectUrl;
        return;
    }

    if (!isOrientationLandscape && !isImageLandscape) {
        let imageHeightAfterResize = ((windowInnerWidth * imageHeight) / imageWidth);
        if (imageHeightAfterResize < screenHeight) {
            let imgElement = getId("viewer");
            imgElement.style.height = "auto";
            imgElement.style.width = "100%";
            imgElement.src = imageObjectUrl;
        } else {
            let imgElement = getId("viewer");
            imgElement.style.height = "100%";
            imgElement.style.width = "auto";
            imgElement.src = imageObjectUrl;
        }
        return;
    }
}

function showErrorDialog() {
    let mediaName = "Media";
    if (mediaType != null) {
        switch (mediaType.toLowerCase()) {
            case MEDIA_TYPE_CERTIFICATE:
                mediaName = "Certificate";
                break;
            case MEDIA_TYPE_AWARD:
                mediaName = "Award";
                break;
            default:
                mediaName = "Media";
                break;
        }
    }
    AlertDialog(`${mediaName} Unavailable`, `We're unable to display the requested ${mediaName.toLowerCase()}. Please verify the link or reach out to support if you need help.`, "Go Back", function () {
        goBackOnError();
    })
}

function goBackOnError() {
    goBack('educationandcertifications.html');
}

function openInNewTab() {
    window.open(imageURL, '_blank')
}

function generateImageUrl() {
    switch (mediaType.toLowerCase()) {
        case MEDIA_TYPE_CERTIFICATE:
            return API_URLS.CERTIFICATES_MEDIA(mediaId);
        case MEDIA_TYPE_AWARD:
            return API_URLS.AWARDS_MEDIA(mediaId);
        case MEDIA_TYPE_WORK:
            return API_URLS.WORK_EXPERIENCE_MEDIA(mediaId);
        default:
            return "";
    }
}

function setTitle() {
    switch (mediaType.toLowerCase()) {
        case MEDIA_TYPE_CERTIFICATE:
            getId("viewer-label-id").innerHTML = "Certificate";
            break;
        case MEDIA_TYPE_AWARD:
            getId("viewer-label-id").innerHTML = "Award";
            break;
        default:
            getId("viewer-label-id").innerHTML = "";
            break;
    }
}