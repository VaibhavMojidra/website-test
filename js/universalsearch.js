let navbarHeight = 0;
let imageIds = [];
let currentTimeStamp = getTimeStamp();
let cachedImageMap = new Map();
let animationCompleted = false;
const DATA_KEYS = {
    ALL: "all",
    APPS: "apps",
    AWARDS: "awards",
    EDUCATION: "education",
    GITHUB_REPOSITORIES: "git_repos",
    INSTITUTE_CERTIFICATION: "institute_cert",
    ONLINE_CERTIFICATION: "online_cert",
    OTHER_CERTIFICATION: "other_cert",
    PROFESSIONAL_CERTIFICATION: "prof_cert",
    ROADMAPS: "roadmaps",
    SKILLS: "skills",
    SOCIALS: "socials",
    WORK_EXPERIENCE: "work_exp"
}
let mainData = {
    [DATA_KEYS.APPS]: [],
    [DATA_KEYS.AWARDS]: [],
    [DATA_KEYS.EDUCATION]: [],
    [DATA_KEYS.GITHUB_REPOSITORIES]: [],
    [DATA_KEYS.INSTITUTE_CERTIFICATION]: [],
    [DATA_KEYS.ONLINE_CERTIFICATION]: [],
    [DATA_KEYS.OTHER_CERTIFICATION]: [],
    [DATA_KEYS.PROFESSIONAL_CERTIFICATION]: [],
    [DATA_KEYS.ROADMAPS]: [],
    [DATA_KEYS.SKILLS]: [],
    [DATA_KEYS.SOCIALS]: [],
    [DATA_KEYS.WORK_EXPERIENCE]: []
}
let defaultFilters = [
    { id: DATA_KEYS.ALL, title: "All Sections", isSelected: true },
    { id: DATA_KEYS.APPS, title: "Apps", isSelected: false },
    { id: DATA_KEYS.AWARDS, title: "Awards", isSelected: false },
    { id: DATA_KEYS.EDUCATION, title: "Education", isSelected: false },
    { id: DATA_KEYS.GITHUB_REPOSITORIES, title: "GitHub Repositories", isSelected: false },
    { id: DATA_KEYS.INSTITUTE_CERTIFICATION, title: "Institute Certification", isSelected: false },
    { id: DATA_KEYS.ONLINE_CERTIFICATION, title: "Online Certification", isSelected: false },
    { id: DATA_KEYS.OTHER_CERTIFICATION, title: "Other Certification", isSelected: false },
    { id: DATA_KEYS.PROFESSIONAL_CERTIFICATION, title: "Professional Certification", isSelected: false },
    { id: DATA_KEYS.ROADMAPS, title: "Roadmaps", isSelected: false },
    { id: DATA_KEYS.SKILLS, title: "Skills", isSelected: false },
    { id: DATA_KEYS.SOCIALS, title: "Social & Other Accounts", isSelected: false },
    { id: DATA_KEYS.WORK_EXPERIENCE, title: "Work Experience", isSelected: false }
];
let appliedFilters = [...defaultFilters];
let cachedFilters = [];
let searchThreshold = 0.4;
let showLoader = false;
let intersectObserver = null;

document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setResizeListenerForDynamicNav(function () {
        navbarHeight = document.querySelector('.navbar-container').offsetHeight;
    });
    initAndProceed();
    setShortcuts(goBackClick);
    setOnUnload();
});

function initAndProceed() {
    setLoader();
    imageIds = [];
    currentTimeStamp = getTimeStamp();
    navbarHeight = document.querySelector('.navbar-container').offsetHeight;
    fetchAndProceed();
}

