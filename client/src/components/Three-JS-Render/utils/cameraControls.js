import { useEffect, useRef, useState } from "react";

// to be able to control camera angle in follow mode using altitude and azimuth angles
export const CameraController = ({ alt, setAlt, az, setAz }) => {
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startX = useRef(0)
  
    const handleMouseDown = (event) => {
      setIsDragging(true);
      startY.current = event.clientY;
      startX.current = event.clientX;
    };
  
    const handleMouseMove = (event) => {
      if (isDragging) {
        const deltaY = event.clientY - startY.current;
        const deltaX = event.clientX - startX.current;
  
        // Set new alt and az values
        setAlt(prevRotation => prevRotation + deltaY * 0.15);
        setAz(prevRotation => prevRotation + deltaX * 0.15);
        startY.current = event.clientY;
        startX.current = event.clientX;
      }
    };
  
    const handleMouseUp = () => {
      setIsDragging(false);
    };
  
    useEffect(() => {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousedown', handleMouseDown);
  
      // Cleanup function to remove event listeners
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mousedown', handleMouseDown);
      };
    }, [isDragging]);
  
    return null; 
  };
  
  
  
  
  
  
  
  // Zooming while following body
  export const ZoomComponent = ({setZoomFactor, zoomFactor}) => {
   
    const MIN_ZOOM = 0;
    const MAX_ZOOM = 100000;
    useEffect(() => {
      const handleWheel = (event) => {
        // Adjust the zoom factor based on the wheel delta
        const zoomAmount = event.deltaY * (0.01/10)*zoomFactor; // Adjust sensitivity
        setZoomFactor((prevZoomFactor) => {
            const newZoomFactor = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prevZoomFactor + zoomAmount));
          return newZoomFactor;
        });
      };
  
      window.addEventListener('wheel', handleWheel);
  
      return () => {
        window.removeEventListener('wheel', handleWheel);
      };
    }, [zoomFactor]);
  
  };