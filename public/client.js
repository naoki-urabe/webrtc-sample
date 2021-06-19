"use strict";
const g_elementCheckboxCamera = document.getElementById("checkbox_camera");
const g_elementCheckboxMicrophone = document.getElementById("checkbox_microphone");
const g_elementVideoLocal = document.getElementById("video_local")
const g_elementTextareaOfferSideOfferSDP = document.getElementById("textarea_offerside_offsersdp");
const g_elementTextareaAnswerSideOfferSDP = document.getElementById("textarea_answerside_offsersdp");
const g_elementTextareaOfferSideAnswerSDP = document.getElementById("textarea_offerside_answersdp");
const g_elementTextareaAnswerSideAnswerSDP = document.getElementById("textarea_answerside_answersdp");
const g_elementVideoRemote = document.getElementById("video_remote");
const g_elementAudioRemote = document.getElementById("audio_remote");


let g_rtcPeerConnection = null;


function onclickCheckbox_CameraMicrophone() {
    console.log("UI Event : Camera/Microphone checkbox clicked.");
    let trackCamera_old = null;
    let trackMicrophone_old = null;
    let bCamera_old = false;
    let bMicrophone_old = false;
    let stream = g_elementVideoLocal.srcObject;
    if(stream){
        trackCamera_old = stream.getVideoTracks()
        if(trackCamera_old){
            bCamera_old = true;
        }
        trackMicrophone_old = stream.getAudioTracks()[0];
        if(trackMicrophone_old){
            bMicrophone_old = true;
        }
    }
    let bCamera_new = false;
    if(g_elementCheckboxCamera.checked) {
        bCamera_new = true;
    }
    let bMicrophone_new = false;
    if(g_elementCheckboxMicrophone.checked){
        bMicrophone_new = true;
    }
    console.log("Camera : %s => %s", bCamera_old, bCamera_new);
    console.log("Microphone : %s => %s", bMicrophone_old, bMicrophone_new);
    if(bCamera_old === bCamera_new && bMicrophone_old === bMicrophone_new) {
        return;
    }
    if(trackCamera_old) {
        console.log("Call : trackCamera_old.stop()");
        trackCamera_old.stop();
    }
    if(trackMicrophone_old) {
        console.log("Call : trackMicrophone_old.stop()");
        trackMicrophone_old.stop();
    }
    console.log("Call : setStreamToElement( Video Local, null)");
    setStreamToElement(g_elementVideoLocal, null);
    if(!bCamera_new && !bMicrophone_new) {
        return;
    }
    console.log("Call : navigator.mediaDevices.getUserMdeia(video=%s, audio=%s)", bCamera_new, bMicrophone_new);
    navigator.mediaDevices.getUserMedia({video: bCamera_new, audio: bMicrophone_new})
    .then((stream) => {
        console.log("Call : setStreamToElement(Video_Local, stream)");
        setStreamToElement(g_elementVideoLocal, stream)
        .catch((error) => {
            console.error("Error : ", error);
            alert("Could not start Camera");
            g_elementCheckboxCamera.checked = false;
            g_elementCheckboxMicrophone.checked = false;
            return;
        })
    })
}

function onclickButton_CreateOfferSDP() {
    console.log("UI Event : 'Create Offer SDP.' button clicked");
    if(g_rtcPeerConnection) {
        alert("Connection object already exists.");
        return;
    }
    console.log("Call : createPeerConnection()");
    let rtcPeerConnection = createPeerConnection(g_elementVideoLocal.srcObject);
    g_rtcPeerConnection = rtcPeerConnection;
    createOfferSDP(rtcPeerConnection);
}

function onclickButton_SetAnswerSDPthenChatStarts() {
    console.log("UI Event : 'Set AnswerSDP'")
    if(!g_rtcPeerConnection) {
        alert("Connection object does not exists");
        return;
    }
    let strAnswerSDP = g_elementTextareaOfferSideAnswerSDP.value;
    if(!strAnswerSDP) {
        alert("AnswerSDP is empty");
        return;
    }
    let sessionDescription = new RTCSessionDescription({
        type: "answer",
        sdp: strAnswerSDP,
    })
    console.log("Call : setAnswerSDP()");
    setOfferSDP_and_createAnswerSDP(g_rtcPeerConnection,sessionDescription)
}

function createPeerConnection(stream) {
    let config = {"iceServers": []};
    let rtcPeerConnection = new RTCPeerConnection(config);
    setupRTCPeerConnectionEventHandler(rtcPeerConnection);
    if(stream) {
        stream.getTracks().forEach((track) => {
            rtcPeerConnection.addTrack(track, stream);
        });
    } else {
        console.log("No local stream");
    }
    return rtcPeerConnection;
}