function fetchAndProceed() {
    const TYPES = {
        QUALIFICATION: "qualification",
        WORK_EXPERIENCE_AND_AWARDS: "work_experience_and_awards",
        SKILLS: "skills",
        APPS: "apps",
        GITHUB_REPOS: "github_repos",
        ROADMAPS: "roadmaps"
    }
    const DATA_URLS = [
        { type: TYPES.QUALIFICATION, url: API_URLS.QUALIFICATION },
        { type: TYPES.WORK_EXPERIENCE_AND_AWARDS, url: API_URLS.WORK_EXPERIENCE_AND_AWARDS },
        { type: TYPES.SKILLS, url: API_URLS.SKILLS },
        { type: TYPES.APPS, url: API_URLS.APPS },
        { type: TYPES.GITHUB_REPOS, url: API_URLS.GITHUB_REPOS },
        { type: TYPES.ROADMAPS, url: API_URLS.ROADMAPS },
    ];
    const fetchPromises = DATA_URLS.map((urlItem) => {
        return fetch(urlItem.url, { signal })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('');
                }
                return response.json();
            })
            .then((data) => {
                return { type: urlItem.type, data };
            })
            .catch((error) => {
                return { type: urlItem.type, error: "Some Error" };
            });
    });

    Promise.all(fetchPromises)
        .then((results) => {
            const errors = results.filter((result) => result.error);
            if (errors.length == 0) {
                results.forEach(result => {
                    switch (result.type) {
                        case TYPES.QUALIFICATION: {
                            let { educations, professionalCertifications, instituteCertifications, onlineCertifications, otherCertifications } = result.data;
                            mainData[DATA_KEYS.EDUCATION] = educations;
                            mainData[DATA_KEYS.PROFESSIONAL_CERTIFICATION] = professionalCertifications;
                            mainData[DATA_KEYS.INSTITUTE_CERTIFICATION] = instituteCertifications;
                            mainData[DATA_KEYS.ONLINE_CERTIFICATION] = onlineCertifications;
                            mainData[DATA_KEYS.OTHER_CERTIFICATION] = otherCertifications;
                        }
                            break;
                        case TYPES.WORK_EXPERIENCE_AND_AWARDS: {
                            const { workExperiences, awards } = result.data;
                            mainData[DATA_KEYS.WORK_EXPERIENCE] = workExperiences;
                            mainData[DATA_KEYS.AWARDS] = awards;
                        }
                            break;
                        case TYPES.SKILLS: {
                            mainData[DATA_KEYS.SKILLS] = result.data;
                        }
                            break;
                        case TYPES.APPS: {
                            mainData[DATA_KEYS.APPS] = result.data;
                        }
                            break;
                        case TYPES.GITHUB_REPOS: {
                            mainData[DATA_KEYS.GITHUB_REPOSITORIES] = result.data;
                        }
                            break;
                        case TYPES.ROADMAPS: {
                            mainData[DATA_KEYS.ROADMAPS] = result.data;
                        }
                            break;
                        default: {
                            getId('main-view').innerHTML = genericErrorHtml;
                            return;
                        }
                    }
                })
                mainData[DATA_KEYS.SOCIALS] = convertSocialsToList();
                getId('filter-container-element').style.display = "flex";
                calculateMainContentHeightForDynamicNav();
                currentTimeStamp = getTimeStamp();
                navbarHeight = document.querySelector('.navbar-container').offsetHeight;
                getId('main-view').innerHTML = startUsingFeatureHtml("Explore Everything at Once", "Quickly search and discover any information across the website—all in one place. <br>Start typing to find what you need without navigating through tabs.", "Get Started");
                setFocus();
            } else {
                getId('main-view').innerHTML = genericErrorHtml;
            }
        })
        .catch((error) => {
            getId('main-view').innerHTML = genericErrorHtml;
        });
}

function setFocus() {
    const inputElement = getId('search-text-box');
    const viewportWidth = window.innerWidth;
    if (viewportWidth >= 1080) {
        inputElement.focus();
    }
}

function openFilterBottomSheet() {
    getId('bottomsheet-container').style.display = "block";
    getId('bottomsheet-dismiss').style.height = "100%";
    getId('bottomsheet-main-container').style.height = "0%";
    setTimeout(() => {
        getId('bottomsheet-dismiss').style.height = "25%";
        getId('bottomsheet-main-container').style.height = "75%";
    }, 50);
    cachedFilters = [...appliedFilters];
    setFiltersUI(cachedFilters);
    getId('bottomsheet-filters-container').scrollTop = 0;
}

function setFiltersUI(filters) {
    let htmlParts = [];
    filters.forEach(filterItem => {
        htmlParts.push(`<div class="filter-list-item" id="filter-item-${filterItem.id}" onclick="onFilterOptionClick('${filterItem.id}')">${filterItem.title}</div>`);
    });
    getId('section-list').innerHTML = htmlParts.join('');
    filters.forEach(filterItem => {
        if (filterItem.isSelected) {
            selectFilterItem(filterItem.id);
        } else {
            deselectFilterItem(filterItem.id);
        }
    })
}


function onFilterOptionClick(sectionId) {
    if (sectionId == DATA_KEYS.ALL) {
        cachedFilters = [...cachedFilters.map(filterItem => ({
            id: filterItem.id,
            title: filterItem.title,
            isSelected: (filterItem.id == DATA_KEYS.ALL)
        }))];
        setFiltersUI(cachedFilters);
        return;
    }

    let cachedTechnologies = [...cachedFilters];

    if (cachedTechnologies.find(it => it.id == sectionId).isSelected) {
        let isOnlyChecked = true;
        for (const filterItem of cachedTechnologies) {
            if (filterItem.id != sectionId && filterItem.isSelected) {
                isOnlyChecked = false;
                break;
            }
        }

        if (isOnlyChecked) {
            return;
        }

        cachedTechnologies = cachedTechnologies.map(filterItem => ({
            id: filterItem.id,
            title: filterItem.title,
            isSelected: (filterItem.id == sectionId) ? false : filterItem.isSelected
        }));

        cachedFilters = [...cachedTechnologies];
        setFiltersUI(cachedFilters);
        return;
    }

    cachedTechnologies = cachedTechnologies.map(filterItem => ({
        id: filterItem.id,
        title: filterItem.title,
        isSelected: (filterItem.id == DATA_KEYS.ALL) ? false : ((filterItem.id == sectionId) ? true : filterItem.isSelected)
    }));

    let isAllChecked = true;
    for (const filterItem of cachedTechnologies) {
        if (filterItem.id != DATA_KEYS.ALL && !filterItem.isSelected) {
            isAllChecked = false;
            break;
        }
    }

    if (isAllChecked) {
        cachedFilters = [...cachedFilters.map(filterItem => ({
            id: filterItem.id,
            title: filterItem.title,
            isSelected: (filterItem.id == DATA_KEYS.ALL)
        }))];
        setFiltersUI(cachedFilters);
        return;
    }

    cachedFilters = [...cachedTechnologies];
    setFiltersUI(cachedFilters);
}

