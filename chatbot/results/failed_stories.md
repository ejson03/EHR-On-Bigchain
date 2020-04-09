## happy path 1
* greet: hello there!
    - utter_greet
* mood_great: amazing   <!-- predicted: thank: amazing -->
    - utter_happy   <!-- predicted: utter_thank -->


## happy path 2
* greet: hello there!
    - utter_greet
* mood_great: amazing   <!-- predicted: thank: amazing -->
    - utter_happy   <!-- predicted: utter_thank -->
* goodbye: bye-bye!   <!-- predicted: bye: bye-bye! -->
    - utter_goodbye   <!-- predicted: utter_bye -->


## sad path 1
* greet: hello
    - utter_greet
* mood_unhappy: not good   <!-- predicted: deny: not good -->
    - utter_cheer_up   <!-- predicted: utter_greet -->
    - utter_did_that_help   <!-- predicted: action_listen -->
* affirm: yes
    - utter_happy   <!-- predicted: utter_greet -->


## sad path 2
* greet: hello
    - utter_greet
* mood_unhappy: not good   <!-- predicted: deny: not good -->
    - utter_cheer_up   <!-- predicted: utter_greet -->
    - utter_did_that_help   <!-- predicted: action_listen -->
* deny: not really
    - utter_goodbye   <!-- predicted: utter_greet -->


## sad path 3
* greet: hi
    - utter_greet
* mood_unhappy: very terrible   <!-- predicted: ask_wherefrom: very terrible -->
    - utter_cheer_up   <!-- predicted: utter_greet -->
    - utter_did_that_help   <!-- predicted: action_listen -->
* deny: no
    - utter_goodbye   <!-- predicted: utter_greet -->


## say goodbye
* goodbye: bye-bye!   <!-- predicted: bye: bye-bye! -->
    - utter_goodbye   <!-- predicted: utter_bye -->


## bot challenge
* bot_challenge: are you a bot?   <!-- predicted: handleinsult: are you a bot? -->
    - utter_iamabot   <!-- predicted: utter_greet -->


