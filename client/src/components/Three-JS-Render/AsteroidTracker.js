import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bounds, OrbitControls } from '@react-three/drei';
import { getCurrentD, orbitalData } from "./BodyPosition";
import { updateIcon, updateLabel } from './utils/label';
import { ZoomComponent, CameraController } from './utils/cameraControls';
import { asteroidData, pha, cometData } from './data/AsteroidData';
import { followBody, followBodyClickEvent } from './utils/followBody';
import { initBodies, Body } from './components/Body';
import { Sun } from './components/Sun';
import { InstancedNEOS } from './components/InstancedNEOS.js';



// Celestial dictionary
export const celestials = orbitalData;
const AsteroidTracker = ({ speed, setViewDate, t, showNEO, showPHA, showComet, target, setTarget, followingBody, setFollowingBody, setAsteroidSize, asteroidSize, labeledBodies, setDisplayData, setImpactData,setCloseApproachData}) => {
    const asteroidCount = 35469;
    const PHACount = 2440;
    const cometCount = 205;
    const d = getCurrentD(new Date());
    const datenow = new Date();
    const bodies = {};
    const orbitalCurves = [];
    const canvas = document.getElementById("canvas");
    const addDays = (now, days) => new Date(new Date(now).setDate(now.getDate() + days));
    const bodyRefs = useRef({}); // Create an array of refs

    const controls = useRef();
    const [zoomFactor, setZoomFactor] = useState(1);

    const [alt, setAlt] = useState(0);
    const [az, setAz] = useState(0);

    const [lerp, setLerp] = useState(0);

    

    // Initialize Bodies
    initBodies(celestials, d, t, bodies, orbitalCurves);

    
    // Assign refs to bodies
    useEffect(() => {
        // Update bodyRefs.current to match the structure of bodies
        const updatedRefs = {};
        Object.keys(bodies).forEach((name) => {
            if (!bodyRefs.current[name]) {
                bodyRefs.current[name] = React.createRef();
            }
            updatedRefs[name] = bodyRefs.current[name];
        });
    
        // Keep only refs for existing bodies
        bodyRefs.current = updatedRefs;
    }, [bodies]);

    
    // Animation component 
    const Animation = () => {

        // Camera ref
        const { camera } = useThree();
        
        // Frame wise animation
        useFrame(() => {

            // Update speed and date 
            setViewDate(addDays(datenow, t.current));
            t.current += Number(speed.current) / 30;
        
            // Updating labels and icons
            Object.entries(labeledBodies).forEach(([body, color]) => {
                const bodyDiv = document.getElementById(body);
                const textPosition = new THREE.Vector3();
                const iconDiv = document.getElementById(`${body}-icon`);
                const iconPosition = new THREE.Vector3();
        
                if (bodyRefs.current[body] && bodyDiv && canvas) {
                    updateLabel(bodyRefs.current[body], bodyDiv, canvas, camera, textPosition);
                    updateIcon(bodyRefs.current[body], iconDiv, canvas, camera, iconPosition);
                }
        
                // Check if we are following a body
                if (followingBody) {
                    // Perform lerping with a threshold check
                    const isLerping = followBody(followingBody, bodyRefs, zoomFactor, controls, camera, setTarget, alt, az, lerp);
                    
        
                    // Stop lerping once the camera has reached close to the target
                    if (!isLerping) {
                        setLerp(0); // Stop lerping
                    }
                }
            });
        });
    };
    

    return (
        <>
            <Canvas
                id='canvas'
                gl={{ alpha: false, antialias: true }} style={{ background: 'black' }}
                camera={{ position: [0, 0, 150], far: 100000, near:0.0001}} // Adjusted camera position
            >
                <Sun />
                {/* main bodies (planets) */}
                {Object.entries(bodies).map(([name, body]) => (
                    <Body
                        key={name}
                        obj={body.props.obj}
                        d={d}
                        t={t}
                        mesh={body.props.mesh}
                        radius={body.props.radius}
                        ref={el => bodyRefs.current[name] = el}
                    />
                ))}
                {/* Orbits */}
                {orbitalCurves}

                {/* Asteroids, comets and PHAs */}
                {showNEO ? <InstancedNEOS asteroidCount={asteroidCount} d={d} t={t} data={asteroidData} pha={false} size={asteroidSize}/> : null}
                {!showNEO && !showPHA ? null : <InstancedNEOS asteroidCount={PHACount} d={d} t={t} data={pha} pha={showPHA} size={asteroidSize}/>}
                {showComet? <InstancedNEOS asteroidCount={cometCount} d={d} t={t} data={cometData} pha={false} comet={true} size={asteroidSize}/> : null}

                {/* Camera controls and animation */}
                <OrbitControls target={target} ref={controls}/>
                <Animation />
                <ZoomComponent setZoomFactor={setZoomFactor} zoomFactor={zoomFactor}/>
                <CameraController setAlt={setAlt} alt={alt} az={az} setAz={setAz}/>
            </Canvas>

            {/* Text Labels */}
            {Object.entries(labeledBodies).map(([body,color]) => (
                <div key={body} id={body} className="absolute z-50 text-white" style={{color:color}}>
                    {body}
                </div>
            ))} 

            {/* Icons */}
            {Object.entries(labeledBodies).map(([body,color]) => (
                <div key={`${body}-icon`} id={`${body}-icon`} className='absolute z-50 rounded-full size-2.5' style={{backgroundColor: color}}></div>
            ))}

            
        </>
    );
};

export default AsteroidTracker;
