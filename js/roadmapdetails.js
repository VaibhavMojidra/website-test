document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setResizeListenerForDynamicNav();
    getQueryParamAndProceed();
    setOnUnload();
});

function getQueryParamAndProceed() {
    const params = new URLSearchParams(window.location.search);
    let roadmapId = params.get('id');
    setLoader();
    if (roadmapId == null) {
        showErrorDialog();
        return;
    }
    if (roadmapId.trim() == "") {
        showErrorDialog();
        return;
    }
    checkForTermsAndProceed(roadmapId);
    setShortcuts(goBackOnError);
}

function checkForTermsAndProceed(roadmapId) {
    if (isRoadmapsTermsAgreed()) {
        initializeRoadmap(roadmapId);
        return;
    }

    AlertDialog("Terms & Conditions", `Our roadmap feature provides starting points to learn various technologies based on my knowledge as a developer. While each roadmap is designed to guide you from beginner to a solid foundation, some items may be outdated or missing due to the fast-paced nature of technology. By clicking "I Agree" you acknowledge these terms and are ready to explore the roadmaps.`, "I Agree", function () {
        try {
            localStorage.setItem(IS_ROADMAPS_TERMS_AGREED, ROADMAPS_TERMS_AGREED);
        } catch (error) { } finally {
            initializeRoadmap(roadmapId);
        }
    });
}

function initializeRoadmap(roadmapId) {
    setTimeout(() => {
        fetch(API_URLS.ROADMAPS_DETAILS(roadmapId), { signal: signal }).then(response => {
            if (!response.ok) {
                throw new Error('');
            }
            return response.json();
        }).then(data => {
            checkForNoteAndProceed(data);
        }).catch(function (e) {
            showErrorDialog();
        });
    }, DELAY);
}

function checkForNoteAndProceed(roadmapData) {
    const { name, desc, note, roadmap } = roadmapData;
    if (note !== null && note !== undefined) {
        AlertDialog("Please note", note, "Got it!", function () {
            initializeUi(name, desc, roadmap);
        });
        return;
    }
    initializeUi(name, desc, roadmap);
}

function initializeUi(name, desc, roadmap) {
    setAboutRoadmap(name, desc);
    setRoadmapList(roadmap);
    setAnimation();
    calculateMainContentHeightForDynamicNav();
}

function setRoadmapList(roadmap) {
    let htmlParts = [];
    roadmap.forEach((item, index) => {
        let { topic, links } = item;
        htmlParts.push(`<div class="roadmap-card fade-in"><div class="roadmap-card-title">${topic}</div>`)
        htmlParts.push(getLinkContainer(links));
        htmlParts.push(`</div>`)
    });
    getId("main-view").scrollTop = 0;
    getId("main-view").innerHTML = htmlParts.join('');
}

function getLinkContainer(links) {
    if (links == null || links == undefined) {
        return "";
    }
    let htmlParts = [`<div class="links-container">`];
    links.forEach(linkItem => {
        let { displayText, link } = linkItem;
        htmlParts.push(`<div class="link-text-with-icon" onclick="openInNewTab('${link}')"><div class="link-text">`);
        if (displayText == null || displayText == undefined) {
            htmlParts.push(`Demo`);
        } else {
            htmlParts.push(displayText);
        }
        htmlParts.push(`</div><div class="link-icon"></div></div>`);
    })
    htmlParts.push(`</div>`);
    return htmlParts.join('');
}

function setAboutRoadmap(name, desc) {
    getId('skeleton-about-roadmap').style.display = "none";
    getId('about-roadmap').style.display = "grid";
    getId('roadmap-title').innerHTML = name;
    getId('roadmap-subtitle').innerHTML = desc;
}

function setLoader() {
    getId('about-roadmap').style.display = "none";
    getId('skeleton-about-roadmap').style.display = "grid";
    const totalItems = 20;
    const htmlParts = Array.from({ length: totalItems }, () => `<div class="roadmap-card"><div class="skeleton-roadmap-card-title skeleton"></div><div class="skeleton-links-container skeleton"></div></div>`).join('');
    getId("main-view").innerHTML = htmlParts;
}


function showErrorDialog() {
    AlertDialog("Roadmap Unavailable", "We're unable to display the requested roadmap. Please verify the link or reach out to support if you need help.", "Go Back", function () {
        goBackOnError();
    })
}

function goBackOnError() {
    goBack('roadmap.html');
}

function isRoadmapsTermsAgreed() {
    if (typeof (Storage) !== "undefined") {
        let isRoadmapsTermsAgreedValue = localStorage.getItem(IS_ROADMAPS_TERMS_AGREED)
        if (isRoadmapsTermsAgreedValue === null) {
            return false;
        } else {
            return isRoadmapsTermsAgreedValue === ROADMAPS_TERMS_AGREED;
        }
    } else {
        return false;
    }
}

function openInNewTab(link) {
    window.open(link, '_blank');
}