function applyFilters() {
    appliedFilters = [...cachedFilters];
    let isAllSectionsSelected = appliedFilters.find(it => it.id == DATA_KEYS.ALL).isSelected;
    getId("main-view").scrollTop = 0;
    closeFilterBottomSheet();
    if (isAllSectionsSelected) {
        const maskUrl = "assets/icons/ic_filter_outlined.svg";
        const filter = getId('filter-icon');
        filter.style.mask = `url('${maskUrl}') no-repeat center / contain`;
        filter.style.webkitMask = `url('${maskUrl}') no-repeat center / contain`;
        setContent();
        return;
    }
    const maskUrl = "assets/icons/ic_filter_filled.svg";
    const filter = getId('filter-icon');
    filter.style.mask = `url('${maskUrl}') no-repeat center / contain`;
    filter.style.webkitMask = `url('${maskUrl}') no-repeat center / contain`;
    setContent();

}

function resetFilter() {
    cachedFilters = [...defaultFilters];
    setFiltersUI(cachedFilters);
}

function debounce(callBack, delay = 1000) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            callBack(...args);
        }, delay);
    };
}

const debouncedSearchResult = debounce(setContent, 600);

function onSearchQueryChange() {
    let searchQuery = getId('search-text-box').value.trim();
    setClearIconVisible(searchQuery == "" ? false : true);
    if (!showLoader) {
        showLoader = true;
        getId("main-view").scrollTop = 0;
        setLoader();
    }
    debouncedSearchResult(searchQuery);
}

function clearSearchQuery() {
    getId('search-text-box').value = "";
    setClearIconVisible(false);
    setContent();
}

function setClearIconVisible(visible) {
    getId('clear-icon-text-box').style.display = visible ? "block" : "none";
}

function setContent() {
    let searchTerm = getId('search-text-box').value.trim();
    let isAllSectionsSelected = appliedFilters.find(it => it.id == DATA_KEYS.ALL).isSelected;
    if (searchTerm == "" && isAllSectionsSelected) {
        const rankedData = Object.keys(mainData)
            .sort((a, b) => a.localeCompare(b))
            .map((key, index) => ({
                section: key,
                data: mainData[key],
                ranked: index
            }));
        renderContentInUi(rankedData)
        return;
    }

    if (isAllSectionsSelected) {
        let allSections = appliedFilters.filter(it => it.id != DATA_KEYS.ALL);
        let rankedDataWithSearchTerm = getRankedData(allSections, searchTerm);
        renderContentInUi(rankedDataWithSearchTerm);
        return;
    }

    let selectedSections = appliedFilters.filter(it => it.isSelected);
    let rankedDataWithSelectedSectionAndSearchTerm = getRankedData(selectedSections, searchTerm);
    renderContentInUi(rankedDataWithSelectedSectionAndSearchTerm);
}


