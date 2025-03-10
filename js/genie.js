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
let questionAndAnswers = [];
let questions = [];
let suggestionFuse = null;
const ANSWERS_TYPE = {
    STARTER: "starter_answer",
    NORMAL: "normal_answer",
}
const QUESTION_TYPES = {
    ABOUT: "about",
    ARTICLE: "article",
}
const ARTICLE_DATA_TYPES = {
    RAW_HTML: "raw_html",
    CODE: "code",
}
let editors = [];
let editorTheme = "eclipse";

const shareIconClass = getShareIconClass();
const ANSWER_LIMIT = 21;
const ARTICLE_BASE_URL = "https://vmdbr.github.io/qnaaifvmw"

document.addEventListener('DOMContentLoaded', function () {
    setTheme(function () { editorTheme = "eclipse" }, function () { editorTheme = "dracula" });
    setShortcuts(goBackClick, onToggleToLightTheme, onToggleToDarkTheme);
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
        ROADMAPS: "roadmaps",
        ARTICLES: "articles",
    }
    const DATA_URLS = [
        { type: TYPES.QUALIFICATION, url: API_URLS.QUALIFICATION },
        { type: TYPES.WORK_EXPERIENCE_AND_AWARDS, url: API_URLS.WORK_EXPERIENCE_AND_AWARDS },
        { type: TYPES.SKILLS, url: API_URLS.SKILLS },
        { type: TYPES.APPS, url: API_URLS.APPS },
        { type: TYPES.ROADMAPS, url: API_URLS.ROADMAPS },
        { type: TYPES.ARTICLES, url: `${ARTICLE_BASE_URL}/db/articles.json` }
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
                let articles = [];
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
                        case TYPES.ARTICLES: {
                            articles = [...result.data];
                        }
                            break;
                        default: {
                            getId('main-view').innerHTML = genericErrorHtml;
                            return;
                        }
                    }
                })
                mainData[DATA_KEYS.SOCIALS] = convertSocialsToList();
                enableChat(articles);
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

function enableChat(articles) {
    generateQuestions(articles);
    getId('error-view').innerHTML = "";
    getId("error-view").style.display = "none";
    getId("loader-container").style.display = "none";
    getId("chat-container").style.display = "flex";
    animateTextbox();
    const questionFromQueryParam = getQuestionFromQueryParam();
    if (isEmptyString(questionFromQueryParam)) {
        addDefaultIntroAnswer();
        return;
    }
    searchQuery(questionFromQueryParam);
}

function getQuestionFromQueryParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const question = urlParams.get("q");
    return (question ? decodeQueryParam(question) : "");
}

function generateQuestions(articles) {
    questions = [];
    let updatedArticles = articles.map(obj => ({ ...obj, type: QUESTION_TYPES.ARTICLE }));
    questions.push(...updatedArticles);
    addPreDefineQuestions();
    suggestionFuse = getSuggestionFuse();
}

function setAnswer(item) {
    removeQueryLoader();
    if (questionAndAnswers.length >= ANSWER_LIMIT) {
        questionAndAnswers.shift();
    }
    questionAndAnswers.push(item);
    setResults();
}

function addPreDefineQuestions() {
    addAboutQuestion();
}

function addAboutQuestion() {
    questions.push({ questions: ["Can you introduce yourself?", "How would you describe yourself?", "Tell me something about yourself.", "Can you give me a brief overview of who you are?", "Tell me about yourself"], type: QUESTION_TYPES.ABOUT })
}

function getSuggestionFuse() {
    const questionsForSuggestions = questions.flatMap(item => item.questions);
    const options = {
        includeScore: true,
        threshold: 0.3
    };
    return new Fuse(questionsForSuggestions, options);
}

function animateTextbox() {
    const placeholderTexts = ["Ask me anything", "Tell me about Vaibhav Mojidra", "Explain for loop in Java?", "Give me Python roadmap.", "Ask me anything"];
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
    const { html, readout, copyText } = getStarterAnswer()
    setAnswer({ id: generateRandomId(), type: ANSWERS_TYPE.STARTER, userQuestion: "", interpretatedQuestion: "", answerHtml: html, isShareAllowed: false, isReadable: true, readoutText: readout, isCopyAllowed: true, copyText: copyText });
}