function setupRTCPeerConnectionEventHandler(rtcPeerConnection) {
    rtcPeerConnection.onnegotiationneeded = () => {
        console.log("Event : Negotiation needed");
    };
    rtcPeerConnection.onicecandidate = (event) => {
        console.log("Event : ICE candidate");
        if(event.candidate) {
            console.log("- ICE candidate : ", event.candidate);
        } else {
            console.log("- ICE candidate : empty");
        }
    };
    rtcPeerConnection.onicecandidateerror = (event) => {
        console.error("Event : ICE candidate error. error code : ",event.errorCode);
    };
    rtcPeerConnection.onicegatheringstatechange = () =>
    {
        console.log( "Event : ICE gathering state change" );
        console.log( "- ICE gathering state : ", rtcPeerConnection.iceGatheringState );

        if( "complete" === rtcPeerConnection.iceGatheringState )
        {
            // Vanilla ICEの場合は、ICE candidateを含んだOfferSDP/AnswerSDPを相手に送る
            // Trickle ICEの場合は、何もしない
            if( "offer" === rtcPeerConnection.localDescription.type )
            {
                // Offer側のOfferSDP用のテキストエリアに貼付
                console.log( "- Set OfferSDP in textarea" );
                g_elementTextareaOfferSideOfferSDP.value = rtcPeerConnection.localDescription.sdp;
                g_elementTextareaOfferSideOfferSDP.focus();
                g_elementTextareaOfferSideOfferSDP.select();
            }
            else if( "answer" === rtcPeerConnection.localDescription.type )
            {
                // Answer側のAnswerSDP用のテキストエリアに貼付
                console.log( "- Set AnswerSDP in textarea" );
                g_elementTextareaAnswerSideAnswerSDP.value = rtcPeerConnection.localDescription.sdp;
                g_elementTextareaAnswerSideAnswerSDP.focus();
                g_elementTextareaAnswerSideAnswerSDP.select();
            }
            else
            {
                console.error( "Unexpected : Unknown localDescription.type. type = ", rtcPeerConnection.localDescription.type );
            }
        }
    };

    rtcPeerConnection.oniceconnectionstatechange = () => {
        console.log("Event : ICE connection state change");
        console.log("- ICE connection state : ", rtcPeerConnection.iceConnectionState);
    }
    rtcPeerConnection.onsignalingstatechange = () => {
        console.log("Event : Signaling state change");
        console.log("- Signaling state : ", rtcPeerConnection.signalingState);
    }
    rtcPeerConnection.onconnectionstatechange = () => {
        console.log("Event : Connection state change");
        console.log("- Connection state : ", rtcPeerConnection.connectionState);
    }
    rtcPeerConnection.ontrack = (event) => {
        console.log("Event : Track");
        console.log("- stream", event.streams[0]);
        console.log("- track", event.track);
        let stream = event.streams[0];
        let track = event.track;
        if("video" === track.kind){
            console.log("Call : setStramToElement(Video_Remote, stream)");
            setStreamToElement(g_elementVideoRemote, stream);
        } else if("audio" === track.kind) {
            console.log("Call : setStreamToElement(Audio_Remote, stream)");
            setStreamToElement(g_elementAudioRemote, stream);
        } else {
            console.error("Unexpected: Unknown track kind : ", track.kind)
        }
    }
}

function setStreamToElement(elementMedia, stream) {
    elementMedia.srcObject = stream;
    if(!stream) {
        return;
    }
    if("VIDEO" === elementMedia.tagName) {
        elementMedia.volume = 0.0;
        elementMedia.muted = true;
    } else if ("AUDIO" === elementMedia.tagName) {
        elementMedia.volume = 1.0;
        elementMedia.muted = false;
    } else {
        console.error("Unexpected : Unknown ElementTagName : ", elementMedia.tagName);
    }
}

function createOfferSDP(rtcPeerConnection) {
    console.log("Call: rtcPeerConnection.createOffer()");
    rtcPeerConnection.createOffer()
    .then((sessionDescription) => {
        console.log("Call : rtcPeerConnection.setLocalDescription()");
        return rtcPeerConnection.setLocalDescription(sessionDescription);
    })
    .then(() => {
    })
    .catch((error) => {
        console.error("Error : ", error);
    })
}

function onclickButton_SetOfferSDPandCreateAnswerSDP() {
    console.log("UI Event : 'Set OfferSDP and Create AnswerSDP.' button clicked");
    if(g_rtcPeerConnection) {
        alert("Connection object already exists.");
        return;
    }
    let strOfferSDP = g_elementTextareaAnswerSideOfferSDP.value;
    if(!strOfferSDP){
        alert("OfferSDP is empty. Please enter the OfferSDP");
        return;
    }
    console.log("Call : createPeerConnection()");
    let rtcPeerConnection = createPeerConnection(g_elementVideoLocal.srcObject);
    g_rtcPeerConnection = rtcPeerConnection;
    let sessionDescription = new RTCSessionDescription({
        type: "offer",
        sdp: strOfferSDP,
    });
    console.log("Call : setOfferSDP_and_createAnswerSDP()");
    setOfferSDP_and_createAnswerSDP(rtcPeerConnection, sessionDescription);
}

function setOfferSDP_and_createAnswerSDP(rtcPeerConnection, sessionDescription) {
    console.log("Call : rtcPeerConnection.setRemoteDescription()");
    rtcPeerConnection.setRemoteDescription(sessionDescription)
    .then(() => {
        return rtcPeerConnection.createAnswer();
    }).then((sessionDescription) => {
        return rtcPeerConnection.setLocalDescription(sessionDescription);
    }).then(()=> {
    }).catch((error) => {
        console.error("error")
    })
}