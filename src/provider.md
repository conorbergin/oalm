# Encrypted Websocket
I want a backend service that syncs the document in near real time.

The server has an update queue and a backup doc which is updated periodically.


Level 1:
update queue
OPEN:
1. request full queue, compute diff and send back encrypted update
RECIEVE:
2. decrypt and apply update

