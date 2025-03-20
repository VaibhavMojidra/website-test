const headerTitle = "GitHub Repositories";
const ALL_TECHNOLOGIES_FILTER_LIST_ITEM = "alltechnologies";
let defaultRepos = [];
let filterRepos = [];
let defaultFilters = [{ id: ALL_TECHNOLOGIES_FILTER_LIST_ITEM, title: "All Technologies", isSelected: true }];
let appliedFilters = [];
let cachedFilters = [];
let showLoader = false;


document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setHeaderTitle();
    setResizeListenerForDynamicNav(setHeaderTitle);
    setOnUnload(closeDrawerBeforeUnload);
    setLoader();
    setGitHubRepositories();
    setShortcuts();
    setPreLoader();
});

function setGitHubRepositories() {
    setTimeout(() => {
        const githubUrl = API_URLS.GITHUB_REPOS;
        fetch(githubUrl, { signal: signal }).then(response => {
            if (!response.ok) {
                throw new Error('');
            }
            return response.json();
        }).then(data => {
            const repos = data;
            defaultRepos = [...repos];
            filterRepos = [...repos];
            renderGitReposToUi(repos, true);
            setFilters(repos);
            setFocus();
            setAnimation();
        }).catch(function (error) {
            getId('main-view').innerHTML = genericErrorHtml;
            trackError(headerTitle, `Fetch ${getEndpoint(githubUrl)}`, error.message);
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

function renderGitReposToUi(repos, allowAnimation = false) {
    let htmlParts = [`<div class="github-repo-list ${allowAnimation ? "fade-in" : ""}">`];
    repos.forEach(repo => {
        htmlParts.push(`<div class="github-repo-list-item clickable" onclick="openRepo('${repo.repoUrl}')"><div class="card-icon github-icon"></div><div class="card-title">${repo.repoName}</div><div class="card-subtitle">${repo.tech}</div></div>`);
    });
    htmlParts.push(`</div>`);
    getId("main-view").innerHTML = htmlParts.join('');
}

function changeTheme() {
    toggleTheme();
}

function setLoader() {
    const cardItemTemplate = `<div class="github-repo-list-item"><div class="card-icon skeleton"></div><div class="skeleton-card-title skeleton"></div><div class="skeleton-card-subtitle skeleton"></div></div>`;
    const cardItems = cardItemTemplate.repeat(100);
    getId("main-view").innerHTML = `<div class="github-repo-list">${cardItems}</div>`
}

const debouncedSearchRepos = debounce(searchRepositories, 600);

function onSearchQueryChange() {
    let searchQuery = getId('search-text-box').value.trim();
    setClearIconVisible(searchQuery == "" ? false : true);
    if (!showLoader) {
        showLoader = true;
        getId("main-view").scrollTop = 0;
        setLoader();
    }
    debouncedSearchRepos(searchQuery);
}



function searchRepositories(searchTerm) {
    if (searchTerm.trim() == "") {
        showLoader = false;
        getId("main-view").scrollTop = 0;
        renderGitReposToUi(filterRepos);
        return;
    }
    const options = {
        includeScore: false,
        keys: [{ name: 'repoName', weight: 0.9 }, { name: 'tech', weight: 0.4 }],
        threshold: 0.4
    }
    const fuse = new Fuse(filterRepos, options);
    const result = fuse.search(searchTerm.trim());
    const finalResult = result.map(item => item.item);
    if (finalResult.length == 0) {
        showLoader = false;
        getId("main-view").scrollTop = 0;
        getId("main-view").innerHTML = createNoResultFoundUi("No Repositories Found", "Sorry, we couldn't find any github repositories with the given search terms.<br>Try changing the keywords or clearing some filters.");
        return;
    }
    showLoader = false;
    getId("main-view").scrollTop = 0;
    renderGitReposToUi(finalResult);
}

function clearSearchQuery() {
    getId('search-text-box').value = "";
    setClearIconVisible(false);
    renderGitReposToUi(filterRepos);
}

function setClearIconVisible(visible) {
    getId('clear-icon-text-box').style.display = visible ? "block" : "none";
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

function closeFilterBottomSheet() {
    cachedFilters = [];
    getId('bottomsheet-filters-container').scrollTop = 0;
    getId('bottomsheet-dismiss').style.height = "100%";
    getId('bottomsheet-main-container').style.height = "0%";
    setTimeout(() => {
        getId('bottomsheet-container').style.display = "none";
    }, 300);
}

function setFiltersUI(filters) {
    let htmlParts = [];
    filters.forEach(filterItem => {
        htmlParts.push(`<div class="filter-list-item" id="filter-item-${filterItem.id}" onclick="onFilterOptionClick('${filterItem.id}')">${filterItem.title}</div>`);
    });
    getId('tech-list').innerHTML = htmlParts.join('');
    filters.forEach(filterItem => {
        if (filterItem.isSelected) {
            selectFilterItem(filterItem.id);
        } else {
            deselectFilterItem(filterItem.id);
        }
    })
}

function onFilterOptionClick(techId) {
    if (techId == ALL_TECHNOLOGIES_FILTER_LIST_ITEM) {
        cachedFilters = [...cachedFilters.map(filterItem => ({
            id: filterItem.id,
            title: filterItem.title,
            isSelected: (filterItem.id == ALL_TECHNOLOGIES_FILTER_LIST_ITEM)
        }))];
        setFiltersUI(cachedFilters);
        return;
    }

    let cachedTechnologies = [...cachedFilters];

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

        cachedFilters = [...cachedTechnologies];
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
        cachedFilters = [...cachedFilters.map(filterItem => ({
            id: filterItem.id,
            title: filterItem.title,
            isSelected: (filterItem.id == ALL_TECHNOLOGIES_FILTER_LIST_ITEM)
        }))];
        setFiltersUI(cachedFilters);
        return;
    }

    cachedFilters = [...cachedTechnologies];
    setFiltersUI(cachedFilters);
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

function resetFilter() {
    cachedFilters = [...defaultFilters];
    setFiltersUI(cachedFilters);
}

function applyFilters() {
    appliedFilters = [...cachedFilters];
    let isAllTechnologiesSelected = appliedFilters.find(it => it.id == ALL_TECHNOLOGIES_FILTER_LIST_ITEM).isSelected;
    if (isAllTechnologiesSelected) {
        const maskUrl = "assets/icons/ic_filter_outlined.svg";
        const filter = getId('filter-icon');
        filter.style.mask = `url('${maskUrl}') no-repeat center / contain`;
        filter.style.webkitMask = `url('${maskUrl}') no-repeat center / contain`;
        filterRepos = [...defaultRepos];
        updateUiOnApplyFilter(filterRepos);
        return;
    }

    let selectedTechs = appliedFilters.filter(it => it.isSelected).map(it => it.title.toLowerCase());
    filterRepos = [...defaultRepos.filter(repo => selectedTechs.includes(repo.tech.toLowerCase()))];
    const maskUrl = "assets/icons/ic_filter_filled.svg";
    const filter = getId('filter-icon');
    filter.style.mask = `url('${maskUrl}') no-repeat center / contain`;
    filter.style.webkitMask = `url('${maskUrl}') no-repeat center / contain`;
    updateUiOnApplyFilter(filterRepos);

}


function updateUiOnApplyFilter(repos) {
    getId("main-view").scrollTop = 0;
    closeFilterBottomSheet();
    if (getId('search-text-box').value.trim() != "") {
        onSearchQueryChange();
        return;
    }
    getId('search-text-box').value = "";
    setClearIconVisible(false);
    renderGitReposToUi(repos);
}

function setFilters(gitHubRepos) {
    let allTechs = [...new Set(gitHubRepos.map(item => item['tech']))]
        .sort()
        .map(value => ({
            id: generateId(value),
            title: value,
            isSelected: false
        }));
    defaultFilters.push(...allTechs);
    appliedFilters = [...defaultFilters];
    getId('filter-container-element').style.display = "flex";
    calculateMainContentHeightForDynamicNav();
}

function generateId(displayText) {
    return displayText.toLowerCase().replace(/\+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

function retryLoad() {
    getId("main-view").scrollTop = 0;
    setLoader();
    setGitHubRepositories();
}

function openRepo(repoUrl) {
    window.location.href = `https://github.com/VaibhavMojidra/${repoUrl}`;
}

window.addEventListener('pageshow', closeDrawerBeforeUnload, false)