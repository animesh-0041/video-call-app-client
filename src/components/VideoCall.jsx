import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("https://video-call-app-backend-9vqt.onrender.com"); // Your signaling server

const VideoCall = () => {
  const [stream, setStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    // Access user media (audio and video)
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        localVideoRef.current.srcObject = mediaStream;
      })
      .catch((error) => console.error("Error accessing media devices.", error));
  }, []);

  useEffect(() => {
    // Set up WebRTC PeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    setPeerConnection(pc);

    // Add local stream to peer connection
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    // Handle receiving remote stream
    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // Handle offer and answer
    socket.on("offer", async (data) => {
      try {
        if (pc.signalingState !== "closed") {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", answer);
        }
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

    socket.on("answer", async (data) => {
      try {
        if (pc.signalingState !== "closed") {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        }
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    });

    socket.on("ice-candidate", async (data) => {
      try {
        if (pc.signalingState !== "closed") {
          await pc.addIceCandidate(new RTCIceCandidate(data));
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    // Clean up peer connection on component unmount
    return () => {
      if (pc) {
        pc.close();
        setPeerConnection(null);
      }
    };
  }, [stream]);

  // Create and send an offer
  const createOffer = async () => {
    if (peerConnection) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", offer);
      } catch (error) {
        console.error("Error creating offer:", error);
      }
    } else {
      console.error("Peer connection is not initialized.");
    }
  };

  return (
    <div>
      <div>
        <h3>Local Stream</h3>
        <video ref={localVideoRef} autoPlay playsInline muted />
      </div>
      <div>
        <h3>Remote Stream</h3>
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
      <button onClick={createOffer}>Start Call</button>
    </div>
  );
};

export default VideoCall;
