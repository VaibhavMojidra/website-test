const headerTitle = "Education & Certifications";
let imageData = {};
const sections = [3, 2, 2, 26, 1];

document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setHeaderTitle();
    setResizeListenerForStaticNav(setHeaderTitle);
    setOnUnload(closeDrawerBeforeUnload);
    setLoader();
    setEducationsAndCertificates();
    setShortcuts();
    setPreLoader();
});

function setLoader() {
    const loaderHtml = sections.map(sectionNumber => `<div class="section-container"><div class="skeleton-section-title skeleton"></div>${Array(sectionNumber).fill(`<div class="card-item"><div class="skeleton card-icon"></div><div class="skeleton-card-title skeleton"></div><div class="skeleton-card-subtitle skeleton"></div></div>`).join('')}</div><div class="spacer" style="height: 24px;"></div>`).join('');
    getId("main-view").innerHTML = loaderHtml;
}

function setEducationsAndCertificates() {

    setTimeout(() => {
        fetch(API_URLS.QUALIFICATION, { signal: signal }).then(response => {
            if (!response.ok) {
                throw new Error('');
            }
            return response.json();
        }).then(data => {
            processEducationsAndCertificates(data);
        }).catch(error => {
            getId('main-view').innerHTML = genericErrorHtml;
        });
    }, DELAY);

}

function createSectionHTML(title, items) {
    let sectionHTML = `<div class="section-container"><div class="section-title fade-in">${title}</div>`;
    items.forEach(item => {
        sectionHTML += `
            <div class="card-item clickable fade-in" onclick="onItemClick('${item.id}')">
                <div class="skeleton card-icon" id="img-loader-${item.id}"></div>
                <img src="" class="card-icon" id="img-${item.id}" style="display: none;"></img>
                <div class="card-title">${item.title}</div>
                <div class="card-subtitle">${item.subTitle}</div>
            </div>`;
        addImageData(item);
    });
    sectionHTML += `</div><div class="spacer" style="height: 24px;"></div>`;
    return sectionHTML;
}

function processEducationsAndCertificates(educationsAndCertificates) {
    let { educations, professionalCertifications, instituteCertifications, onlineCertifications, otherCertifications } = educationsAndCertificates;
    imageData = {};
    let mainListHTML = "";
    mainListHTML += createSectionHTML("Education", educations);
    mainListHTML += createSectionHTML("Professional Certification", professionalCertifications);
    mainListHTML += createSectionHTML("Institute Certification", instituteCertifications);
    mainListHTML += createSectionHTML("Online Certification", onlineCertifications);
    mainListHTML += createSectionHTML("Other Certification", otherCertifications);
    getId("main-view").scrollTop = 0;
    getId("main-view").innerHTML = mainListHTML;
    setAnimation();
    setTimeout(() => {
        loadLogos();
    }, DELAY);
}

function loadLogos() {
    Object.values(imageData).forEach(logoData => {
        fetchLogo(logoData);
    });
    imageData = {};
}

function fetchLogo(logoData) {
    let logoUrl = API_URLS.QUALIFICATION_MEDIA(logoData.icon);
    fetch(logoUrl, { signal: signal }).then(response => {
        if (!response.ok) {
            throw new Error('');
        }
        return response.blob();
    }).then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        logoData.ids.forEach(id => {
            let imgElement = getId(`img-${id}`);
            imgElement.src = objectUrl;
            getId(`img-loader-${id}`).style.display = "none";
            imgElement.style.display = "block";
        });
    }).catch(error => {
        onLogoFetchFailed(logoData, logoUrl);
    })
}

function onLogoFetchFailed(logoData, logoUrl) {
    logoData.ids.forEach(id => {
        getId(`img-${id}`).src = logoUrl;
        getId(`img-loader-${id}`).style.display = "none";
        getId(`img-${id}`).style.display = "block";
    })
}


function addImageData(data) {
    if (!imageData[data.icon]) {
        imageData[data.icon] = {
            icon: data.icon,
            ids: []
        };
    }
    imageData[data.icon].ids.push(data.id);
}


function changeTheme() {
    toggleTheme();
}

function onItemClick(id) {
    window.location.href = `educationandcertificationsdetails.html?id=${id}`;
}

function retryLoad() {
    getId("main-view").scrollTop = 0;
    setLoader();
    setEducationsAndCertificates();
}

window.addEventListener('pageshow', closeDrawerBeforeUnload, false)