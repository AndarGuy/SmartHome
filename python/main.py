import collections
import csv
import json
import os
import re
import time

from flask import Flask, request

JSON_PARSE_ERROR = 'json_parse_error'
OK = 'OK'
MAC_ERROR = 'invalid_mac_address'

COOLER_SPEED = 'cooler_speed'
COOLER_ENABLED = 'cooler_enabled'
COOLER_BLOCKED = 'cooler_blocked'

POST = 'POST'
DATA = 'data'
DATE = 'date'
VALUES = 'values'
VALUES_NAMES = 'values_names'
TYPE = 'type'
SENSORS = 'sensors'

LOG_PATH = '../log/'
LOG_FILENAME = 'log.csv'

JSON_PATH = '../json/'
SENSORS_DESCRIPTION_FILENAME = 'description.json'
SENSORS_INFO_FILENAME = 'info.json'

sensors_description = json.load(open(JSON_PATH + SENSORS_DESCRIPTION_FILENAME))
sensors_info = json.load(open(JSON_PATH + SENSORS_INFO_FILENAME))

cooler_enabled = False
cooler_speed = 20
cooler_blocked = False

app = Flask(__name__)


def is_mac_valid(mac):
    return re.match("[0-9a-f]{2}([-:]?)[0-9a-f]{2}(\\1[0-9a-f]{2}){4}$", mac.lower())


def flatten(l):
    for el in l:
        if isinstance(el, collections.Iterable) and not isinstance(el, (str, bytes)):
            yield from flatten(el)
        else:
            yield el


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response


@app.route('/connect/<mac>')
def connect(mac):
    if is_mac_valid(mac):
        return OK
    else:
        return MAC_ERROR


@app.route('/receive', methods=[POST])
def receive():
    global cooler_blocked
    if request.is_json:
        data = dict(request.get_json())
        sensors = data[SENSORS].keys()
        row = list(flatten([[int(value) for value in data[SENSORS][sensor][VALUES]] for sensor in sensors]))
        row.insert(0, int(time.time() * 1000))
        header = list(
            flatten([[sensor + '.' + sensors_description[sensors_info[sensor][TYPE]][VALUES_NAMES][num] for num in
                      range(len(data[SENSORS][sensor][VALUES]))] for sensor in sensors]))
        header.insert(0, DATE)

        cooler_blocked = data[COOLER_BLOCKED]

        with open(LOG_PATH + LOG_FILENAME, 'a') as f:
            writer = csv.writer(f)
            if not os.path.getsize(LOG_PATH + LOG_FILENAME):
                writer.writerow(header)
            writer.writerow(row)
        return str(cooler_speed) + ' ' + str(cooler_enabled).lower()
    else:
        return JSON_PARSE_ERROR


@app.route('/get', methods=[POST])
def get():
    global cooler_speed, cooler_enabled
    if request.is_json:
        data = dict(request.get_json())

        cooler_enabled = data[COOLER_ENABLED]
        cooler_speed = data[COOLER_SPEED]

        with open(LOG_PATH + LOG_FILENAME, 'r') as f:
            reader = csv.reader(f)
            read = list(reader)
            header = read[0]
            row = read[-1]
            date = row.pop(0)

            output = sensors_info.copy()
            for info in sensors_info:
                output[info].update(sensors_description[sensors_info[info][TYPE]])

            values = {}
            for sensor, value in map(lambda x: x.split('.'), filter(lambda x: x.find('.') != -1, header)):
                values[sensor] = values.get(sensor, [])
                values[sensor].append(row.pop(0))

            for sensor in output.keys():
                output[sensor][VALUES] = values[sensor]

            output = {SENSORS: output, COOLER_BLOCKED: cooler_blocked, DATE: date}

        return json.dumps(output)
    else:
        return JSON_PARSE_ERROR


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False)
