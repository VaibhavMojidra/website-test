let onAlertButtonClick = function () { }

function AlertDialog(title = "", message = "", alertButtonText = "", onAlertButtonClickFun = function () { }) {
    getId('dialog-container').style.display = 'flex'
    getId('dialog-container').innerHTML = `<div class="dialog"><div class="dialog-title-and-message-container"><div class="dialog-title">${title}</div><div class="dialog-message">${message}</div></div><div class="dialog-divider"></div><div class="dialog-button" onclick="onAlertButtonClick()">${alertButtonText}</div></div>`
    onAlertButtonClick = function () {
        getId('dialog-container').style.display = 'none'
        getId('dialog-container').innerHTML = ''
        onAlertButtonClickFun()
    }
}