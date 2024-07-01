document.addEventListener('DOMContentLoaded', function () {
    setTheme(function () {
        console.log("After Light Set")
    }, function () {
        console.log("After Dark Set")
    })
});

function changeTheme() {
    toggleTheme(function () {
        console.log("After changed to Light")
    }, function () {
        console.log("After changed to Dark")
    })
}