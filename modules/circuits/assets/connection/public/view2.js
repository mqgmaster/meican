/**
 * @copyright Copyright (c) 2016 RNP
 * @license http://github.com/ufrgs-hyman/meican#license
 * @author Mauricio Quatrin Guerreiro
 */

var meicanMap;
var circuitApproved = false;
var circuitDataPlane;
var path;
var statsCurrentPts;
var statsGraphic;
var refreshInterval;

$(document).ready(function() {
    circuitApproved = isAuthorized();
    circuitDataPlane = getDataPlaneStatus();
    requestRefresh();
    initPathBox();
    initStats();
    initHistoryModal();
    initEditModal();
    initCancelModal();
    enableAutoRefresh();

    $("#refresh-btn").on('click', function() {
        requestRefresh();
        MAlert.show("Refresh in progress.", "Please, wait a moment while we get updated information.", 'success');
    });
});

$(document).on('ready pjax:success', function() {
    //se o circuito nao esta aprovado, verifica o ultimo status
    //se ele for aprovado, entao deve ser recarregado 
    if (!circuitApproved && isAuthorized()) {
        circuitApproved = true;
        console.log("connection approved");
        drawCircuit($("#circuit-id").attr('value'), true);
    }

    //se mudou dataplane entao atualiza cor do circuito
    if(circuitDataPlane != getDataPlaneStatus()) {
        console.log('dataplane change');
        circuitDataPlane = getDataPlaneStatus();
        updateCircuitColor();
    }
});

function updateCircuitColor() {
    var color = (circuitDataPlane == 'ACTIVE') ? "#35E834" : "#27567C";
    for (var i = meicanMap.getLinks().length - 1; i >= 0; i--) {
        meicanMap.getLinks()[i].setStyle({
            color: color
        });
    };
}

function getDataPlaneStatus() {
    return $("#status-dataplane").attr("status");
}

function isAuthorized() {
    return $("#status-auth").attr('status') == 'AUTHORIZED';
}

function requestRefresh() {
    $.ajax({
        url: baseUrl+'/circuits/connection/refresh',
        data: {
            id: $("#circuit-id").attr('value'),
        },
        success: function() {
            refreshPjax("details-pjax");
        }
    });
}

function disableAutoRefresh() {
    clearInterval(refreshInterval);
}

function enableAutoRefresh() {
    refreshInterval = setInterval(refreshAll, 30000);
}

function refreshAll() {
    console.log('refreshing...');
    refreshPjax('status-pjax');
    setTimeout(function() {
        refreshPjax('details-pjax');
    }, 2000);
    setTimeout(function() {
        refreshPjax('history-pjax');
    }, 4000);
}

function refreshPjax(id) {
    $.pjax.defaults.timeout = 5000;
    $.pjax.reload({
        container:'#' + id
    });
}

function initCancelModal() {
    $("#cancel-btn").on("click", function() {
        $('#cancel-modal').modal("show");
        return false;
    });

    $("#cancel-modal").on("click", '.close-btn', function() {
        $("#cancel-modal").modal("hide");
    });

    $("#cancel-modal").on("click", '.confirm-btn', function() {
        $.ajax({
            url: baseUrl+'/circuits/connection/cancel',
            dataType: 'json',
            data: {
                id: $("#circuit-id").attr("value"),
            },
            success: function() {
            },
            error: function() {
                MAlert.show(I18N.t("Error."), I18N.t("You are not allowed for cancel circuits in this domains."), 'danger');
            }
        });
        $("#cancel-modal").modal("hide");
        MAlert.show(I18N.t("Cancellation in progress."), I18N.t("Please, wait a moment while we process your request."), 'success');
    });
}

