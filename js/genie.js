const DATA_KEYS = {
    APPS: "apps",
    AWARDS: "awards",
    EDUCATION: "education",
    INSTITUTE_CERTIFICATION: "institute_cert",
    ONLINE_CERTIFICATION: "online_cert",
    OTHER_CERTIFICATION: "other_cert",
    PROFESSIONAL_CERTIFICATION: "prof_cert",
    ROADMAPS: "roadmaps",
    SKILLS: "skills",
    SOCIALS: "socials",
    WORK_EXPERIENCE: "work_exp"
}
let mainData = defaultMainData();
let placeHolderAnimInterval = null;
let questionAndAnswers = []
const ANSWERS_TYPE = {
    STARTER: "starter_answer",
    ABOUT_GENIE: "about_genie"
}
const shareIconClass = getShareIconClass();
document.addEventListener('DOMContentLoaded', function () {
    setTheme();
    setShortcuts(goBackClick);
    setOnUnload(function () {
        stopSpeaking();
        clearInterval(placeHolderAnimInterval);
    });
    setResizeListenerForStaticNav(() => { }, 60);
    getId("loader-container").style.display = "flex";
    initQuestions();
    setCancelListnerForSpeakOut();
});

function setCancelListnerForSpeakOut() {
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopSpeaking();
        }
    });
}

function initQuestions() {
    mainData = defaultMainData();
    questionAndAnswers = []
    const TYPES = {
        QUALIFICATION: "qualification",
        WORK_EXPERIENCE_AND_AWARDS: "work_experience_and_awards",
        SKILLS: "skills",
        APPS: "apps",
        ROADMAPS: "roadmaps"
    }
    const DATA_URLS = [
        { type: TYPES.QUALIFICATION, url: API_URLS.QUALIFICATION },
        { type: TYPES.WORK_EXPERIENCE_AND_AWARDS, url: API_URLS.WORK_EXPERIENCE_AND_AWARDS },
        { type: TYPES.SKILLS, url: API_URLS.SKILLS },
        { type: TYPES.APPS, url: API_URLS.APPS },
        { type: TYPES.ROADMAPS, url: API_URLS.ROADMAPS }
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
                enableChat();
            } else {
                showInitError();
            }
        })
        .catch((error) => {
            showInitError();
        });
}

function showInitError() {
    getId("chat-container").style.display = "none";
    getId("loader-container").style.display = "none";
    getId("error-view").style.display = "flex";
    getId('error-view').innerHTML = genericErrorHtml;
}

function enableChat() {
    getId('error-view').innerHTML = "";
    getId("error-view").style.display = "none";
    getId("loader-container").style.display = "none";
    getId("chat-container").style.display = "flex";
    animateTextbox();
    addDefaultIntroAnswer();
    addDefaultIntroAnswer2();
    setResults(true);
}

function animateTextbox() {
    const placeholderTexts = [
        "Ask me anything",
        "Tell me about Vaibhav Mojidra",
        "Explain for loop in Java?",
        "What is Vaibhav Mojidra's work experience?",
        "Give me Python roadmap.",
        "Ask me anything"
    ];

    let index = 0;
    const textarea = getId("ask-text-box");

    placeHolderAnimInterval = setInterval(() => {
        index++;
        if (index >= placeholderTexts.length) {
            clearInterval(placeHolderAnimInterval);
            return;
        }
        textarea.setAttribute("placeholder", placeholderTexts[index]);
    }, 2500);
}

function addDefaultIntroAnswer() {
    const { html, readout } = getStarterAnswer()
    questionAndAnswers.push({
        id: generateRandomId(),
        type: ANSWERS_TYPE.STARTER,
        userQuestion: "",
        interpretatedQuestion: "",
        answerHtml: html,
        isShareAllowed: false,
        isReadable: true,
        readoutText: readout,
        isCopyAllowed: true,
        copyText: "Data1",
        isReading: false
    });
}

function addDefaultIntroAnswer2() {
    const { html, readout } = getStarterAnswer()
    questionAndAnswers.push({
        id: `${generateRandomId()}du`,
        type: ANSWERS_TYPE.ABOUT_GENIE,
        userQuestion: "Tell me abt yourself",
        interpretatedQuestion: "Tell me about yourself",
        answerHtml: html,
        isShareAllowed: true,
        isReadable: true,
        readoutText: readout,
        isCopyAllowed: true,
        copyText: "Data2",
        isReading: false
    });
}

