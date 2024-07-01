const DARK_THEME_LOCAL_STORAGE = "VaibhavMojidraDarkMode";
const DARK_THEME_ON = "T";
const DARK_THEME_OFF = "F";

function onNavBarBurgerClick(id) {
    let burgerClickElement = getId('burgerClick');
    burgerClickElement.checked = !burgerClickElement.checked;
    id.classList.toggle('toggle');
}

function getId(documentIDkey) {
    return document.getElementById(documentIDkey);
}


function setTheme(onLightTheme = function () { }, onDarkTheme = function () { }) {
    if (isDarkTheme()) {
        setColorsWhenDarkTheme();
        setThemeIconWhenDarkTheme();
        onDarkTheme();
    } else {
        setColorsWhenLightTheme();
        setThemeIconWhenLightTheme();
        onLightTheme();
    }
}

function setColorsWhenDarkTheme() {
    let r = document.querySelector(':root');
    r.style.setProperty('--background-color', '#000000');
    r.style.setProperty('--text-color', '#FFFFFF');
    r.style.setProperty('--light-text-color', '#8d8d93');
}

function setColorsWhenLightTheme() {
    let r = document.querySelector(':root');
    r.style.setProperty('--background-color', '#f2f2f7');
    r.style.setProperty('--text-color', '#000000');
    r.style.setProperty('--light-text-color', '#939399');
}

function toggleTheme(onChangedToLightTheme = function () { }, onChangedToDarkTheme = function () { }) {
    if (isDarkTheme()) {
        saveTheme(DARK_THEME_OFF, function () {
            setColorsWhenLightTheme();
            setThemeIconWhenLightTheme();
            onChangedToLightTheme();
        })
    } else {
        saveTheme(DARK_THEME_ON, function () {
            setColorsWhenDarkTheme();
            setThemeIconWhenDarkTheme();
            onChangedToDarkTheme();
        })
    }
}

function setThemeIconWhenLightTheme() {
    try {
        const maskUrl = "../assets/icons/ic_dark_mode.svg";
        const themeIcon = getId('theme-icon');
        themeIcon.style.mask = `url('${maskUrl}') no-repeat center / contain`;
        themeIcon.style.webkitMask = `url('${maskUrl}') no-repeat center / contain`;
    } catch (error) {
        console.log(error);
    }
}

function setThemeIconWhenDarkTheme() {
    try {
        const maskUrl = "../assets/icons/ic_light_mode.svg";
        const themeIcon = getId('theme-icon');
        themeIcon.style.mask = `url('${maskUrl}') no-repeat center / contain`;
        themeIcon.style.webkitMask = `url('${maskUrl}') no-repeat center / contain`;
    } catch (error) {
        console.log(error);
    }
}

function saveTheme(newThemeValue = DARK_THEME_OFF, onSuccess = function () { }) {
    if (typeof (Storage) !== "undefined") {
        localStorage.setItem(DARK_THEME_LOCAL_STORAGE, newThemeValue);
        onSuccess()
    } else {
        alert("Sorry Dark Mode not supported.");
    }
}

function isDarkTheme() {
    if (typeof (Storage) !== "undefined") {
        let darkMode = localStorage.getItem(DARK_THEME_LOCAL_STORAGE)
        if (darkMode === null) {
            return false;
        } else {
            return darkMode === DARK_THEME_ON;
        }
    } else {
        return false;
    }
}