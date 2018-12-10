"use strict";

let preferences = (function() {

    let m_elmBtnRefresh;
    let m_elmBtnPreferences;

    document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
    window.addEventListener("unload", onUnload);

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

        m_elmBtnRefresh = document.getElementById("btnRefresh");
        m_elmBtnPreferences = document.getElementById("btnPreferences");

        m_elmBtnRefresh.addEventListener("click", onClickRefresh, true);
        m_elmBtnPreferences.addEventListener("click", onClickPreferences, true);

        refreshProgressBars();
    }

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
        window.removeEventListener("unload", onUnload);

        m_elmBtnRefresh.removeEventListener("click", onClickRefresh, true);
        m_elmBtnPreferences.removeEventListener("click", onClickPreferences, true);
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function refreshProgressBars() {

        let details;
        let now = new Date();
        let millisecInDay = 86400000;
        let millisecInYear = 31536000000;       // ignoring leap years


        // +++ Day
        details = {
            total: 24 * 60,                                         // minutes in day
            elapsed: now.getHours() * 60 + now.getMinutes(),        // minutes elapsed
        };
        setProgressbar(document.getElementById("pBarDay"), details);

        // +++ Month
        details = {
            total: (new Date(now.getFullYear(), now.getMonth(), 0)).getDate() * 24,    // hours in this month
            elapsed: ((now.getDate() - 1) * 24) + now.getHours(),                      // hours elapsed
        };
        setProgressbar(document.getElementById("pBarMonth"), details);

        // +++ Year
        details = {
            total: (isLeapYear(now.getFullYear()) ? 366 : 365),                            // days in this year
            elapsed: Math.ceil((now - (new Date(now.getFullYear(), 0, 1))) / millisecInDay),    // days elapsed
        };
        setProgressbar(document.getElementById("pBarYear"), details);

        // +++ Life
        let gettingGeoLoc = prefs.getGeoLocation();
        let gettingDateOfBirth = prefs.getDateOfBirth();

        gettingGeoLoc.then((geoLocation) => {
            gettingDateOfBirth.then((dateOfBirth) => {

                if(geoLocation !== globals.GEO_LOCATION_NOT_SET && utils.isValidBirthDate(dateOfBirth)) {

                    let gettingGender = prefs.getGender();
                    let gettingJsonText = utils.getJsonTextData(globals.URL_WHO_LIFE_EXPECTANCY_DATA);

                    gettingGender.then((gender) => {
                        gettingJsonText.then((jsonText) => {

                            let whoData = JSON.parse(jsonText);
                            let nodes = getLifeExpectancyNode(geoLocation, whoData);
                            let years = Object.getOwnPropertyDescriptor(nodes[0], gender);

                            details = {
                                total: years.value,                                                     // expectancy years
                                elapsed: Math.floor((now - new Date(dateOfBirth)) / millisecInYear),    // years elapsed - ignoring leap years
                            };
                            setProgressbar(document.getElementById("pBarLife"), details);
                        });
                    });

                } else {
                    setProgressbar(document.getElementById("pBarLife"));
                }
            });
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function setProgressbar(elmProgressBar, details) {

        if(elmProgressBar) {

            let elmValue = elmProgressBar.querySelector(".progressBarTexts > .progressBarValue");
            let elmInner = elmProgressBar.querySelector(".progressBar > .progressBarInner");
            let elmPrgBar = elmProgressBar.querySelector(".progressBar");

            if(details === undefined || details === null) {
                elmPrgBar.classList.add("optionsNotSet");
                elmValue.textContent = "-";
                elmInner.style.width = "0%";
                setTimeout(() => utils.blinkElement(m_elmBtnPreferences, 200, 2000), 750);
            } else {
                elmPrgBar.classList.remove("optionsNotSet");
                elmValue.textContent = elmInner.style.width = Math.min(Math.round(details.elapsed * 100 / details.total), 100) + "%";
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function isLeapYear(year) {
        return year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0);
    }

	////////////////////////////////////////////////////////////////////////////////////
	function getLifeExpectancyNode(name, whoData) {

        let node, nodes = [];

        for(let n in whoData) {

            if(!whoData.hasOwnProperty(n)) {
                continue;
            }

            node = whoData[n];

            if (typeof node === 'object') {
                if(node.hasOwnProperty("name") && node.name === name) {
                    nodes.push(node);
                } else {
                    nodes = nodes.concat(getLifeExpectancyNode(name, node));
                }
            }
        }
        return nodes;
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function onClickRefresh(event) {
        refreshProgressBars();
    }

    ////////////////////////////////////////////////////////////////////////////////////
    function onClickPreferences(event) {
        browser.runtime.openOptionsPage();
    }

})();