function setResults(animate = false) {
    let resultsHtml = [];
    let lastIndex = questionAndAnswers.length - 1;
    let lastItemId = "";
    questionAndAnswers.forEach(function (qnaItem, index) {
        if (index == lastIndex && animate) {
            lastItemId = qnaItem.id;
            resultsHtml.push(getQNAItemHTML(qnaItem, ` style="opacity:0;transform: translateY(10px);"`));
            return;
        }
        resultsHtml.push(getQNAItemHTML(qnaItem));
    })
    getId('chat-result').innerHTML = resultsHtml.join('').trim();
    if (animate) {
        setTimeout(() => {
            try {
                let lastItemElement = getId(lastItemId);
                lastItemElement.style.opacity = "1";
                lastItemElement.style.transform = "translateY(0)";
            } catch (error) { }
        }, 100);
    }
}

// const {id,
//     type,
//     userQuestion,
//     interpretatedQuestion,
//     answerHtml,
//     isShareAllowed,
//     isReadable,
//     readoutText,isCopyAllowed,isReading } = qnaItem;

function getQNAItemHTML(qnaItem, answerBlockStyle = "") {
    const { id, type, userQuestion, answerHtml, isShareAllowed, isReadable, isCopyAllowed, isReading } = qnaItem;
    let starterHtml = [];
    if (type != ANSWERS_TYPE.STARTER) {
        starterHtml.push(createQuestionBlock(id, userQuestion))
    }
    starterHtml.push(`<div class="answer-block" id="${id}"${answerBlockStyle}>`);
    starterHtml.push(createAnswerBlock(answerHtml));
    starterHtml.push(createShareReadAndCopyBlock(id, isShareAllowed, isReadable, isCopyAllowed, isReading))
    starterHtml.push(`</div>`)
    return starterHtml.join('').trim();
}

function createShareReadAndCopyBlock(id, isShareAllowed = false, isReadable = false, isCopyAllowed = false, isReading = false) {
    let shareReadAndCopyHtml = [];
    shareReadAndCopyHtml.push(`<div class="share-read-and-copy">`);
    shareReadAndCopyHtml.push(createReadOption(id, isReadable, isReading));
    if (isCopyAllowed) {
        shareReadAndCopyHtml.push(`<div class="copy-icon" id="copy-${id}" onclick="copyAnswer('${id}')"></div>`);
    }
    if (isShareAllowed) {
        shareReadAndCopyHtml.push(`<div class="${shareIconClass}" onclick="shareAnswer('${id}')"></div>`);
    }
    shareReadAndCopyHtml.push(`</div>`);
    return shareReadAndCopyHtml.join('').trim();
}

function createReadOption(id, isReadable = false, isReading = false) {
    if (isNullOrFalse(isReadable)) {
        return "";
    }
    if (isReading) {
        return `<div class="stop-reading-icon" onclick="stopSpeaking('${id}')"></div>`;
    }

    return `<div class="read-it-icon" onclick="startSpeaking('${id}')"></div>`;
}

function isNullOrFalse(value) {
    return value === null || value === false;
}

function createAnswerBlock(answerHtml) {
    return `<div>${answerHtml}</div>`;
}

function createQuestionBlock(id, question) {
    return `<div class="question-block-container"><div class="question-block" id="question-${id}">${question}</div></div>`;
}

function retryLoad() {
    getId("error-view").scrollTop = 0;
    getId('error-view').innerHTML = "";
    getId("error-view").style.display = "none";
    getId("loader-container").style.display = "flex";
    initQuestions();
}

function convertSocialsToList() {
    let socialList = [];
    Object.keys(socials).forEach(key => {
        socialList.push(socials[key]);
    });
    return socialList;
}

function onAskQueryChange() {
    // let askTextBox = getId('ask-text-box')
    // const newLinesCount = askTextBox.value.split("\n").length;
    // if (newLinesCount <= 4) {
    //     askTextBox.rows = newLinesCount;
    //     return;
    // }
    // askTextBox.rows = 4;
    let askTextBox = getId('ask-text-box');
    askTextBox.style.height = "auto";
    askTextBox.style.height = Math.min(askTextBox.scrollHeight, 88) + "px";
}

function goBackClick() {
    goBack('index.html');
}

function defaultMainData() {
    return {
        [DATA_KEYS.APPS]: [],
        [DATA_KEYS.AWARDS]: [],
        [DATA_KEYS.EDUCATION]: [],
        [DATA_KEYS.INSTITUTE_CERTIFICATION]: [],
        [DATA_KEYS.ONLINE_CERTIFICATION]: [],
        [DATA_KEYS.OTHER_CERTIFICATION]: [],
        [DATA_KEYS.PROFESSIONAL_CERTIFICATION]: [],
        [DATA_KEYS.ROADMAPS]: [],
        [DATA_KEYS.SKILLS]: [],
        [DATA_KEYS.SOCIALS]: [],
        [DATA_KEYS.WORK_EXPERIENCE]: []
    }
}