function initEditModal() {
    $("#edit-modal").on("click", '.confirm-btn', function() {
        validateEditForm();

        setTimeout(function() {
            if($("#edit-modal").find(".has-error").length > 0) {
                console.log("tem erro")
                MAlert.show(I18N.t("Request invalid."), I18N.t("Please, check your input and try again."), 'danger');
                return;
            }

            $.ajax({
                type: "POST",
                url: baseUrl + '/circuits/connection/update?submit=true',
                data: $("#edit-form").serialize(),
                success: function (response) {
                    if(response) {
                        MAlert.show(I18N.t("Modification in progress."), 
                        I18N.t("Please, wait a moment while we process your request."), 'success');
                        $.ajax({
                            type: "POST",
                            url: baseUrl + '/circuits/connection/update?id='+ $("#circuit-id").attr('value') + '&confirm=true',
                            success: function () {
                            },
                            error: function() {
                                MAlert.show(I18N.t("Error."), I18N.t("Sorry, contact your administrator."), 'danger');
                            }
                        });
                        $("#edit-modal").modal('hide');
                    }
                    else MAlert.show(
                        I18N.t("No changes."), 
                        I18N.t("Please, check your input and try again."), 
                        'warning');
                },
                error: function() {
                    MAlert.show(I18N.t("Error."), I18N.t("Sorry, contact your administrator."), 'danger');
                }
            });

        }, 200);

        return false;
    });

    $("#connectionform-acceptrelease").on("switchChange.bootstrapSwitch", function(event, state) {
        validateEditForm();
    });

    $("#edit-modal").on("click", '.close-btn', function() {
        $("#edit-modal").modal("hide");
        return false;
    });

    $("#edit-modal").on("click", '.undo-btn', function() {
        $("#connectionform-start").val($("#info-start").attr('value'));
        $("#connectionform-end").val($("#info-end").attr('value'));
        $("#connectionform-bandwidth").val($("#info-bandwidth").attr('value'));
        validateEditForm();
        return false;
    });

    $("#edit-btn").on("click", function() {
        $('#edit-form').yiiActiveForm('resetForm');
        $("#connectionform-start").val($("#info-start").attr('value'));
        $("#connectionform-end").val($("#info-end").attr('value'));
        $("#connectionform-bandwidth").val($("#info-bandwidth").attr('value'));
        $('#edit-modal').modal("show");
        return false;
    });
}

function validateEditForm() {
    $("#edit-form").yiiActiveForm("validateAttribute", 'connectionform-bandwidth');
    $("#edit-form").yiiActiveForm("validateAttribute", 'connectionform-start');
    $("#edit-form").yiiActiveForm("validateAttribute", 'connectionform-end');
}

function initHistoryModal() {
    $("#history-pjax").on("click", '.event-message', function(e) {
        $('#event-message-modal').modal('show');
        $.ajax({
            url: baseUrl+'/circuits/connection/get-event-message',
            data: {
                id: $(this).parent().parent().attr('data-key')
            },
            method: "GET",
            success: function(response) {
                $("#event-message-modal").find('.modal-body').html(response);
            },
        });
        return false;
    });

    $('#event-message-modal').on('hidden.bs.modal', function () {
        $("#event-message-modal").find('.modal-body').html('');
    })
}

function updateCircuitStatus() {
    switch($("#info-status").attr("value")) {
        case 'reservating'   : 
            break;
        case 'scheduled'     : 
            if(moment().isAfter($("#info-start").attr("value"))) {
                activatingCircuit();
            } else {
                $("#status-box").find(".tts").text(moment().to($("#circuit-info").find('.start-time').attr("value")));
            }
            break;
        case 'activating'    : activeCircuit();
            break;
        case 'active'        : finishCircuit();
            break;
        case 'finished'      : 
            break;
    }
}

function scheduleCircuit() {
    $("#status-box").find(".info-box-text").text("Time to start");
    $("#status-box").find(".info-box-number").html('<span class="tts">loading...</span><br><small>10/02/2016 at 20:00</small>');
    $("#status-box").attr("data-value", 'scheduled');
}