function getRankedData(sectionList, searchTerm) {
    const rankedData = [];
    sectionList.forEach(function (sectionItem) {
        let sectionData = [];
        let sectionRank = 100000;
        let section = sectionItem.id;
        switch (section) {
            case DATA_KEYS.APPS: {
                let filteredData = filterInSection(mainData[DATA_KEYS.APPS], searchTerm, 1001, [{ name: 'name', weight: 0.8 }, { name: 'tech', weight: 0.5 }, { name: 'type', weight: 0.3 }]);
                sectionData = filteredData.data;
                sectionRank = filteredData.rank;
            }
                break;
            case DATA_KEYS.AWARDS: {
                let filteredData = filterInSection(modifyAwardList(mainData[DATA_KEYS.AWARDS]), searchTerm, 1002, [{ name: 'name', weight: 0.8 }, { name: 'issuedDateInMonthAndYear', weight: 0.5 }, { name: 'issuedDate', weight: 0.3 }]);
                sectionData = getOriginalAwardList(filteredData.data);
                sectionRank = filteredData.rank;
            }
                break;
            case DATA_KEYS.EDUCATION: {
                let filteredData = filterInSection(mainData[DATA_KEYS.EDUCATION], searchTerm, 1003, [{ name: 'title', weight: 0.8 }, { name: 'subTitle', weight: 0.5 }, { name: 'keywords', weight: 0.3 }]);
                sectionData = filteredData.data;
                sectionRank = filteredData.rank;
            }
                break;
            case DATA_KEYS.GITHUB_REPOSITORIES: {
                let filteredData = filterInSection(mainData[DATA_KEYS.GITHUB_REPOSITORIES], searchTerm, 1004, [{ name: 'repoName', weight: 0.8 }, { name: 'tech', weight: 0.2 }]);
                sectionData = filteredData.data;
                sectionRank = filteredData.rank;
            }
                break;
            case DATA_KEYS.INSTITUTE_CERTIFICATION: {
                let filteredData = filterInSection(mainData[DATA_KEYS.INSTITUTE_CERTIFICATION], searchTerm, 1005, [{ name: 'title', weight: 0.8 }, { name: 'subTitle', weight: 0.5 }, { name: 'keywords', weight: 0.3 }]);
                sectionData = filteredData.data;
                sectionRank = filteredData.rank;
            }
                break;
            case DATA_KEYS.ONLINE_CERTIFICATION: {
                let filteredData = filterInSection(mainData[DATA_KEYS.ONLINE_CERTIFICATION], searchTerm, 1006, [{ name: 'title', weight: 0.8 }, { name: 'subTitle', weight: 0.5 }, { name: 'keywords', weight: 0.3 }]);
                sectionData = filteredData.data;
                sectionRank = filteredData.rank;
            }
                break;
            case DATA_KEYS.OTHER_CERTIFICATION: {
                let filteredData = filterInSection(mainData[DATA_KEYS.OTHER_CERTIFICATION], searchTerm, 1007, [{ name: 'title', weight: 0.8 }, { name: 'subTitle', weight: 0.5 }, { name: 'keywords', weight: 0.3 }]);
                sectionData = filteredData.data;
                sectionRank = filteredData.rank;
            }
                break;
            case DATA_KEYS.PROFESSIONAL_CERTIFICATION: {
                let filteredData = filterInSection(mainData[DATA_KEYS.PROFESSIONAL_CERTIFICATION], searchTerm, 1008, [{ name: 'title', weight: 0.8 }, { name: 'subTitle', weight: 0.5 }, { name: 'keywords', weight: 0.3 }]);
                sectionData = filteredData.data;
                sectionRank = filteredData.rank;
            }
                break;
            case DATA_KEYS.ROADMAPS: {
                let filteredData = filterInSection(mainData[DATA_KEYS.ROADMAPS], searchTerm, 1009, ['name']);
                sectionData = filteredData.data;
                sectionRank = filteredData.rank;
            }
                break;
            case DATA_KEYS.SKILLS: {
                let filteredData = filterInSection(mainData[DATA_KEYS.SKILLS], searchTerm, 1010, ['title']);
                sectionData = filteredData.data;
                sectionRank = filteredData.rank;
            }
                break;
            case DATA_KEYS.SOCIALS: {
                let filteredData = filterInSection(mainData[DATA_KEYS.SOCIALS], searchTerm, 1011, ['name']);
                sectionData = filteredData.data;
                sectionRank = filteredData.rank;
            }
                break;
            case DATA_KEYS.WORK_EXPERIENCE: {
                let filteredData = filterInSection(mainData[DATA_KEYS.WORK_EXPERIENCE], searchTerm, 1012, [{ name: "name", weight: 0.9 }, { name: "location", weight: 0.2 }, { name: "type", weight: 0.2 }, { name: "projects.name", weight: 0.9 }, { name: "projects.role", weight: 0.6 }]);
                sectionData = filteredData.data;
                sectionRank = filteredData.rank;
            }
                break;
            default: {
                section = "";
                sectionData = [];
                sectionRank = 100000;
            }
        }
        if (sectionData.length != 0) {
            rankedData.push({
                section: section,
                data: sectionData,
                ranked: sectionRank
            })
        }
    });
    return rankedData;
}

function getOriginalAwardList(modifiedAwardList) {
    return modifiedAwardList.map(item => {
        const { issuedDateInMonthAndYear, ...rest } = item;
        return rest;
    })
}

function modifyAwardList(awardList) {
    return awardList.map(item => ({
        ...item,
        issuedDateInMonthAndYear: formatAwardIssueDate(item.issuedDate)
    }))
}

function filterInSection(listData, searchTerm, defaultRank, filterKeys) {
    if (searchTerm == "") {
        return {
            data: listData,
            rank: defaultRank
        }
    }
    const options = {
        includeScore: true,
        keys: filterKeys,
        threshold: searchThreshold,
        useExtendedSearch: true
    }
    const fuse = new Fuse(listData, options);
    const result = fuse.search(searchTerm);
    if (result.length == 0) {
        return {
            data: [],
            rank: defaultRank
        }
    }
    let rank = result[0].score;
    const finalResult = result.map(it => it.item);
    return {
        data: finalResult,
        rank: rank
    }
}