function setResults() {
    let resultsHtml = [];
    let lastIndex = questionAndAnswers.length - 1;
    let lastItemId = "";
    questionAndAnswers.forEach(function (qnaItem, index) {
        if (index == lastIndex) {
            lastItemId = qnaItem.id;
            resultsHtml.push(getQNAItemHTML(qnaItem, ` style="opacity:0;transform: translateY(10px);"`));
            return;
        }
        resultsHtml.push(getQNAItemHTML(qnaItem));
    })
    getId('chat-result').innerHTML = resultsHtml.join('').trim();
    setTimeout(() => {
        try {
            let lastItemElement = getId(lastItemId);
            lastItemElement.style.opacity = "1";
            lastItemElement.style.transform = "translateY(0)";
        } catch (error) { }
        initializeEditors();
    }, 100);
}

function initializeEditors() {

    editors.forEach(editor => {
        try {
            editor.destroy();
            editor.container.remove();
        } catch (error) { }
    })
    editors = [];
    document.querySelectorAll(".code-block").forEach((div, index) => {
        let editorId = `editor-${index}`;
        div.id = editorId;
        let lang = div.getAttribute("data-lang") || "text";
        let editor = ace.edit(editorId);
        editor.session.setMode(`ace/mode/${lang}`);
        editor.setTheme(`ace/theme/${editorTheme}`);
        editor.setReadOnly(true);
        editor.setOptions({
            fontSize: "14px",
            maxLines: Infinity,
            showPrintMargin: false,
            useWorker: false,
            highlightActiveLine: false,
            showGutter: false
        });
        setTimeout(() => {
            let totalLines = editor.session.getLength(); // Auto-detect lines
            let lineHeight = editor.renderer.lineHeight || 18; // Default to 18px if not detected
            let newHeight = (totalLines * lineHeight) + "px";

            console.log(`New Height: ${newHeight}`);
            div.style.height = newHeight;

            editor.resize(); // Force re-render after height change
        }, 10);

        editors.push(editor);
    })
}

function getQNAItemHTML(qnaItem, answerBlockStyle = "") {
    const { id, type, userQuestion, answerHtml, isShareAllowed, isReadable, isCopyAllowed } = qnaItem;
    let starterHtml = [];
    if (type != ANSWERS_TYPE.STARTER) {
        starterHtml.push(createQuestionBlock(id, userQuestion))
    }
    starterHtml.push(`<div class="answer-block" id="${id}"${answerBlockStyle}>`);
    starterHtml.push(createAnswerBlock(answerHtml));
    starterHtml.push(createShareReadAndCopyBlock(id, isShareAllowed, isReadable, isCopyAllowed))
    starterHtml.push(`</div>`)
    return starterHtml.join('').trim();
}

function createShareReadAndCopyBlock(id, isShareAllowed = false, isReadable = false, isCopyAllowed = false) {
    let shareReadAndCopyHtml = [];
    shareReadAndCopyHtml.push(`<div class="share-read-and-copy">`);
    shareReadAndCopyHtml.push(createReadOption(id, isReadable));
    if (isCopyAllowed) {
        shareReadAndCopyHtml.push(`<div class="copy-icon" id="copy-${id}" onclick="copyAnswer('${id}')"></div>`);
    }
    if (isShareAllowed) {
        shareReadAndCopyHtml.push(`<div class="${shareIconClass}" onclick="shareAnswer('${id}')"></div>`);
    }
    shareReadAndCopyHtml.push(`</div>`);
    return shareReadAndCopyHtml.join('').trim();
}

