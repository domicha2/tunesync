import requests
import json
import tunesync.tests.helper_functions as helper

class TestUsers:
    # If running consecutively multiple times, change the user
    # of these first 2 methods so both pass on a new user
    def test_make_user(self):
        user = helper.makeUser("a", "123")
        assert "token" in user.text and "user_id" in user.text

    def test_make_duplicate_user(self):
        user = helper.makeUser("a", "123")
        assert "details" in user.text

    def test_make_room_with_subtitle(self):
        token = helper.getToken("a", "123")
        room = helper.makeRoom(token, "Best Room", "yoyo")
        assert "id" in room.text and "title" in room.text

    def test_make_room_without_subtitle(self):
        token = helper.getToken("a", "123")
        room = helper.makeRoom(token, "Lul")
        assert "id" in room.text and "title" in room.text

    def test_make_duplicate_room_with_same_title(self):
        token = helper.getToken("a", "123")
        room = helper.makeRoom(token, "Lul")
        assert "id" in room.text and "title" in room.text

    #TODO: Are we supposed to be able to delete rooms?

    # File not being read? :/
    def test_make_tune(self):
        token = helper.getToken("a", "123")
        tune = helper.makeTune(token)
        print(tune)

    #TODO: Update tune tests

    #TODO: All Types of Event Tests

    #TODO: Voting Tests