function renderContentInUi(rankedData) {
    imageIds = [];
    currentTimeStamp = getTimeStamp();
    removeMultipleMenuAnimation();

    if (rankedData.length == 0) {
        showLoader = false;
        getId("main-view").scrollTop = 0;
        getId("main-view").innerHTML = createNoResultFoundUi("No Result Found", "Sorry, we couldn't find any result with the given search terms.<br>Try changing the keywords or clearing some filters.");
        return;
    }
    const isAnimationDone = getAnimationCompletion();
    const sortedRankedData = [...rankedData].sort((a, b) => a.ranked - b.ranked).map(({ section, data }) => ({ section, data }));
    const htmlParts = [`<div id="result-list" class="${isAnimationDone ? "" : "fade-in"}">`];
    sortedRankedData.forEach(function (sectionData) {
        switch (sectionData.section) {
            case DATA_KEYS.APPS: {
                htmlParts.push(createAppsSection(sectionData.data));
            }
                break;
            case DATA_KEYS.AWARDS: {
                htmlParts.push(createAwardsSection(sectionData.data));
            }
                break;
            case DATA_KEYS.EDUCATION: {
                htmlParts.push(createEducationOrCertificationSection(sectionData.data, DATA_KEYS.EDUCATION));
            }
                break;
            case DATA_KEYS.GITHUB_REPOSITORIES: {
                htmlParts.push(createGithubRepositoriesSection(sectionData.data));
            }
                break;
            case DATA_KEYS.INSTITUTE_CERTIFICATION: {
                htmlParts.push(createEducationOrCertificationSection(sectionData.data, DATA_KEYS.INSTITUTE_CERTIFICATION));
            }
                break;
            case DATA_KEYS.ONLINE_CERTIFICATION: {
                htmlParts.push(createEducationOrCertificationSection(sectionData.data, DATA_KEYS.ONLINE_CERTIFICATION));
            }
                break;
            case DATA_KEYS.OTHER_CERTIFICATION: {
                htmlParts.push(createEducationOrCertificationSection(sectionData.data, DATA_KEYS.OTHER_CERTIFICATION));
            }
                break;
            case DATA_KEYS.PROFESSIONAL_CERTIFICATION: {
                htmlParts.push(createEducationOrCertificationSection(sectionData.data, DATA_KEYS.PROFESSIONAL_CERTIFICATION));
            }
                break;
            case DATA_KEYS.ROADMAPS: {
                htmlParts.push(createRoadmapsSection(sectionData.data));
            }
                break;
            case DATA_KEYS.SKILLS: {
                htmlParts.push(createSkillsSection(sectionData.data));
            }
                break;
            case DATA_KEYS.SOCIALS: {
                htmlParts.push(createSocialsAndOtherAccountsSection(sectionData.data));
            }
                break;
            case DATA_KEYS.WORK_EXPERIENCE: {
                htmlParts.push(createWorkExperienceSection(sectionData.data));
            }
                break;
            default: { }
                break;
        }
    })
    showLoader = false;
    htmlParts.push('</div>');
    getId("main-view").scrollTop = 0;
    getId('main-view').innerHTML = htmlParts.join('');
    addMultipleMenuAnimation();
    loadMedia();
    if (!isAnimationDone) {
        setAnimation();
    }
}

function loadMedia() {
    try { intersectObserver.disconnect(); } catch (error) { }
    intersectObserver = null;
    intersectObserver = new IntersectionObserver((entries, intersectObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const imageItem = imageIds.find(item => item.id === (entry.target.id.replace(/^skeleton-/, '')));
                if (imageItem) {
                    fetchMedia(imageItem);
                    intersectObserver.unobserve(entry.target);
                }
            }
        });
    });
    imageIds.forEach(function (imageItem) {
        let imgElement = getId(`skeleton-${imageItem.id}`);
        intersectObserver.observe(imgElement);
    });
}

function fetchMedia(imageItem) {
    const { id, url } = imageItem;
    getId(`skeleton-${id}`).style.display = "block";
    getId(id).style.display = "none";
    if (cachedImageMap.has(url)) {
        try {
            let objectUrl = cachedImageMap.get(url);
            let imgElement = getId(id);
            imgElement.src = objectUrl;
            getId(`skeleton-${id}`).style.display = "none";
            imgElement.style.display = "block";
            return;
        }
        catch (e) {
            onMediaFetchFailed(id, `skeleton-${id}`, url);
            return;
        }
    }
    fetch(url, { signal: signal }).then(response => {
        if (!response.ok) {
            throw new Error('');
        }
        return response.blob();
    }).then(blob => {
        try {
            let imgElement = getId(id);
            const objectUrl = URL.createObjectURL(blob);
            imgElement.src = objectUrl;
            getId(`skeleton-${id}`).style.display = "none";
            imgElement.style.display = "block";
            addToCachedImageMap(url, objectUrl);
        } catch (e) { }
    }).catch(error => {
        onMediaFetchFailed(id, `skeleton-${id}`, url);
    })
}


function addToCachedImageMap(url, objectUrl) {
    if (cachedImageMap.has(url)) {
        try {
            let oldObjectUrl = cachedImageMap.get(url);
            URL.revokeObjectURL(oldObjectUrl);
        } catch (error) { }
    }
    cachedImageMap.set(url, objectUrl);
}


function onMediaFetchFailed(imageId, skeletonId, logoUrl) {
    try {
        getId(imageId).src = logoUrl;
        getId(skeletonId).style.display = "none";
        getId(imageId).style.display = "block";
    } catch (e) { }
}

function selectFilterItem(filterId) {
    let filterElement = getId(`filter-item-${filterId}`);
    filterElement.style.borderWidth = "2.3px";
    filterElement.style.borderColor = "var(--text-color)";
    filterElement.style.color = "var(--text-color)";
    filterElement.style.fontWeight = "600";
}

function deselectFilterItem(filterId) {
    let filterElement = getId(`filter-item-${filterId}`);
    filterElement.style.borderWidth = "2px";
    filterElement.style.borderColor = "var(--light-text-color)";
    filterElement.style.color = "var(--light-text-color)";
    filterElement.style.fontWeight = "500";
}

function closeFilterBottomSheet() {
    cachedFilters = [];
    getId('bottomsheet-filters-container').scrollTop = 0;
    getId('bottomsheet-dismiss').style.height = "100%";
    getId('bottomsheet-main-container').style.height = "0%";
    setTimeout(() => {
        getId('bottomsheet-container').style.display = "none";
    }, 300);
}

