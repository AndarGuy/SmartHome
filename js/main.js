var settingUpdateTimeElement, settingEnableCoolerElement;
var wrapperElement, sensorsElement;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function update() {
    $.ajax({
        method: 'POST',
        contentType: "application/json",
        dataType: "json",
        url: 'http://andarguy.me:5000/get',
        data: JSON.stringify({'cooler_speed': 0, 'cooler_enabled': settingEnableCoolerElement.checked}),
        success: function(data) {

            var loading = document.getElementById('loading');
            if (loading != null) loading.remove();

            var messageElement = document.getElementById('message');
            var current = new Date();
            var lastUpdated = data.date;
            var timeWithoutUpdate = (current - lastUpdated) / 1000;
            
            messageElement.textContent = 'Last update was now.';
            if (timeWithoutUpdate > 5) {
                messageElement.textContent = 'Warning! Last update was ' + String(Math.round(timeWithoutUpdate)) + 's ago.';
                if (timeWithoutUpdate / 60 > 1) {
                    timeWithoutUpdate = Math.round(timeWithoutUpdate / 60);
                    messageElement.textContent = 'Warning! Last update was ' + String(Math.round(timeWithoutUpdate)) + 'm ago.';
                    if (timeWithoutUpdate / 60 > 1) {
                        timeWithoutUpdate = Math.round(timeWithoutUpdate / 60);
                        messageElement.textContent = 'Warning! Last update was ' + String(Math.round(timeWithoutUpdate)) + 'h ago.';
                        if (timeWithoutUpdate / 24 > 1) {
                            timeWithoutUpdate = Math.round(timeWithoutUpdate / 24);
                            messageElement.textContent = 'Warning! Last update was ' + String(Math.round(timeWithoutUpdate)) + 'd ago.';
                        }
                    }
                }
            }

            var sensors = data.sensors;
                
            Object.keys(sensors).forEach(sensor => {
                var positionContainer = document.getElementById(sensors[sensor].position);
                if (positionContainer == null) {
                    positionContainer = document.createElement('div');
                    positionContainer.setAttribute('id', sensors[sensor].position);
                    var subtitle = document.createElement('span');
                    subtitle.textContent = sensors[sensor].position;
                    subtitle.setAttribute('class', 'subtitle')
                    positionContainer.append(subtitle);
                    sensorsElement.append(positionContainer);
                }

                var sensorContainer = document.getElementById(sensor);
                
                var infoWrapper, indicatorWrapper, indicator, infoTitle, infoValue;
                if (sensorContainer == null) {
                    sensorContainer = document.createElement('div');
                    infoWrapper = document.createElement('div'), indicatorWrapper = document.createElement('div'), indicator = document.createElement('div');
                    infoTitle = document.createElement('span'), infoValue = document.createElement('span');
                    sensorContainer.setAttribute('id', sensor);
                    indicator.setAttribute('class', 'indicator');
                    infoTitle.setAttribute('class', 'info_title');
                    infoValue.setAttribute('class', 'info_value');
                    sensorContainer.setAttribute('class', 'sensor');
                    infoWrapper.setAttribute('class', 'info_wrapper');
                    indicatorWrapper.setAttribute('class', 'indicator_wrapper');
                    infoTitle.textContent = sensors[sensor].name;
                    infoWrapper.append(infoTitle);
                    infoWrapper.append(infoValue);
                    indicatorWrapper.append(indicator);
                    sensorContainer.append(infoWrapper);
                    sensorContainer.append(indicatorWrapper);
                    positionContainer.append(sensorContainer);
                }

                infoWrapper = findChildByClassname(sensorContainer, 'info_wrapper');
                indicatorWrapper = findChildByClassname(sensorContainer, 'indicator_wrapper');
                indicator = findChildByClassname(indicatorWrapper, 'indicator');
                infoTitle = findChildByClassname(infoWrapper, 'info_title');
                infoValue = findChildByClassname(infoWrapper, 'info_value');

                indicator.setAttribute('online', 'true');
                

                var values = Array();
                for (let index = 0; index < sensors[sensor].values.length; index++) {
                    var val = sensors[sensor].values[index];
                    if (val < sensors[sensor].values_possible[index].min || val > sensors[sensor].values_possible[index].max) {
                        infoValue.textContent = 'Offline';
                        indicator.setAttribute('online', 'false');
                        break;
                    }
                    values.push(val + sensors[sensor].units[index]);
                }
                if (indicator.getAttribute('online') == 'true') infoValue.textContent = values.join(', ');
                
            });
        },
        failture: function(error) {
            
        }
    });
}

function findChildByClassname(element, className) {
    for (var i = 0; i < element.childNodes.length; i++) {
        if (element.childNodes[i].className == className) {
          return element.childNodes[i];
        }        
    }
}

function removeChildren(element) {
    while(element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

async function start() {
    while (true) {
        update();
        await sleep(settingUpdateTimeElement.value);
    }
}

$(document).ready(function() {
    settingCoolerSpeedElement = document.getElementById('setting_cooler_speed');
    settingEnableCoolerElement = document.getElementById('setting_enable_cooler');
    settingUpdateTimeElement = document.getElementById('setting_update_time');
    wrapperElement = document.getElementById('wrapper');
    sensorsElement = document.getElementById('sensors');
    start();
});