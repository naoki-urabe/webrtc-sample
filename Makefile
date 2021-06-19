build:
	docker build -t webrtc-sample:latest .
run-container:
	docker run -it \
	-v $(PWD):/webrtc-sample \
	-p 1337:1337 \
	webrtc-sample /bin/ash