function createReadOption(id, isReadable = false) {
    if (isNullOrFalse(isReadable)) {
        return "";
    }
    return `<div id="readout-container-${id}"><div class="read-it-icon" onclick="startSpeaking('${id}')"></div></div>`;
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

function onSend() {
    const query = getId('ask-text-box').value.trim();
    if (isEmptyString(query)) {
        return;
    }
    searchQuery(query);
}

function searchQuery(query) {
    addQueryLoader(query);
    clearQueryTextBox();
    setTimeout(() => {
        performSearch(query);
    }, 100);
}

function performSearch(query) {
    const singleQuestionsList = transformQuestionsList(questions);
    const searchFuse = new Fuse(singleQuestionsList, { keys: ["question"], includeScore: true, threshold: 0.3 });
    const results = searchFuse.search(query);
    if (results.length === 0) {
        onNoAnswerFound(query);
        return;
    }
    const bestMatch = results[0];
    if (bestMatch.score <= 0.8) {
        getAnswerAndProcessIt(query, bestMatch.item);
        return;
    }
    onNoAnswerFound(query);
}

function getAnswerAndProcessIt(query, questionItem) {
    let interpretatedQuestion = questionItem.question;
    switch (questionItem.type) {
        case QUESTION_TYPES.ABOUT: {
            onAskForAbout(query, interpretatedQuestion);
        }
            break;
        case QUESTION_TYPES.ARTICLE: {
            onAskForArticle(query, interpretatedQuestion, questionItem.articleId)
        }
            break;
        default: {
            onNoAnswerFound(query);
        }
    }
}

function onAskForArticle(userQuestion, interpretatedQuestion, articleId) {
    fetch(`${ARTICLE_BASE_URL}/db/articles/${articleId}.json`, { signal })
        .then((response) => {
            console.log(response);
            if (!response.ok) {
                throw new Error('');
            }
            return response.json();
        })
        .then((data) => {
            processArticle(userQuestion, interpretatedQuestion, data)
        })
        .catch((error) => {
            // TODO
            console.log(error);
            onNoAnswerFound(userQuestion)
        });
}

function processArticle(userQuestion, interpretatedQuestion, articleData) {
    const htmlContent = createArticleContent(articleData.data)
    const { isCopyAllowed, copyText, isReadAllowed, readOutText } = articleData;
    setAnswer({
        id: generateRandomId(),
        type: ANSWERS_TYPE.NORMAL,
        userQuestion: userQuestion,
        interpretatedQuestion: interpretatedQuestion,
        answerHtml: htmlContent,
        isShareAllowed: true,
        isReadable: isTrue(isReadAllowed),
        readoutText: toString(readOutText),
        isCopyAllowed: isTrue(isCopyAllowed),
        copyText: toString(copyText)
    });
}

function createArticleContent(articleDataList) {
    const htmlContent = [];
    articleDataList.forEach(function (item) {
        switch (item.type) {
            case ARTICLE_DATA_TYPES.RAW_HTML: {
                htmlContent.push(item.html)
            }
                break;
            case ARTICLE_DATA_TYPES.CODE: {
                let codeBlock = generateCodeBlock(item.code, item.lang);
                htmlContent.push(codeBlock);
            }
                break;
            default: { }
        }
    })
    return htmlContent.join("");
}

function generateCodeBlock(code, lang) {
    return `<div class="code-block" data-lang="${lang}">${code}</div>`;
}

function onAskForAbout(userQuestion, interpretatedQuestion) {
    const { html, readout, copyText } = getStarterAnswer();
    setAnswer({ id: generateRandomId(), type: ANSWERS_TYPE.NORMAL, userQuestion: userQuestion, interpretatedQuestion: interpretatedQuestion, answerHtml: html, isShareAllowed: true, isReadable: true, readoutText: readout, isCopyAllowed: true, copyText: copyText });
}

function onNoAnswerFound(query) {
    const { html, readout, copyText } = getNoAnswerFoundReponse();
    setAnswer({ id: generateRandomId(), type: ANSWERS_TYPE.NORMAL, userQuestion: query, interpretatedQuestion: "", answerHtml: html, isShareAllowed: false, isReadable: true, readoutText: readout, isCopyAllowed: true, copyText: copyText });
}

function transformQuestionsList(questionsData) {
    return questionsData.flatMap(({ questions, ...rest }) => questions.map(question => ({ question, ...rest })));
}

function clearQueryTextBox() {
    getId('ask-text-box').value = "";
    getId("suggestions-container").innerHTML = "";
}

function addQueryLoader(userQuestion) {
    getId("question-loader").innerHTML = `<div class="question-block-container"><div class="question-block">${userQuestion}</div></div><div class="answer-block"><div class="ticontainer"><div class="tiblock" id="temp-loader-id"><div class="tidot"></div><div class="tidot"></div><div class="tidot"></div></div></div></div>`;
    getId("send-container").innerHTML = `<div class="disable-send-generating-answer-loader"></div>`;
    setTimeout(() => { try { getId('temp-loader-id').scrollIntoView({ behavior: "smooth", block: "end" }); } catch (error) { } }, 100);
}

function removeQueryLoader() {
    stopSpeaking();
    getId("question-loader").innerHTML = "";
    getId("send-container").innerHTML = `<div class="send-button" onclick="onSend()"></div>`;
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

const debouncedSuggestQuestion = debounce(suggestQuestion, 600);

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
    const query = askTextBox.value;
    debouncedSuggestQuestion(query);
}

function suggestQuestion(query) {
    if (!isQueryEligibleForSuggestion(query)) {
        getId("suggestions-container").innerHTML = "";
        return;
    }
    const suggestedQuestion = findSuggestion(query);
    if (isNotEmptyString(suggestedQuestion)) {
        const boldText = getRandomItem(["Did you mean", "Are you asking", "Do you mean to ask", "Are you referring to"]);
        getId("suggestions-container").innerHTML = `<div class="suggestion-text" onclick="searchQuery('${suggestedQuestion}')" ><span class="suggestion-text-bold">${boldText}: </span><i>${suggestedQuestion}</i></div>`;
        return;
    }
    getId("suggestions-container").innerHTML = "";
}

function findSuggestion(query) {
    if (suggestionFuse == null) {
        suggestionFuse = getSuggestionFuse();
    }
    const results = suggestionFuse.search(query);
    if (results.length === 0) {
        return "";
    }
    const bestMatch = results[0];
    if (bestMatch.score <= 0.7) {
        return bestMatch.item;
    }
    return "";
}

function isQueryEligibleForSuggestion(query) {
    const words = query.trim().split(/\s+/);
    return words.length >= 2 && query.length >= 5;
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
        { word: "Vaibhav Mojidra", pronouceWord: "Vaibhav Moojeedraa" },
        { word: "ChatGPT", pronouceWord: "Chat G P T" },
        { word: "AI", pronouceWord: "A I" }
    ]
    const pronouceText = processPronouce(readout, pronounceList)
    return {
        html: `<div class="para">${firstSentence} ${secondSentence} ${thirdSentence}</div><div class="para">${fourthSentence}</div>`,
        copyText: `${firstSentence} ${secondSentence} ${thirdSentence} ${fourthSentence}`,
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
            getId(`readout-container-${obj.id}`).innerHTML = `<div class="read-it-icon" onclick="startSpeaking('${obj.id}')"></div>`;
            return;
        }
        getId(`readout-container-${id}`).innerHTML = `<div class="stop-reading-icon" onclick="stopSpeaking()"></div>`;
        readOutText = obj.readoutText;
    })
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
        getId(`readout-container-${obj.id}`).innerHTML = `<div class="read-it-icon" onclick="startSpeaking('${obj.id}')"></div>`;
    });
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

