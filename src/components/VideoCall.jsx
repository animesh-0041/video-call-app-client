// import React, { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";
// import "./videoCall.css";
// import { BsMicMuteFill } from "react-icons/bs";
// import { FaMicrophone } from "react-icons/fa";
// import { IoVideocam } from "react-icons/io5";
// import { FaVideoSlash } from "react-icons/fa";
// const socket = io("https://video-call-app-backend-9vqt.onrender.com"); // Your signaling server

// const VideoCall = () => {
//   const [stream, setStream] = useState(null);
//   const [peerConnection, setPeerConnection] = useState(null);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isVideoOff, setIsVideoOff] = useState(false);
//   const [isSharingScreen, setIsSharingScreen] = useState(false);

//   const localVideoRef = useRef();
//   const remoteVideoRef = useRef();

//   useEffect(() => {
//     // Access user media (audio and video)
//     navigator.mediaDevices
//       .getUserMedia({ video: true, audio: true })
//       .then((mediaStream) => {
//         setStream(mediaStream);
//         localVideoRef.current.srcObject = mediaStream;
//       })
//       .catch((error) => console.error("Error accessing media devices.", error));
//   }, []);

//   useEffect(() => {
//     // Set up WebRTC PeerConnection
//     const pc = new RTCPeerConnection({
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     });

//     setPeerConnection(pc);

//     // Add local stream to peer connection
//     if (stream) {
//       stream.getTracks().forEach((track) => pc.addTrack(track, stream));
//     }

//     // Handle ICE candidates
//     pc.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("ice-candidate", event.candidate);
//       }
//     };

//     // Handle receiving remote stream
//     pc.ontrack = (event) => {
//       remoteVideoRef.current.srcObject = event.streams[0];
//     };

//     // Handle offer and answer
//     socket.on("offer", async (data) => {
//       try {
//         if (pc.signalingState !== "closed") {
//           await pc.setRemoteDescription(new RTCSessionDescription(data));
//           const answer = await pc.createAnswer();
//           await pc.setLocalDescription(answer);
//           socket.emit("answer", answer);
//         }
//       } catch (error) {
//         console.error("Error handling offer:", error);
//       }
//     });

//     socket.on("answer", async (data) => {
//       try {
//         if (pc.signalingState !== "closed") {
//           await pc.setRemoteDescription(new RTCSessionDescription(data));
//         }
//       } catch (error) {
//         console.error("Error handling answer:", error);
//       }
//     });

//     socket.on("ice-candidate", async (data) => {
//       try {
//         if (pc.signalingState !== "closed") {
//           await pc.addIceCandidate(new RTCIceCandidate(data));
//         }
//       } catch (error) {
//         console.error("Error adding ICE candidate:", error);
//       }
//     });

//     // Clean up peer connection on component unmount
//     return () => {
//       if (pc) {
//         pc.close();
//         setPeerConnection(null);
//       }
//     };
//   }, [stream]);

//   // Create and send an offer
//   const createOffer = async () => {
//     if (peerConnection) {
//       try {
//         const offer = await peerConnection.createOffer();
//         await peerConnection.setLocalDescription(offer);
//         socket.emit("offer", offer);
//       } catch (error) {
//         console.error("Error creating offer:", error);
//       }
//     } else {
//       console.error("Peer connection is not initialized.");
//     }
//   };

//   // Toggle mute
//   const toggleMute = () => {
//     if (stream) {
//       const audioTrack = stream.getAudioTracks()[0];
//       if (audioTrack) {
//         audioTrack.enabled = !audioTrack.enabled;
//         setIsMuted(!audioTrack.enabled);
//       }
//     }
//   };

//   // Toggle video
//   const toggleVideo = () => {
//     if (stream) {
//       const videoTrack = stream.getVideoTracks()[0];
//       if (videoTrack) {
//         videoTrack.enabled = !videoTrack.enabled;
//         setIsVideoOff(!videoTrack.enabled);
//       }
//     }
//   };

//   // Toggle screen share
//   // Toggle screen share
//   const toggleScreenShare = async () => {
//     if (!isSharingScreen) {
//       try {
//         // If screen sharing is not active, start it
//         const screenStream = await navigator.mediaDevices.getDisplayMedia({
//           video: true,
//         });

//         const screenTrack = screenStream.getVideoTracks()[0];

//         // Replace the current video track with the screen sharing track
//         const sender = peerConnection
//           .getSenders()
//           .find((s) => s.track.kind === "video");
//         if (sender) {
//           sender.replaceTrack(screenTrack);
//         }

