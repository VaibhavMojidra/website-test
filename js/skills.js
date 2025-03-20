const headerTitle = "Skills";
const dummySkills = 38;
let cachedSkills = [];

document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setHeaderTitle();
    setResizeListenerForStaticNav(setHeaderTitle);
    setOnUnload(closeDrawerBeforeUnload);
    setLoader();
    setSkills();
    setShortcuts();
    setPreLoader();
});

function setLoader() {
    const skeletons = new Array(dummySkills).fill(`<div class="skeleton" style="border-radius: 8px;height: 40px;"></div>`).join('');
    const loaderInnerHtml = `<div class="skills-container">${skeletons}</div>`;
    getId("main-view").innerHTML = loaderInnerHtml;
}

function setSkills() {
    setTimeout(() => {
        const skillsUrl = API_URLS.SKILLS;
        fetch(API_URLS.SKILLS, { signal: signal }).then(response => {
            if (!response.ok) {
                throw new Error('');
            }
            return response.json();
        }).then(data => {
            createSkillsHTML(data);
        }).catch(error => {
            getId('main-view').innerHTML = genericErrorHtml;
            trackError(headerTitle, `Fetch ${getEndpoint(skillsUrl)}`, error.message);
        });
    }, DELAY);
}

function createSkillsHTML(skills) {
    const mainView = getId("main-view");
    cachedSkills = skills.map(obj => ({ ...obj, isOpen: false }));
    const skillsHtml = cachedSkills.map((skill, index) => {
        const skillId = generateSkillId(skill.title);
        return `<div class="fade-in">
				<div class="skills-item clickable" onclick="toggleSkillDetail('${skillId}',${index})">
					<div class="skills-title-row">
						<div class="skills-indicator skills-indicator-close" id="indicator-${skillId}"></div>
						<div class="skills-title">${skill.title}</div>
					</div>
					<div class="skills-detail skills-detail-row-close" id="skill-detail-${skillId}">${skill.desc}</div>
				</div>
			</div>`;
    }).join('');
    mainView.scrollTop = 0;
    mainView.innerHTML = `<div class="skills-container">${skillsHtml}</div>`;
    setAnimation();
}

function changeTheme() {
    toggleTheme();
}

function toggleSkillDetail(skillId, skillIndex) {
    if (cachedSkills[skillIndex].isOpen) {
        toggleClassInSkill(`indicator-${skillId}`, 'skills-indicator-close', 'skills-indicator-open');
        toggleClassInSkill(`skill-detail-${skillId}`, 'skills-detail-row-close', 'skills-detail-row-open');
        cachedSkills[skillIndex].isOpen = false;
    } else {
        toggleClassInSkill(`indicator-${skillId}`, 'skills-indicator-open', 'skills-indicator-close');
        toggleClassInSkill(`skill-detail-${skillId}`, 'skills-detail-row-open', 'skills-detail-row-close');
        cachedSkills[skillIndex].isOpen = true;
    }
}

function toggleClassInSkill(skillElementId, classNameToAdd, classNameToRemove) {
    let skillElement = getId(skillElementId);
    if (!skillElement.classList.contains(classNameToAdd)) {
        skillElement.classList.add(classNameToAdd);
    }
    if (skillElement.classList.contains(classNameToRemove)) {
        skillElement.classList.remove(classNameToRemove);
    }
}

function generateSkillId(skillTitle) {
    return skillTitle.toLowerCase().replace(/\+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

function retryLoad() {
    getId("main-view").scrollTop = 0;
    setLoader();
    setSkills();
}

window.addEventListener('pageshow', closeDrawerBeforeUnload, false)