function goBackClick() {
    goBack('index.html');
}

function isNotEmptyString(str) {
    return str.trim() !== "";
}

function isEmptyString(str) {
    return str.trim() === "";
}

function isTrue(value) {
    return value === true;
}

function toString(value) {
    return value == null ? "" : String(value).trim();
}

function getNoAnswerFoundReponse() {
    const responses = [
        "Apologies, but I’m unable to answer your question.",
        "I’m sorry, but I don’t have an answer to your question.",
        "Unfortunately, I’m unable to answer that question at the moment.",
        "I appreciate your question, but I don’t have the answer right now.",
        "Sorry, I don’t have an answer for that.",
        "I don’t have enough information to answer your question.",
        "That’s beyond my knowledge at this time.",
        "I wish I could help, but I don’t know the answer."
    ];
    const finalAnswer = getRandomItem(responses).trim()
    return {
        html: `<div class="para">${finalAnswer}</div>`,
        copyText: finalAnswer,
        readout: finalAnswer
    };
}

function onToggleToLightTheme() {
    editorTheme = "eclipse";
    editors.forEach(editor => {
        try {
            editor.setTheme(`ace/theme/${editorTheme}`);
        } catch (error) { }
    })
}

function onToggleToDarkTheme() {
    editorTheme = "dracula";
    editors.forEach(editor => {
        try {
            editor.setTheme(`ace/theme/${editorTheme}`);
        } catch (error) { }
    })
}