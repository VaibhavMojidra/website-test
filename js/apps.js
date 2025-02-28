const headerTitle = "Apps";
const dummyApps = 24;
const ALL_APPS_FILTER_LIST_ITEM = "allapps";
const ALL_TECHNOLOGIES_FILTER_LIST_ITEM = "alltechnologies";
let defaultFilters = { appType: [{ id: ALL_APPS_FILTER_LIST_ITEM, title: "All Apps", isSelected: true }], technology: [{ id: ALL_TECHNOLOGIES_FILTER_LIST_ITEM, title: "All Technologies", isSelected: true }] };
let appliedFilters = {};
let cachedFilters = {};
let defaultApps = [];
let filterApps = [];
let showLoader = false;
let intersectObserver = null;
let cachedImageMap = new Map();

document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setHeaderTitle();
    setResizeListenerForDynamicNav(setHeaderTitle);
    setOnUnload(closeDrawerBeforeUnload);
    setLoader();
    setApps();
    setShortcuts();
    setPreLoader();
});

function setLoader() {
    const cardItemTemplate = `<div class="app-item"><div class="app-image skeleton-app-image skeleton"></div><div class="app-item-content-container"><div class="skeleton-app-name skeleton"></div><div class="skeleton-app-tags skeleton"></div><div class="skeleton-app-card-buttons skeleton"></div></div></div>`;
    const cardItems = cardItemTemplate.repeat(dummyApps);
    getId("main-view").innerHTML = `<div class="apps-container">${cardItems}</div>`
}

function setApps() {
    setTimeout(() => {
        fetch(API_URLS.APPS, { signal: signal }).then(response => {
            if (!response.ok) {
                throw new Error('');
            }
            return response.json();
        }).then(data => {
            const apps = data;
            defaultApps = [...apps];
            filterApps = [...apps];
            renderAppsToUi(apps, true);
            setFilters(apps);
            setFocus();
            setAnimation();
        }).catch(function (error) {
            getId('main-view').innerHTML = genericErrorHtml;
        });
    }, DELAY);
}

function setFocus() {
    const inputElement = getId('search-text-box');
    const viewportWidth = window.innerWidth;
    if (viewportWidth >= 1080) {
        inputElement.focus();
    }
}

function renderAppsToUi(apps, allowAnimation = false) {
    let htmlParts = [`<div class="apps-container">`];
    let imagesIds = [];
    apps.forEach(app => {
        let appId = generateId(app.name);
        imagesIds.push({
            id: appId,
            url: API_URLS.APPS_MEDIA(app.media)
        })
        htmlParts.push(`
            <div class="app-item ${allowAnimation ? "fade-in" : ""}">
				<div class="app-image skeleton-app-image skeleton" id="skeleton-${appId}" style="display: block;"></div>
				<img src="" id="img-${appId}" class="app-image" style="display: none;"></img>
				<div class="app-item-content-container">
					<div class="app-name">${app.name}</div>
					<div class="app-tags">
						<div class="tag-item">
							<div class="tag-icon"></div>
							<div class="tag-name">${app.type}</div>
						</div>
						<div class="tag-item" style="margin-left: 10px;">
							<div class="tag-icon"></div>
							<div class="tag-name">${app.tech}</div>
						</div>
					</div>
					<div class="app-card-buttons">
						<div class="app-card-button" onclick="onLearnMore('${app.id}')">Learn more</div>
						<div class="app-card-button" style="margin-left: 12px;" onclick="openUrl('${app.url}')">${app.buttonText}</div>
					</div>
				</div>
			</div>`);
    });
    htmlParts.push('</div>');
    getId('main-view').innerHTML = htmlParts.join('');
    getId("main-view").scrollTop = 0;
    loadMedia(imagesIds);
}

function loadMedia(imagesIds) {
    try { intersectObserver.disconnect(); } catch (error) { }
    intersectObserver = null;
    intersectObserver = new IntersectionObserver((entries, intersectObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const imageItem = imagesIds.find(item => item.id === (entry.target.id.replace(/^skeleton-/, '')));
                if (imageItem) {
                    fetchMedia(imageItem);
                    intersectObserver.unobserve(entry.target);
                }
            }
        });
    });
    imagesIds.forEach(function (imageItem) {
        let imgElement = getId(`skeleton-${imageItem.id}`);
        intersectObserver.observe(imgElement);
    });
}