function activatingCircuit() {
    $("#status-box").find(".ion-clock").removeClass().addClass("ion ion-gear-a");
    $("#status-box").find(".info-box-text").text("Status");
    $("#status-box").find(".info-box-number").text("Activating");
    $("#status-box").attr("data-value", 'activating');
}

function activeCircuit() {
    $("#status-box").find(".ion-clock").removeClass().addClass("ion ion-arrow-up-a");
    $("#status-box").find(".info-box-text").text("Status");
    $("#status-box").find(".info-box-number").text("Active");
    $("#status-box").attr("data-value", 'active');
}

function inactiveCircuit() {
    $("#status-box").find(".ion-clock").removeClass().addClass("ion ion-close-circled");
    $("#status-box").find(".info-box-text").text("Status");
    $("#status-box").find(".info-box-number").text("Inactive");
}

function finishCircuit() {
    $("#status-box").find(".ion-clock").removeClass().addClass("ion ion-checkmark-circled");
    $("#status-box").find(".info-box-text").text("Status");
    $("#status-box").find(".info-box-number").text("Finished");
}

function initPathBox() {
    $("#path-grid").css("margin", '10px');
    $("#path-box").css("height", 445);
    $("#canvas").css("height", 400);
    meicanMap = new LMap('canvas');
    meicanMap.show('dev');
    loadDomains();

    drawCircuit($("#circuit-id").attr('value'));

    /*$("#canvas").on("linkClick", function(e, link) {
        var srcPoint;
        for (var i = 0; i < path.length; i++) {
            if(('dev' + path[i].device_id) == link.options.from)
                loadStats(path[i]);
        };
    });*/

    $('#canvas').on('lmap.nodeClick', function(e, marker) {
        marker.setPopupContent('Domain: <b>' + meicanMap.getDomain(marker.options.domainId).name + 
            '</b><br>Device: <b>' + marker.options.name + '</b><br>');
            //'In port: <b></b><br>' +
            //'Out port: <b></b><br>' +
            //'VLAN: <b></b><br>');
    });

    $("#path-box").on("click", '.show-stats', function() {
        ///monitoramento de interfaces????????
        loadStats($(this).parent().parent().attr("data-key"));
    });
}

function loadDomains() {
    $.ajax({
        url: baseUrl+'/topology/domain/get-all',
        dataType: 'json',
        method: "GET",        
        success: function(response) {
            meicanMap.setDomains(response);
        }
    });
}

function drawCircuit(connId, animate) {
    $.ajax({
        url: baseUrl+'/circuits/connection/get-ordered-path',
        dataType: 'json',
        method: "GET",
        data: {
            id: connId,
        },
        success: function(response) {
            path = response;
            var size = response.length;
            var requiredMarkers = [];
            for (var i = 0; i < size; i++) {
                requiredMarkers.push(path[i]);
            }

            if (circuitApproved) {
                //a ordem dos marcadores aqui eh importante,
                //pois eh a ordem do circuito
                //console.log(requiredMarkers);
                addSource(path[0]);
                addDestin(path[size-1]);
                
                for (var i = 1; i < size-1; i++) {
                    addWayPoint(path[i]);
                }

                updatePathInfo(path);
                
                //setMapBoundsMarkersWhenReady(requiredMarkers);
                
                //
                //drawCircuitWhenReady(path, animate);
                drawCircuitWhenReady(path, false);
                
            } else {
                //aqui nao importa a ordem dos marcadores, pois nao ha circuito criado

                addSource(path[0]);
                addDestin(path[size-1]);
                
                for (var i = 1; i < size-1; i++) {
                    addWayPoint(path[i]);
                }
                
                setMapBoundsMarkersWhenReady(requiredMarkers);
            }
        }
    });
}

