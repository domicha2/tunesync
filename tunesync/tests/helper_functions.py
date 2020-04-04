import requests
import json

def getToken(username, password):
    res = requests.post(
        "http://localhost:8000/users/auth/",
        data={"username": username, "password": password},
        verify=False,
    )
    return res.json()["token"]


def makeRoom(token, title, subtitle=None):
    res = requests.post(
        "http://localhost:8000/rooms/",
        headers={"Authorization": "Token " + token},
        data={"subtitle": subtitle, "title": title},
    )
    return res


def makeEvent(token, room, event_type, args, parent_event=None):
    data = {"room": room, "event_type":event_type, "args":args}
    if parent_event:
        data["parent_event"] = parent_event
    res = requests.post(
        "http://localhost:8000/events/",
        headers={"Authorization": "Token " + token, "content-type": "application/json"},
        data=json.dumps(data),
    )
    return res

def makeTune(token):
    with open("test.mp3", 'rb') as fobj:
        res = requests.post(
            "http://localhost:8000/tunes/",
            headers={"Authorization": "Token " + token},
            files={'file': fobj},
        )
        return res
    
def getEvents(token, room, query):
    url =  "http://localhost:8000/rooms/{0}/events/?{1}".format(room, query)
    
    res = requests.get(url, 
                       headers={"Authorization": "Token " + token})
    return res

def getTuneMeta(token, tune_id):
    url = "http://localhost:8000/tunes/{}/meta/".format(tune_id)
    res = requests.get(url, headers={"Authorization": "Token " + token})
    return res

def getTuneData(token, tune_id):
    url = "http://localhost:8000/tunes/{}/data/".format(tune_id)
    res = requests.get(url, headers={"Authorization": "Token " + token})
    return res




def makeUser(username, password):
    url = "http://localhost:8000/users/"
    res = requests.post(url,
        data={"username": username, "password": password},
    )
    return res

def getTuneSync(token, room_id):
    url = "http://localhost:8000/rooms/{}/tunesync/".format(room_id)
    res = requests.get(url, headers={"Authorization": "Token " + token})
    return res

def kickUser(token, room_id, kicked_user):
    return makeEvent(token, room_id, "U", {"type": "K", "user": kicked_user})

def inviteUsers(token, room_id, users):
    return makeEvent(token, room_id, "U", {"type": "I", "users": users})

def changeUser(token, room_id, user, role):
    return makeEvent(token, room_id, "U", {"type": "C", "user": user, "role": role})

def userJoin(token, room_id, is_accepted):
    return makeEvent(token, room_id, "U", {"type": "J", "is_accepted": is_accepted})

def getTune(token, query):
    url = "http://localhost:8000/tunes?{}".format(query)
    res = requests.get(url, headers={"Authorization": "Token " + token})
    return res

def getRoomEvent(token, room_id):
    url = "http://localhost:8000/rooms/{}/events/".format(room_id)
    res = requests.get(url, headers={"Authorization": "Token " + token})
    return res

def getRoomTuneSync(token, room_id):
    url = "http://localhost:8000/rooms/{}/tunesync/".format(room_id)
    res = requests.get(url, headers={"Authorization": "Token " + token})
    return res


def getUsers(token, page, query):
    url = "http://localhost:8000/users/?page={}&{}".format(page, query)
    res = requests.get(url, headers={"Authorization": "Token " + token})
    return res


def updateTune(token, tune_id, name=None, artist=None, album=None):
    url = "http://localhost:8000/tunes/{}/".format(tune_id)
    params = {"tune_name": name, "tune_artist": artist, "tune_album": album}
    res = requests.patch(url, params=params, headers={"Authorization": "Token " + token})
    return res