/* global adapterConfig, socket, systemLang, hosts, formatInfo, versionMap, mainHost */

const uptimeMap = {};

//------------------------------------------------------- UPDATE FIELDS -------------------------------------------------------------------

const updateInfoPage = async function () {
    $('#systemInfoList').empty();
    for (let currentHost in hosts) {
        getHostInfo(hosts[currentHost], function (data) {
            let text = '';
            if (data) {
                text += "<h3>" + data.hostname + "</h3>";
                text += "<dl class='dl-horizontal'>";
                for (let item in data) {
                    if (data.hasOwnProperty(item)) {
                        text += '<dt>' + _(item) + '</dt>';
                        if (item === 'Node.js') {
                            text += '<dd><span id="aktNodeVersion' + data.hostname + '">' + (formatInfo[item] ? formatInfo[item](data[item]) : data[item]) + '</span><span id="nodeExtraInfo' + data.hostname + '"></span></dd>';
                        } else {
                            text += '<dd' + ((item === 'Uptime' || item === 'System uptime') ? (" id='" + data.hostname + item + "' class='timeCounter' data-start='" + data[item] + "'") : "") + '>' + (formatInfo[item] ? formatInfo[item](data[item]) : data[item]) + '</dd>';
                        }
                    }
                }
                text += "</dl>";
            }
            if (text) {
                $('#systemInfoList').append(text);
                if (versionMap) {
                    getNodeExtrainfo(data.hostname);
                }
            }
        });
    }

    setInterval(function () {
        $(".timeCounter").each(function () {
            const key = $(this).attr("id");
            if (!(key in uptimeMap)) {
                uptimeMap[key] = $(this).data("start");
            }
            uptimeMap[key] = ++uptimeMap[key];
            $(this).text(formatSeconds(uptimeMap[key]));
        });
    }, 1000);


    getAdaptersInfo(mainHost, function (repository, installedList) {

        const listUpdatable = [];
        const listNew = [];
        const listHost = [];
        let adapter, obj;

        if (installedList) {
            for (adapter in installedList) {
                if (!installedList.hasOwnProperty(adapter)) {
                    continue;
                }
                obj = installedList[adapter];

                if (!obj || !obj.version || adapter === "hosts") {
                    continue;
                }

                let version = '';
                if (repository[adapter] && repository[adapter].version) {
                    version = repository[adapter].version;
                }
                if (!upToDate(version, obj.version)) {
                    if (obj.controller) {
                        listHost.push(adapter);
                    } else {
                        listUpdatable.push(adapter);
                    }
                }

            }
            listUpdatable.sort();

        }

        fillList('hostUpdate', listHost, repository, installedList);
        fillList('update', listUpdatable, repository, installedList);

        const now = new Date();
        for (adapter in repository) {
            if (!repository.hasOwnProperty(adapter)) {
                continue;
            }
            obj = repository[adapter];
            if (!obj || obj.controller) {
                continue;
            }
            if (installedList && installedList[adapter]) {
                continue;
            }
            if (!(obj.published && ((now - new Date(obj.published)) < 3600000 * 24 * 60))) {
                continue;
            }
            listNew.push(adapter);
        }
        listNew.sort();

        fillList('new', listNew, repository, installedList);

    });
};

$(function () {
    //------------------------------------------------------- FILL DATA -----------------------------------------------------------------------   
    readInstanceConfig(async function () {

        if (parent.window.location.hash === "#tab-info") {

            getHosts(await getNodeVersionList());

            if (adapterConfig.forum) {
                startForum();
            } else {
                $('#forumBlock').hide();
            }

            if (adapterConfig.news) {
                checkNewsLang();
                readAndWriteNewsData();
            } else {
                $('#newsBlock').hide();
            }

            if (!adapterConfig.clock) {
                startClock("start");
            } else {
                $('#home-container').hide();
            }

            if (adapterConfig.new_adapters) {
                searchGithubForNewAdapters(adapterConfig.new_adapters_sort, adapterConfig.new_adapters_order);
            } else {
                $('#adapterSearchBlock').hide();
            }

            if (adapterConfig.adapter_request) {
                showAdapterRequest();
            } else {
                $('#adapterRequestBlock').hide();
                if (adapterConfig.adapter_issue) {
                    $('#knownIssuesBlock').removeClass().addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12");
                }
            }
            if (adapterConfig.adapter_issue) {
                showIssues();
            } else {
                $('#knownIssuesBlock').hide();
                if (adapterConfig.adapter_request) {
                    $('#adapterRequestBlock').removeClass().addClass("col-xs-12 col-sm-12 col-md-12 col-lg-12");
                }
            }
            if (!adapterConfig.adapter_issue && !adapterConfig.adapter_request) {
                $('#adapterRequestIssueBlock').hide();
            }

            if (adapterConfig.documentation) {
                showDocumentation();
            } else {
                $('.rotate-button').hide();
            }

            translateAll(systemLang);

        } else {
            startClock("stop");
        }

        var loadJS = function (url, implementationCode, location) {
        
            var scriptTag = window.top.document.createElement('script');
            scriptTag.src = url;

            scriptTag.onload = implementationCode;
            scriptTag.onreadystatechange = implementationCode;

            location.appendChild(scriptTag);
        };
        var yourCodeToBeCalled = function () {
             startPopupNews();
        };
        loadJS('popupnews.js', yourCodeToBeCalled, window.top.document.head);

       
    });
});