function updatePathInfo(path) {
    $($("#path-grid").find('tbody').find("tr").children()[0]).text(0);
    $($("#path-grid").find('tbody').find("tr").children()[1]).text(path[0].port_urn);
    $($("#path-grid").find('tbody').find("tr").children()[2]).text(path[0].vlan);

    for (var i = 1; i < path.length; i++) {
        var pointRow = $($("#path-grid").find('tbody').find("tr")[0]).clone();

        $(pointRow.children()[0]).text(i);
        $(pointRow.children()[1]).text(path[i].port_urn);
        $(pointRow.children()[2]).text(path[i].vlan);
        $(pointRow).attr('data-key', i);
        $($("#path-grid").find('tbody')).append(pointRow);
    }
}

function drawCircuitWhenReady(requiredMarkers, animate) {
    if (areMarkersReady(requiredMarkers)) {
        //console.log("drew");
        if (animate) {
            drawCircuitAnimated();
        } else {
            var pathIds = [];
            for (var i = 0; i < meicanMap.getNodes().length - 1; i++) {
                meicanMap.addLink(
                    null, 
                    meicanMap.getNodes()[i].options.id, 
                    meicanMap.getNodes()[i+1].options.id, 
                    'dev', 
                    false,
                    null,
                    (circuitDataPlane == 'ACTIVE') ? "#35E834" : "#27567C");
            }
            
            meicanMap.focusNodes();
            loadStats(path[0], path[1]);
        }
    } else {
        setTimeout(function() {
            drawCircuitWhenReady(requiredMarkers, animate);
        } ,50);
    }
}

function setMapBoundsMarkersWhenReady(requiredMarkers) {
    if (areMarkersReady(requiredMarkers)) {
        //console.log("setbounds");
        meicanMap.focusNodes();
    } else {
        setTimeout(function() {
            setMapBoundsMarkersWhenReady(requiredMarkers);
        } ,50);
    }
}

function addWayPoint(pathItem) {
    //marker = meicanMap.getMarker('dev'+ devId);
    //if (marker) return;

    $.ajax({
        url: baseUrl+'/circuits/connection/get-stp',
        dataType: 'json',
        method: "GET",
        data: {
            id: pathItem.device_id,
        },
        success: function(response) {
            addMarker(response, "#00FF00");
        }
    });
}

function addSource(pathItem) {
    //marker = meicanMap.getMarker('dev'+ devId);
    //if (marker) return meicanMap.changeDeviceMarkerColor(marker, "0000EE");

    $.ajax({
        url: baseUrl+'/circuits/connection/get-stp',
        dataType: 'json',
        method: "GET",
        data: {
            id: pathItem.device_id,
        },
        success: function(response) {
            addMarker(response, "#0000EE");
        }
    });
}

function addDestin(pathItem) {
    //marker = meicanMap.getMarker('dev'+ devId);
    //if (marker) return meicanMap.changeDeviceMarkerColor(marker, "FF0000");

    $.ajax({
        url: baseUrl+'/circuits/connection/get-stp',
        dataType: 'json',
        method: "GET",
        data: {
            id: pathItem.device_id,
        },
        success: function(response) {
            addMarker(response, "#FF0000");
        }
    });
}

function addMarker(dev, color) {
    marker = meicanMap.getNode('dev'+dev.id);
    if (marker) return marker;

    meicanMap.addNode(
        'dev'+dev.id,
        dev.name,
        'dev',
        meicanMap.getDomainByName(dev.dom).id,
        dev.lat,
        dev.lng,
        color);
}

function areMarkersReady(ids) {
    for (var i = 0; i < ids.length; i++) {
        var marker = meicanMap.getNode('dev'+ids[i].device_id);
        if (marker === null) {
            return false;
        }
    }
    
    return true;
}

