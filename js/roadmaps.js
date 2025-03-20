const headerTitle = "Roadmaps";
const dummyRoadmaps = 5;
document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setHeaderTitle();
    setResizeListenerForStaticNav(setHeaderTitle);
    setOnUnload(closeDrawerBeforeUnload);
    setLoader();
    if (isRoadmapsTermsAgreed()) {
        setRoadMaps();
    } else {
        showTermsAndConditions();
    }
    setShortcuts();
    setPreLoader();
});

function setRoadMaps() {
    setTimeout(() => {
        const roadmapsUrl = API_URLS.ROADMAPS;
        fetch(API_URLS.ROADMAPS, { signal: signal }).then(response => {
            if (!response.ok) {
                throw new Error('');
            }
            return response.json();
        }).then(data => {
            renderRoadMapsToUi(data)
        }).catch(function (error) {
            getId('main-view').innerHTML = genericErrorHtml;
            trackError(headerTitle, `Fetch ${getEndpoint(roadmapsUrl)}`, error.message);
        });
    }, DELAY);
}

function renderRoadMapsToUi(roadMaps) {
    let htmlParts = [`<div class="roadmap-list fade-in">`];
    roadMaps.forEach(roadMap => {
        let { name, desc, id } = roadMap;
        htmlParts.push(`<div class="roadmap-list-item clickable" onclick="openRoadMap('${id}')">
				<div class="roadmap-card-icon roadmap-icon"></div>
				<div class="roadmap-card-title">${name}</div>
				<div class="roadmap-card-subtitle">${desc}</div>
			</div>`);
    });
    htmlParts.push(`</div>`);
    getId("main-view").innerHTML = htmlParts.join('');
    setAnimation();
}

function setLoader() {
    const cardItemTemplate = `<div class="roadmap-list-item"><div class="roadmap-card-icon skeleton"></div><div class="skeleton-roadmap-card-title skeleton"></div><div class="skeleton-roadmap-card-subtitle skeleton"></div></div>`;
    const cardItems = cardItemTemplate.repeat(dummyRoadmaps);
    getId("main-view").scrollTop = 0;
    getId("main-view").innerHTML = `<div class="roadmap-list">${cardItems}</div>`
}

function changeTheme() {
    toggleTheme();
}

function showTermsAndConditions() {
    getId('main-view').innerHTML = createTermsAndConditions(`Our roadmap feature provides starting points to learn various technologies based on my knowledge as a developer. While each roadmap is designed to guide you from beginner to a solid foundation, some items may be outdated or missing due to the fast-paced nature of technology. By clicking "I Agree" you acknowledge these terms and are ready to explore the roadmaps.`);
}

function onAgreeTermsAndConditions() {
    try {
        localStorage.setItem(IS_ROADMAPS_TERMS_AGREED, ROADMAPS_TERMS_AGREED);
    } catch (error) { } finally {
        setLoader();
        setRoadMaps();
    }
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

function openRoadMap(id) {
    window.location.href = `roadmapdetails.html?id=${id}`;
}

function retryLoad() {
    setLoader();
    setRoadMaps();
}

window.addEventListener('pageshow', closeDrawerBeforeUnload, false)