function retryLoad() {
    getId("main-view").scrollTop = 0;
    initAndProceed();
}

function createAppsSection(appsList) {
    let htmlParts = [`<section class="section"><div class="section-title">Apps</div>`];
    appsList.forEach(function (app, index) {
        let mediaUrl = API_URLS.APPS_MEDIA(app.media);
        let mediaId = getMediaId('app', index, mediaUrl);
        htmlParts.push(`<div class="card clickable" onclick="onAppItemClick('${app.id}')"><img class="card-icon app-icon" src="" id="${mediaId}" style="display:none"></img><div class="card-icon app-icon skeleton" id="skeleton-${mediaId}"></div><div class="card-title">${app.name}</div><div class="card-subtitle">${app.tech}</div></div>`)
    });
    htmlParts.push('</section>');
    return htmlParts.join('');
}

function createAwardsSection(awardsList) {
    let htmlParts = [`<section class="section"><div class="section-title">Awards</div>`];
    awardsList.forEach(function (award, index) {
        let mediaUrl = API_URLS.WORK_EXPERIENCE_MEDIA(award.icon);
        let mediaId = getMediaId('award', index, mediaUrl);
        htmlParts.push(`<div class="card clickable" onclick="onAwardItemClick('${award.award}')">
                    <img class="card-icon square-icon" src="" style="display:none" id="${mediaId}"></img>
                    <div class="card-icon square-icon skeleton" id="skeleton-${mediaId}"></div>
                    <div class="card-title">${award.name}</div>
                    <div class="card-subtitle">${formatAwardIssueDate(award.issuedDate)}</div>
                </div>`);
    });
    htmlParts.push('</section>');
    return htmlParts.join('');
}

function createEducationOrCertificationSection(educationCertificationList, eduCertType) {
    switch (eduCertType) {
        case DATA_KEYS.EDUCATION: {
            return createEducationCertificateCommonTemplate(educationCertificationList, "Education", "edu");
        }
        case DATA_KEYS.INSTITUTE_CERTIFICATION: {
            return createEducationCertificateCommonTemplate(educationCertificationList, "Institute Certification", "intcert");
        }
        case DATA_KEYS.ONLINE_CERTIFICATION: {
            return createEducationCertificateCommonTemplate(educationCertificationList, "Online Certification", "onlcert");
        }
        case DATA_KEYS.OTHER_CERTIFICATION: {
            return createEducationCertificateCommonTemplate(educationCertificationList, "Other Certification", "othercert");
        }
        case DATA_KEYS.PROFESSIONAL_CERTIFICATION: {
            return createEducationCertificateCommonTemplate(educationCertificationList, "Professional Certification", "profcert");
        }
        default: {
            return "";
        }
    }
}

function createEducationCertificateCommonTemplate(educationCertificationList, sectionTitle, mediaTag) {
    let htmlParts = [`<section class="section"><div class="section-title">${sectionTitle}</div>`];
    educationCertificationList.forEach(function (ec, index) {
        let mediaUrl = API_URLS.QUALIFICATION_MEDIA(ec.icon);
        let mediaId = getMediaId(mediaTag, index, mediaUrl);
        htmlParts.push(`<div class="card clickable" onclick="onEducationAndCertItemClick('${ec.id}')"><img class="card-icon square-icon" src="" style="display:none" id="${mediaId}"></img><div class="card-icon square-icon skeleton" id="skeleton-${mediaId}"></div><div class="card-title">${ec.title}</div><div class="card-subtitle">${ec.subTitle}</div></div>`);
    });
    htmlParts.push('</section>');
    return htmlParts.join('');
}

function createGithubRepositoriesSection(githubReposList) {
    let htmlParts = [`<section class="section"><div class="section-title">GitHub Repositories</div>`];
    githubReposList.forEach(function (repo) {
        htmlParts.push(`<div class="card clickable" onclick="onGithubRepoItemClick('${repo.repoUrl}')"><div class="card-icon github-icon"></div><div class="card-title">${repo.repoName}</div><div class="card-subtitle">${repo.tech}</div></div>`);
    });
    htmlParts.push('</section>');
    return htmlParts.join('');
}

function createRoadmapsSection(roadmapsList) {
    let htmlParts = [`<section class="section"><div class="section-title">Roadmaps</div>`];
    roadmapsList.forEach(function (roadmap) {
        htmlParts.push(`<div class="card clickable" onclick="onRoadmapItemClick('${roadmap.id}')"><div class="card-icon roadmap-icon"></div><div class="card-title">${roadmap.name}</div><div class="card-subtitle">${roadmap.desc}</div></div>`);
    });
    htmlParts.push('</section>');
    return htmlParts.join('');
}

