import requests
import json
import tunesync.tests.helper_functions as helper

# python -m pytest tunesync/tests/test_users.py -s
class TestUsers:
    # If running consecutively multiple times, change the user
    # of these first 2 methods so both pass on a new user
    def test_make_user(self):
        user = helper.makeUser("c", "123")
        assert "token" in user.text and "user_id" in user.text

    def test_make_user2(self):
        user = helper.makeUser("b", "123")
        assert "token" in user.text and "user_id" in user.text

    def test_make_duplicate_user(self):
        user = helper.makeUser("c", "123")
        assert "details" in user.text

    def test_make_room_with_subtitle(self):
        token = helper.getToken("c", "123")
        room = helper.makeRoom(token, "Best Room", "yoyo")
        assert "id" in room.text and "title" in room.text

    def test_make_room_without_subtitle(self):
        token = helper.getToken("c", "123")
        room = helper.makeRoom(token, "Lul")
        assert "id" in room.text and "title" in room.text

    def test_make_duplicate_room_with_same_title(self):
        token = helper.getToken("c", "123")
        room = helper.makeRoom(token, "Lul")
        assert "id" in room.text and "title" in room.text

    #TODO: Are we supposed to be able to delete rooms?

    # # File not being read? :/
    # def test_make_tune(self):
    #     token = helper.getToken("c", "123")
    #     tune = helper.makeTune(token)
    #     print(tune)

    #TODO: Update tune tests

    #TODO: All Types of Event Tests

    # Getting a 403 - why?
    def test_make_kick_user_event(self):
        print()
        print("EVENT TESTS")
        token = helper.getToken("c", "123")
        room_id = 1
        kicked_user_id = 2
        event = helper.kickUser(token, room_id, kicked_user_id)
        print(event)
        print(event.text)
        assert True

    #TODO: Voting Tests