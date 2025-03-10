let certificateId = "";

document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setResizeListenerForDynamicNav();
    getQueryParamAndProceed();
    setOnUnload();
});

function getQueryParamAndProceed() {
    const params = new URLSearchParams(window.location.search);
    let eduCertId = params.get('id');
    setSingleItemsLoader();
    if (eduCertId == null) {
        showErrorDialog();
        return;
    }
    if (eduCertId.trim() == "") {
        showErrorDialog();
        return;
    }
    if (eduCertId.trim().endsWith("m")) {
        setMultipleItemsLoader();
    }
    fetchContentAndIntialize(eduCertId);
    setShortcuts(goBackOnError);
}

function fetchContentAndIntialize(eduCertId) {
    let detailType = getType(eduCertId);
    if (detailType == null) {
        showErrorDialog();
        return;
    }
    getId('edu-and-cert-type').innerHTML = detailType;
    setTimeout(() => {
        fetch(API_URLS.QUALIFICATION_DETAILS(eduCertId), { signal: signal }).then(response => {
            if (!response.ok) {
                throw new Error('');
            }
            return response.json();
        }).then(data => {
            initializeUi(data, detailType);
        }).catch(function (e) {
            showErrorDialog();
            trackError("Education & Certifications Details", `Fetch ${eduCertId}.json`, e.message);
        });
    }, DELAY);
}

function initializeUi(eduCertData, detailType) {
    let contentHTML = "";
    if (eduCertData["type"] == "s") {
        contentHTML = createSingleItemsList(eduCertData["listData"]);
    } else {
        contentHTML = createMultipleItemsList(eduCertData["nestedData"]);
    }
    getId('skeleton-certificate-about-container-element').style.display = "none";
    getId('certificate-about-container-element').style.display = "grid";
    getId('certificate-about-title-element').innerHTML = eduCertData["title"];
    getId('certificate-about-subtitle-element').innerHTML = eduCertData["subTitle"];
    getId("main-view").scrollTop = 0;
    getId("main-view").innerHTML = contentHTML;
    setAnimation();
    setCertificateAction(eduCertData);
    fetchLogo(eduCertData["icon"]);
    calculateMainContentHeightForDynamicNav();
}

function triggerShakeAnimation() {
    setTimeout(() => {
        const element = getId("certificate-icon");
        element.style.animation = "shake 2s";
    }, 2000);
}


function setCertificateAction(eduCertContent) {
    if (eduCertContent["certificate"] != undefined) {
        certificateId = eduCertContent["certificate"];
        getId('certificate-icon').style.display = "block";
        triggerShakeAnimation();
    }
}

function fetchLogo(logo) {
    let logoUrl = API_URLS.QUALIFICATION_MEDIA(logo);
    fetch(logoUrl, { signal: signal }).then(response => {
        if (!response.ok) {
            throw new Error('');
        }
        return response.blob();
    }).then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        let imgElement = getId(`certificate-about-img`);
        getId(`loader-certificate-about-img`).style.display = "none";
        imgElement.src = objectUrl;
        imgElement.style.display = "block";
    }).catch(error => {
        getId(`loader-certificate-about-img`).style.display = "none";
        getId(`certificate-about-img`).style.display = "block";
        getId(`certificate-about-img`).src = logoUrl;
        trackError("Education & Certifications Details", `Load ${logo}`, error.message);
    })
}

function createSingleItemsList(listData) {
    const contentHTML = listData.map(item => `<div class="single-item-card fade-in">${item}</div>`).join('');
    return contentHTML + '<div class="spacer" style="height: 20px;"></div>';
}

function createMultipleItemsList(nestedData) {
    return nestedData.map(listItem => `
        <div class="multiple-item-card fade-in">
            <div class="spacer" style="height: 12px;"></div>
            <div class="multiple-item-card-title">${listItem.title}</div>
            <div class="spacer" style="height: 4px;"></div>
            ${listItem.listData.map((item, index) => `
                <div class="multiple-item-card-subitem-row">
                    <div class="multiple-item-card-subitem">${item}</div>
                    ${index < listItem.listData.length - 1 ? '<div class="multiple-item-divider"></div>' : ''}
                </div>`).join('')}
        </div>
    `).join('') + `<div class="spacer" style="height: 20px;"></div>`;
}


function showErrorDialog() {
    AlertDialog("Details Unavailable", "We're unable to display the requested certificate or education details. Please verify the link or reach out to support if you need help.", "Go Back", function () {
        goBackOnError();
    })
}

function goBackOnError() {
    goBack('educationandcertifications.html');
}

function setSingleItemsLoader() {
    const loaderItems = Array(30).fill('<div class="skeleton skeleton-single-item-card"></div>');
    loaderItems.push('<div class="spacer" style="height: 20px;"></div>');
    getId("main-view").innerHTML = loaderItems.join('');
}

function setMultipleItemsLoader() {
    const loaderItems = Array(10).fill(`<div class="multiple-item-card"><div class="spacer" style="height:12px"></div><div class="skeleton-multiple-item-card-title skeleton"></div><div class="spacer" style="height:4px"></div><div class="multiple-item-card-subitem-row"><div class="skeleton-multiple-item-card-subitem skeleton"></div><div class="multiple-item-divider"></div></div><div class="multiple-item-card-subitem-row"><div class="skeleton-multiple-item-card-subitem skeleton"></div><div class="multiple-item-divider"></div></div><div class="multiple-item-card-subitem-row"><div class="skeleton-multiple-item-card-subitem skeleton"></div><div class="multiple-item-divider"></div></div><div class="multiple-item-card-subitem-row"><div class="skeleton-multiple-item-card-subitem skeleton"></div><div class="multiple-item-divider"></div></div><div class="multiple-item-card-subitem-row"><div class="skeleton-multiple-item-card-subitem skeleton"></div><div class="spacer" style="height:1px"></div></div></div>`);
    loaderItems.push('<div class="spacer" style="height: 20px;"></div>');
    getId("main-view").innerHTML = loaderItems.join('');
}

function getType(value) {
    let defaultType = null;
    if (typeof value !== 'string' || value.length < 2) {
        return defaultType;
    }
    const typeMap = {
        'ed': 'Education',
        'pc': 'Professional Certificate',
        'in': 'Institute Certificate',
        'ol': 'Online Certificate',
        'ot': 'Other Certificate'
    };
    const key = value.slice(0, 2).toLowerCase();
    return typeMap[key] || defaultType;
}


function onCertificateClick() {
    window.location.href = `viewer.html?type=${MEDIA_TYPE_CERTIFICATE}&id=${certificateId}`;
}