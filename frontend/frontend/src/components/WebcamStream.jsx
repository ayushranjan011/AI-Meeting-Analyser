import React from "react";

function WebcamStream({ videoRef, isCameraLoading, cameraError, children }) {
  return (
    <section className="panel webcam-panel">
      <div className="panel-header">
        <h2>Webcam Stream</h2>
      </div>
      {isCameraLoading && <p className="status-text">Initializing webcam...</p>}
      {cameraError && <p className="error-text">{cameraError}</p>}
      <div className="video-wrapper">
        <video ref={videoRef} autoPlay playsInline muted className="webcam-video" />
        {children}
      </div>
    </section>
  );
}

export default WebcamStream;