//         // Ensure the video element only shows the current screen stream
//         if (localVideoRef.current.srcObject) {
//           localVideoRef.current.srcObject
//             .getTracks()
//             .forEach((track) => track.stop()); // Stop previous stream
//         }

//         localVideoRef.current.srcObject = screenStream;

//         // Stop screen sharing when the user stops it
//         screenTrack.onended = () => {
//           stopScreenShare(); // Automatically stop screen sharing when the user stops it
//         };

//         setIsSharingScreen(true);
//       } catch (error) {
//         console.error("Error sharing screen:", error);
//       }
//     } else {
//       // If screen sharing is active, stop it
//       stopScreenShare();
//     }
//   };

//   // Stop screen sharing and switch back to the webcam
//   const stopScreenShare = async () => {
//     const videoTrack = stream.getVideoTracks()[0]; // Get the original webcam video track
//     const sender = peerConnection
//       .getSenders()
//       .find((s) => s.track.kind === "video");
//     if (sender) {
//       sender.replaceTrack(videoTrack); // Replace the screen sharing track with the webcam track
//     }

//     // Ensure the local video element only shows the webcam stream
//     if (localVideoRef.current.srcObject) {
//       localVideoRef.current.srcObject
//         .getTracks()
//         .forEach((track) => track.stop()); // Stop screen stream
//     }

//     localVideoRef.current.srcObject = stream; // Set video back to webcam

//     setIsSharingScreen(false);
//   };

//   return (
//     <div>
//       <div>
//         <h3>Local Stream</h3>
//         <video ref={localVideoRef} autoPlay playsInline muted />
//       </div>
//       <div>
//         <h3>Remote Stream</h3>
//         <video ref={remoteVideoRef} autoPlay playsInline />
//       </div>
//       <button onClick={createOffer}>Start Call</button>
//       <div className="video-controls">
//         <button onClick={toggleMute}>
//           {isMuted ? (
//             <BsMicMuteFill color="red" size={24} />
//           ) : (
//             <FaMicrophone size={24} />
//           )}{" "}
//           Mic
//         </button>
//         <button onClick={toggleVideo}>
//           {isVideoOff ? <FaVideoSlash size={24} /> : <IoVideocam size={24} />}
//         </button>
//         <button onClick={toggleScreenShare} disabled>
//           {isSharingScreen ? "Stop Sharing Screen" : "Share Screen"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default VideoCall;

import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { BsMicMuteFill } from "react-icons/bs";
import { FaMicrophone, FaVideoSlash } from "react-icons/fa";
import { IoVideocam } from "react-icons/io5";
import "./videoCall.css";

const socket = io("https://video-call-app-backend-9vqt.onrender.com"); // Your signaling server

const VideoCall = () => {
  const [stream, setStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

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

  // Toggle mute
  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (!isSharingScreen) {
      try {
        // Get the screen stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace the current video track with the screen sharing track
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track.kind === "video");
        sender.replaceTrack(screenTrack);

        // Update the local video to show the screen share
        localVideoRef.current.srcObject = screenStream;

        // Stop screen sharing when the user stops it
        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsSharingScreen(true);
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    } else {
      // Stop screen sharing and revert to the webcam
      stopScreenShare();
    }
  };

  // Stop screen sharing and switch back to the video
  const stopScreenShare = async () => {
    const videoTrack = stream.getVideoTracks()[0]; // Get the original webcam video track
    const sender = peerConnection
      .getSenders()
      .find((s) => s.track.kind === "video");
    sender.replaceTrack(videoTrack);

    // Set local video back to webcam
    localVideoRef.current.srcObject = stream;

    setIsSharingScreen(false);
  };

  return (
    <div>
      <div style={{ width: 200, height: 200, margin: "0 auto" }}>
        <h3>You</h3>
        <video ref={localVideoRef} autoPlay playsInline muted />
      </div>
      <div style={{ width: 500, height: 500, margin: "0 auto" }}>
        <h3>Remote Stream</h3>
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
      <button onClick={createOffer}>Start Call</button>
      <div className="video-controls">
        <button onClick={toggleMute}>
          {isMuted ? (
            <BsMicMuteFill color="red" size={24} />
          ) : (
            <FaMicrophone size={24} />
          )}{" "}
          Mic
        </button>
        <button onClick={toggleVideo}>
          {isVideoOff ? <FaVideoSlash size={24} /> : <IoVideocam size={24} />}
        </button>
        <button onClick={toggleScreenShare} disabled>
          {isSharingScreen ? "Stop Sharing Screen" : "Share Screen"}
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