function createWorkExperienceSection(workExperienceList) {
    let htmlParts = [`<section class="section"><div class="section-title">Work Experience</div>`];
    workExperienceList.forEach(function (work, index) {
        let mediaUrl = API_URLS.WORK_EXPERIENCE_MEDIA(work.logo);
        let mediaId = getMediaId('work', index, mediaUrl);
        htmlParts.push(`<div class="card clickable" onclick="onWorkItemClick()">
                    <img class="card-icon square-icon" src="" style="display:none" id="${mediaId}"></img>
                    <div class="card-icon square-icon skeleton" id="skeleton-${mediaId}"></div>
                    <div class="card-title">${work.name}</div>
                    <div class="card-subtitle">${work.location} · ${work.type}</div>
                </div>`);
    });
    htmlParts.push('</section>');
    return htmlParts.join('');
}

function createSocialsAndOtherAccountsSection(socialsList) {
    let htmlParts = [`<section class="section"><div class="section-title">Social & Other Accounts</div>`];
    socialsList.forEach(function (social) {
        let iconName = convertToLowerCaseAndRemoveSpaces(social.name);
        htmlParts.push(`<div class="social-card clickable" onclick="onSocialItemClick('${social.url}')">
        <div style="mask: url('assets/socialicons/${iconName}.svg') no-repeat center / contain;-webkit-mask: url('assets/socialicons/${iconName}.svg') no-repeat center / contain;background-color: var(--text-color)" class="social-card-icon"></div>
        <div class="social-card-title">${social.name}</div>
    </div>`)
    })
    htmlParts.push('</section>');
    return htmlParts.join('');
}

function convertSocialsToList() {
    let socialList = [];
    Object.keys(socials).forEach(key => {
        socialList.push(socials[key]);
    });
    return socialList;
}

function createSkillsSection(skillsList) {
    let htmlParts = [`<section class="section"><div class="section-title">Skills</div>`];
    skillsList.forEach(function (skill) {
        htmlParts.push(` <div class="skill-card"><div class="skill-card-title">${skill.title}</div><div class="skill-card-subtitle">${skill.desc}</div></div>`);
    });
    htmlParts.push('</section>');
    return htmlParts.join('');
}

function setLoader() {
    let itemCountPerSection = 5;
    getId('main-view').innerHTML = `<div id="result-list">${createAppSectionLoader(itemCountPerSection)}${createCommonSectionLoader(itemCountPerSection)}${createCommonSectionLoader(itemCountPerSection)}${createCommonSectionLoader(itemCountPerSection)}${createCommonSectionLoader(itemCountPerSection)}${createCommonSectionLoader(itemCountPerSection)}${createCommonSectionLoader(itemCountPerSection)}${createCommonSectionLoader(itemCountPerSection)}${createCommonSectionLoader(itemCountPerSection)}${createSkillsSectionLoader(itemCountPerSection)}${createSocialsSectionLoader(itemCountPerSection)}${createCommonSectionLoader(itemCountPerSection)}</div>`;
}


function addMultipleMenuAnimation() {
    navbarHeight = document.querySelector('.navbar-container').offsetHeight;
    removeMultipleMenuAnimation();
    const sections = document.querySelectorAll('.section');
    const titles = document.querySelectorAll('.section-title');
    document.querySelector('.main-content').addEventListener('scroll', () => {
        sections.forEach((section, index) => {
            const title = titles[index];
            const rect = section.getBoundingClientRect();
            if (rect.top <= navbarHeight && rect.bottom >= navbarHeight) {
                title.style.position = 'sticky';
                title.style.top = '0px';
            } else if (rect.bottom < navbarHeight) {
                title.style.position = 'relative';
                title.style.top = '';
            }
        });
    });
}

function removeMultipleMenuAnimation() {
    try {
        document.querySelector('.scroll-container').removeEventListener('scroll', function () { })
    } catch (error) { }
}

function createAppSectionLoader(itemsCount) {
    const skeletonCard = `<div class="card"><div class="card-icon app-icon skeleton"></div><div class="skeleton-card-title skeleton"></div><div class="skeleton-card-subtitle skeleton"></div></div>`;
    return `${createSectionTitleLoader()}${skeletonCard.repeat(itemsCount)}`;
}

function createCommonSectionLoader(itemsCount) {
    const skeletonCard = `<div class="card"><div class="card-icon square-icon skeleton"></div><div class="skeleton-card-title skeleton"></div><div class="skeleton-card-subtitle skeleton"></div></div>`;
    return `${createSectionTitleLoader()}${skeletonCard.repeat(itemsCount)}`;
}

function createSkillsSectionLoader(itemsCount) {
    const skeletonCard = `<div class="skill-card"><div class="skeleton-skill-card-title skeleton"></div><div class="skeleton-skill-card-subtitle skeleton"></div></div>`;
    return `${createSectionTitleLoader()}${skeletonCard.repeat(itemsCount)}`;
}

function createSocialsSectionLoader(itemsCount) {
    const skeletonCard = ` <div class="social-card"><div class="social-card-icon skeleton"></div><div class="skeleton-social-card-title skeleton"></div></div>`;
    return `${createSectionTitleLoader()}${skeletonCard.repeat(itemsCount)}`;
}

function createSectionTitleLoader() {
    return `<div class="skeleton-section-title skeleton"></div>`;
}

function onStartUsingFeatureButtonClick() {
    setContent();
}

function getTimeStamp() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();
    const id = `${day}${month}${year}${hours}${minutes}${seconds}${milliseconds}`;
    return id;
}

