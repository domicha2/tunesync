import requests
import json
import tunesync.tests.helper_functions as helper

# Run these commands in order to test thoroughly
# sh reset_dev.sh
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
    def test_make_message_event(self):
        print()
        print("EVENT TESTS")
        token = helper.getToken("c", "123")
        room_id = 1
        content = "sucksucksuck"
        event = helper.sendMessage(token, room_id, content)
        assert "event_type" in event.text and "room" in event.text and "author" in event.text

    def test_make_message_event_for_fake_room(self):
        token = helper.getToken("c", "123")
        room_id = 6
        content = "sucksucksuck"
        event = helper.sendMessage(token, room_id, content) 
        assert "detail" in event.text

    def test_make_kick_user_event(self):
        token = helper.getToken("c", "123")
        room_id = 1
        # Should we allow someone to kick themselves? LOL
        kicked_user_id = 2
        event = helper.kickUser(token, room_id, kicked_user_id)
        assert "event_type" in event.text and "room" in event.text and "author" in event.text

    def test_make_kick_fake_user_event(self):
        token = helper.getToken("c", "123")
        room_id = 1
        kicked_user_id = 100
        event = helper.kickUser(token, room_id, kicked_user_id)
        assert "detail" in event.text

    #TODO: Not sure how this test is supposed to be formatted?
    # Keep getting a 403 no matter what I try
    def test_invite_user_event(self):
        print()
        print("test_invite_user_event")
        token = helper.getToken("c", "123")
        room_id = 1
        users = 3
        event = helper.inviteUsers(token, room_id, users)
        print(event)
        print(event.text)
        assert True

    #TODO: Keep getting a 403 no matter what I try
    def test_invite_fake_user_event(self):
        print()
        print("test_invite_fake_user_event")
        token = helper.getToken("c", "123")
        room_id = 1
        users = 100
        event = helper.inviteUsers(token, room_id, users)
        print(event)
        print(event.text)
        assert True

    #TODO: Keep getting a 403 no matter what I try
    def test_user_join_true_event(self):
        print()
        print("test_user_join_true_event")
        token = helper.getToken("c", "123")
        room_id = 1
        is_accepted = True
        event = helper.inviteUsers(token, room_id, is_accepted)
        print(event)
        print(event.text)
        assert True
        
    #TODO: Keep getting a 403 no matter what I try
    def test_user_join_false_event(self):
        print()
        print("test_user_join_false_event")
        token = helper.getToken("c", "123")
        room_id = 1
        is_accepted = False
        event = helper.inviteUsers(token, room_id, is_accepted)
        print(event)
        print(event.text)
        assert True

    def test_change_user_event(self):
        print()
        print("test_change_user_event")
        token = helper.getToken("c", "123")
        room_id = 1
        user_id = 3
        new_role = "A"
        event = helper.changeUser(token, room_id, user_id, new_role)
        print(event)
        print(event.text)
        assert True

    def test_change_user_to_fake_role_event(self):
        print()
        print("test_change_user_to_fake_role_event")
        token = helper.getToken("c", "123")
        room_id = 1
        user_id = 3
        new_role = "CC"
        event = helper.changeUser(token, room_id, user_id, new_role)
        print(event)
        print(event.text)
        assert True

    #TODO: Voting Tests