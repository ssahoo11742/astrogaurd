import * as THREE from "three"
import { celestials } from '../AsteroidTracker';
import { impactStats, closeApproachStats } from "./closeApproach";

// Follow Body function
export const followBody = (body, bodyRefs, zoomFactor, controls, camera, setTarget, alt, az, lerp) => {
    const positionVector = new THREE.Vector3();
    const matrixWorld = bodyRefs.current[body].matrixWorld;
    positionVector.setFromMatrixPosition(matrixWorld);
  
    controls.current.target.copy(positionVector);
  
    // Radius
    const radius = 5 * zoomFactor; 
  
    // Altitude angle (phi)
    const phi = ((alt % 100) / 100) * Math.PI; 
    
    // Azimuthal angle (theta)
    const theta = ((az+ Math.PI/2) * 0.015 ) % (2 * Math.PI); 
  
    // Convert spherical coordinates to Cartesian coordinates
    const cameraOffset = new THREE.Vector3();
    cameraOffset.setFromSpherical(new THREE.Spherical(radius, phi, theta ));
  
    // Target camera position
    const targetCameraPosition = positionVector.clone().add(cameraOffset);
  
    // Check distance threshold to stop lerping
    const distanceThreshold = 0.01;  // Small distance to check if we've arrived
    const distanceToTarget = camera.position.distanceTo(targetCameraPosition);
  
    // If lerping is enabled, smoothly transition to the target position
    if (lerp && distanceToTarget > distanceThreshold) {
      // Adjust the lerp factor to a reasonable speed
      camera.position.lerp(targetCameraPosition, 0.05);
      camera.lookAt(positionVector);
      camera.updateProjectionMatrix();
      controls.current.update();
  
      setTarget(positionVector);
  
      // Still lerping
      return true;
    } else {
      // Instantly move if not lerping or if within the threshold
      camera.position.copy(targetCameraPosition);
      camera.lookAt(positionVector);
      camera.updateProjectionMatrix();
      controls.current.update();
      // Lerping is done
      return false;
    }
  };


// On click event function for following bodies
export const followBodyClickEvent = (speed, setAsteroidSize, setFollowingBody, setLerp, setZoomFactor, body, bodyRefs, setDisplayData, setImpactData, setCloseApproachData) =>{
    speed.current = 0;
    setAsteroidSize(0.05);
    setFollowingBody(body);
    setLerp(1);
    setZoomFactor(1)
    setDisplayData({
      name:body,
      diameter:celestials[body].diameter,
      orbPer: celestials[body].per,
      rotPer: celestials[body].rotPer,
      producer: celestials[body].producer,
      albedo: celestials[body].albedo
    })

    impactStats(celestials[body].des).then(result => {
      setImpactData(result)
    })
    closeApproachStats(celestials[body].des).then(result => {
      setCloseApproachData(result)
    })
  }