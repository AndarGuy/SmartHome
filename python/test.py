import requests

json = {
  "sensors": {
    "dht1": {
      "values": [10, 20]
    },
    "dht2": {
      "values": [30, 40]
    },
    "gas1": {
      "values": [50]
    },
    "gas2": {
      "values": [60]
    },
    "gas3": {
      "values": [70]
    }
  },
  "cooler_blocked": False
}

json1 = {
    'cooler_speed': 100,
    'servo_enabled': True,
}

res = requests.post('http://andarguy.me:5000/receive', json=json)
if res.ok:
    print(res.content)