function getStarterAnswer() {
    const firstSentences = [
        "Hi, I’m Genie! I can help answer your questions about Vaibhav Mojidra from this website.",
        "Hello! I’m Genie, here to assist you with any questions about Vaibhav Mojidra from this website.",
        "Hey there! I’m Genie. If you have any questions about Vaibhav Mojidra from this website, I can help!",
        "Hi! I’m Genie, your guide to anything related to Vaibhav Mojidra from this website.",
        "Nice to see you! I’m Genie, and I can assist you with any queries about Vaibhav Mojidra from this website."
    ]
    const secondSentences = [
        "You can also ask me about coding concepts based on the information provided by Vaibhav Mojidra. ",
        "I can also explain some coding concepts based on the information shared by Vaibhav Mojidra.",
        "I can also explain coding concepts based on the data provided by Vaibhav Mojidra.",
        "I can also explain coding concepts using the information shared by Vaibhav Mojidra.",
        "If you need help understanding coding concepts, I can explain them based on the details provided by Vaibhav Mojidra."
    ]

    const thirdSentences = [
        "Please note that I am not an AI assistant like ChatGPT or Gemini. My knowledge is limited to Vaibhav Mojidra’s data, and I cannot reference previous questions or answers.",
        "Keep in mind, I’m not an AI assistant like ChatGPT or Gemini. My knowledge is limited to Vaibhav Mojidra’s data, and I cannot recall previous questions or answers.",
        "Just a heads-up—I’m not an AI assistant like ChatGPT or Gemini. My knowledge is limited to Vaibhav Mojidra’s content, and I don’t remember past questions or answers.",
        "Please note that I am not an AI assistant like ChatGPT or Gemini. My responses are limited to Vaibhav Mojidra’s data, and I don’t retain previous questions or answers.",
        "Remember, I’m not an AI assistant like ChatGPT or Gemini. My knowledge is strictly limited to Vaibhav Mojidra’s content, and I can’t recall past conversations."
    ]

    const fourthSentences = [
        "Feel free to ask your questions. I’m here to help!",
        "Go ahead and ask—I’m happy to help!",
        "Let me know how I can help!",
        "Feel free to ask—I’m here to help!"
    ]
    const firstSentence = getRandomItem(firstSentences).trim()
    const secondSentence = getRandomItem(secondSentences).trim()
    const thirdSentence = getRandomItem(thirdSentences).trim()
    const fourthSentence = getRandomItem(fourthSentences).trim()
    const readout = [firstSentence, secondSentence, thirdSentence, fourthSentence].join(" ").trim();
    const pronounceList = [
        { word: "Vaibhav Mojidra", pronouceWord: "Vaaibhav Moojeedraa" },
        { word: "ChatGPT", pronouceWord: "Chat G P T" },
        { word: "AI", pronouceWord: "A I" }
    ]
    const pronouceText = processPronouce(readout, pronounceList)
    return {
        html: `<div class="para">${firstSentence} ${secondSentence} ${thirdSentence}</div><div class="para">${fourthSentence}</div>`,
        readout: pronouceText
    };
}

function processPronouce(originalText, pronounceList) {
    let pronoucedText = originalText;
    pronounceList.forEach(({ word, pronouceWord }) => {
        let regex = new RegExp(`\\b${word}\\b`, "gi");
        pronoucedText = pronoucedText.replace(regex, pronouceWord);
    });
    return pronoucedText;
}

function getRandomItem(dataList) {
    return dataList[Math.floor(Math.random() * dataList.length)]
}

function getShareIconClass() {
    const isAppleDevice = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isAppleDevice) {
        return "ios-share-icon"
    }
    return "share-icon"
}

function generateRandomId() {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const now = new Date();
    return `${letters[Math.random() * 52 | 0]}${now.getFullYear()}${letters[Math.random() * 52 | 0]}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${letters[Math.random() * 52 | 0]}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}${now.getMilliseconds().toString().padStart(3, '0')}`;
}

function startSpeaking(id) {
    window.speechSynthesis.cancel();
    let readOutText = "";
    questionAndAnswers.forEach(obj => {
        if (obj.id !== id) {
            obj.isReading = false;
            return;
        }
        obj.isReading = true;
        readOutText = obj.readoutText;
    })
    setResults();
    const speech = new SpeechSynthesisUtterance(readOutText);
    speech.lang = "en-IN";
    speech.rate = getSpeechSpeed();
    speech.pitch = 1;
    speech.onend = function () {
        stopSpeaking()
    }
    window.speechSynthesis.speak(speech);
}

function getSpeechSpeed() {
    const speeds = { safari: 1.1, firefox: 1, default: 1.2 };
    return isSafari() ? speeds.safari : isFirefox() ? speeds.firefox : speeds.default;
}


function stopSpeaking() {
    window.speechSynthesis.cancel();
    questionAndAnswers.forEach(obj => {
        obj.isReading = false;
    });
    setResults();
}