function fetchMedia(imageItem) {
    const { id, url } = imageItem;
    getId(`skeleton-${id}`).style.display = "block";
    getId(`img-${id}`).style.display = "none";
    if (cachedImageMap.has(url)) {
        try {
            let objectUrl = cachedImageMap.get(url);
            let imgElement = getId(`img-${id}`);
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
            const objectUrl = URL.createObjectURL(blob);
            let imgElement = getId(`img-${id}`);
            imgElement.src = objectUrl;
            getId(`skeleton-${id}`).style.display = "none";
            imgElement.style.display = "block";
            addToCachedImageMap(url, objectUrl);
        } catch (e) { }
    }).catch(error => {
        onMediaFetchFailed(`img-${id}`, `skeleton-${id}`, url);
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

function setFilters(apps) {
    defaultFilters.appType.push(...generateFilterOptions(apps, 'type', 's'));
    defaultFilters.technology.push(...generateFilterOptions(apps, 'tech'));
    appliedFilters = { ...defaultFilters };
    getId('filter-container-element').style.display = "flex";
    calculateMainContentHeightForDynamicNav();
}

function openFilterBottomSheet() {
    getId('bottomsheet-container').style.display = "block";
    getId('bottomsheet-dismiss').style.height = "100%";
    getId('bottomsheet-main-container').style.height = "0%";
    setTimeout(() => {
        getId('bottomsheet-dismiss').style.height = "25%";
        getId('bottomsheet-main-container').style.height = "75%";
    }, 50);
    cachedFilters = { ...appliedFilters };
    setFiltersUI(cachedFilters);
    getId('bottomsheet-filters-container').scrollTop = 0;
}

function setFiltersUI(filters) {
    getId('app-type-list').innerHTML = createFilterListUi(filters.appType);
    getId('technology-list').innerHTML = createFilterListUi(filters.technology, false);
    populateSelection(filters.appType);
    populateSelection(filters.technology);
}

function populateSelection(filterList) {
    filterList.forEach(filterItem => {
        if (filterItem.isSelected) {
            selectFilterItem(filterItem.id);
        } else {
            deselectFilterItem(filterItem.id);
        }
    })
}

function createFilterListUi(filterList, isFilterListAppType = true) {
    let htmlParts = [];
    filterList.forEach(filterItem => {
        htmlParts.push(`<div class="filter-list-item" id="filter-item-${filterItem.id}" onclick="${isFilterListAppType ? `onAppTypeItemClick('${filterItem.id}')` : `onTechnologyItemClick('${filterItem.id}')`}" >${filterItem.title}</div>`);
    });
    return htmlParts.join('');
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

function onAppTypeItemClick(appTypeId) {
    if (appTypeId == ALL_APPS_FILTER_LIST_ITEM) {
        cachedFilters.appType = cachedFilters.appType.map(filterItem => ({
            id: filterItem.id,
            title: filterItem.title,
            isSelected: (filterItem.id == ALL_APPS_FILTER_LIST_ITEM)
        }));
        cachedFilters.technology = [...defaultFilters.technology];
        setFiltersUI(cachedFilters);
        return;
    }

    let cachedAppTypes = [...cachedFilters.appType];

    if (cachedAppTypes.find(it => it.id == appTypeId).isSelected) {
        let isOnlyChecked = true;
        for (const filterItem of cachedAppTypes) {
            if (filterItem.id != appTypeId && filterItem.isSelected) {
                isOnlyChecked = false;
                break;
            }
        }

        if (isOnlyChecked) {
            return;
        }

        cachedAppTypes = cachedAppTypes.map(filterItem => ({
            id: filterItem.id,
            title: filterItem.title,
            isSelected: (filterItem.id == appTypeId) ? false : filterItem.isSelected
        }));

        refreshTechnologiesFilterList(cachedAppTypes);
        return;
    }

    cachedAppTypes = cachedAppTypes.map(filterItem => ({
        id: filterItem.id,
        title: filterItem.title,
        isSelected: (filterItem.id == ALL_APPS_FILTER_LIST_ITEM) ? false : ((filterItem.id == appTypeId) ? true : filterItem.isSelected)
    }));

    let isAllChecked = true;
    for (const filterItem of cachedAppTypes) {
        if (filterItem.id != ALL_APPS_FILTER_LIST_ITEM && !filterItem.isSelected) {
            isAllChecked = false;
            break;
        }
    }

    if (isAllChecked) {
        cachedFilters.appType = [...defaultFilters.appType];
        cachedFilters.technology = [...defaultFilters.technology];
        setFiltersUI(cachedFilters);
        return;
    }
    refreshTechnologiesFilterList(cachedAppTypes);
    getId('bottomsheet-filters-container').scrollTop = 0;
}

function refreshTechnologiesFilterList(cachedAppTypes) {
    cachedFilters.appType = [...cachedAppTypes];
    let selectedAppTypes = cachedAppTypes
        .map(appTypeItem => appTypeItem.isSelected ? appTypeItem.title.slice(0, -1) : undefined)
        .filter(title => title !== undefined);

    let newTechnlogies = [{ id: ALL_TECHNOLOGIES_FILTER_LIST_ITEM, title: "All Technologies", isSelected: true }, ...[...new Set(defaultApps.filter(item => selectedAppTypes.includes(item.type)).map(item => item['tech']))]
        .sort()
        .map(value => ({
            id: generateId(value),
            title: `${value}`,
            isSelected: false
        }))];
    cachedFilters.technology = [...newTechnlogies];
    setFiltersUI(cachedFilters);
}


function onTechnologyItemClick(techId) {
    if (techId == ALL_TECHNOLOGIES_FILTER_LIST_ITEM) {
        cachedFilters.technology = [...cachedFilters.technology.map(filterItem => ({
            id: filterItem.id,
            title: filterItem.title,
            isSelected: (filterItem.id == ALL_TECHNOLOGIES_FILTER_LIST_ITEM)
        }))];
        setFiltersUI(cachedFilters);
        return;
    }

    let cachedTechnologies = [...cachedFilters.technology];

    if (cachedTechnologies.find(it => it.id == techId).isSelected) {
        let isOnlyChecked = true;
        for (const filterItem of cachedTechnologies) {
            if (filterItem.id != techId && filterItem.isSelected) {
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
            isSelected: (filterItem.id == techId) ? false : filterItem.isSelected
        }));

        cachedFilters.technology = [...cachedTechnologies];
        setFiltersUI(cachedFilters);
        return;
    }

    cachedTechnologies = cachedTechnologies.map(filterItem => ({
        id: filterItem.id,
        title: filterItem.title,
        isSelected: (filterItem.id == ALL_TECHNOLOGIES_FILTER_LIST_ITEM) ? false : ((filterItem.id == techId) ? true : filterItem.isSelected)
    }));

    let isAllChecked = true;
    for (const filterItem of cachedTechnologies) {
        if (filterItem.id != ALL_TECHNOLOGIES_FILTER_LIST_ITEM && !filterItem.isSelected) {
            isAllChecked = false;
            break;
        }
    }

    if (isAllChecked) {
        cachedFilters.technology = [...cachedFilters.technology.map(filterItem => ({
            id: filterItem.id,
            title: filterItem.title,
            isSelected: (filterItem.id == ALL_TECHNOLOGIES_FILTER_LIST_ITEM)
        }))];
        setFiltersUI(cachedFilters);
        return;
    }

    cachedFilters.technology = [...cachedTechnologies];
    setFiltersUI(cachedFilters);
}

function resetFilter() {
    cachedFilters = { ...defaultFilters }
    setFiltersUI(cachedFilters);
}

function closeFilterBottomSheet() {
    cachedFilters = {}
    getId('bottomsheet-filters-container').scrollTop = 0;
    getId('bottomsheet-dismiss').style.height = "100%";
    getId('bottomsheet-main-container').style.height = "0%";
    setTimeout(() => {
        getId('bottomsheet-container').style.display = "none";
    }, 300);

}

function applyFilters() {
    appliedFilters = { ...cachedFilters }
    let isAllAppTypeSelected = appliedFilters.appType.find(it => it.id == ALL_APPS_FILTER_LIST_ITEM).isSelected;
    let isAllTechnologiesSelected = appliedFilters.technology.find(it => it.id == ALL_TECHNOLOGIES_FILTER_LIST_ITEM).isSelected;
    if (isAllAppTypeSelected && isAllTechnologiesSelected) {
        const maskUrl = "assets/icons/ic_filter_outlined.svg";
        const filter = getId('filter-icon');
        filter.style.mask = `url('${maskUrl}') no-repeat center / contain`;
        filter.style.webkitMask = `url('${maskUrl}') no-repeat center / contain`;
        filterApps = [...defaultApps];
        updateUiOnApplyFilter(filterApps);
        return;
    }

    let filterAppsBasedOnAppType = [...defaultApps];

    if (!isAllAppTypeSelected) {
        let selectedAppTypes = appliedFilters.appType.filter(it => it.isSelected).map(it => it.title.slice(0, -1).toLowerCase());
        filterAppsBasedOnAppType = [...defaultApps.filter(app => selectedAppTypes.includes(app.type.toLowerCase()))];
    }

    let newfilteredApps = [...filterAppsBasedOnAppType];

    if (!isAllTechnologiesSelected) {
        let selectedTechs = appliedFilters.technology.filter(it => it.isSelected).map(it => it.title.toLowerCase());
        newfilteredApps = [...filterAppsBasedOnAppType.filter(app => selectedTechs.includes(app.tech.toLowerCase()))];
    }
    filterApps = [...newfilteredApps];

    const maskUrl = "assets/icons/ic_filter_filled.svg";
    const filter = getId('filter-icon');
    filter.style.mask = `url('${maskUrl}') no-repeat center / contain`;
    filter.style.webkitMask = `url('${maskUrl}') no-repeat center / contain`;
    updateUiOnApplyFilter(filterApps);
}

function updateUiOnApplyFilter(filterApps) {
    getId("main-view").scrollTop = 0;
    closeFilterBottomSheet();
    if (getId('search-text-box').value.trim() != "") {
        onSearchQueryChange();
        return;
    }
    getId('search-text-box').value = "";
    setClearIconVisible(false);
    renderAppsToUi(filterApps);
}


function generateFilterOptions(data, key, suffix = '') {
    return [...new Set(data.map(item => item[key]))]
        .sort()
        .map(value => ({
            id: generateId(value),
            title: `${value}${suffix}`,
            isSelected: false
        }));
}

function changeTheme() {
    toggleTheme();
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

const debouncedSearchApps = debounce(searchApps, 600);


function onSearchQueryChange() {
    let searchQuery = getId('search-text-box').value.trim();
    setClearIconVisible(searchQuery == "" ? false : true);
    if (!showLoader) {
        showLoader = true;
        getId("main-view").scrollTop = 0;
        setLoader();
    }
    debouncedSearchApps(searchQuery);
}

function searchApps(searchTerm) {
    if (searchTerm.trim() == "") {
        showLoader = false;
        getId("main-view").scrollTop = 0;
        renderAppsToUi(filterApps);
        return;
    }
    const options = {
        includeScore: false,
        keys: [{ name: 'name', weight: 0.9 }, { name: 'tech', weight: 0.6 }, { name: 'type', weight: 0.3 }], threshold: 0.4
    }
    const fuse = new Fuse(filterApps, options);
    const result = fuse.search(searchTerm.trim());
    const finalResult = result.map(item => item.item);
    if (finalResult.length == 0) {
        showLoader = false;
        getId("main-view").scrollTop = 0;
        getId("main-view").innerHTML = createNoResultFoundUi("No Apps Found", "Sorry, we couldn't find any apps with the given search terms. <br>Try changing the keywords or clearing some filters.");
        return;
    }
    showLoader = false;
    getId("main-view").scrollTop = 0;
    renderAppsToUi(finalResult);
}

function setClearIconVisible(visible) {
    getId('clear-icon-text-box').style.display = visible ? "block" : "none";
}

function clearSearchQuery() {
    getId('search-text-box').value = "";
    setClearIconVisible(false);
    renderAppsToUi(filterApps);
}

function generateId(displayText) {
    return displayText.toLowerCase().replace(/\+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

function retryLoad() {
    getId("main-view").scrollTop = 0;
    setLoader();
    setApps();
}

function onLearnMore(id) {
    window.location.href = `appsdetails.html?id=${id}`;
}

function openUrl(url) {
    window.location.href = url;
}

window.addEventListener('pageshow', closeDrawerBeforeUnload, false)