function initStats() {
    $("#stats").css("height", 375);

    $("#stats-box").on('click', '.refresh-btn', function() {
        loadStats();
    });

    statsGraphic = $.plot("#stats", [], {
      grid: {
        hoverable: true,
        borderColor: "#f3f3f3",
        borderWidth: 1,
        tickColor: "#f3f3f3"
      },
      series: {
        shadowSize: 0,
        lines: {
          show: true
        },
        points: {
          show: true
        }
      },
      lines: {
        fill: true,
      },
      yaxis: {
        show: true,
        tickFormatter: function(val, axis) {
            if (Math.abs(val) < 1) 
                val = val.toFixed(4);
            else 
                val = val.toFixed(2);
            return Math.abs(val) + " Mbps";
        }
      },
      xaxis: {
        mode: "time",
        timezone: 'browser',
        show: true,
      },
      legend: {
        noColumns: 2,
        container: $("#stats-legend"),
        labelFormatter: function(label, series) {
            return '<span style="margin-right: 10px; margin-left: 5px;">' + label + '</span>';
        }
      }
    });

    //Initialize tooltip on hover
    $('<div class="tooltip-inner" id="line-chart-tooltip"></div>').css({
      position: "absolute",
      display: "none",
      opacity: 0.8,
      zIndex: 3,
    }).appendTo("body");


    $("#stats").bind("plothover", function (event, pos, item) {

      if (item) {
        var x = item.datapoint[0],
            y = item.datapoint[1].toFixed(4);

        $("#line-chart-tooltip").html(moment.unix(x/1000).format("DD/MM/YYYY HH:mm:ss") + '<br>' + Math.abs(y) + ' Mbps')
            .css({top: item.pageY + 5, left: item.pageX + 5})
            .fadeIn(200);
      } else {
        $("#line-chart-tooltip").hide();
      }

    });
}

function loadStats(srcPoint, dstPoint) {
    if(srcPoint) {
        statsCurrentLink = {src: srcPoint, dst: dstPoint};
    }

    //$("#stats-target").html("<b>" + statsCurrentPoint.port_urn + "</b> (VLAN <b>" + statsCurrentPoint.vlan + "</b>)");

    $("#stats-loading").show();

    //if(urnType == "NSI")....
    var urn = statsCurrentLink.src.port_urn;
    urn = urn.split(':');
    var dom = urn[3];
    var dstDev = statsCurrentLink.dst.port_urn.split(':')[statsCurrentLink.dst.port_urn.split(':').length - 3];
    var dev = urn[urn.length - 3];
    var port = urn[urn.length - 2];
    var vlan = statsCurrentLink.src.vlan;
    var statsData = [];

    loadTrafficHistory(statsData, dom, dev, port, vlan, dstDev);
}

function loadTrafficHistory(statsData, dom, dev, port, vlan, dstDev) {
    $.ajax({
        url: baseUrl+'/monitoring/traffic/get-vlan-history?dom=' + dom + '&dev=' + dev +
            '&port=' + port + '&vlan=' + vlan + '&dir=out' + '&interval=' + 0,
        dataType: 'json',
        method: "GET",
        success: function(data) {
            var dataOut = [];
            for (var i = 0; i < data.traffic.length; i++) {
                dataOut.push([moment.unix(data.traffic[i].ts), 0-(data.traffic[i].val*8/1000000)]);
            }
            statsData.push({label: dstDev + ' to ' + dev, data: dataOut, color: "#f56954" });

            statsGraphic.setData(statsData);
            statsGraphic.setupGrid();
            statsGraphic.draw();
        }
    });

    $.ajax({
        url: baseUrl+'/monitoring/traffic/get-vlan-history?dom=' + dom + '&dev=' + dev +
            '&port=' + port + '&vlan=' + vlan + '&dir=in' + '&interval=' + 0,
        dataType: 'json',
        method: "GET",
        success: function(data) {
            var dataIn = [];
            for (var i = 0; i < data.traffic.length; i++) {
                dataIn.push([moment.unix(data.traffic[i].ts), data.traffic[i].val*8/1000000]);
            }
            statsData.push({label: dev + ' to ' + dstDev, data: dataIn, color: "#3c8dbc" });

            statsGraphic.setData(statsData);
            statsGraphic.setupGrid();
            statsGraphic.draw();
            
            $("#stats-loading").hide();
        }
    });
}