function copyAnswer(id) {
    const copyElement = getId(`copy-${id}`);
    copyElement.style.backgroundColor = "var(--primary-color)";
    copyElement.style.mask = "url('assets/icons/ic_copy_success.svg') no-repeat center / contain";
    copyElement.style.webkitMask = "url('assets/icons/ic_copy_success.svg') no-repeat center / contain";
    copyElement.style.cursor = "none";
    copyElement.style.pointerEvents = "none";
    copyAnimInterval = setTimeout(() => {
        copyElement.style.backgroundColor = "var(--light-text-color)";
        copyElement.style.mask = "url('assets/icons/ic_copy.svg') no-repeat center / contain";
        copyElement.style.webkitMask = "url('assets/icons/ic_copy.svg') no-repeat center / contain";
        copyElement.style.cursor = "pointer";
        copyElement.style.pointerEvents = "auto";
    }, 900);
    const copyText = getQuestionAndAnswerItemFieldById(id, "copyText");
    if (copyText != null) {
        copyTextToClipboard(copyText)
    }
}

function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text)
}

function getQuestionAndAnswerItemFieldById(targetId, field) {
    const item = questionAndAnswers.find(obj => obj.id === targetId);
    return item && field in item ? item[field] : null;
}

function shareAnswer(id) {
    const { question, shareableAnswerUrl } = getQuestionAndShareableAnswerUrl(id);
    openShareSheet("Vaibhav Mojidra", `Here’s the answer to your question: ${question}\n\n`, shareableAnswerUrl, function () {
        shareUsingDialog(id, question, shareableAnswerUrl);
    });
}

function openShareSheet(title, text, url, onError = function () { }) {
    if (!isMobile()) {
        onError();
        return;
    }
    if (navigator.share) {
        navigator.share({ title, text, url }).catch((error) => { if (error.name !== "AbortError") { onError(); } });
        return;
    }
    onError();
}

function shareUsingDialog(id, question, shareableAnswerUrl) {
    getId('dialog-container').innerHTML = `<div class="share-dialog"><div class="dialog-title-and-message-container"><div class="dialog-title">Share Answer</div><div class="dialog-message"><span class="truncate-4">Here’s the answer to your question: ${question} </span><span class="link truncate-2">${shareableAnswerUrl}</span></div></div><div class="dialog-divider"></div><div class="share-dialog-button" onclick="onCopyWithMessage('${id}')">Copy with message</div><div class="dialog-divider"></div><div class="share-dialog-button" onclick="onCopyOnlyLink('${id}')">Copy link only</div><div class="dialog-divider"></div><div class="share-dialog-button" onclick="onCancelShareDialog()">Cancel</div></div>`;
    getId('dialog-container').style.display = 'flex';
}

function onCopyWithMessage(id) {
    onCancelShareDialog();
    const { question, shareableAnswerUrl } = getQuestionAndShareableAnswerUrl(id);
    const copyText = `Here’s the answer to your question: ${question}\n\n${shareableAnswerUrl}`;
    copyTextToClipboard(copyText);
}

function onCopyOnlyLink(id) {
    onCancelShareDialog();
    const { shareableAnswerUrl } = getQuestionAndShareableAnswerUrl(id);
    copyTextToClipboard(shareableAnswerUrl);
}

function onCancelShareDialog() {
    getId('dialog-container').style.display = 'none';
    getId('dialog-container').innerHTML = "";
}

function getShareableAnswerUrl(question) {
    const cleanUrl = getCleanCurrentUrl();
    const encodedQuestion = encodeQueryParam(question);
    return `${cleanUrl}?q=${encodedQuestion}`;
}

function getCleanCurrentUrl() {
    let url = window.location.href;
    return url.endsWith("/") ? url.slice(0, -1) : url;
}

function encodeQueryParam(text) {
    return encodeURIComponent(text);
}

function decodeQueryParam(encodedText) {
    return decodeURIComponent(encodedText);
}

function ensureQuestionMark(text) {
    return text.endsWith("?") ? text : text + "?";
}

function getQuestionAndShareableAnswerUrl(id) {
    const interpretatedQuestion = getQuestionAndAnswerItemFieldById(id, "interpretatedQuestion");
    const question = ensureQuestionMark(interpretatedQuestion);
    const shareableAnswerUrl = getShareableAnswerUrl(question);
    return { question, shareableAnswerUrl }
}

function isMobile() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const mobileOrTabRegex = /(android|iphone|ipad|ipod|blackberry|windows phone|kindle|silk|opera mini|mobile)/;
    const watchRegex = /(watch)/;
    return mobileOrTabRegex.test(userAgent) || watchRegex.test(userAgent) || isTouchDevice;
}

function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function isFirefox() {
    return /firefox/i.test(navigator.userAgent);
}