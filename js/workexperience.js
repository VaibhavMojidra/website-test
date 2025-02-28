const headerTitle = "Work Experience";
let imagesData = [];
let awardIcons = {};
const dummyWorks = [2];
const dummyAwards = 4;

document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setHeaderTitle();
    setResizeListenerForStaticNav(setHeaderTitle);
    setOnUnload(closeDrawerBeforeUnload);
    setLoader();
    setWorkExperiencesAndAwards();
    setShortcuts();
    setPreLoader();
});

function setWorkExperiencesAndAwards() {
    imageData = [];
    awardIcons = {};
    setTimeout(() => {
        fetch(API_URLS.WORK_EXPERIENCE_AND_AWARDS, { signal: signal }).then(response => {
            if (!response.ok) {
                throw new Error('');
            }
            return response.json();
        }).then(data => {
            const { workExperiences, awards } = data;
            let loaderHtml = `${createExperienceSection(workExperiences)} <div class="spacer" style="height: 24px;"></div> ${createAwardsSection(awards)}`;
            getId("main-view").scrollTop = 0;
            getId("main-view").innerHTML = loaderHtml;
            setAnimation();
            loadMedia();
        }).catch(function (error) {
            getId('main-view').innerHTML = genericErrorHtml;
        });
    }, DELAY);
}

function loadMedia() {
    imagesData.forEach(function (imageItem) {
        fetchMedia(imageItem);
    });
    Object.values(awardIcons).forEach(logoData => {
        fetchAwardsLogo(logoData);
    });
    imageData = [];
    awardIcons = {};
}

function fetchMedia(imageItem) {
    const { id, imgName, skeletonId } = imageItem;
    let logoUrl = API_URLS.WORK_EXPERIENCE_MEDIA(imgName);
    fetch(logoUrl, { signal: signal }).then(response => {
        if (!response.ok) {
            throw new Error('');
        }
        return response.blob();
    }).then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        let imgElement = getId(id);
        imgElement.src = objectUrl;
        getId(skeletonId).style.display = "none";
        imgElement.style.display = "block";
    }).catch(error => {
        onLogoFetchFailed(id, skeletonId, logoUrl);
    })
}

function fetchAwardsLogo(logoData) {
    let logoUrl = API_URLS.WORK_EXPERIENCE_MEDIA(logoData.icon);
    fetch(logoUrl, { signal: signal }).then(response => {
        if (!response.ok) {
            throw new Error('');
        }
        return response.blob();
    }).then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        logoData.ids.forEach(id => {
            let imgElement = getId(id);
            imgElement.src = objectUrl;
            getId(`${id}-skeleton`).style.display = "none";
            imgElement.style.display = "block";
        });
    }).catch(error => {
        onAwardLogoFetchFailed(logoData, logoUrl);
    })
}

function onAwardLogoFetchFailed(logoData, logoUrl) {
    logoData.ids.forEach(id => {
        getId(id).src = logoUrl;
        getId(`${id}-skeleton`).style.display = "none";
        getId(id).style.display = "block";
    })
}

function onLogoFetchFailed(imageId, skeletonId, logoUrl) {
    getId(imageId).src = logoUrl;
    getId(skeletonId).style.display = "none";
    getId(imageId).style.display = "block";
}

function createExperienceSectionLoader() {
    const createCompanyContainer = (clients) => `<div class="company-container"><div class="company-about-container"><div class="company-logo-vl-container"><div class="company-logo skeleton"></div><div class="company-vl-container"><div class="company-vl"></div></div></div><div class="company-details"><div class="skeleton-company-name skeleton"></div><div class="skeleton-company-experience skeleton"></div><div class="skeleton-company-location-and-type skeleton"></div><div class="company-photos"><div class="company-img skeleton"></div><div class="company-img skeleton"></div></div><div class="spacer" style="height: 12px;"></div></div></div>${createClients(clients)}</div>`;
    const createClients = (clients) => Array(clients).fill(0).map((_, index, arr) => `<div class="client-container"><div class="client-vl-container"><div class="client-vl-bullet-container"><div class="client-vl-bullet-vl"></div><div class="client-vl-bullet"></div></div>${index !== arr.length - 1 ? `<div class="client-vert-l-container"><div class="client-vert-l"></div></div>` : ''}</div><div style="width: 100%;"><div class="client-details"><div class="client-logo-and-name"><div class="client-logo skeleton"></div><div style="width: calc(100% - 44px);"><div class="skeleton-client-name skeleton"></div></div></div><div class="client-work-role-duration-container"><div class="skeleton-work-role skeleton"></div><div class="skeleton-client-duration skeleton"></div></div></div></div></div>`).join('');
    const workInnerHtml = `<div class="section-container"><div class="skeleton-section-title skeleton"></div><div class="company-view">${dummyWorks.map((clients, clientsIndex) => `${createCompanyContainer(clients)}${clientsIndex !== dummyWorks.length - 1 ? '<div class="spacer" style="height: 16px;"></div>' : ''}`).join('')}</div></div>`;
    return workInnerHtml;
}

