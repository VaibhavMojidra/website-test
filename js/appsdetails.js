
document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setResizeListenerForStaticNav(() => { }, 60);
    setOnUnload();
    setLoader();
    getQueryParamAndProceed();
});

function getQueryParamAndProceed() {
    const params = new URLSearchParams(window.location.search);
    let appId = params.get('id');

    if (appId == null) {
        showErrorDialog();
        return;
    }
    if (appId.trim() == "") {
        showErrorDialog();
        return;
    }
    fetchContentAndIntialize(appId);
    setShortcuts(goBackOnError);
}

function fetchContentAndIntialize(appId) {
    setTimeout(() => {
        fetch(API_URLS.APP_DETAILS(appId), { signal: signal }).then(response => {
            if (!response.ok) {
                throw new Error('');
            }
            return response.json();
        }).then(data => {
            initializeUi(data);
        }).catch(function (e) {
            showErrorDialog();
        });
    }, DELAY);
}

function initializeUi(data) {
    const { name, type, tech, shortDesc, buttons, detailedDesc, media } = data;
    let htmlParts = [`<div class="fade-in"><div class="app-name">${name}</div><div class="app-tags"><div class="tag-item"><div class="tag-icon"></div><div class="tag-name">${type}</div></div><div class="tag-item" style="margin-left: 10px;"><div class="tag-icon"></div><div class="tag-name">${tech}</div></div></div><div class="app-tag-line">${shortDesc}</div><div class="apps-button-container">`];
    buttons.forEach(btn => {
        htmlParts.push(`<div class="action-button" onclick="openLink('${btn.url}')">${btn.text}</div>`);
    });
    htmlParts.push(`</div></div>`);
    getId('about-app-container').innerHTML = htmlParts.join('');
    getId('apps-detailed-description').innerHTML = `<div class="fade-in">${detailedDesc}</div>`;
    setAnimation();
    fetchMedia(media);
}


function fetchMedia(media) {
    let mediaUrl = API_URLS.APPS_MEDIA(media);
    fetch(mediaUrl, { signal: signal }).then(response => {
        if (!response.ok) {
            throw new Error('');
        }
        return response.blob();
    }).then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        let imgElement = getId(`app-image`);
        getId(`app-image-loader`).style.display = "none";
        imgElement.src = objectUrl;
        imgElement.style.display = "block";
    }).catch(error => {
        getId(`app-image-loader`).style.display = "none";
        getId(`app-image`).style.display = "block";
        getId(`app-image`).src = logoUrl;
    })
}

function showErrorDialog() {
    AlertDialog("Details Unavailable", "We're unable to display the requested app details. Please verify the link or reach out to support if you need help.", "Go Back", function () {
        goBackOnError();
    })
}

function goBackOnError() {
    goBack('apps.html');
}

function setLoader() {
    getId('about-app-container').innerHTML = `<div class="skeleton-app-name skeleton"></div><div class="app-tags"><div class="skeleton-app-tag skeleton"></div><div class="skeleton-app-tag skeleton" style="margin-left:10px"></div></div><div class="app-tag-line"><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line-partial skeleton"></div></div><div class="apps-button-container"><div class="skeleton-action-button skeleton" style="width:80px"></div><div class="skeleton-action-button skeleton" style="width:120px"></div></div></div>`;
    getId('apps-detailed-description').innerHTML = `<div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line-partial skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line skeleton"></div><div class="skeleton-desc-line-partial skeleton"></div>`;
}

function openLink(link) {
    window.location.href = link;
}