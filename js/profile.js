const headerTitle = "Vaibhav Mojidra";
const statistics = [
    {
        statisticsType: "Apps",
        elementName: "apps-count",
        count: 0
    },
    {
        statisticsType: "Git",
        elementName: "git-repos-count",
        count: 0
    },
    {
        statisticsType: "Awards",
        elementName: "awards-count",
        count: 0
    }
];

const statisticsRunStatus = { [statistics[0].statisticsType]: false, [statistics[1].statisticsType]: false, [statistics[2].statisticsType]: false }

document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setAnimation();
    setResizeListenerForStaticNav();
    setSocials();
    setStatistics();
    setCopyrightFooter();
    setOnUnload(closeDrawerBeforeUnload);
    setShortcuts();
    setPreLoader();
});

function changeTheme() {
    toggleTheme();
}

function setSocials() {
    getId('social-row-1').innerHTML = getSocialRowInnerHtml(1);
    getId('social-row-2').innerHTML = getSocialRowInnerHtml(2);
}

function setStatistics() {
    statistics[0].count = appsCount
    statistics[1].count = gitCount
    statistics[2].count = awardsCount
    statistics.forEach(statItem => {
        createOdoMeter(statItem.elementName, statItem.count, statItem.statisticsType)
    })
}

function getSocialRowInnerHtml(rowNumber) { let factor = rowNumber == 1 ? 1 : 6; let innerHtml = Array.from({ length: 5 }, (_, i) => { let social = socials[i + factor]; let iconName = convertToLowerCaseAndRemoveSpaces(social.name); return `<div style="mask: url('assets/socialicons/${iconName}.svg') no-repeat center / contain;-webkit-mask: url('assets/socialicons/${iconName}.svg') no-repeat center / contain;" class="social-icon" onclick="window.location.href='https://${social.url}'"></div>` }).join(''); return innerHtml }

function convertToLowerCaseAndRemoveSpaces(str) {
    return str.toLowerCase().replace(/\s+/g, '');
}

function createOdoMeter(elementName, count, statisticsType) {
    const el = getId(elementName);
    const odoMeter = new Odometer({
        el,
        value: 0,
        format: '(dd,dd,dd,ddd)',
        duration: 1000
    });
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!statisticsRunStatus[statisticsType]) {
                    odoMeter.update(count);
                    statisticsRunStatus[statisticsType] = this
                }
            }
        });
    }, { threshold: 0.1 });

    observer.observe(el);
}

function setCopyrightFooter() {
    getId("copyright-footer").innerHTML = `Copyright &#169; ${getCurrentYear()} Vaibhav Mojidra.`
}

function getCurrentYear() {
    return new Date().getFullYear();
}

window.addEventListener('pageshow', closeDrawerBeforeUnload, false)