function createExperienceSection(workExperiences) {
    let htmlParts = [`<div class="section-container fade-in"><div class="section-title">Experience</div><div class="company-view">`];
    workExperiences.forEach((company, companyIndex) => {
        const { name, logo, joiningDate, exitDate, time, type, location, images, compressImages, projects } = company;
        let companyLogoId = `company-logo-${companyIndex}`;
        let skeletonCompanyLogoId = `skeleton-company-logo-${companyIndex}`;
        imagesData.push({ id: companyLogoId, skeletonId: skeletonCompanyLogoId, imgName: logo })
        let companyExperience = createCompanyExperience(time, joiningDate, exitDate);
        htmlParts.push(`<div class="company-container"><div class="company-about-container"><div class="company-logo-vl-container"><div class="company-logo skeleton" id="${skeletonCompanyLogoId}"></div><img src="" id="${companyLogoId}" class="company-logo" style="display: none;"></img><div class="company-vl-container"><div class="company-vl"></div></div></div><div class="company-details"><div class="company-name">${name}</div><div class="company-experience">${companyExperience}</div><div class="company-location-and-type">${location} · ${type}</div><div class="company-photos">`);
        compressImages.forEach(function (companyImage, companyImageIndex) {
            let companyImageId = `company-image-${companyIndex}-${companyImageIndex}`;
            let skeletonCompanyImageId = `skeleton-company-image-${companyIndex}-${companyImageIndex}`
            imagesData.push({ id: companyImageId, skeletonId: skeletonCompanyImageId, imgName: companyImage });
            htmlParts.push(`<div class="company-img skeleton" id="${skeletonCompanyImageId}"></div><img class="company-img clickable" id="${companyImageId}" src="" style="display:none" onclick="openWorkImage('${images[companyImageIndex]}')" />`);
        })
        htmlParts.push(`</div><div class="spacer" style="height: 12px;"></div></div></div>`);
        projects.forEach(function (project, projectIndex) {
            const { logo: projectLogo, name: projectName, role, onBoardDate, releaseDate } = project;
            let projectLogoId = `project-logo-${companyIndex}-${projectIndex}`;
            let skeletonProjectLogoId = `skeleton-project-logo-${companyIndex}-${projectIndex}`;
            let periodAndDuration = createPeriodAndDuration(onBoardDate, releaseDate);
            imagesData.push({ id: projectLogoId, skeletonId: skeletonProjectLogoId, imgName: projectLogo });
            htmlParts.push(`<div class="client-container"><div class="client-vl-container"><div class="client-vl-bullet-container"><div class="client-vl-bullet-vl"></div><div class="client-vl-bullet"></div></div>`);
            if (projectIndex !== projects.length - 1) { htmlParts.push(`<div class="client-vert-l-container"><div class="client-vert-l"></div></div>`); }
            htmlParts.push(`</div><div><div class="client-details"><div class="client-logo-and-name"><div class="client-logo skeleton" id="${skeletonProjectLogoId}"></div><img src="" alt="" id="${projectLogoId}" class="client-logo" style="display: none;"></img><div><div class="client-name">${projectName}</div></div></div><div class="client-work-role-duration-container"><div class="work-role">${role}</div><div class="client-duration">${periodAndDuration}</div></div></div></div></div>`);
        })
        htmlParts.push(`</div>`);
        if (companyIndex != workExperiences.length - 1) { htmlParts.push(`<div class="spacer" style="height: 16px;"></div>`); }
    });
    htmlParts.push(`</div></div>`);
    return htmlParts.join('');
}