function getMediaId(itemType, position, mediaUrl) {
    let mediaId = `${itemType}${position}${currentTimeStamp}`;
    imageIds.push({
        id: mediaId,
        url: mediaUrl
    })
    return mediaId;
}

function formatAwardIssueDate(issuedDate) {
    return moment(issuedDate, 'MM/DD/YYYY').format('MMMM YYYY');
}

function convertToLowerCaseAndRemoveSpaces(str) {
    return str.toLowerCase().replace(/\s+/g, '');
}

function onAppItemClick(id) {
    window.location.href = `appsdetails.html?id=${id}`;
}

function onAwardItemClick(imageId) {
    window.location.href = `viewer.html?type=${MEDIA_TYPE_AWARD}&id=${imageId}`;
}

function onEducationAndCertItemClick(id) {
    window.location.href = `educationandcertificationsdetails.html?id=${id}`;
}

function onGithubRepoItemClick(repoUrl) {
    window.location.href = `https://github.com/VaibhavMojidra/${repoUrl}`;
}

function onRoadmapItemClick(id) {
    window.location.href = `roadmapdetails.html?id=${id}`;
}

function onWorkItemClick() {
    window.location.href = `workexperience.html`;
}

function onSocialItemClick(socailUrl) {
    window.location.href = `https://${socailUrl}`;
}

function openSearchInfoDialog() {
    let dialogContainer = getId('search-info-dialog-container');
    dialogContainer.innerHTML = `<div class="search-info-dialog"><div class="search-info-dialog-title">Explore Universal Search</div><div class="search-info-dialog-message">Welcome to <span class="light-bold">Universal Search</span>. This powerful feature lets you explore all website content in one place and apply filters to narrow your search to specific sections.<br><br>To make your search more effective, we support advanced pattern matching. Here’s how each match type works:<br><br><ul style="padding-left:20px;padding-right:20px"><li><span class="light-bold">Fuzzy Match (Default)</span><br>Finds close enough matches to your search term, handling typos, partial inputs, or variations in word forms.<br>Eg: Searching for <span class="dialog-highlight">Andrid</span> will return results containing "<span class="light-bold">Android</span>", even with a typo.</li><br><li><span class="light-bold">Exact Match</span><br>Matches your search term precisely, disallowing typos or variations. Use the syntax <span class="dialog-highlight">=(Search Term)</span>.<br>Eg: Searching for <span class="dialog-highlight">=Java</span> will return results containing exact word "<span class="light-bold">Java</span>" only, excluding partial matches like "<s>JavaScript.</s>"</li><br><li><span class="light-bold">Include-Match</span><br>Finds results that include the search term. Use the syntax <span class="dialog-highlight">'(Search Term)</span>.<br>Eg: Searching for <span class="dialog-highlight">'python</span> will return all results containing the word "<span class="light-bold">python</span>".</li><br><li><span class="light-bold">Inverse-Exact-Match</span><br>Excludes results containing the search term. Use the syntax <span class="dialog-highlight">!(Search Term)</span>.<br>Eg: Searching for <span class="dialog-highlight">!kotlin</span> will exclude out all results that include the word "<span class="light-bold">kotlin</span>".</li><br><li><span class="light-bold">Prefix-Exact-Match</span><br>Finds results that starts with the search term. Use the syntax <span class="dialog-highlight">^(Search Term)</span>.<br>Eg: Searching for <span class="dialog-highlight">^java</span> will return results containing word like "<span class="light-bold">JavaScript</span>" or "<span class="light-bold">Java Developer</span>".</li><br><li><span class="light-bold">Inverse-Prefix-Exact-Match</span><br>Excludes results that starts with the the search term. Use the syntax <span class="dialog-highlight">!^(Search Term)</span>.<br>Eg: Searching for <span class="dialog-highlight">!^java</span> will return results excluding items containing word starting with "<span class="light-bold">java</span>".</li><br><li><span class="light-bold">Suffix-Exact-Match</span><br>Finds results that ends with the search term. Use the syntax <span class="dialog-highlight">(Search Term)$</span>.<br>Eg: Searching for <span class="dialog-highlight">.js$</span> will return results containing word like "<span class="light-bold">App.js</span>" or "<span class="light-bold">index.js</span>".</li><br><li><span class="light-bold">Inverse-Suffix-Exact-Match</span><br>Excludes results that ends with the the search term. Use the syntax <span class="dialog-highlight">!(Search Term)$</span>.<br>Eg: Searching for <span class="dialog-highlight">!.java$</span> will return results excluding items containing word ending with "<span class="light-bold">.java</span>".</li></ul><br>Make your searches faster, smarter, and more tailored with <span class="light-bold">Universal Search</span>.</div><div class="search-info-dialog-divider-and-button"><div class="spacer" style="height:15px"></div><div class="search-info-dialog-divider"></div><div class="search-info-dialog-button" onclick="closeSearchInfoDialog()">Understood</div></div></div>`;
    dialogContainer.style.display = "flex";
}

function closeSearchInfoDialog() {
    let dialogContainer = getId('search-info-dialog-container');
    dialogContainer.style.display = "none";
    dialogContainer.innerHTML = "";
}

function goBackClick() {
    goBack('index.html');
}

function getAnimationCompletion() {
    if (animationCompleted) {
        return true
    }
    animationCompleted = true
    return false
}