function createAwardsSection(awards) {
    let htmlParts = [`<div class="section-container fade-in"><div class="section-title">Awards</div>`];
    awards.forEach(function (awardItem, index) {
        const { name, award, icon, issuedDate, note } = awardItem;
        const iconId = `award-ic-id-${index}`;
        const skeletonId = `${iconId}-skeleton`;
        const formatedIssueDate = moment(issuedDate, 'MM/DD/YYYY').format('MMMM YYYY');
        htmlParts.push(`<div class="card-item clickable" onclick="openAward('${award}')"><div class="award-logo-and-name-date-container">
            <div class="skeleton award-icon" id="${skeletonId}"></div>
            <img class="award-icon" id="${iconId}" src="" style="display:none"></img>
            <div class="award-name-date-container"><div class="award-name">${name}</div><div class="award-date">${formatedIssueDate}</div></div></div><div class="award-note">${note}</div></div>`);
        addAwardImageData({ icon: icon, id: iconId });
    });
    htmlParts.push(`</div>`);
    return htmlParts.join('');
}

function createCompanyExperience(jobTime, startDate, endDate) {
    let periodAndDuration = createPeriodAndDuration(startDate, endDate)
    return `${jobTime} · ${periodAndDuration}`;
}

function createPeriodAndDuration(startDate, endDate) {
    let duration = "";
    let period = "";
    if (endDate == "Present") {
        duration = calculateDuration(new Date(startDate), new Date());
        period = `${moment(startDate, 'MM/DD/YYYY').format('MMM YYYY')} - Present`;
    } else {
        duration = calculateDuration(new Date(startDate), new Date(endDate));
        period = `${moment(startDate, 'MM/DD/YYYY').format('MMM YYYY')} - ${moment(endDate, 'MM/DD/YYYY').format('MMM YYYY')}`;
    }
    return `${period} · ${duration}`;
}

function calculateDuration(startDate, endDate) {
    let startingDate = moment(startDate);
    let endingDate = moment(endDate);
    let yearsDiff = endingDate.diff(startingDate, 'years');
    let monthsDiff = endingDate.diff(startingDate, 'months') % 12;
    let yearsText = yearsDiff === 1 ? "1 year" : yearsDiff > 1 ? `${yearsDiff} years` : "";
    let monthsText = monthsDiff === 1 ? "1 month" : monthsDiff > 1 ? `${monthsDiff} months` : "";
    if (yearsText && monthsText) {
        return `${yearsText} ${monthsText}`;
    } else if (yearsText) {
        return yearsText;
    } else if (monthsText) {
        return monthsText;
    } else {
        return "";
    }
}


function setLoader() {
    let loaderHtml = `${createExperienceSectionLoader()} <div class="spacer" style="height: 24px;"></div> ${createAwardSectionLoader()}`
    getId("main-view").innerHTML = loaderHtml;
}

function changeTheme() {
    toggleTheme();
}

function createAwardSectionLoader() {
    const cardItemTemplate = `<div class="card-item"><div class="award-logo-and-name-date-container"><div class="skeleton award-icon"></div><div class="award-name-date-container"><div class="skeleton-award-name skeleton"></div><div class="skeleton-award-date skeleton"></div></div></div><div class="skeleton-award-note skeleton"></div></div>`;
    const cardItems = cardItemTemplate.repeat(dummyAwards);
    return `<div class="section-container"><div class="skeleton-section-title skeleton"></div>${cardItems}</div>`;
}

function addAwardImageData(data) {
    if (!awardIcons[data.icon]) {
        awardIcons[data.icon] = {
            icon: data.icon,
            ids: []
        };
    }
    awardIcons[data.icon].ids.push(data.id);
}

function openWorkImage(imageId) {
    window.location.href = `viewer.html?type=${MEDIA_TYPE_WORK}&id=${imageId}`;
}

function openAward(imageId) {
    window.location.href = `viewer.html?type=${MEDIA_TYPE_AWARD}&id=${imageId}`;
}

function retryLoad() {
    getId("main-view").scrollTop = 0;
    setLoader();
    setWorkExperiencesAndAwards();
}

window.addEventListener('pageshow', closeDrawerBeforeUnload, false)